# LAW.AI — Trợ lý pháp luật Việt Nam

LAW.AI là giao diện web để kiểm thử mô hình AI pháp luật hiện có. Ứng dụng cung cấp hội thoại, lịch sử, nhận dạng giọng nói tiếng Việt, đọc câu trả lời, chế độ sáng/tối và tài khoản người dùng.

Frontend không chứa mô hình, không suy diễn điều luật và không tự tạo căn cứ pháp lý. Câu trả lời, nguồn tham khảo và trạng thái hiệu lực chỉ hiển thị khi backend trả về. Mỗi câu trả lời kèm dòng lưu ý:

> Câu trả lời dựa trên văn bản luật lao động đã ban hành của Việt Nam.

## Công nghệ

- Vue.js 3, Composition API, `<script setup lang="ts">`
- TypeScript 5.9
- Vite 8
- Tailwind CSS 4
- Pinia 4 và Vue Router 5
- Axios
- marked và DOMPurify để hiển thị Markdown đã được làm sạch
- lucide-vue-next
- Web Speech API và SpeechSynthesis API

## Yêu cầu môi trường

- Node.js 22 trở lên (đã chạy với Node.js 22.16)
- npm 10 trở lên
- Trình duyệt hiện đại. Nhận dạng giọng nói hoạt động tốt nhất trên Chrome hoặc Edge desktop. Firefox và Safari thường không hỗ trợ Web Speech API theo cùng một cách.

## Cài đặt

```bash
npm install
```

## Chạy ứng dụng

```bash
npm run dev
```

Vite in địa chỉ cục bộ, thường là `http://localhost:5173`.

Các lệnh khác:

```bash
npm run typecheck
npm run build
npm run preview
```

`build` chạy kiểm tra TypeScript rồi tạo thư mục `dist`.

## Cấu hình `.env`

Sao chép file mẫu rồi sửa cho đúng backend của bạn:

```bash
copy .env.example .env
```

```env
VITE_API_BASE_URL=http://localhost:8000/api
VITE_USE_MOCK=false
VITE_API_TIMEOUT=90000
VITE_AUTH_MODE=cookie
VITE_REQUIRE_AUTH=false
VITE_HISTORY_MODE=local
VITE_API_WITH_CREDENTIALS=false
VITE_CSRF_COOKIE=
VITE_CSRF_HEADER=
```

Đổi `.env` xong phải khởi động lại Vite. Có thể ghi đè base URL lúc chạy trong **Cài đặt → Kết nối**, lưu ở `localStorage` với khóa `legalai.api.baseUrl`. Chỉ nhận `http` và `https`, không nhận userinfo trong URL.

Mọi biến `VITE_` được đóng vào bundle trình duyệt. Không đặt API key của mô hình, mật khẩu hay token thật vào `.env` hoặc README. Khóa của mô hình phải nằm ở backend.

## Kết nối backend AI luật

Lớp HTTP nằm trong `src/services`. Component Vue không gọi HTTP trực tiếp.

| Biến | Ý nghĩa |
| --- | --- |
| `VITE_API_BASE_URL` | Gốc API, không có dấu `/` cuối. Đường dẫn tương đối được nối vào gốc này. |
| `VITE_API_TIMEOUT` | Thời gian chờ, từ 5000 đến 300000 ms. Mặc định 90000. |
| `VITE_HISTORY_MODE` | `local` hoặc `api`. |

Đường dẫn mặc định trong `src/config/api.ts`:

- `POST chat`
- `GET/POST conversations`
- `GET/PATCH/DELETE conversations/:id`
- `POST feedback`
- `POST auth/login`, `POST auth/google`, `POST auth/register`, `POST auth/logout`, `GET auth/me`

Đây là hợp đồng đề xuất, không phải giao thức bắt buộc. Nếu backend dùng tên trường `snake_case` hoặc `camelCase` cho cùng một ý nghĩa, `src/services/adapters.ts` chuẩn hóa về kiểu dữ liệu của giao diện. Response không đúng hợp đồng này được báo là dữ liệu không hợp lệ, không bị đoán thành schema khác.

`POST chat` gửi:

```json
{
  "conversation_id": "conversation-id",
  "message": "Nội dung câu hỏi pháp luật"
}
```

Response được chấp nhận khi có `message.content` dạng chuỗi:

```json
{
  "conversation_id": "conversation-id",
  "message": {
    "id": "message-id",
    "role": "assistant",
    "content": "Nội dung trả lời từ AI",
    "sources": [],
    "structured": {}
  }
}
```

`sources` và `structured` là tùy chọn. Nếu không có, giao diện chỉ hiển thị văn bản. Không tự điền điều, khoản, số hiệu, ngày hiệu lực hay trạng thái còn hiệu lực.

Streaming chưa được giả định. Hủy request dùng `AbortController` khi người dùng bấm dừng.

## Xác thực

`VITE_AUTH_MODE=cookie` là mặc định. Trình duyệt gửi cookie qua `withCredentials`. Frontend gọi `GET auth/me` để biết phiên, vì cookie HttpOnly không đọc được bằng JavaScript. Backend cần CORS cho phép origin của Vite và `Access-Control-Allow-Credentials`. Axios gửi kèm cookie `XSRF-TOKEN` nếu có. Nếu backend dùng tên khác, đặt `VITE_CSRF_COOKIE` và `VITE_CSRF_HEADER`.

`VITE_AUTH_MODE=bearer` lưu token ở `sessionStorage`. Ô ghi nhớ phiên mới chuyển token sang `localStorage`. Mật khẩu không được lưu. Ứng dụng không tự làm mới token.

`VITE_REQUIRE_AUTH=true` chuyển mọi trang chat và cài đặt về đăng nhập khi chưa có phiên. Khi tắt, khách vẫn chat được; lịch sử khách tách khỏi lịch sử tài khoản.

Đăng ký gửi họ tên, email và mật khẩu tới `POST auth/register`. Nếu backend trả 404, giao diện báo endpoint chưa có và không tạo tài khoản giả.

Đăng nhập Google dùng Google Identity Services. Đặt `VITE_GOOGLE_CLIENT_ID` bằng mã khách OAuth (đây là mã công khai, không phải client secret), thêm origin đang chạy vào Google Cloud, rồi khởi động lại Vite. Nút gửi `POST auth/google` với `access_token`. Nếu máy chủ chưa có endpoint này hoặc không kết nối được, ứng dụng vẫn tạo phiên trên thiết bị từ hồ sơ Google và báo rõ máy chủ chưa xác nhận. Không lưu access token hay mật khẩu.

## Lịch sử hội thoại

`VITE_HISTORY_MODE=local` lưu hội thoại trong `localStorage`, khóa `legalai.history.guest` hoặc `legalai.history.user_<id>`. Token và mật khẩu không nằm trong dữ liệu này. Tin đang xử lý khi tải lại trang trở thành lỗi có thể thử lại.

`VITE_HISTORY_MODE=api` dùng các endpoint hội thoại. Không có cơ chế tự rơi về local khi API lỗi. Ở chế độ API, ô tìm kiếm chỉ khớp nội dung tin nhắn đã tải về.

Chế độ mock luôn dùng lịch sử local.

## Chế độ demo

Đặt `VITE_USE_MOCK=true` rồi khởi động lại Vite. Banner trên cùng ghi rõ đang ở chế độ demo. Câu trả lời lặp lại câu hỏi đã thoát ký tự và nói rằng đây không phải tra cứu pháp luật. Không có điều luật hay nguồn giả.

Đăng nhập demo chỉ cần định danh và mật khẩu từ 8 ký tự. Mật khẩu không được lưu. Phiên demo chỉ gồm id, tên và email trên thiết bị này.

Tắt mock trước khi nối backend thật. Giá trị mặc định trong `.env.example` là `false`.

## Giọng nói

- Micro dùng Web Speech API, ngôn ngữ `vi-VN`, trong `src/composables/useSpeechRecognition.ts`.
- Kết quả tạm thời và kết quả cuối được tách nếu trình duyệt gửi cả hai.
- Văn bản được đưa vào ô nhập. Người dùng sửa rồi gửi. Tự động gửi mặc định tắt, và chỉ chạy khi trình duyệt tự kết thúc nhận dạng.
- Đọc câu trả lời dùng SpeechSynthesis. Markdown, mã và liên kết được bỏ trước khi đọc. Ưu tiên giọng `vi-VN` nếu máy có. Không phải thiết bị nào cũng có giọng tiếng Việt.
- Nút đọc có tạm dừng, tiếp tục và dừng. Chuyển hội thoại sẽ dừng giọng đang đọc.
- Có thể tắt đọc câu trả lời, chọn giọng, chỉnh tốc độ từ 0,8 đến 1,2 trong Cài đặt.

Nếu sau này cần nhận dạng ổn định trên nhiều nền tảng, thêm dịch vụ speech-to-text ở backend rồi thay phần gọi trong composable. Giao diện không cần viết lại.

## Giới hạn trình duyệt

- Web Speech API phụ thuộc dịch vụ của trình duyệt và quyền micro. Từ chối quyền hoặc không có micro sẽ có thông báo, không tự gửi câu hỏi.
- Một số trình duyệt chỉ nhận dạng khi trang chạy trên `localhost` hoặc HTTPS.
- SpeechSynthesis có thể cắt câu dài. Ứng dụng chia đoạn khoảng 220 ký tự.
- Giọng tiếng Việt có thể vắng trên Windows, Firefox hoặc thiết bị di động.
- Trên màn hình cảm ứng, Enter xuống dòng. Nút gửi nằm cạnh ô nhập.
- Cookie xác thực không hoạt động nếu backend không bật CORS credentials.

## Giao diện

- Sidebar thu gọn trên desktop và thành ngăn kéo trên mobile.
- Thẻ chủ đề chỉ điền câu hỏi vào ô nhập, không tự gửi và không tạo câu trả lời.
- Light, dark và theo hệ thống. Lựa chọn lưu ở `legalai.theme` trước khi Vue khởi động để giảm nháy nền.
- Đánh giá hữu ích hoặc chưa hữu ích gửi `POST feedback` khi không ở chế độ demo. Nếu endpoint thiếu, trạng thái giữ trên thiết bị và ghi là chưa đồng bộ.

## Build production

```bash
npm run build
npm run preview
```

Đặt biến `VITE_` đúng môi trường lúc build. File tĩnh nằm trong `dist`. Backend phải cho phép origin production nếu dùng cookie.

## Vấn đề thường gặp

- **Không kết nối được API:** kiểm tra backend đang chạy, `VITE_API_BASE_URL` có hậu tố `/api` nếu server gắn route tại đó, và không có dấu `/` ở đầu đường dẫn service. Axios sẽ bỏ phần path của base URL nếu URL request bắt đầu bằng `/`.
- **401 liên tục:** phiên hết hạn. Cookie mode cần `GET auth/me` trả người dùng. Bearer mode cần header `Authorization`.
- **Đăng ký thất bại 404:** backend chưa có `POST auth/register`. Không bật mock để giả lập việc này trên môi trường thật.
- **Lịch sử biến mất sau đăng nhập:** lịch sử khách và lịch sử tài khoản tách riêng. Ở chế độ local, Cài đặt có mục đưa hội thoại khách vào tài khoản hiện tại.
- **Đổi `.env` không ăn:** tắt và chạy lại `npm run dev`. Bản ghi đè trong Cài đặt ưu tiên hơn giá trị env cho đến khi xóa.
- **Micro không nghe:** cấp quyền micro, dùng Chrome hoặc Edge, và mở bằng localhost hoặc HTTPS.
- **Chữ khó đọc sau đổi theme:** tải lại trang. Nếu vẫn lệch, xóa `legalai.theme` trong localStorage.
