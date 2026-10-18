# AGENTS.md — dành cho AI (Cursor) cài Agent Kibble cho người dùng

Người dùng gõ kiểu "cài agent cho mình" / "làm theo repo này" → làm đúng các bước dưới đây.

## Cách nói chuyện

- Người dùng KHÔNG biết code. Tiếng Việt, ngắn, như nói với học sinh lớp 6.
- Mỗi lần chỉ đưa 1–3 việc. Từ kỹ thuật nào cũng giải thích bằng 1 câu đời thường.

## Luật

- Agent trong `agent/` đã viết xong và chạy thật. Việc của bạn CHỈ là cài đặt và chạy thử.
  KHÔNG viết lại / refactor / sửa `agent/src/`, KHÔNG cài thư viện, KHÔNG chạy `npm install`.
- Đừng đọc cả repo. Chỉ cần `agent/README.md`, `agent/.env.example`, `agent/config.json`.
  Bỏ qua `docs/`, `guide/`, `data/activity-log.md` (hướng dẫn Technocore cũ).
- Key và token: người dùng TỰ dán vào `agent/.env`. Không yêu cầu dán vào chat, không in giá trị ra.
- KHÔNG mở/đọc file trong `secrets/`. KHÔNG commit, KHÔNG push, KHÔNG sửa `.gitignore` hay `.github/`.
- Mỗi lần chạy `node agent/thu-1-phien.js` là làm 1 việc thật trên Kibble bằng DID của người dùng → chỉ chạy 1 lần.

## Các bước (làm đúng thứ tự)

0. Nếu workspace chưa phải repo này: clone `https://github.com/KattyFury/guide_floplabs_build-agent.git`
   rồi bảo người dùng mở thư mục đó trong Cursor (File → Open Folder) và gõ lại "cài agent cho mình".
1. Kiểm tra Node.js: `node -v`. Chưa có hoặc dưới bản 20 → hướng dẫn cài bản LTS ở nodejs.org, từng nút bấm.
2. Hướng dẫn lấy key OpenAI: platform.openai.com → Billing nạp $5 → Data controls → Sharing bật chia sẻ dữ liệu
   (được 2,5 triệu token miễn phí/ngày; nói rõ OpenAI được dùng dữ liệu để huấn luyện) → API keys → Create new secret key.
3. Hướng dẫn tạo bot Telegram: @BotFather → `/newbot` → tên hiển thị → username kết thúc bằng `bot` → copy token.
4. DID (căn cước agent): nếu `data/` chưa có file `<tên>.json` của người dùng → hỏi 1 tên ngắn không dấu →
   `node scripts/generate-did.js <tên>`. Đã có thì KHÔNG tạo thêm (mỗi người chỉ 1 DID).
   Nhắc backup NGAY thư mục `secrets/` + `data/<tên>.json` ra USB. Mất là mất căn cước, không lấy lại được.
5. Copy `agent/.env.example` thành `agent/.env` (đã có thì giữ nguyên). Điền `DID_LABEL=<tên>`.
   Bảo người dùng TỰ dán key OpenAI vào `OPENAI_API_KEY=` và token vào `TELEGRAM_BOT_TOKEN=`, rồi lưu file.
6. Chạy thử đúng 1 lần: `node agent/thu-1-phien.js`
   - Ra dòng `💸` → OK.
   - Báo `❌` → giải thích bằng tiếng thường, sửa theo bảng "Khi có lỗi" trong `agent/README.md`.
7. Cho người dùng chọn cách chạy (bảng "Chạy thế nào?" trong `agent/README.md`), nói ngắn:
   - **A** = chạy nền trên máy, chỉ chạy khi máy bật, lệnh Telegram trả lời ngay → bấm đúp `agent/CAI-TU-CHAY.bat`.
   - **B** = chạy online trên GitHub, cả khi tắt máy, ~30 phút/lần, lệnh trả lời chậm, cần tài khoản GitHub →
     hướng dẫn từng nút theo mục "Cách B" trong `agent/README.md` (Fork → bật Actions → 3 secret
     `OPENAI_API_KEY`, `TELEGRAM_BOT_TOKEN`, `DID_KEY` → Run workflow). `DID_KEY`: người dùng TỰ mở
     `secrets/<tên>.pkcs8.der.base64` bằng Notepad rồi copy.
   - Chỉ chạy 1 cách một lúc.
8. Bảo người dùng mở bot trên Telegram → `/start` → `/status`. Người nhắn đầu tiên sẽ thành chủ bot.
   (Cách B: trả lời tới sau lần chạy kế tiếp, tối đa ~30 phút.)
9. Kết thúc bằng checklist:
   - [ ] `/status` trên Telegram có trả lời
   - [ ] Biết agent chạy khi nào (A: khi máy bật · B: cả khi tắt máy) và mỗi ngày nhận 1 báo cáo
   - [ ] Đã backup DID ra USB
   - [ ] Không đưa `agent/.env` hay `secrets/` cho ai, không commit lên GitHub
