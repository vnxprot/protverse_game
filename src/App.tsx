import { lazy, Suspense, useEffect, useState, type ChangeEvent } from 'react'
import { ArrowLeft, ArrowRight, BookHeart, ChevronRight, Cloud, CloudOff, Compass, Download, Heart, Mail, Moon, Pause, Play, RotateCcw, Settings2, Sparkles, Stars, Upload, Users, Orbit, WandSparkles } from 'lucide-react'
import { cloud, readCloudSave, writeCloudSave } from './cloud'
import { getEnding, getSceneNarration, initialSave, isSaveData, scenes, type Era, type PlayMode, type SaveData, type Trait } from './story'
import StorySky, { meteorChoices } from './StorySky'
import './vault.css'
import './motion.css'

type Page = 'universe' | 'story' | 'journal' | 'settings' | 'planet' | 'vault'
type PlanetId = 'thao' | 'mai' | 'an' | 'yen'

const planets: Record<PlanetId, { name: string; caption: string; mood: string; className: string }> = {
  thao: { name: 'Phương Thảo', caption: 'Bò Bụ Bẫm', mood: 'Mùa truyện đang mở', className: 'thao' },
  mai: { name: 'Mai', caption: 'Mùa hè đã qua', mood: 'Một ký ức khác', className: 'mai' },
  an: { name: 'An', caption: 'Ngã rẽ cũ', mood: 'Một ký ức khác', className: 'an' },
  yen: { name: 'Yên', caption: 'Chưa từng gặp', mood: 'Một tương lai khác', className: 'yen' },
}

const VaultPage = lazy(() => import('./VaultPage'))

const lensCopy: Record<Era, { title: string; subtitle: string; mini: string }> = {
  past: { title: 'Những điều đã qua', subtitle: 'Ký ức mở ra như từng trang sách nổi.', mini: 'Nhìn lại để hiểu, không viết lại người khác.' },
  present: { title: 'Vũ trụ của Prot', subtitle: 'Mỗi trái tim là một thế giới riêng.', mini: 'Hôm nay có một tín hiệu từ thế giới của Thảo.' },
  future: { title: 'Những vì sao chưa tới', subtitle: 'Không ai biết trước điều sẽ xảy ra.', mini: 'Mỗi con đường chỉ là một khả năng.' },
}

function protPosition(choiceCount: number, lens: Era, futureSky: number, meteorChoice: SaveData['meteorChoice']) {
  const positions = [[49, 53], [46, 50], [43, 55], [41, 49], [38, 51], [36, 46]]
  let [x, y] = positions[Math.min(choiceCount, 5)]
  if (meteorChoice === 'step-out') { x -= 5; y += 5 }
  if (meteorChoice === 'write') { x += 2; y -= 5 }
  if (meteorChoice === 'ask') { x += 7; y -= 2 }
  if (lens === 'past') { x -= 4; y += 6 }
  if (lens === 'future') { x += [-1, -8, 12][futureSky]; y -= 10 }
  return { left: `${x}%`, top: `${y}%` }
}

function thaoPosition(choiceCount: number) {
  const positions = [[7, 16], [4, 18], [12, 13], [9, 20], [5, 15], [13, 18]]
  const [right, top] = positions[Math.min(choiceCount, 5)]
  return { right: `${right}%`, top: `${top}%` }
}

function loadLocal(): SaveData {
  try {
    const value = JSON.parse(localStorage.getItem('protverse-save') || 'null')
    return isSaveData(value) ? value : initialSave
  } catch { return initialSave }
}

function IconBadge({ children }: { children: React.ReactNode }) { return <span className="icon-badge">{children}</span> }

export default function App() {
  const [page, setPage] = useState<Page>('universe')
  const [lens, setLens] = useState<Era>('present')
  const [mode, setMode] = useState<PlayMode>('manual')
  const [selectedPlanet, setSelectedPlanet] = useState<PlanetId>('thao')
  const [save, setSave] = useState<SaveData>(loadLocal)
  const [found, setFound] = useState<number[]>([])
  const [userId, setUserId] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [cloudMessage, setCloudMessage] = useState('')
  const [cloudStatus, setCloudStatus] = useState<'idle' | 'saved' | 'error'>('idle')
  const [futureSky, setFutureSky] = useState(0)
  const [meteorOpen, setMeteorOpen] = useState(false)
  const scene = scenes[Math.min(save.sceneIndex, scenes.length - 1)]
  const finished = save.sceneIndex >= scenes.length
  const latestChoice = save.choices[save.choices.length - 1]
  const revealed = !finished && latestChoice?.sceneId === scene.id ? latestChoice.choiceIndex : null
  const readyToChoose = found.length === 3 || revealed !== null

  useEffect(() => { localStorage.setItem('protverse-save', JSON.stringify(save)) }, [save])
  useEffect(() => { setFound([]) }, [save.sceneIndex])
  useEffect(() => { if (mode === 'auto' && page === 'story' && !finished) setFound([0, 1, 2]) }, [mode, page, save.sceneIndex, finished])

  useEffect(() => {
    if (!cloud) return
    let cancelled = false
    const handleUser = async (id: string | null) => {
      if (cancelled) return
      if (!id) { setUserId(null); return }
      try {
        const remote = await readCloudSave(id)
        if (cancelled) return
        if (isSaveData(remote) && new Date(remote.updatedAt).getTime() > new Date(loadLocal().updatedAt).getTime()) {
          setSave(remote)
          setCloudMessage('Đã khôi phục tiến trình từ Supabase.')
        }
      } catch { if (!cancelled) setCloudMessage('Chưa tải được tiến trình trên Supabase. Bản trên máy vẫn an toàn.') }
      if (!cancelled) setUserId(id)
    }
    cloud.auth.getUser().then(({ data }) => handleUser(data.user?.id || null))
    const { data: sub } = cloud.auth.onAuthStateChange((_event, session) => { void handleUser(session?.user.id || null) })
    return () => { cancelled = true; sub.subscription.unsubscribe() }
  }, [])

  useEffect(() => {
    if (!userId) return
    const timer = window.setTimeout(() => {
      writeCloudSave(userId, save).then(() => setCloudStatus('saved')).catch(() => setCloudStatus('error'))
    }, 800)
    return () => window.clearTimeout(timer)
  }, [save, userId])

  useEffect(() => {
    if (mode !== 'auto' || page !== 'story' || finished || !readyToChoose) return
    const timer = window.setTimeout(() => {
      if (revealed === null) choose(scene.autoChoice)
      else advance()
    }, 4200)
    return () => window.clearTimeout(timer)
  }, [mode, page, save.sceneIndex, revealed, finished, readyToChoose])

  function choose(choiceIndex: number) {
    if (revealed !== null || finished || !readyToChoose) return
    const choice = scene.choices[choiceIndex]
    if (!choice) return
    setSave(current => {
      const traits = { ...current.traits }
      for (const [trait, change] of Object.entries(choice.effect)) traits[trait as Trait] += change || 0
      return { ...current, choices: [...current.choices, { sceneId: scene.id, choiceIndex, at: new Date().toISOString() }], traits, updatedAt: new Date().toISOString() }
    })
  }

  function advance() {
    setSave(current => ({ ...current, sceneIndex: Math.min(current.sceneIndex + 1, scenes.length), updatedAt: new Date().toISOString() }))
  }

  function collectFragment(index: number) {
    setFound(current => current.includes(index) ? current : [...current, index])
  }

  function decideMeteor(id: SaveData['meteorChoice']) {
    const decision = meteorChoices.find(choice => choice.id === id)
    if (!decision || save.meteorChoice) return
    setSave(current => {
      const traits = { ...current.traits }
      for (const [trait, amount] of Object.entries(decision.effect)) traits[trait as Trait] += amount
      return { ...current, meteorChoice: id, traits, updatedAt: new Date().toISOString() }
    })
    setMeteorOpen(false)
  }

  function openPlanet(id: PlanetId) {
    setSelectedPlanet(id)
    setPage(id === 'thao' ? 'story' : 'planet')
  }

  function exportSave() {
    const blob = new Blob([JSON.stringify(save, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'protverse-save.json'
    link.click()
    URL.revokeObjectURL(url)
  }

  async function importSave(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    try {
      const parsed = JSON.parse(await file.text())
      if (!isSaveData(parsed)) throw new Error('invalid')
      setSave({ ...parsed, updatedAt: new Date().toISOString() })
      setCloudMessage('Đã nhập tiến trình thành công.')
    } catch { setCloudMessage('Tệp này không phải bản lưu ProtVerse hợp lệ.') }
    event.target.value = ''
  }

  async function sendLoginLink() {
    if (!cloud || !email.trim()) return
    setCloudMessage('Đang gửi liên kết đăng nhập...')
    const { error } = await cloud.auth.signInWithOtp({ email: email.trim(), options: { emailRedirectTo: window.location.origin } })
    setCloudMessage(error ? `Chưa gửi được: ${error.message}` : 'Đã gửi liên kết. Hãy mở email để hoàn tất đăng nhập.')
  }

  async function signOut() {
    await cloud?.auth.signOut()
    setUserId(null)
    setCloudMessage('Đã đăng xuất. Bản lưu trên thiết bị vẫn còn.')
  }

  function resetSeason() {
    if (!window.confirm('Chơi lại mùa truyện của Thảo từ đầu? Hãy xuất bản lưu trước nếu muốn giữ hành trình này.')) return
    setSave({ ...initialSave, updatedAt: new Date().toISOString() })
    setPage('story')
  }

  return <div className="app-shell" data-era={lens} data-growth={save.choices.length >= 4 ? 'grown' : save.choices.length >= 2 ? 'moving' : 'start'} data-future={futureSky} data-meteor={save.meteorChoice || 'none'}>
    <div className="stars-layer" aria-hidden="true" />
    <header className="app-header">
      <button className="brand" onClick={() => setPage('universe')} aria-label="Về vũ trụ ProtVerse"><span className="brand-star">✦</span><span>PROT<span>VERSE</span><small>VŨ TRỤ TÌNH YÊU CỦA PROT</small></span></button>
      <div className="header-actions">
        <button className="edition edition-link" onClick={() => setPage('vault')}><Users size={13} /> Kho quỹ đạo riêng tư</button>
        <button className="round-button" onClick={() => setPage('settings')} aria-label="Mở cài đặt"><Settings2 size={18} /></button>
      </div>
    </header>

    <main className="main-area">
      {page === 'universe' && <>
        <div className="route-picker"><button className="route-card active" onClick={() => setPage('universe')}><WandSparkles size={21} /><span><strong>Vũ trụ truyện</strong><small>Câu chuyện hư cấu · Chơi và thử nhiều lựa chọn</small></span></button><button className="route-card" onClick={() => setPage('vault')}><Orbit size={22} /><span><strong>Vũ trụ ký ức</strong><small>Hồ sơ và hội thoại thật · Chỉ mày mới đưa dữ liệu vào</small></span><ArrowRight size={17} /></button></div>
        <div className="hero-heading"><div><div className="eyebrow"><Sparkles size={14} /> CHƯƠNG MỞ ĐẦU · BẢN ĐỒ CẢM XÚC</div><h1>{lensCopy[lens].title}</h1><p>{lensCopy[lens].subtitle}</p></div><div className="mode-switch" aria-label="Chế độ chơi"><button className={mode === 'manual' ? 'active' : ''} onClick={() => setMode('manual')} aria-pressed={mode === 'manual'}><Compass size={15} /> Thủ công</button><button className={mode === 'auto' ? 'active' : ''} onClick={() => setMode('auto')} aria-pressed={mode === 'auto'}><Play size={15} /> Tự động</button></div></div>
        <div className="universe-grid">
          <section className="cosmos" aria-label="Bản đồ các thế giới của Prot">
            <div className="nebula nebula-one" /><div className="nebula nebula-two" />
            <div className="orbit orbit-one" /><div className="orbit orbit-two" /><div className="orbit orbit-three" />
            <div className="little-star star-a">✦</div><div className="little-star star-b">✧</div><div className="little-star star-c">✦</div><div className="little-star star-d">✧</div>
            <div className="prot-anchor" style={protPosition(save.choices.length, lens, futureSky, save.meteorChoice)}><div className="prot-glow" /><img src="/assets/prot-clay.png" alt="Prot, chàng trai trầm tính cầm cuốn sổ ngôi sao" /><span className="prot-label">PROT <i>·</i> Người kể chuyện</span></div>
            <button className="planet-spot thao-spot" style={thaoPosition(save.choices.length)} onClick={() => openPlanet('thao')} aria-label="Bước vào thế giới Phương Thảo"><span className="planet-halo" /><img src="/assets/thao-world.png" alt="Thế giới đất nặn của Phương Thảo với quán cà phê và cây hoa" /><span className="planet-tag"><b>Phương Thảo</b><small>✦ Mùa truyện đang mở</small></span></button>
            <button className="planet-spot small-spot mai-spot" onClick={() => openPlanet('mai')} aria-label="Xem thế giới của Mai"><span className="mini-world lilac">✿</span><span className="mini-label">Mai</span></button>
            <button className="planet-spot small-spot an-spot" onClick={() => openPlanet('an')} aria-label="Xem thế giới của An"><span className="mini-world peach">☀</span><span className="mini-label">An</span></button>
            <button className="planet-spot small-spot yen-spot" onClick={() => openPlanet('yen')} aria-label="Xem thế giới của Yên"><span className="mini-world mint">✧</span><span className="mini-label">Yên</span></button>
            {save.choices.length >= 2 && <button className={`meteor-trigger ${save.meteorChoice ? 'settled' : ''}`} onClick={() => setMeteorOpen(true)} aria-label="Mở biến cố sao băng"><span>☄</span><small>{save.meteorChoice ? 'Biến cố đã qua' : 'Một biến cố đang tới'}</small></button>}
            <div className="cosmos-tip"><span>✦</span> Chạm vào một thế giới để bước vào câu chuyện</div>
          </section>
          <aside className="story-peek">
            <div className="story-peek-top"><span className="tiny-pill"><span /> ĐANG PHÁT SÁNG</span><Stars size={20} /></div>
            <div className="peek-icon">✿</div><div className="eyebrow">MÙA TRUYỆN ĐẦU TIÊN</div><h2>Phương Thảo</h2><p className="peek-nickname">“Bò Bụ Bẫm”</p>
            <p className="peek-description">Một quán cà phê nhỏ. Một ngôi sao giấy. Và những ngày Prot học cách nói điều mình thật sự cảm thấy.</p>
            <div className="peek-progress"><div><span>Hành trình đã đi</span><strong>{Math.min(save.sceneIndex, scenes.length)}/{scenes.length} khoảnh khắc</strong></div><div className="progress-track"><span style={{ width: `${Math.min(save.sceneIndex / scenes.length, 1) * 100}%` }} /></div></div>
            <button className="primary-button" onClick={() => openPlanet('thao')}>{save.sceneIndex ? 'Tiếp tục câu chuyện' : 'Bắt đầu hành trình'} <ArrowRight size={18} /></button>
            <p className="peek-footnote">{lensCopy[lens].mini}</p>
          </aside>
        </div>
        <div className="timeline"><div className="timeline-title"><Moon size={15} /> DÒNG THỜI GIAN</div><div className="timeline-buttons"><button className={lens === 'past' ? 'active' : ''} onClick={() => setLens('past')}>Quá khứ</button><button className={lens === 'present' ? 'active' : ''} onClick={() => setLens('present')}>Hiện tại</button><button className={lens === 'future' ? 'active' : ''} onClick={() => setLens('future')}>Tương lai</button></div></div>
        {meteorOpen && <section className="meteor-panel" aria-label="Biến cố sao băng"><button className="meteor-close" onClick={() => setMeteorOpen(false)} aria-label="Đóng biến cố">×</button><div className="eyebrow">☄ BIẾN CỐ · MỘT ĐÊM KHÔNG TÍN HIỆU</div><h2>Điều Prot làm trong khoảng lặng</h2><p>Không có tin nhắn mới. Prot vẫn có quyền chọn tối nay thuộc về điều gì. Sao băng sẽ ở đây đến khi mày sẵn sàng.</p>{save.meteorChoice ? <div className="meteor-result">Prot đã chọn: <strong>{meteorChoices.find(choice => choice.id === save.meteorChoice)?.title}</strong>. Quỹ đạo của cậu đã đổi một chút.</div> : <div className="meteor-options">{meteorChoices.map(choice => <button key={choice.id} onClick={() => decideMeteor(choice.id)}><strong>{choice.title}</strong><span>{choice.detail}</span></button>)}</div>}</section>}
        <StorySky save={save} futureSky={futureSky} onFutureSky={setFutureSky} showFuture={lens === 'future'} onConstellation={order => setSave(current => ({ ...current, constellationOrder: order, updatedAt: new Date().toISOString() }))} />
      </>}

      {page === 'story' && <>
        <div className="story-head"><button className="back-link" onClick={() => setPage('universe')}><ArrowLeft size={17} /> Về vũ trụ</button><span className="story-head-right">MÙA CỦA THẢO · {finished ? 'HỒI KẾT' : scene.day.toUpperCase()}</span></div>
        <div className="chapter-layout">
          <div className="chapter-art"><div className="chapter-art-glow" /><img className="chapter-world" src="/assets/thao-world.png" alt="Thế giới đất nặn của Thảo" /><img className="chapter-prot" src="/assets/prot-clay.png" alt="Prot" /><div className="chapter-stamp"><span>✦</span> {finished ? 'MỘT MÙA ĐÃ QUA' : scene.place}</div>{!finished && revealed === null && <><svg className="fragment-lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><polyline points={found.map(index => [[27, 31], [80, 43], [44, 78]][index].join(',')).join(' ')} fill="none" stroke="#ffe1b1" strokeWidth=".55" strokeLinecap="round" /></svg><div className="fragment-count">{found.length}/3 mảnh ký ức</div>{scene.fragments.map((fragment, index) => !found.includes(index) && <button className={`memory-fragment fragment-${index}`} key={fragment} onClick={() => collectFragment(index)} aria-label={`Nhặt ${fragment}`}><span>{['✦', '✿', '✧'][index]}</span><small>{fragment}</small></button>)}</>}</div>
          <div className="chapter-page">
            <div className="page-topline"><BookHeart size={17} /> {finished ? 'TRANG CUỐI' : `${scene.day.toUpperCase()} · ${scene.weather.toUpperCase()}`}</div>
            {finished ? <><h1>{getEnding(save).title}</h1><div className="chapter-rule" /><p className="narration">{getEnding(save).text}</p><p className="task-note">Mỗi mùa truyện có thể đi theo một cách khác khi Prot lựa chọn khác đi.</p><div className="ending-actions"><button className="primary-button" onClick={() => setPage('journal')}>Xem nhật ký <ArrowRight size={18} /></button><button className="subtle-button" onClick={resetSeason}><RotateCcw size={16} /> Chơi lại mùa này</button></div></> : <>
              <h1>{scene.title}</h1><div className="chapter-rule" /><p className="narration">{getSceneNarration(save)}</p><div className="task-note"><span>✧</span> {scene.task}</div>
              {revealed === null ? <>{!readyToChoose && <div className="fragment-instruction"><Sparkles size={16} /><span>Chạm nhặt ba mảnh ký ức trên thế giới đất nặn để mở lựa chọn.</span><button onClick={() => setFound([0, 1, 2])}>Bỏ qua</button></div>}<div className={`choices ${!readyToChoose ? 'not-ready' : ''}`} aria-label="Các lựa chọn của Prot">{scene.choices.map((choice, index) => <button key={choice.label} className="choice-card" disabled={!readyToChoose} onClick={() => choose(index)}><span className="choice-icon">{index + 1}</span><span><strong>{choice.label}</strong><small>{choice.detail}</small></span><ChevronRight size={17} /></button>)}</div></> : <div className="reflection"><div className="reflection-label">✦ KHOẢNH KHẮC CÒN LẠI</div><p>{scene.choices[revealed].thought}</p><button className="primary-button" onClick={advance}>{save.sceneIndex === scenes.length - 1 ? 'Xem hồi kết' : 'Sang ngày tiếp theo'} <ArrowRight size={18} /></button></div>}
            </>}
            <div className="chapter-footer"><span>{mode === 'auto' ? <><Play size={14} /> Prot tự chọn sau vài giây</> : <><Pause size={14} /> Mày chọn từng khoảnh khắc</>}</span><button onClick={() => setMode(mode === 'auto' ? 'manual' : 'auto')}>{mode === 'auto' ? 'Dừng tự động' : 'Chuyển tự động'}</button></div>
          </div>
        </div>
        <div className="scene-dots" aria-label="Tiến trình mùa truyện">{scenes.map((item, index) => <span key={item.id} className={index < save.sceneIndex ? 'done' : index === save.sceneIndex ? 'current' : ''} aria-label={`${item.day}${index < save.sceneIndex ? ' đã qua' : ''}`} />)}</div>
      </>}

      {page === 'planet' && <div className="simple-page"><button className="back-link" onClick={() => setPage('universe')}><ArrowLeft size={17} /> Về vũ trụ</button><div className={`planet-illustration ${planets[selectedPlanet].className}`}><span>✦</span></div><div className="eyebrow">MỘT THẾ GIỚI KHÁC</div><h1>{planets[selectedPlanet].name}</h1><p>{planets[selectedPlanet].caption} — {planets[selectedPlanet].mood}. Mùa truyện này sẽ được mở khi câu chuyện của Prot có thêm những trang mới.</p><button className="primary-button" onClick={() => openPlanet('thao')}>Đến thế giới của Thảo <ArrowRight size={18} /></button></div>}

      {page === 'vault' && <Suspense fallback={<div className="vault-page">Đang mở Kho quỹ đạo...</div>}><VaultPage onBack={() => setPage('universe')} userId={userId} /></Suspense>}

      {page === 'journal' && <div className="journal-page"><div className="page-heading"><div className="eyebrow"><BookHeart size={15} /> CUỐN SỔ CỦA PROT</div><h1>Nhật ký những vì sao</h1><p>Điều Prot đã chọn, và những điều cậu dần hiểu về mình.</p></div><div className="journal-layout"><div className="journal-list">{save.choices.length === 0 ? <div className="empty-journal"><div>✧</div><h3>Trang giấy còn trống</h3><p>Bắt đầu mùa truyện của Thảo để viết nên ký ức đầu tiên.</p><button className="primary-button" onClick={() => openPlanet('thao')}>Bắt đầu <ArrowRight size={17} /></button></div> : save.choices.map((record, index) => { const item = scenes.find(s => s.id === record.sceneId); const choice = item?.choices[record.choiceIndex]; return item && choice ? <article className="journal-entry" key={`${record.sceneId}-${index}`}><span className="entry-number">{String(index + 1).padStart(2, '0')}</span><div><small>{item.day} · {item.place}</small><h3>{item.title}</h3><strong>{choice.label}</strong><p>{choice.thought}</p></div></article> : null })}</div><aside className="journal-side"><div className="tiny-pill">✦ CHÂN DUNG PROT</div><h2>Những điều đang lớn lên</h2><div className="trait-row"><span>Can đảm</span><b>{save.traits.courage}</b></div><div className="trait-row"><span>Rõ ràng</span><b>{save.traits.clarity}</b></div><div className="trait-row"><span>Bình thản</span><b>{save.traits.balance}</b></div><p>Đây là dấu vết lựa chọn của Prot, không phải điểm tình cảm của người khác.</p></aside></div></div>}

      {page === 'settings' && <div className="settings-page"><button className="back-link" onClick={() => setPage('universe')}><ArrowLeft size={17} /> Về vũ trụ</button><div className="page-heading"><div className="eyebrow"><Settings2 size={15} /> GÓC RIÊNG CỦA PROT</div><h1>Cài đặt & bản lưu</h1><p>Giữ hành trình của mày an toàn, dù chơi trên thiết bị nào.</p></div><div className="settings-grid"><section className="settings-card"><IconBadge>{cloud ? userId ? <Cloud size={22} /> : <CloudOff size={22} /> : <CloudOff size={22} />}</IconBadge><h2>Đồng bộ Supabase</h2>{!cloud ? <p>Game đang lưu trực tiếp trên thiết bị. Kết nối dự án Supabase sẽ bật đăng nhập và đồng bộ.</p> : userId ? <><p>Đã kết nối. Tiến trình truyện được lưu vào tài khoản của mày. Kho ký ức chỉ đồng bộ khi mày tự chọn và nhập mật khẩu mã hóa trong Kho quỹ đạo.</p><div className="status-line">{cloudStatus === 'error' ? 'Chưa đồng bộ được; bản trên máy vẫn còn.' : cloudStatus === 'saved' ? 'Đã đồng bộ gần đây' : 'Đang chờ đồng bộ'}</div><button className="subtle-button" onClick={signOut}>Đăng xuất</button></> : <><p>Nhập email để nhận liên kết đăng nhập. Sau đó có thể tiếp tục chơi trên iPhone khác.</p><label className="field-label" htmlFor="login-email">Email của mày</label><div className="email-row"><input id="login-email" type="email" value={email} onChange={event => setEmail(event.target.value)} placeholder="ten@example.com" /><button onClick={sendLoginLink} disabled={!email.trim()} aria-label="Gửi liên kết đăng nhập"><Mail size={18} /></button></div></>}{cloudMessage && <p className="form-message" role="status">{cloudMessage}</p>}</section><section className="settings-card"><IconBadge><Download size={22} /></IconBadge><h2>Bản lưu truyện</h2><p>Tệp này chỉ gồm tiến trình và lựa chọn trong vũ trụ truyện. Bản sao hồ sơ và hội thoại nằm riêng trong Kho quỹ đạo.</p><div className="settings-actions"><button className="secondary-button" onClick={exportSave}><Download size={17} /> Xuất bản lưu</button><label className="secondary-button upload-button"><Upload size={17} /> Nhập bản lưu<input type="file" accept="application/json,.json" onChange={importSave} /></label><button className="secondary-button" onClick={() => setPage('vault')}><Users size={17} /> Đến Kho quỹ đạo</button></div></section><section className="settings-card full"><IconBadge><Heart size={22} /></IconBadge><h2>Về ProtVerse</h2><p>Vũ trụ truyện là hư cấu. Vũ trụ ký ức chỉ hiển thị dữ kiện mày đưa vào và góc nhìn do mày ghi. Chế độ tự động không gửi tin nhắn ngoài đời và game không dự đoán cảm xúc của người thật.</p></section></div></div>}
    </main>

    <nav className="bottom-nav" aria-label="Điều hướng chính"><button className={page === 'universe' || page === 'planet' ? 'selected' : ''} onClick={() => setPage('universe')}><Compass size={19} /><span>Truyện</span></button><button className={page === 'story' ? 'selected' : ''} onClick={() => openPlanet('thao')}><Sparkles size={19} /><span>Mùa Thảo</span></button><button className={page === 'vault' ? 'selected' : ''} onClick={() => setPage('vault')}><Users size={19} /><span>Ký ức</span></button><button className={page === 'journal' ? 'selected' : ''} onClick={() => setPage('journal')}><BookHeart size={19} /><span>Nhật ký</span></button></nav>
  </div>
}
