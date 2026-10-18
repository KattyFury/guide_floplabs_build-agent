# Agent research kèo — gửi link X, nhận câu trả lời "có nên làm không"

Bạn lướt X thấy một dự án đang được hype. Gửi link cho agent qua Telegram,
khoảng 1 phút sau nhận lại:

```text
🔍 Flop Labs — 4/10 · CHỜ THÊM

Là gì: Dự án đang thử làm mạng cho máy AI tính toán, chưa chạy thật.

👍 Vì sao đáng làm
• Không bán token trước, ai cũng ngang nhau
• Airdrop dành 24% token cho người thử
• Vai trò đơn giản chỉ cần ví miễn phí

👎 Vì sao cẩn thận
• Testnet chưa mở, chỉ là bản nháp
• Chỉ một người công khai dẫn dắt
• Quy tắc token còn thay đổi được

🚩 Cảnh báo: Có nhiều trang giả mạo bán token giả.

👉 Làm gì: Chờ testnet mở rồi thử miễn phí, không nạp tiền gì cả.
```

Kèo mà **cá nhân không làm được** thì agent báo ngay trong vài giây, không tốn
công research:

| Loại | Agent trả lời |
|---|---|
| Dành cho doanh nghiệp (book demo, contact sales…) | 🏢 Cá nhân không tham gia được |
| AI thuần — không ví, không chain, không token | 🤖 Không có gì để farm |
| Web2 — chỉ có quỹ crypto đầu tư | 🌐 Có quỹ crypto ≠ có airdrop |

---

## Cần gì?

| Thứ cần | Vì sao | Giá |
|---|---|---|
| **Gói X từ Plus trở lên** (The X Subscription) | Có sẵn Grok API = "não" của agent, có sẵn tool tìm trên X + đọc web | $8/tháng |
| **Cursor** | App để AI cài agent hộ bạn | Có trong gói X |
| **Node.js** (bản LTS) | Chương trình để chạy agent | Miễn phí |
| **Telegram** | Nói chuyện với agent | Miễn phí |

**Agent chỉ chạy khi máy tính bật và cửa sổ agent còn mở.** Tắt cửa sổ hoặc
tắt máy = agent nghỉ, nhắn tin lúc đó sẽ không ai trả lời (bật lại là nó đọc
tin cũ và trả lời tiếp).

---

## Cài đặt — để Cursor làm hộ

1. Mở Cursor → **File → Open Folder** → chọn folder repo này.
2. Mở chat **Agent**, chọn model **Grok**.
3. Mở file [`prompts/cursor-cai-agent.md`](../prompts/cursor-cai-agent.md), copy cả khối
   prompt, dán vào chat → Enter.
4. Làm theo từng bước Cursor hướng dẫn (lấy key Grok, tạo bot Telegram, dán vào file `.env`).
5. Cursor chạy thử xong → **bấm đúp `agent/CHAY-AGENT.bat`** mỗi lần muốn bật agent.

Tự làm không cần Cursor? Xem mục [Tự cài bằng tay](#tự-cài-bằng-tay) ở cuối.

---

## Tốn bao nhiêu? (đo thật 18/10/2026)

| Trường hợp | Chi phí 1 kèo | Thời gian |
|---|---|---|
| Kèo không làm được (dừng ở cổng lọc) | ≈ $0.02 | 3–6 giây |
| Kèo làm được (research đầy đủ + tranh luận) | ≈ $0.11 | 35–55 giây |
| Hỏi lại kèo đã research trong 7 ngày | $0 (lấy từ bộ nhớ) | tức thì |

Mỗi câu trả lời có dòng `💸` cho biết đúng lần đó tốn bao nhiêu. Gõ `/chiphi`
để xem tổng hôm nay. Log đầy đủ ở `agent/logs/cost.jsonl`.

Tiền đi đâu: phần lớn là **tìm kiếm** (đọc web ≈ $0.005/lần, đọc bài X ≈ $0.005/bài)
và chữ đọc từ web. Phần "suy nghĩ + tranh luận" hiện chỉ ≈ $0.01.

---

## Agent làm gì bên trong

```text
Link X
  │
  ▼
🚪 Cổng lọc (rẻ): đọc website → cá nhân có làm được không?
  │      └─ không → trả lời 2 dòng, DỪNG
  ▼
🔎 Gom dữ liệu: đọc web + X (vốn, team, token, cách tham gia, cờ đỏ)
  │      └─ đã có token + biết contract → lấy giá/thanh khoản từ DexScreener (miễn phí)
  ▼
⚔️ Tranh luận: 1 agent tìm lý do NÊN làm, 1 agent tìm lý do NÊN NÉ (chạy song song)
  ▼
⚖️ Trọng tài: chấm điểm, viết kết luận ngắn kiểu ELI12
```

Gõ `/chitiet` trên Telegram để xem toàn bộ dữ liệu + cuộc tranh luận của kèo vừa hỏi.

---

## Núm vặn — hôm nay nuôi bằng gói X, mai cho ăn compute Flop

Mọi thứ chỉnh trong [`config.json`](config.json), không cần sửa code:

| Núm | Hôm nay | Khi có compute Flop |
|---|---|---|
| `research.debate_rounds` — số vòng tranh luận | 1 | 3–5 |
| `research.max_tool_calls` — số lần tìm web/X | 4 | 10+ |
| `think.model` / `think.base_url` — não suy nghĩ | `grok-4.3` trên xAI | model mở trên Flop |
| `cache_days` — nhớ kết quả bao lâu | 7 | 1–3 |

Phần **suy nghĩ/tranh luận** dùng chuẩn OpenAI, nên khi Flop mở chỉ cần đổi
`think.base_url` + `think.model` + `think.api_key_env`. Phần **gom dữ liệu**
đang dùng tool tìm X/web có sẵn của Grok — khi chuyển hẳn khỏi Grok thì phải thay
bằng tool riêng.

---

## Lệnh Telegram

| Gửi | Agent làm |
|---|---|
| `https://x.com/tenduan` hoặc `@tenduan` | Research kèo đó |
| `/moi https://x.com/tenduan` | Research lại từ đầu, bỏ qua kết quả cũ |
| `/chitiet` | Xem dữ liệu + tranh luận của kèo vừa hỏi |
| `/chiphi` | Hôm nay đã tốn bao nhiêu |

Bot là **bot riêng**: người đầu tiên nhắn tin sẽ thành chủ, người khác nhắn vào
bị từ chối (để không ai dùng ké lượt của bạn). Muốn đổi chủ: xoá file `agent/data/owner.json`.

---

## Khi có lỗi

| Agent báo | Làm gì |
|---|---|
| `Chưa có key Grok` | Mở `agent/.env`, điền `XAI_API_KEY` |
| `Key Grok sai` | Tạo key mới tại grok.com/dashboard (tab **Grok Inference**, không phải tab Cursor) |
| `Hết lượt dùng / hết credit` | Xem grok.com/dashboard/billing: chờ reset tuần hoặc nạp thêm |
| `Chưa có TELEGRAM_BOT_TOKEN` | Mở `agent/.env`, dán token từ @BotFather |
| Cửa sổ đen tắt ngay khi bấm đúp | Chưa cài Node.js → cài bản LTS tại nodejs.org |

---

## Tự cài bằng tay

1. Cài [Node.js](https://nodejs.org) bản **LTS**.
2. Copy `agent/.env.example` thành `agent/.env`, điền:
   - `XAI_API_KEY` — grok.com/dashboard → API keys → **Create** → tab **Grok Inference**
   - `TELEGRAM_BOT_TOKEN` — nhắn [@BotFather](https://t.me/BotFather) → `/newbot` → copy token
3. Thử không cần Telegram: mở Terminal trong folder repo, gõ
   `node agent/run.js https://x.com/flop_labs`
4. Bật bot: bấm đúp `agent/CHAY-AGENT.bat` (hoặc `node agent/bot.js`).
5. Mở bot trên Telegram → `/start` → gửi link X.

Không cần `npm install` — agent không dùng thư viện ngoài.
