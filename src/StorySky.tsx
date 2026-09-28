import { ArrowRight, GitBranch, Sparkles } from 'lucide-react'
import { scenes, type SaveData } from './story'

const points = [[10, 66], [29, 28], [49, 68], [69, 24], [89, 59]]
const futures = [
  { title: 'Nói điều mình cảm thấy', symbol: '✦', text: 'Prot chọn sự rõ ràng và lắng nghe. Câu trả lời của Thảo vẫn thuộc về cô ấy.' },
  { title: 'Một tối dành cho mình', symbol: '☾', text: 'Prot bước ra ngoài, gặp bạn bè và tìm lại những điều làm ngày của mình có ý nghĩa.' },
  { title: 'Giữ một trang dịu dàng', symbol: '✧', text: 'Prot chấp nhận điều chưa trọn vẹn và mang theo ký ức mà không đứng yên trong đó.' },
]

type Props = { save: SaveData; futureSky: number; onFutureSky: (index: number) => void; showFuture: boolean; onConstellation: (order: number[]) => void }

export default function StorySky({ save, futureSky, onFutureSky, showFuture, onConstellation }: Props) {
  const linked = save.constellationOrder || []
  const completed = scenes.map((scene, index) => ({ scene, index, record: save.choices.find(choice => choice.sceneId === scene.id) })).filter(item => item.record)
  const selected = linked.map(index => completed.find(item => item.index === index)).filter(item => item !== undefined)

  function toggle(index: number) {
    onConstellation(linked.includes(index) ? linked.filter(value => value !== index) : [...linked.slice(-2), index])
  }

  return <div className="sky-features">
    <section className="constellation-card"><div className="section-heading"><div><div className="eyebrow"><Sparkles size={14} /> KÝ ỨC LÀ CHÒM SAO</div><h2>Nối những điều đã qua</h2><p>Chạm các khoảnh khắc Prot đã trải qua. Thứ tự nối sao đổi cách mày kể lại cùng một mùa truyện.</p></div><span>{completed.length}/{scenes.length} điểm sáng</span></div>
      <div className="story-constellation"><svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><polyline points={selected.map(item => points[item.index].join(',')).join(' ')} fill="none" stroke="#ffdda7" strokeWidth=".5" strokeLinecap="round" /></svg>{scenes.map((scene, index) => <button key={scene.id} className={`story-star story-star-${index} ${completed.some(item => item.index === index) ? 'awake' : ''} ${linked.includes(index) ? 'linked' : ''}`} style={{ left: `${points[index][0]}%`, top: `${points[index][1]}%` }} disabled={!completed.some(item => item.index === index)} onClick={() => toggle(index)} aria-label={`Nối ký ức ${scene.title}`}><span>✦</span><small>{scene.title}</small></button>)}</div>
      <div className="constellation-reading">{selected.length ? <><strong>{selected.map(item => item.scene.title).join(' → ')}</strong><p>{selected.map(item => item.scene.choices[item.record!.choiceIndex]?.thought).filter(Boolean).join(' ')}</p></> : <p>{completed.length ? 'Chọn tối đa ba điểm sáng để nghe lại những điều Prot đã chọn.' : 'Chơi mùa truyện của Thảo để thắp lên ngôi sao đầu tiên.'}</p>}</div>
    </section>
    {showFuture && <section className="future-card"><div className="section-heading"><div><div className="eyebrow"><GitBranch size={14} /> TƯƠNG LAI LÀ NHIỀU BẦU TRỜI</div><h2>Ba con đường khả dĩ</h2><p>Đây là hướng đi của Prot trong truyện, không phải dự báo về cảm xúc của người thật.</p></div></div><div className="future-options">{futures.map((future, index) => <button key={future.title} className={futureSky === index ? 'active' : ''} onClick={() => onFutureSky(index)} aria-pressed={futureSky === index}><span className="future-symbol">{future.symbol}</span><span><strong>{future.title}</strong><small>{future.text}</small></span><ArrowRight size={17} /></button>)}</div></section>}
  </div>
}

export const meteorChoices = [
  { id: 'step-out', title: 'Bước ra phố', detail: 'Prot để điện thoại ở nhà và đi xem triển lãm.', effect: { balance: 2 } },
  { id: 'write', title: 'Viết vào sổ', detail: 'Gọi tên nỗi nhớ mà không cần một lời hồi đáp.', effect: { clarity: 2 } },
  { id: 'ask', title: 'Hỏi thăm một lần', detail: 'Gửi lời chân thành rồi trở về với ngày của mình.', effect: { courage: 1, clarity: 1 } },
] as const
