# Flop Labs cho người Việt — 3 hướng tham gia trước airdrop $FLOP

Dành cho người **chưa biết code**. Không cần “biết vibe code” — chỉ cần làm
đúng hướng, cất kỹ file quan trọng, rồi chờ ngày testnet / chương trình KOL.

`$FLOP` là tiền của mạng **Flop Network** (Flop Labs / Arthur Hayes): mạng cho
máy GPU bán sức tính cho AI agent. Không bán token trước. Thưởng cho người
**làm việc thật** sau này trên mạng.

*Cập nhật 18/10/2026. Hướng dẫn cộng đồng, không phải Flop Labs. Thông tin có
thể đổi — luôn ưu tiên [@flop_labs](https://x.com/flop_labs).*

---

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

### Não dùng hôm nay (trước khi có compute Flop)

Flop chưa mở để mua não GPU bằng `$FLOP`. Trong lúc chờ, agent của bạn vẫn
cần **một bộ não tạm** để làm việc trên máy (Cursor giúp gõ lệnh / tạo DID hộ).

| Option | Ai hợp | Ghi chú |
|---|---|---|
| **Cursor + Grok API** | Có **X Premium+** (gói Plus/Premium trên X) | Lấy API Grok → gắn vào Cursor → chọn model Grok. Đây là option khuyên dùng trong repo này. |
| **Cursor + API khác** (GPT…) | Đang dùng ChatGPT / có credit API | Cũng được: tập cho agent làm việc; sau này mới chuyển sang compute Flop khi mạng mở. |
| **Chỉ trang web** (Cách B) | Không muốn cài Cursor | Chỉ tạo DID, không “nuôi” agent trên máy. |

Ý dài hạn: hôm nay dùng Grok/GPT làm não tạm → khi Flop testnet/mainnet mở,
agent **mua compute `$FLOP`** thay vì (hoặc bớt) phụ thuộc API công ty lớn.

### Cách A — Dùng Cursor + Grok (khuyên dùng nếu bạn không biết code)

1. Có tài khoản **X Premium+** (để dùng được Grok API theo gói của X).
2. Cài [Cursor](https://cursor.com) và mở app.
3. Gắn **Grok API** vào Cursor, rồi chọn model **Grok**.
4. Mở chat **Agent**.
5. Mở file prompt này, **copy cả khối** trong khung code:
   **[prompts/cursor-tao-did.md](prompts/cursor-tao-did.md)**
6. Dán vào chat Agent → Enter → làm đúng checklist agent đưa ra.
7. Khi xong: bạn phải có DID + biết file khoá nằm đâu + đã **backup ra 2 nơi**.

Không cần hiểu lệnh. Agent làm hộ; bạn chỉ duyệt và cất file.

*(Chi tiết bấm đâu để lấy API key / dán vào Cursor: sẽ bổ sung sau nếu anh em cần.
Tạm thời nhờ Agent Grok trong Cursor hướng dẫn từng nút — nhớ bảo nó “giải thích
như học sinh lớp 6”.)*

### Cách B — Web (không cần Cursor)

👉 **[Mở trang tạo DID](https://kattyfury.github.io/guide_floplabs_build-on-floplabs/)**  
Chạy trong trình duyệt, khoá không gửi lên server của chúng tôi.

### Cách C — Tự gõ lệnh (đã biết một chút máy tính)

Xem [guide/technocore-ky-thuat.md](guide/technocore-ky-thuat.md).

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
| Người thường, chưa biết code | **Hướng 1** (Cursor + prompt) |
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
