import type { VaultData } from './vault'

export type EncryptedVault = {
  ciphertext: string
  iv: string
  salt: string
  iterations: number
  scope: 'profiles' | 'all'
  updated_at: string
}

function toBase64(bytes: Uint8Array): string {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary)
}

function fromBase64(value: string): Uint8Array {
  return Uint8Array.from(atob(value), char => char.charCodeAt(0))
}

async function keyFromPassphrase(passphrase: string, salt: Uint8Array, iterations: number) {
  const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(passphrase), 'PBKDF2', false, ['deriveKey'])
  return crypto.subtle.deriveKey({ name: 'PBKDF2', salt: salt as BufferSource, iterations, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt'])
}

export async function encryptVault(data: VaultData, passphrase: string, scope: 'profiles' | 'all'): Promise<EncryptedVault> {
  if (passphrase.length < 12) throw new Error('Mật khẩu mã hóa cần ít nhất 12 ký tự.')
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const iterations = 210000
  const key = await keyFromPassphrase(passphrase, salt, iterations)
  const payload: VaultData = scope === 'all' ? data : { ...data, messages: [] }
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(JSON.stringify(payload)))
  return { ciphertext: toBase64(new Uint8Array(ciphertext)), iv: toBase64(iv), salt: toBase64(salt), iterations, scope, updated_at: new Date().toISOString() }
}

export async function decryptVault(record: EncryptedVault, passphrase: string): Promise<VaultData> {
  const key = await keyFromPassphrase(passphrase, fromBase64(record.salt), record.iterations)
  const plaintext = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: fromBase64(record.iv) as BufferSource }, key, fromBase64(record.ciphertext) as BufferSource)
  const data: unknown = JSON.parse(new TextDecoder().decode(plaintext))
  if (!data || typeof data !== 'object' || (data as Partial<VaultData>).version !== 1 || !Array.isArray((data as Partial<VaultData>).people) || !Array.isArray((data as Partial<VaultData>).messages)) throw new Error('Bản sao không hợp lệ.')
  return data as VaultData
}
