export type Era = 'past' | 'present' | 'future'
export type PlayMode = 'manual' | 'auto'
export type Trait = 'courage' | 'clarity' | 'balance'

export type StoryChoice = {
  label: string
  detail: string
  thought: string
  effect: Partial<Record<Trait, number>>
}

export type StoryScene = {
  id: string
  day: string
  title: string
  place: string
  weather: string
  narration: string
  task: string
  choices: StoryChoice[]
  autoChoice: number
}

export const scenes: StoryScene[] = [
  {
    id: 'paper-star', day: 'Ngày 01', title: 'Ngôi sao bằng giấy', place: 'Tiệm sách cuối phố', weather: 'Một chiều hơi nhiều mây',
    narration: 'Prot gặp Phương Thảo trước kệ sách cũ. Một ngôi sao giấy rơi khỏi cuốn sổ của cậu. Thảo nhặt lên và bật cười: “Cậu vẫn gấp mấy thứ này à?”',
    task: 'Đặt ngôi sao vào đúng vị trí trong câu chuyện.',
    choices: [
      { label: 'Kể vì sao Prot gấp sao', detail: 'Một câu chuyện nhỏ, thật lòng.', thought: 'Prot kể về những tối muốn giữ lại một điều đẹp đẽ. Cậu nói chậm, nhưng lần này không giấu mình.', effect: { courage: 2, clarity: 1 } },
      { label: 'Hỏi Thảo đang đọc gì', detail: 'Để câu chuyện mở từ phía cô ấy.', thought: 'Thảo kể về cuốn sách đang cầm. Prot lắng nghe và thấy cuộc gặp dễ chịu hơn mình tưởng.', effect: { balance: 2, clarity: 1 } },
      { label: 'Cười rồi cất ngôi sao đi', detail: 'Giữ khoảnh khắc lại cho riêng mình.', thought: 'Một cuộc gặp ngắn. Trên đường về, Prot vẫn nghĩ đến tiếng cười ấy.', effect: { balance: 1 } },
    ], autoChoice: 1,
  },
  {
    id: 'rain-cafe', day: 'Ngày 04', title: 'Hộp sữa sau cơn mưa', place: 'Con đường đến quán cà phê', weather: 'Mưa phùn, đèn phố lên sớm',
    narration: 'Hai người đã nói chuyện thêm vài lần. Prot muốn mời Thảo đi cà phê. Điện thoại trong tay cậu sáng lên, rồi lại tối. Con đường giấy trước mặt chia thành ba nhánh.',
    task: 'Chọn cách Prot ngỏ lời.',
    choices: [
      { label: 'Mời rõ ràng, để Thảo chọn', detail: 'Một lời mời cụ thể, thoải mái từ chối.', thought: 'Prot gửi lời mời với ngày giờ rõ ràng. Cậu đặt điện thoại xuống và tiếp tục buổi tối của mình.', effect: { courage: 2, clarity: 2, balance: 1 } },
      { label: 'Gửi một câu bóng gió', detail: 'Mở cửa nhưng chưa dám bước tới.', thought: 'Tin nhắn được gửi. Prot nhận ra cả hai có thể hiểu nó theo hai cách khác nhau.', effect: { courage: 1 } },
      { label: 'Để hôm khác rồi hỏi', detail: 'Prot cần thêm thời gian.', thought: 'Prot gấp điện thoại. Cậu tự hỏi mình đang kiên nhẫn hay đang sợ một câu trả lời.', effect: { balance: 1 } },
    ], autoChoice: 0,
  },
  {
    id: 'other-planets', day: 'Ngày 07', title: 'Một tối không có tin nhắn', place: 'Căn phòng của Prot', weather: 'Bầu trời trong, rất yên',
    narration: 'Một buổi tối trôi qua mà Thảo bận việc riêng. Không có tín hiệu mới trên quỹ đạo của cô ấy. Trên bàn Prot còn một cuốn sách chưa đọc và vé xem triển lãm cuối tuần.',
    task: 'Quyết định Prot sẽ làm gì với khoảng lặng.',
    choices: [
      { label: 'Ra ngoài xem triển lãm', detail: 'Một buổi tối vẫn thuộc về Prot.', thought: 'Ở triển lãm, Prot chụp một bức tranh mình thích. Tối đó cậu thấy nhẹ hơn, dù điện thoại vẫn yên.', effect: { balance: 3 } },
      { label: 'Nhắn một lần để hỏi thăm', detail: 'Quan tâm mà không đòi câu trả lời ngay.', thought: 'Prot gửi một lời hỏi thăm ngắn. Sau đó cậu quay về cuốn sách trên bàn.', effect: { clarity: 1, balance: 1 } },
      { label: 'Viết cảm xúc vào sổ', detail: 'Nói với chính mình trước.', thought: 'Những dòng chữ không giải quyết mọi thứ, nhưng Prot hiểu mình đang mong đợi điều gì.', effect: { clarity: 2, balance: 1 } },
    ], autoChoice: 0,
  },
  {
    id: 'the-invitation', day: 'Ngày 12', title: 'Phía bên kia cây cầu', place: 'Cầu giấy bên quán nhỏ', weather: 'Nắng qua những tán cây đất nặn',
    narration: 'Thảo chủ động hỏi Prot có muốn ghé một quán nhỏ cùng cô ấy không. Trong buổi gặp, cả hai kể về những điều mình muốn làm năm tới. Prot nhận ra Thảo có những dự định riêng rất rõ ràng.',
    task: 'Chọn điều Prot mang vào cuộc gặp.',
    choices: [
      { label: 'Chia sẻ dự định của Prot', detail: 'Để hai người hiểu nhau hơn.', thought: 'Prot nói về những nơi cậu muốn đi và điều cậu còn đang tìm kiếm. Cuộc trò chuyện trở nên thật hơn.', effect: { courage: 2, clarity: 2 } },
      { label: 'Lắng nghe rồi hỏi thêm', detail: 'Tò mò về thế giới của Thảo.', thought: 'Thảo kể nhiều hơn. Prot nhận ra sự gần gũi bắt đầu bằng việc lắng nghe mà không vội kết luận.', effect: { balance: 2, clarity: 1 } },
      { label: 'Cố tỏ ra giống Thảo', detail: 'Một cách gần lại nhưng thiếu chân thật.', thought: 'Prot gật đầu với vài điều mình không thật sự nghĩ vậy. Về nhà, cậu thấy có gì đó chưa đúng.', effect: { courage: 1 } },
    ], autoChoice: 0,
  },
  {
    id: 'honest-sky', day: 'Ngày 19', title: 'Bầu trời nói thật', place: 'Bậc thềm dưới đèn vàng', weather: 'Đêm mát, có vài ngôi sao',
    narration: 'Những lần gặp khiến Prot quý Thảo hơn. Cậu không muốn đoán mãi. Thảo cũng có quyền nói rõ cô ấy nhìn mối quan hệ này thế nào, dù câu trả lời có thể khác điều Prot mong.',
    task: 'Chọn cách Prot nói về cảm xúc.',
    choices: [
      { label: 'Nói thật và lắng nghe', detail: 'Không đặt áp lực lên câu trả lời.', thought: 'Prot nói điều mình cảm nhận và để Thảo có thời gian đáp lại. Dù chuyện sẽ đi đâu, cậu đã thành thật.', effect: { courage: 3, clarity: 3, balance: 1 } },
      { label: 'Hỏi về mong muốn của cả hai', detail: 'Bắt đầu bằng một câu hỏi mở.', thought: 'Cuộc nói chuyện dài hơn dự tính. Prot hiểu rằng sự rõ ràng không nhất thiết làm mất đi dịu dàng.', effect: { clarity: 3, balance: 2 } },
      { label: 'Tiếp tục giữ trong lòng', detail: 'Cậu chưa sẵn sàng.', thought: 'Đêm vẫn đẹp. Prot biết rồi sẽ có lúc cần đối diện câu hỏi này.', effect: { balance: 1 } },
    ], autoChoice: 0,
  },
]

export type ChoiceRecord = {
  sceneId: string
  choiceIndex: number
  at: string
}

export type SaveData = {
  version: 1
  sceneIndex: number
  choices: ChoiceRecord[]
  traits: Record<Trait, number>
  updatedAt: string
}

export const initialSave: SaveData = {
  version: 1,
  sceneIndex: 0,
  choices: [],
  traits: { courage: 0, clarity: 0, balance: 0 },
  updatedAt: new Date().toISOString(),
}

export function getEnding(save: SaveData) {
  const { courage, clarity, balance } = save.traits
  if (clarity >= 6 && balance >= 5) return {
    title: 'Một quỹ đạo có hai con đường',
    text: 'Prot đã đủ can đảm để nói thật và đủ bình thản để lắng nghe. Thảo muốn tiếp tục tìm hiểu, chậm rãi, theo nhịp của cả hai. Không có lời hứa về kết quả; phía trước là một con đường họ cùng chọn bước lên.',
  }
  if (courage >= 5 && clarity >= 5) return {
    title: 'Điều đẹp đẽ được nói ra',
    text: 'Prot bày tỏ tình cảm. Thảo trân trọng sự chân thành ấy nhưng chưa có cùng cảm xúc. Prot buồn, rồi nhận ra một câu trả lời rõ ràng cũng giúp mình bước tiếp mà không đánh mất sự dịu dàng.',
  }
  return {
    title: 'Ngôi sao còn trong sổ',
    text: 'Có những điều Prot chưa nói được trong mùa này. Cậu cất ngôi sao giấy vào sổ, mang theo cả niềm vui lẫn sự tiếc nuối. Một hành trình khác bắt đầu từ việc hiểu mình hơn.',
  }
}

export function isSaveData(value: unknown): value is SaveData {
  if (!value || typeof value !== 'object') return false
  const data = value as Partial<SaveData>
  return data.version === 1 && typeof data.sceneIndex === 'number' && data.sceneIndex >= 0 && data.sceneIndex <= scenes.length && Array.isArray(data.choices) && !!data.traits && typeof data.traits.courage === 'number' && typeof data.traits.clarity === 'number' && typeof data.traits.balance === 'number' && typeof data.updatedAt === 'string'
}
