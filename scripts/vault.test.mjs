import test from 'node:test'
import assert from 'node:assert/strict'
import { emptyVault, mergeMessages, newPerson, parseChatText, parseNameAgeList } from '../src/vault.ts'
import { decryptVault, encryptVault } from '../src/vaultCrypto.ts'

test('danh sách dán từ Excel giữ tên và tuổi, không tạo người từ tiêu đề', () => {
  assert.deepEqual(parseNameAgeList('Tên\tTuổi\nLan\t31\nMai, 29\nYên'), [
    { name: 'Lan', age: 31 }, { name: 'Mai', age: 29 }, { name: 'Yên', age: null },
  ])
})

test('đoạn chat được tách, có bước duyệt người gửi và tránh nhập trùng', () => {
  const sample = '[12/06/2024, 20:15] Prot: Chào cậu\n[12/06/2024, 20:17] Lan: Chào Prot'
  const drafts = parseChatText(sample, 'Messenger', 'Prot')
  assert.equal(drafts.length, 2)
  assert.equal(drafts[0].sender, 'prot')
  assert.equal(drafts[1].sender, 'person')
  const first = mergeMessages(emptyVault(), 'person-a', drafts)
  assert.equal(first.added, 2)
  const second = mergeMessages(first.data, 'person-a', drafts)
  assert.equal(second.added, 0)
})

test('bản sao riêng tư được mã hóa, chọn chỉ hồ sơ và cần đúng mật khẩu', async () => {
  const vault = emptyVault()
  vault.people = [newPerson('Lan', 31)]
  vault.messages = mergeMessages(vault, vault.people[0].id, parseChatText('Prot: Chào cậu', 'Zalo', 'Prot')).data.messages
  const encrypted = await encryptVault(vault, 'mat-khau-rieng-tu-dai', 'profiles')
  assert.equal(encrypted.ciphertext.includes('Chào cậu'), false)
  const restored = await decryptVault(encrypted, 'mat-khau-rieng-tu-dai')
  assert.equal(restored.people.length, 1)
  assert.equal(restored.messages.length, 0)
  await assert.rejects(decryptVault(encrypted, 'mat-khau-khac-qua'), /operation-specific|decrypt|authenticate|cipher/i)
})
