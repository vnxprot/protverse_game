# ProtVerse

**Vũ trụ tình yêu của Prot** — bản chơi đầu tiên, theo phong cách đất nặn và sách tranh nổi.

## Chơi thử trên máy

```bash
npm install
npm run dev
```

Mở địa chỉ Vite hiển thị trong terminal. Game có thể chơi và lưu tiến trình trên trình duyệt ngay cả khi chưa nối Supabase.

## Supabase

1. Chạy `supabase/schema.sql` trong SQL Editor của dự án Supabase.
2. Sao chép `.env.example` thành `.env.local` và điền Project URL cùng **publishable key**. Không dùng secret key trong ứng dụng trình duyệt.
3. Thêm URL ứng dụng vào **Authentication → URL Configuration → Redirect URLs** để email đăng nhập trở lại game.
4. Trên Vercel, tạo hai biến môi trường `VITE_SUPABASE_URL` và `VITE_SUPABASE_ANON_KEY` trước khi triển khai.

Tất cả dữ liệu trong `game_saves` được bảo vệ theo `auth.uid() = user_id`. Mã nguồn không chứa tin nhắn hoặc ghi âm thật. Tiến trình còn có thể xuất thành JSON trong màn hình Cài đặt.

## Nội dung bản đầu

- Bản đồ vũ trụ có Prot và bốn thế giới, với mùa truyện Phương Thảo đang mở.
- Năm cảnh có lựa chọn, cảm nhận sau mỗi cảnh, chế độ thủ công và tự động.
- Ba cách khép lại mùa truyện dựa trên cách Prot hành động.
- Dòng thời gian Quá khứ, Hiện tại, Tương lai; nhật ký lựa chọn; giao diện thích ứng iPhone.
- PWA có thể thêm vào màn hình chính và tiếp tục chơi ngoại tuyến sau lần tải đầu.

Các mùa truyện và nhân vật khác hiện là phác thảo, chưa có nội dung chơi. Chế độ tự động chỉ điều khiển nhân vật trong game.
