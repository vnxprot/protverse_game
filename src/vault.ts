export type RelationshipStage = 'wish' | 'unspoken' | 'talking' | 'pursued' | 'dated' | 'rejected' | 'quiet' | 'past' | 'unknown'
export type EvidenceKind = 'said' | 'remembered' | 'unconfirmed'
export type Glasses = 'unknown' | 'yes' | 'no'
export type Sender = 'prot' | 'person' | 'unknown'

export const stageLabels: Record<RelationshipStage, string> = {
  wish: 'Chưa quen / mong ước', unspoken: 'Chưa dám bày tỏ', talking: 'Đang trò chuyện',
  pursued: 'Đã chủ động tìm hiểu', dated: 'Đã hẹn gặp',
  rejected: 'Đã từ chối rõ ràng', quiet: 'Không hồi đáp / chưa rõ',
  past: 'Một chặng đã qua', unknown: 'Chưa phân loại',
}
export const evidenceLabels: Record<EvidenceKind, string> = {
  said: 'Người ấy từng nói', remembered: 'Prot ghi nhớ', unconfirmed: 'Chưa xác nhận',
}

export type Person = {
  id: string
  name: string
  nickname: string
  age: number | null
  ageAsOf: string
  hair: string
  favoriteColor: string
  glasses: Glasses
  interests: string[]
  stage: RelationshipStage
  factNote: string
  protNote: string
  evidence: EvidenceKind
  updatedAt: string
}

export type ChatMessage = {
  id: string
  personId: string
  source: string
  sender: Sender
  senderLabel: string
  timestamp: string
  text: string
  fingerprint: string
}

export type VaultData = { version: 1; people: Person[]; messages: ChatMessage[]; updatedAt: string }
export type DraftMessage = Omit<ChatMessage, 'id' | 'personId' | 'fingerprint'>

const DB_NAME = 'protverse-private-vault'
const STORE = 'data'

export function emptyVault(): VaultData {
  return { version: 1, people: [], messages: [], updatedAt: new Date().toISOString() }
}

export function isVaultData(value: unknown): value is VaultData {
  if (!value || typeof value !== 'object') return false
  const data = value as Partial<VaultData>
  return data.version === 1 && typeof data.updatedAt === 'string' && Array.isArray(data.people) && Array.isArray(data.messages)
    && data.people.every(item => item && typeof item.id === 'string' && typeof item.name === 'string' && typeof item.nickname === 'string'
      && (item.age === null || typeof item.age === 'number') && typeof item.ageAsOf === 'string' && typeof item.hair === 'string'
      && typeof item.favoriteColor === 'string' && ['unknown', 'yes', 'no'].includes(item.glasses)
      && Array.isArray(item.interests) && item.interests.every(value => typeof value === 'string')
      && typeof item.stage === 'string' && typeof item.factNote === 'string' && typeof item.protNote === 'string'
      && typeof item.evidence === 'string' && typeof item.updatedAt === 'string')
    && data.messages.every(item => item && typeof item.id === 'string' && typeof item.personId === 'string'
      && typeof item.source === 'string' && ['prot', 'person', 'unknown'].includes(item.sender)
      && typeof item.senderLabel === 'string' && typeof item.timestamp === 'string'
      && typeof item.text === 'string' && typeof item.fingerprint === 'string')
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1)
    request.onupgradeneeded = () => { if (!request.result.objectStoreNames.contains(STORE)) request.result.createObjectStore(STORE) }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function loadVault(): Promise<VaultData> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const request = db.transaction(STORE, 'readonly').objectStore(STORE).get('vault')
    request.onsuccess = () => { db.close(); resolve(isVaultData(request.result) ? request.result : emptyVault()) }
    request.onerror = () => { db.close(); reject(request.error) }
  })
}

export async function saveVault(data: VaultData): Promise<void> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE, 'readwrite')
    transaction.objectStore(STORE).put(data, 'vault')
    transaction.oncomplete = () => { db.close(); resolve() }
    transaction.onerror = () => { db.close(); reject(transaction.error) }
  })
}

export function newPerson(name = '', age: number | null = null): Person {
  return {
    id: crypto.randomUUID(), name, nickname: '', age, ageAsOf: age ? new Date().toISOString().slice(0, 10) : '',
    hair: '', favoriteColor: '', glasses: 'unknown', interests: [], stage: 'unknown',
    factNote: '', protNote: '', evidence: 'unconfirmed', updatedAt: new Date().toISOString(),
  }
}

export function parseNameAgeList(raw: string): Array<{ name: string; age: number | null }> {
  return raw.split(/\r?\n/).map(line => {
    const parts = line.trim().split(/[\t,;|]/).map(part => part.trim()).filter(Boolean)
    if (!parts.length || /^(tên|name)$/i.test(parts[0])) return null
    const number = Number(parts[1])
    return { name: parts[0], age: parts[1] && Number.isInteger(number) && number > 0 && number < 120 ? number : null }
  }).filter((item): item is { name: string; age: number | null } => item !== null)
}

const datedLines = [
  /^\[?(\d{1,2}[/.\-]\d{1,2}[/.\-]\d{2,4})[,\s]+(\d{1,2}:\d{2}(?::\d{2})?)\]?\s*(?:-|–)?\s*([^:]{1,80}):\s*(.*)$/,
  /^(\d{1,2}:\d{2}(?::\d{2})?)\s+([^:]{1,80}):\s*(.*)$/,
]

export function parseChatText(raw: string, source: string, protName: string): DraftMessage[] {
  const result: DraftMessage[] = []
  const normalizedProt = protName.trim().toLocaleLowerCase('vi')
  for (const rawLine of raw.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line) continue
    let timestamp = ''
    let label = ''
    let content = line
    const full = line.match(datedLines[0])
    const timeOnly = full ? null : line.match(datedLines[1])
    const senderOnly = full || timeOnly ? null : line.match(/^([^:]{1,60}):\s*(.+)$/)
    if (full) { timestamp = `${full[1]} ${full[2]}`; label = full[3].trim(); content = full[4] }
    else if (timeOnly) { timestamp = timeOnly[1]; label = timeOnly[2].trim(); content = timeOnly[3] }
    else if (senderOnly) { label = senderOnly[1].trim(); content = senderOnly[2] }
    else if (result.length && /^\s/.test(rawLine)) {
      result[result.length - 1].text += `\n${line}`
      continue
    }
    if (!content.trim()) continue
    result.push({ source, sender: label ? label.toLocaleLowerCase('vi') === normalizedProt ? 'prot' : 'person' : 'unknown', senderLabel: label, timestamp, text: content.trim() })
  }
  return result
}

export function fingerprint(message: DraftMessage, personId: string, ordinal: number): string {
  const input = [personId, message.source, message.sender, message.timestamp, message.text, ordinal].join('\u241f')
  let hash = 2166136261
  for (let i = 0; i < input.length; i++) hash = Math.imul(hash ^ input.charCodeAt(i), 16777619)
  return (hash >>> 0).toString(36)
}

export function mergeMessages(vault: VaultData, personId: string, drafts: DraftMessage[]): { data: VaultData; added: number } {
  const seen = new Set(vault.messages.map(message => message.fingerprint))
  const additions: ChatMessage[] = []
  drafts.forEach((draft, index) => {
    if (!draft.text.trim()) return
    const key = fingerprint(draft, personId, index)
    if (seen.has(key)) return
    seen.add(key)
    additions.push({ ...draft, id: crypto.randomUUID(), personId, fingerprint: key })
  })
  return { data: { ...vault, messages: [...vault.messages, ...additions], updatedAt: new Date().toISOString() }, added: additions.length }
}
