# ProtVerse

**Vũ trụ tình yêu của Prot** — game web miễn phí theo phong cách đất nặn và sách tranh nổi, gồm hai lối vào tách biệt.

## Chơi thử trên máy

```bash
npm install
npm run dev
```

Mở địa chỉ Vite hiển thị trong terminal. Game có thể chơi và lưu tiến trình trên trình duyệt ngay cả khi chưa nối Supabase.

## Hai vũ trụ

- **Vũ trụ truyện:** mùa truyện Phương Thảo với năm cảnh, lựa chọn, biến cố sao băng, các chòm sao nối từ điều Prot đã chọn và ba bầu trời tương lai hư cấu. Prot và các thế giới chuyển động với nhịp riêng. Chế độ tự động chỉ chọn trong game.
- **Vũ trụ ký ức:** Kho quỹ đạo bắt đầu rỗng, không có người thật hay tin nhắn mẫu được tạo sẵn. Tạo hồ sơ, lọc giai đoạn, nhập danh sách tên/tuổi từ nội dung sao chép hai cột Excel, dán hội thoại nhiều dòng, duyệt người gửi/nội dung trước khi lưu, nối tin nhắn thành chòm sao có nguồn.

Kho ký ức lưu bằng IndexedDB của trình duyệt. Nội dung dán không tự gửi lên Vercel hoặc Supabase. Xuất JSON để có bản sao trước khi xóa dữ liệu trình duyệt hoặc đổi máy. Khi đăng nhập, người chơi có thể chủ động chọn đồng bộ **chỉ hồ sơ** hoặc **hồ sơ và hội thoại**; dữ liệu được mã hóa AES-GCM bằng mật khẩu riêng ngay trong trình duyệt trước khi ghi vào `private_vaults`. Mật khẩu không lưu trên máy chủ hoặc trong game, và không có cách khôi phục bản mã hóa nếu quên mật khẩu. Không đưa mật khẩu này vào file JSON.

## Supabase

1. Chạy `supabase/schema.sql` trong SQL Editor của dự án Supabase.
2. Sao chép `.env.example` thành `.env.local` và điền Project URL cùng **publishable key**. Không dùng secret key trong ứng dụng trình duyệt.
3. Thêm URL ứng dụng vào **Authentication → URL Configuration → Redirect URLs** để email đăng nhập trở lại game.
4. Trên Vercel, tạo hai biến môi trường `VITE_SUPABASE_URL` và `VITE_SUPABASE_ANON_KEY` trước khi triển khai.

`game_saves` và `private_vaults` đều bật RLS theo `auth.uid() = user_id`. Mã nguồn không chứa tin nhắn hoặc ghi âm thật. Tiến trình truyện và kho ký ức có bản xuất JSON riêng.

## Kiểm tra

```bash
npm test
npm run build
```

Các bài kiểm tra kiểm tra tách hội thoại, tránh nhập trùng, danh sách tên/tuổi và mã hóa bản sao. Khi có file Excel thực tế, bổ sung trình nhập `.xlsx` theo các cột và định dạng trong file đó; hiện tại có thể sao chép hai cột tên/tuổi từ Excel rồi dán vào Kho quỹ đạo.

## Giới hạn hiện tại

- Mùa truyện Phương Thảo là chương được viết đầu tiên; các thế giới truyện khác chưa có nội dung riêng.
- Bộ tách chat là bước đầu cho văn bản dán có dạng `ngày giờ người gửi: nội dung`, `người gửi: nội dung` hoặc từng dòng tự do. Người chơi phải kiểm tra bản xem trước. Bộ đọc riêng cho file xuất Messenger/Zalo sẽ được hoàn thiện khi có mẫu dữ liệu thật.
- Phiên bản này chưa phân tích giọng nói, ảnh hoặc file `.xlsx` trực tiếp.
- Giao diện tối ưu iPhone dưới dạng PWA; không có bản native trên App Store.

Tôn trọng cài đặt giảm chuyển động của thiết bị. Mọi tương lai trong vũ trụ truyện là kịch bản giả định, không dự báo cảm xúc của người thật.
