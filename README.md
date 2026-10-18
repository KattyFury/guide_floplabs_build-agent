# Tự build Agent AI của riêng bạn — nuôi bằng gói X hôm nay, compute Flop ngày mai

Dành cho người **chưa biết code**. Ai có **gói X từ Plus ($8/tháng)** là đã có sẵn
**Grok API** — "bộ não" để chạy agent của riêng mình — và **Cursor** để AI cài hộ.
Thay vì chỉ dùng gói X để tắt quảng cáo / cày view, dùng nó nuôi 1 agent làm việc thật.
Khi mạng **Flop** ([@flop_labs](https://x.com/flop_labs)) mở, agent chuyển sang
**mua compute `$FLOP`** — và đó chính là việc được tính airdrop.

*Cập nhật 18/10/2026. Hướng dẫn cộng đồng, không phải Flop Labs. Thông tin có
thể đổi — luôn ưu tiên [@flop_labs](https://x.com/flop_labs).*

---

## 0. Agent đầu tiên: research kèo (bắt đầu từ đây)

Gửi link X của 1 dự án qua Telegram → agent tự đọc web + X rồi trả lời gọn kiểu
ELI12: **kèo này cá nhân có làm được không, có đáng làm không, có mấy hướng tham
gia, người mới nên làm gì tiếp**.

| | |
|---|---|
| Não | Grok API (có trong gói X từ Plus) |
| Cài đặt | Dán 1 prompt vào Cursor → Cursor làm hộ |
| Chạy | Trên máy bạn — **chạy khi máy bật + cửa sổ agent mở** |
| Chi phí đo thật | ≈ $0.02 kèo bị loại · ≈ $0.11–0.16 kèo research đầy đủ |

👉 **[Hướng dẫn agent](agent/README.md)** · **[Prompt dán vào Cursor](prompts/cursor-cai-agent.md)**

---

# Flop Labs — 3 hướng tham gia trước airdrop $FLOP

`$FLOP` là tiền của mạng **Flop Network** (Flop Labs / Arthur Hayes): mạng cho
máy GPU bán sức tính cho AI agent. Không bán token trước. Thưởng cho người
**làm việc thật** sau này trên mạng.

## 1. Ba hướng (nhớ bảng này là đủ)

| # | Hướng | Việc làm hôm nay | Được tính khi nào |
|---|---|---|---|
| **1** | **Tạo DID → chờ testnet** | Tạo 1 “căn cước” DID + backup khoá | Testnet mở: dùng làm Agent mua sức tính |
| **2** | **Làm content** | Viết / quay video + điền form KOL | Chương trình creator / leaderboard (đang preview) |
| **3** | **Có GPU → chờ testnet** | Đăng ký miner, chuẩn bị máy | Testnet mở: máy chạy inference thật |

Cả 3 hướng đều **chưa nhận tiền ngay**. Thưởng gắn lúc mạng chính thức
(dự kiến khoảng Q1/2027). Testnet được nói khoảng cuối tháng 10 / đầu 11/2026.

### Đừng làm theo (lỗi thời)

Chat / spam tin trên Technocore **không** còn là cách lấy airdrop.
Tạo DID chỉ để **có danh tính sẵn**, không phải “điểm” tự động.

---

## 2. Hướng 1 — Tạo DID (bắt đầu từ đây)

**DID** = tờ căn cước của agent trên máy bạn. Có 2 phần:

- **DID công khai** (dòng chữ `did:key:...`) → share được.
- **File khoá bí mật** → như mật khẩu nhà. Mất = mất căn cước. Đưa người khác = họ giả làm bạn.

### Não hôm nay = tận dụng gói X (Plus trở lên), trước khi có compute Flop

Flop chưa mở để mua não GPU bằng `$FLOP`. Repo này **chỉ hướng dẫn một đường**:

**Gói X (Plus trở lên) → Grok API → Cursor Agent → tạo DID / nuôi agent trên máy.**

| Bước | Việc làm (đời thường) |
|---|---|
| 1 | Có **gói X từ Plus trở lên** trên [x.com](https://x.com) (để dùng Grok / lấy API) |
| 2 | Cài [Cursor](https://cursor.com) — app để AI làm hộ việc trên máy |
| 3 | Lấy **Grok API key** từ phía X/Grok → dán vào Cursor → chọn model **Grok** |
| 4 | Mở chat **Agent**, dán prompt ở dưới → Agent tạo DID hộ bạn |
| 5 | Backup file khoá. Follow [@flop_labs](https://x.com/flop_labs) chờ testnet |

Ý dài hạn: hôm nay dùng **não Grok (qua gói X)** → khi Flop mở, agent
**mua compute `$FLOP`**.

### Cách chính — Cursor + Grok (gói X)

1. Đăng ký / nâng **gói X (Plus trở lên)**.
2. Cài [Cursor](https://cursor.com) và mở app.
3. Gắn **Grok API** vào Cursor, chọn model **Grok**.
4. Mở chat **Agent**.
5. Mở **[prompts/cursor-tao-did.md](prompts/cursor-tao-did.md)** → **copy cả khối**
   trong khung code → dán vào Agent → Enter.
6. Làm đúng checklist agent đưa ra.
7. Khi xong: có DID + biết file khoá nằm đâu + đã **backup ra 2 nơi**.

Không cần hiểu lệnh. Agent làm hộ; bạn chỉ duyệt và cất file.

Chưa biết bấm đâu lấy API key? Trong Cursor hỏi Grok:
*“Hướng dẫn mình lấy Grok API từ gói X (Plus trở lên) rồi dán vào Cursor, từng nút,
như nói với học sinh lớp 6.”*

### Cách phụ — Chỉ cần DID, không nuôi agent bằng Cursor

👉 **[Trang web tạo DID](https://kattyfury.github.io/guide_floplabs_build-agent/)**  
(hoặc [guide/technocore-ky-thuat.md](guide/technocore-ky-thuat.md) nếu tự gõ lệnh).

Repo vẫn **ưu tiên Cách chính (gói X)**.

### Sau khi có DID

1. Follow [@flop_labs](https://x.com/flop_labs) — bật thông báo.
2. **Chỉ tạo 1 DID.** Nhiều căn cước giả dễ bị gộp / mất thưởng.
3. Khi testnet mở: Agent được tính khi **mua sức tính thật đã thanh toán** —
   không phải faucet, không phải giữ token suông.

Hiện **chưa** mở testnet cho mọi người. Ai bán “vào sớm / RPC / claim ngay” →
coi là lừa đảo.

---

## 3. Hướng 2 — Làm content

1. Điền form: [flop.finance/apply/kol](https://flop.finance/apply/kol)  
   (Không thấy tiếng Việt → chọn *Other*.)
2. Đăng bài / video giải thích 3 hướng ở mục 1 cho bạn bè (thật, không spam).
3. Gom mọi người vào 1 nhóm (X / Telegram) để khi có link giới thiệu thì gửi ngay.
4. Đừng kéo “ví ảo”. Điểm hướng tới việc thật người khác làm, không phải view ảo.

Leaderboard KOL mới ở mức **xem trước** — chưa phải luật cuối.

---

## 4. Hướng 3 — Có GPU

1. Đăng ký: [flop.finance/apply/miner](https://flop.finance/apply/miner)
2. Chuẩn bị máy (thường cần GPU khá mạnh — xem lại trang testnet khi live).
3. Chờ [@flop_labs](https://x.com/flop_labs) báo ngày mở và phần mềm chính thức.

Khi testnet mở: thưởng miner gắn với sức tính **đã chạy và được kiểm tra**.

---

## 5. Chọn hướng nào?

| Bạn là… | Làm |
|---|---|
| Người thường, chưa biết code | **Hướng 1** (gói X → Cursor + Grok) |
| Thích viết / làm video / có follower | **Hướng 2** (+ nên có DID hướng 1) |
| Có card đồ họa mạnh | **Hướng 3** |

Làm chung 1 + 2 cũng được. Đừng tốn thời gian cày chat Technocore.

---

## 6. Né lừa đảo (đọc 10 giây)

- Chưa có FLOP để “claim” hôm nay.
- Chỉ tin [flop.finance](https://flop.finance) và [@flop_labs](https://x.com/flop_labs).
- Không gửi file khoá DID cho ai.
- Không chuyển tiền / seed ví cho “support”.

---

## File trong repo này

| File | Dùng để |
|---|---|
| [prompts/cursor-tao-did.md](prompts/cursor-tao-did.md) | **Copy prompt** dán vào Cursor (Hướng 1) |
| [guide/technocore-ky-thuat.md](guide/technocore-ky-thuat.md) | Kỹ thuật phụ (terminal) — không bắt buộc |
| [data/activity-log.md](data/activity-log.md) | Nhật ký chạy thử cũ |

**Nguồn chính thức:**
[Airdrop](https://flop.finance/airdrop/) ·
[Testnet](https://flop.finance/testnet/) ·
[Apply KOL](https://flop.finance/apply/kol) ·
[Apply miner](https://flop.finance/apply/miner)

[MIT](LICENSE)
