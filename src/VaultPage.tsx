import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react'
import { ArrowLeft, Check, Download, FileText, Plus, Search, Sparkles, Trash2, Upload } from 'lucide-react'
import { readEncryptedVault, writeEncryptedVault } from './cloud'
import { decryptVault, encryptVault } from './vaultCrypto'
import {
  evidenceLabels, isVaultData, loadVault, mergeMessages, newPerson,
  parseChatText, parseNameAgeList, saveVault, stageLabels,
  type DraftMessage, type EvidenceKind, type Glasses, type Person,
  type RelationshipStage, type VaultData,
} from './vault'

type Props = { onBack: () => void; userId: string | null }

function downloadJson(data: VaultData) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }))
  const link = document.createElement('a')
  link.href = url
  link.download = 'protverse-kho-ky-uc.json'
  link.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export default function VaultPage({ onBack, userId }: Props) {
  const [vault, setVault] = useState<VaultData | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [stageFilter, setStageFilter] = useState('all')
  const [panel, setPanel] = useState<'profile' | 'import' | 'bulk'>('profile')
  const [rawChat, setRawChat] = useState('')
  const [source, setSource] = useState('Zalo')
  const [protName, setProtName] = useState('Prot')
  const [drafts, setDrafts] = useState<DraftMessage[]>([])
  const [bulkText, setBulkText] = useState('')
  const [starred, setStarred] = useState<string[]>([])
  const [notice, setNotice] = useState('')
  const [saveStatus, setSaveStatus] = useState('Đang mở kho trên thiết bị...')
  const [passphrase, setPassphrase] = useState('')
  const [cloudScope, setCloudScope] = useState<'profiles' | 'all'>('profiles')
  const [vaultCloudMessage, setVaultCloudMessage] = useState('')
  const queue = useRef(Promise.resolve())

  useEffect(() => {
    let active = true
    loadVault().then(data => { if (active) { setVault(data); setSaveStatus('Chỉ lưu trên thiết bị này') } })
      .catch(() => { if (active) setSaveStatus('Không mở được kho. Hãy kiểm tra quyền lưu dữ liệu của trình duyệt.') })
    return () => { active = false }
  }, [])

  useEffect(() => {
    if (!vault) return
    setSaveStatus('Đang lưu...')
    queue.current = queue.current.catch(() => {}).then(() => saveVault(vault))
    queue.current.then(() => setSaveStatus('Đã lưu trên thiết bị này')).catch(() => setSaveStatus('Lưu chưa thành công. Hãy xuất bản sao JSON.'))
  }, [vault])

  const people = vault?.people || []
  const person = people.find(item => item.id === selectedId) || null
  const filtered = useMemo(() => people.filter(item => {
    const matchQuery = `${item.name} ${item.nickname} ${item.interests.join(' ')}`.toLocaleLowerCase('vi').includes(query.toLocaleLowerCase('vi'))
    return matchQuery && (stageFilter === 'all' || item.stage === stageFilter)
  }), [people, query, stageFilter])
  const messages = useMemo(() => (vault?.messages || []).filter(item => item.personId === selectedId), [vault, selectedId])
  const chosenStars = messages.filter(item => starred.includes(item.id))
  const parsedBulk = parseNameAgeList(bulkText)

  function updatePerson(patch: Partial<Person>) {
    if (!vault || !person) return
    setVault({ ...vault, people: vault.people.map(item => item.id === person.id ? { ...item, ...patch, updatedAt: new Date().toISOString() } : item), updatedAt: new Date().toISOString() })
  }

  function addPerson() {
    if (!vault) return
    const next = newPerson()
    setVault({ ...vault, people: [...vault.people, next], updatedAt: new Date().toISOString() })
    setSelectedId(next.id)
    setPanel('profile')
    setNotice('Hồ sơ mới đã mở. Hãy nhập tên trước.')
  }

  function deletePerson() {
    if (!vault || !person || !window.confirm(`Xóa hồ sơ ${person.name || 'chưa đặt tên'} và toàn bộ tin nhắn đã nhập của người này trên thiết bị? Hãy xuất bản sao trước nếu cần.`)) return
    setVault({ ...vault, people: vault.people.filter(item => item.id !== person.id), messages: vault.messages.filter(item => item.personId !== person.id), updatedAt: new Date().toISOString() })
    setSelectedId(null)
    setStarred([])
    setNotice('Đã xóa hồ sơ trên thiết bị này.')
  }

  function importBulk() {
    if (!vault || !parsedBulk.length) return
    const additions = parsedBulk.map(item => newPerson(item.name, item.age))
    setVault({ ...vault, people: [...vault.people, ...additions], updatedAt: new Date().toISOString() })
    setBulkText('')
    setPanel('profile')
    setSelectedId(additions[0].id)
    setNotice(`Đã thêm ${additions.length} hồ sơ. Có thể sửa tuổi và các chi tiết sau.`)
  }

  function previewChat() {
    const parsed = parseChatText(rawChat, source, protName)
    setDrafts(parsed)
    setNotice(parsed.length ? `Đã tách ${parsed.length} dòng. Hãy kiểm tra người gửi và nội dung trước khi lưu.` : 'Chưa đọc được tin nhắn nào.')
  }

  function updateDraft(index: number, patch: Partial<DraftMessage>) {
    setDrafts(current => current.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item))
  }

  function commitChat() {
    if (!vault || !person || !drafts.length) return
    const merged = mergeMessages(vault, person.id, drafts)
    setVault(merged.data)
    setRawChat('')
    setDrafts([])
    setPanel('profile')
    setNotice(`Đã lưu ${merged.added} tin nhắn mới trên thiết bị. ${drafts.length - merged.added} dòng đã có hoặc trống.`)
  }

  function toggleStar(id: string) {
    setStarred(current => current.includes(id) ? current.filter(item => item !== id) : [...current.slice(-2), id])
  }

  async function importBackup(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    try {
      const parsed: unknown = JSON.parse(await file.text())
      if (!isVaultData(parsed)) throw new Error('invalid')
      if (!window.confirm('Bản sao này sẽ thay thế kho ký ức hiện có trên thiết bị. Tiếp tục?')) return
      setVault(parsed)
      setSelectedId(null)
      setNotice('Đã khôi phục kho ký ức từ bản sao JSON.')
    } catch { setNotice('Tệp này không phải bản sao Kho ký ức hợp lệ.') }
  }

  async function uploadEncrypted() {
    if (!vault || !userId) return
    setVaultCloudMessage('Đang mã hóa trên thiết bị rồi mới đồng bộ...')
    try {
      const encrypted = await encryptVault(vault, passphrase, cloudScope)
      await writeEncryptedVault(userId, encrypted)
      setPassphrase('')
      setVaultCloudMessage(`Đã đồng bộ bản mã hóa (${cloudScope === 'all' ? 'hồ sơ và hội thoại' : 'chỉ hồ sơ'}). Mật khẩu không được lưu.`)
    } catch (error) { setVaultCloudMessage(error instanceof Error ? error.message : 'Chưa đồng bộ được.') }
  }

  async function restoreEncrypted() {
    if (!vault || !userId || !passphrase) return
    setVaultCloudMessage('Đang lấy bản mã hóa và giải mã trên thiết bị...')
    try {
      const encrypted = await readEncryptedVault(userId)
      if (!encrypted) { setVaultCloudMessage('Chưa có bản sao mã hóa trên Supabase.'); return }
      const remote = await decryptVault(encrypted, passphrase)
      if (!window.confirm(`Khôi phục bản sao ${encrypted.scope === 'all' ? 'gồm hội thoại' : 'chỉ có hồ sơ'}? ${encrypted.scope === 'all' ? 'Kho hiện tại trên thiết bị sẽ được thay thế.' : 'Hồ sơ trùng sẽ được cập nhật; hội thoại trên thiết bị vẫn giữ.'}`)) return
      if (encrypted.scope === 'all') setVault({ ...remote, updatedAt: new Date().toISOString() })
      else {
        const merged = new Map(vault.people.map(item => [item.id, item]))
        remote.people.forEach(item => merged.set(item.id, item))
        setVault({ ...vault, people: [...merged.values()], updatedAt: new Date().toISOString() })
      }
      setPassphrase('')
      setVaultCloudMessage('Đã khôi phục và lưu trên thiết bị này.')
    } catch { setVaultCloudMessage('Không giải mã được. Hãy kiểm tra mật khẩu hoặc bản sao trên Supabase.') }
  }

  if (!vault) return <div className="vault-page"><button className="back-link" onClick={onBack}><ArrowLeft size={17} /> Về vũ trụ truyện</button><p role="status">{saveStatus}</p></div>

  return <div className="vault-page">
    <button className="back-link" onClick={onBack}><ArrowLeft size={17} /> Về vũ trụ truyện</button>
    <div className="vault-heading"><div><div className="eyebrow"><Sparkles size={15} /> VŨ TRỤ KÝ ỨC · DỮ LIỆU CỦA MÀY</div><h1>Kho quỹ đạo</h1><p>Mỗi người có câu chuyện và cuộc sống riêng. Ở đây chỉ có điều mày ghi lại và dữ kiện mày chọn đưa vào.</p></div><div className="vault-count"><strong>{people.length}</strong><span>hồ sơ riêng tư</span></div></div>
    <div className="vault-privacy"><span>✦</span><span>{saveStatus}. Hội thoại dán vào đây không tự gửi lên Supabase hay đưa vào vũ trụ truyện.</span></div>
    <div className="vault-actions"><button className="primary-button" onClick={addPerson}><Plus size={17} /> Thêm một người</button><button className="secondary-button" onClick={() => setPanel('bulk')}><FileText size={16} /> Nhập danh sách tên, tuổi</button><button className="secondary-button" onClick={() => downloadJson(vault)}><Download size={16} /> Xuất bản sao riêng tư</button><label className="secondary-button vault-file-label"><Upload size={16} /> Khôi phục JSON<input type="file" accept="application/json,.json" onChange={importBackup} /></label></div>
    <section className="vault-cloud"><div><h2>Đồng bộ riêng tư theo lựa chọn</h2><p>{userId ? 'Bản sao được mã hóa trong trình duyệt trước khi gửi đến Supabase. Chỉ mày giữ mật khẩu giải mã.' : 'Đăng nhập Supabase trong Cài đặt để bật bản sao mã hóa. Kho trên thiết bị vẫn dùng được.'}</p></div>{userId && <div className="vault-cloud-controls"><select value={cloudScope} onChange={event => setCloudScope(event.target.value as 'profiles' | 'all')} aria-label="Dữ liệu muốn đồng bộ"><option value="profiles">Chỉ hồ sơ nhân vật</option><option value="all">Hồ sơ và hội thoại</option></select><input type="password" value={passphrase} onChange={event => setPassphrase(event.target.value)} autoComplete="off" placeholder="Mật khẩu mã hóa từ 12 ký tự" aria-label="Mật khẩu mã hóa riêng" /><button className="secondary-button" onClick={uploadEncrypted} disabled={passphrase.length < 12}>Đồng bộ bản mã hóa</button><button className="secondary-button" onClick={restoreEncrypted} disabled={!passphrase}>Khôi phục từ Supabase</button></div>}{vaultCloudMessage && <p className="vault-cloud-status" role="status">{vaultCloudMessage}</p>}<small>Quên mật khẩu mã hóa sẽ không mở được bản sao trên Supabase. Hãy giữ thêm bản xuất JSON ở nơi riêng tư.</small></section>
    {notice && <p className="vault-notice" role="status">{notice}</p>}
    {panel === 'bulk' && <section className="vault-panel"><h2>Nhập danh sách ban đầu</h2><p>Mỗi dòng: <b>Tên, tuổi</b>. Có thể dán từ hai cột Excel bằng dấu tab. Mày sẽ sửa và thêm dữ kiện từng người sau.</p><textarea value={bulkText} onChange={event => setBulkText(event.target.value)} placeholder={'Phương Thảo, 31\nMai, 29'} rows={5} /><div className="vault-panel-footer"><span>Đọc được {parsedBulk.length} hồ sơ · chỉ lưu trên máy</span><button className="primary-button" onClick={importBulk} disabled={!parsedBulk.length}>Thêm vào kho <Check size={16} /></button></div></section>}
    <div className="vault-layout">
      <aside className="vault-list"><div className="vault-search"><Search size={17} /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Tìm tên, biệt danh, sở thích" aria-label="Tìm hồ sơ" /></div><select value={stageFilter} onChange={event => setStageFilter(event.target.value)} aria-label="Lọc theo giai đoạn"><option value="all">Mọi giai đoạn</option>{Object.entries(stageLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select><div className="vault-person-list">{filtered.length ? filtered.map((item, index) => <button className={`vault-person ${selectedId === item.id ? 'active' : ''}`} key={item.id} onClick={() => { setSelectedId(item.id); setPanel('profile'); setStarred([]) }}><span className={`vault-avatar tone-${index % 5}`}>{item.name.trim().charAt(0).toLocaleUpperCase('vi') || '✦'}</span><span><b>{item.name || 'Hồ sơ chưa có tên'}</b><small>{item.nickname || stageLabels[item.stage]}</small></span><span className="vault-person-arrow">›</span></button>) : <div className="vault-empty">{people.length ? 'Không có hồ sơ phù hợp.' : 'Kho còn trống. Thêm người đầu tiên để bắt đầu.'}</div>}</div></aside>
      <section className="vault-detail">{!person ? <div className="vault-welcome"><div className="vault-welcome-orbit"><img src="/assets/prot-clay.png" alt="Prot" /><span>✦</span><span>✿</span><span>✧</span></div><h2>Những thế giới chưa được ghi lại</h2><p>Chọn một hồ sơ, hoặc thêm người đầu tiên. Kho này không tự tạo nhân vật và không suy đoán điều người khác nghĩ.</p></div> : <>
        <div className="vault-person-head"><div><span className="eyebrow">HỒ SƠ RIÊNG · {stageLabels[person.stage].toUpperCase()}</span><h2>{person.name || 'Hồ sơ chưa có tên'}</h2><p>{person.nickname ? `“${person.nickname}” · ` : ''}{messages.length} tin nhắn đã lưu</p></div><button className="vault-danger" onClick={deletePerson} aria-label="Xóa hồ sơ"><Trash2 size={17} /></button></div>
        <div className="vault-orbit" aria-label={`Quỹ đạo ký ức của ${person.name || 'người này'}`}><div className="vault-ring ring-a" /><div className="vault-ring ring-b" /><img src="/assets/prot-clay.png" alt="Prot" /><span className="vault-orbit-person">{person.name.trim().charAt(0).toLocaleUpperCase('vi') || '✿'}</span><span className="vault-orbit-star one">✦</span><span className="vault-orbit-star two">✧</span><span className="vault-orbit-caption">Quỹ đạo minh họa · không đo cảm xúc của người ấy</span></div>
        <div className="vault-tabs"><button className={panel === 'profile' ? 'active' : ''} onClick={() => setPanel('profile')}>Hồ sơ</button><button className={panel === 'import' ? 'active' : ''} onClick={() => setPanel('import')}>Dán hội thoại</button></div>
        {panel === 'profile' && <><div className="vault-form"><label>Tên<input value={person.name} onChange={event => updatePerson({ name: event.target.value })} placeholder="Tên gọi của người ấy" /></label><label>Biệt danh<input value={person.nickname} onChange={event => updatePerson({ nickname: event.target.value })} /></label><label>Tuổi đã biết<input type="number" min="1" max="119" value={person.age ?? ''} onChange={event => updatePerson({ age: event.target.value ? Number(event.target.value) : null, ageAsOf: event.target.value ? new Date().toISOString().slice(0, 10) : '' })} placeholder="Chưa biết" /></label><label>Kiểu tóc<input value={person.hair} onChange={event => updatePerson({ hair: event.target.value })} placeholder="Chưa biết" /></label><label>Màu yêu thích<input value={person.favoriteColor} onChange={event => updatePerson({ favoriteColor: event.target.value })} placeholder="Chưa biết" /></label><label>Đeo kính<select value={person.glasses} onChange={event => updatePerson({ glasses: event.target.value as Glasses })}><option value="unknown">Chưa biết</option><option value="yes">Có</option><option value="no">Không</option></select></label><label className="wide">Sở thích, ngăn bằng dấu phẩy<input value={person.interests.join(', ')} onChange={event => updatePerson({ interests: event.target.value.split(',').map(value => value.trim()).filter(Boolean) })} placeholder="Sách, cà phê, âm nhạc..." /></label><label>Giai đoạn<select value={person.stage} onChange={event => updatePerson({ stage: event.target.value as RelationshipStage })}>{Object.entries(stageLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label><label>Nguồn của các chi tiết<select value={person.evidence} onChange={event => updatePerson({ evidence: event.target.value as EvidenceKind })}>{Object.entries(evidenceLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label><label className="wide">Điều biết được<textarea value={person.factNote} onChange={event => updatePerson({ factNote: event.target.value })} placeholder="Chỉ ghi điều có căn cứ; có thể bổ sung nguồn và thời điểm." rows={3} /></label><label className="wide">Góc nhìn của Prot<textarea value={person.protNote} onChange={event => updatePerson({ protNote: event.target.value })} placeholder="Mày đã cảm thấy gì, và bây giờ nhìn lại thế nào?" rows={3} /></label></div><p className="vault-source-note">Chi tiết hồ sơ: {evidenceLabels[person.evidence]}. Tuổi {person.age ? `được ghi vào ${person.ageAsOf || 'chưa rõ ngày'}` : 'chưa biết'}. Đừng dùng sự im lặng để suy ra cảm xúc của người khác.</p>
          <div className="vault-memories"><div className="vault-section-head"><div><h3>Chòm sao ký ức</h3><p>Chạm tối đa ba tin nhắn để nối lại một khoảnh khắc theo nguồn gốc của nó.</p></div><span>{chosenStars.length}/3 vì sao</span></div><div className="vault-constellation"><svg viewBox="0 0 400 120" aria-hidden="true"><path d="M50 86 Q 200 18 350 82" fill="none" stroke="#d8acdb55" strokeDasharray="5 8" /><polyline points={chosenStars.map((_, index) => `${[65, 200, 335][index]},${[75, 34, 76][index]}`).join(' ')} fill="none" stroke="#ffdca5" strokeWidth="2" />{chosenStars.map((_, index) => <circle key={index} cx={[65, 200, 335][index]} cy={[75, 34, 76][index]} r="6" fill="#ffdba3" />)}</svg><p>{chosenStars.length ? chosenStars.map(item => item.text).join(' · ') : 'Chưa nối vì sao nào. Chọn các tin nhắn bên dưới.'}</p></div><div className="vault-message-list">{messages.length ? messages.map(item => <article key={item.id} className="vault-message"><div><small>{item.source} · {item.timestamp || 'Không rõ thời gian'} · {item.sender === 'prot' ? 'Prot' : item.sender === 'person' ? (person.name || 'Người ấy') : 'Chưa rõ người gửi'}</small><p>{item.text}</p></div><button className={starred.includes(item.id) ? 'active' : ''} onClick={() => toggleStar(item.id)} aria-label={starred.includes(item.id) ? 'Bỏ gắn sao' : 'Gắn sao ký ức'}>✦</button></article>) : <div className="vault-empty">Chưa có tin nhắn. Mày có thể dán một đoạn hội thoại ở thẻ bên cạnh.</div>}</div></div></>}
        {panel === 'import' && <div className="vault-import"><h3>Dán đoạn chat với {person.name || 'người này'}</h3><p>Dán nhiều dòng cùng lúc. Game đọc trong trình duyệt và cho mày sửa trước khi lưu; không gửi tin nhắn cho người ấy.</p><div className="vault-form"><label>Nguồn<select value={source} onChange={event => setSource(event.target.value)}><option>Zalo</option><option>Messenger</option><option>Khác</option></select></label><label>Tên hiển thị của Prot trong đoạn chat<input value={protName} onChange={event => setProtName(event.target.value)} /></label><label className="wide">Hội thoại<textarea value={rawChat} onChange={event => { setRawChat(event.target.value); setDrafts([]) }} rows={9} placeholder={'[12/06/2024, 20:15] Prot: Chào cậu\n[12/06/2024, 20:17] Thảo: Chào Prot'} /></label></div><button className="secondary-button" onClick={previewChat} disabled={!rawChat.trim()}>Tách và xem trước</button>{drafts.length > 0 && <div className="vault-review"><h4>Kiểm tra {drafts.length} dòng trước khi lưu</h4><div className="vault-review-list">{drafts.map((item, index) => <div className="vault-review-row" key={index}><span>{index + 1}</span><select value={item.sender} onChange={event => updateDraft(index, { sender: event.target.value as DraftMessage['sender'] })} aria-label={`Người gửi dòng ${index + 1}`}><option value="prot">Prot</option><option value="person">{person.name || 'Người ấy'}</option><option value="unknown">Chưa rõ</option></select><input value={item.timestamp} onChange={event => updateDraft(index, { timestamp: event.target.value })} placeholder="Thời gian (nếu có)" aria-label={`Thời gian dòng ${index + 1}`} /><textarea value={item.text} onChange={event => updateDraft(index, { text: event.target.value })} rows={2} aria-label={`Nội dung dòng ${index + 1}`} /></div>)}</div><button className="primary-button" onClick={commitChat}>Lưu {drafts.length} dòng đã duyệt <Check size={16} /></button></div>}</div>}
      </>}</section>
    </div>
  </div>
}
