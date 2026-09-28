import { createClient } from '@supabase/supabase-js'
import type { SaveData } from './story'
import type { EncryptedVault } from './vaultCrypto'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

export const cloud = url && key ? createClient(url, key) : null

export async function readCloudSave(userId: string): Promise<SaveData | null> {
  if (!cloud) return null
  const { data, error } = await cloud.from('game_saves').select('save_data').eq('user_id', userId).maybeSingle()
  if (error) throw error
  return data?.save_data ?? null
}

export async function writeCloudSave(userId: string, save: SaveData) {
  if (!cloud) return
  const { error } = await cloud.from('game_saves').upsert({ user_id: userId, save_data: save, updated_at: save.updatedAt }, { onConflict: 'user_id' })
  if (error) throw error
}

export async function readEncryptedVault(userId: string): Promise<EncryptedVault | null> {
  if (!cloud) return null
  const { data, error } = await cloud.from('private_vaults').select('ciphertext,iv,salt,iterations,scope,updated_at').eq('user_id', userId).maybeSingle()
  if (error) throw error
  return data ?? null
}

export async function writeEncryptedVault(userId: string, record: EncryptedVault): Promise<void> {
  if (!cloud) throw new Error('Chưa kết nối Supabase.')
  const { error } = await cloud.from('private_vaults').upsert({ user_id: userId, ...record }, { onConflict: 'user_id' })
  if (error) throw error
}
