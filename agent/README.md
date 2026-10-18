# Agent research kèo — gửi link X, nhận câu trả lời "có nên làm không"

Bạn lướt X thấy một dự án đang được hype. Gửi link cho agent qua Telegram,
khoảng 1 phút sau nhận lại:

```text
🔍 Flop Labs — 4/10 · CHỜ THÊM

Là gì: Một dự án chưa có mạng thật, đang chuẩn bị thử nghiệm cho máy tính chạy việc AI.

🧭 Cách tham gia (4 hướng)
1. Miner — Có GPU thường, nộp đơn miễn phí, sắp mở thử nghiệm
2. Validator — Nộp đơn miễn phí, sắp mở thử nghiệm
3. Agent/user — Dùng thử miễn phí khi có thử nghiệm
4. KOL/builder — Nộp đơn miễn phí qua form chính thức

👍 Vì sao đáng làm
• Không ai bán trước, ai cũng bắt đầu ngang nhau
• Arthur Hayes đứng dẫn dắt
• Thử nghiệm mở đơn miễn phí

👎 Vì sao cẩn thận
• Chưa có mạng thật chạy
• Nhiều giấy tờ vẫn đang nháp

🚩 Cảnh báo: Nhiều token giả mạo FLOP đang bán ngoài.

👉 Làm gì: Người mới chờ thử nghiệm mở rồi nộp đơn miner hoặc agent tại flop.finance, KHÔNG nạp tiền gì cả.
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
| Kèo không làm được (dừng ở cổng lọc) | ≈ $0.0015 | 3 giây |
| Kèo làm được (research đầy đủ) | ≈ $0.007 | 30 giây |
| Research + đọc thêm X (`/x`) | ≈ $0.16 | 30 giây |
| Hỏi lại kèo đã research trong 7 ngày | $0 (lấy từ bộ nhớ) | tức thì |

Gói X **Plus** có lượt dùng mỗi tuần ≈ $10 theo giá API (đo thật: $1.28 = 13% lượt
tuần). Tức là **~1.000+ kèo/tuần** ở chế độ thường, nhưng chỉ ~60 kèo/tuần nếu kèo nào
cũng `/x`.

Mỗi câu trả lời có dòng `💸` cho biết đúng lần đó tốn bao nhiêu. Gõ `/chiphi`
để xem tổng hôm nay. Log đầy đủ ở `agent/logs/cost.jsonl`, lỗi ở `agent/logs/errors.log`.

Vì sao rẻ: agent **tự tìm web miễn phí** (Brave Search, dự phòng DuckDuckGo) và tự
tải trang về, cắt gọn rồi mới đưa Grok đọc. Tool tìm web/X có sẵn của Grok tính tiền
mỗi lần tìm ($0.005) và nhét cả trang vào (tốn token) — bản đầu dùng nó tốn $0.11–0.27/kèo.
Tìm trên X thì không có cách miễn phí, nên chỉ bật khi gõ `/x`.

---

## Agent làm gì bên trong

```text
Link X
  │
  ▼
🚪 Cổng lọc: tìm web miễn phí → Grok đọc kết quả → cá nhân có làm được không?
  │      └─ không → trả lời 2 dòng, DỪNG
  ▼
🔎 Gom dữ liệu MIỄN PHÍ: 4 lượt tìm web (cách tham gia, vốn, token, lừa đảo)
  │   + tải tối đa 3 trang chính thức, mỗi trang cắt còn 4.000 ký tự
  │      ├─ đã có token + biết contract → giá/thanh khoản từ DexScreener (miễn phí)
  │      └─ gõ /x → Grok đọc thêm bài trên X 30 ngày gần nhất (trả phí)
  ▼
⚖️ Trọng tài: cân lý do nên làm / nên né, chấm điểm, liệt kê các hướng tham gia,
   viết kết luận ngắn kiểu ELI12
```

Gõ `/chitiet` trên Telegram để xem toàn bộ dữ liệu agent đã gom cho kèo vừa hỏi.

---

## Núm vặn — hôm nay nuôi bằng gói X, mai cho ăn compute Flop

Mọi thứ chỉnh trong [`config.json`](config.json), không cần sửa code:

| Núm | Hôm nay | Khi có compute Flop |
|---|---|---|
| `web.max_pages` — số trang chính thức được đọc | 3 | 10+ |
| `web.page_chars` — đọc bao nhiêu chữ mỗi trang | 4000 | 20000+ |
| `web.results_per_query` — số kết quả mỗi lượt tìm | 5 | 10 |
| `think.model` / `think.base_url` — não suy nghĩ | `grok-4.3` trên xAI | model mở trên Flop |
| `cache_days` — nhớ kết quả bao lâu | 7 | 1–3 |

Cả cổng lọc và bước viết kết luận đều dùng chuẩn OpenAI, nên khi Flop mở chỉ cần đổi
`think.base_url` + `think.model` + `think.api_key_env` (và `brain.gate_model`).
Phần tìm web là code của mình, không phụ thuộc Grok. Chỉ `/x` dùng tool riêng của Grok.

---

## Lệnh Telegram

| Gửi | Agent làm |
|---|---|
| `https://x.com/tenduan` hoặc `@tenduan` | Research kèo đó |
| `/moi https://x.com/tenduan` | Research lại từ đầu, bỏ qua kết quả cũ |
| `/x https://x.com/tenduan` | Research + đọc thêm bài trên X (≈ $0.16, đắt gấp ~20 lần) |
| `/chitiet` | Xem dữ liệu agent đã gom cho kèo vừa hỏi |
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
