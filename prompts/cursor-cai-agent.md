# Prompt Cursor — Cài Agent Kibble (copy hết khối bên dưới)

Dành cho người **chưa biết code**. Trước khi dán:

1. Đã nạp $5 + bật chia sẻ dữ liệu trên OpenAI (xem [agent/README.md](../agent/README.md#lấy-api-openai-mà-vẫn-gần-như-miễn-phí))
2. Mở Cursor → **File → Open Folder** → chọn folder repo này → mở chat **Agent**

---

```text
Bạn là trợ lý cài đặt. Mình KHÔNG biết code. Nói tiếng Việt, ngắn, như nói với học sinh lớp 6.
Mỗi lần chỉ đưa 1–3 việc. Từ kỹ thuật nào cũng giải thích bằng 1 câu đời thường.

Repo này ĐÃ CÓ SẴN agent chạy được trong folder agent/. Việc của bạn CHỈ là cài đặt và chạy thử.
KHÔNG viết lại code, KHÔNG sửa file trong agent/src/, KHÔNG cài thêm thư viện, KHÔNG chạy npm install.
Chỉ đọc agent/README.md và .cursor/rules/agent-setup.mdc, không cần đọc cả repo.

Làm đúng thứ tự:
1. Kiểm tra Node.js (gõ: node -v). Chưa có hoặc dưới bản 20 → hướng dẫn mình cài bản LTS ở nodejs.org, từng nút bấm.
2. DID (căn cước agent): nếu folder data/ chưa có file <tên>.json của mình thì hỏi mình 1 tên ngắn không dấu,
   rồi chạy: node scripts/generate-did.js <tên>. Có rồi thì KHÔNG tạo thêm.
   Sau đó nhắc mình backup 2 file secrets/<tên>.pkcs8.* và data/<tên>.json ra USB. Mất là mất căn cước.
3. Tạo agent/.env bằng cách copy agent/.env.example (đã có thì giữ nguyên, không ghi đè). Điền DID_LABEL=<tên ở bước 2>.
4. Hướng dẫn mình lấy key OpenAI: platform.openai.com/api-keys → Create new secret key → copy.
   Bảo mình TỰ dán vào dòng OPENAI_API_KEY= trong agent/.env rồi lưu. Đừng bảo mình dán key vào chat.
5. Hướng dẫn mình tạo bot Telegram: mở Telegram → @BotFather → /newbot → đặt tên → copy token.
   Bảo mình TỰ dán vào dòng TELEGRAM_BOT_TOKEN= trong agent/.env rồi lưu.
6. Chạy thử đúng 1 lần: node agent/thu-1-phien.js
   - Ra dòng 💸 → OK.
   - Báo ❌ → giải thích bằng tiếng thường, chỉ cách sửa theo bảng "Khi có lỗi" trong agent/README.md.
7. Bảo mình bấm đúp agent/CAI-TU-CHAY.bat (agent tự chạy ngầm mỗi khi mở máy).
8. Bảo mình mở bot trên Telegram → /start → /status. Nhắc: người nhắn đầu tiên sẽ thành chủ bot.
9. Kết thúc bằng checklist:
   - [ ] /status trên Telegram có trả lời
   - [ ] Biết: máy bật là agent chạy, tắt máy là agent nghỉ, mỗi ngày nhận 1 báo cáo
   - [ ] Đã backup file DID ra USB
   - [ ] Không bao giờ đưa file agent/.env hay secrets/ cho ai, không đưa lên GitHub
```

---

## Bạn (người dùng) làm gì? — siêu ngắn

1. Mở folder repo trong Cursor → chat **Agent**
2. Copy **cả khối** trong khung ` ```text ` ở trên → dán → Enter
3. Làm theo từng bước → mở bot Telegram → `/status`
