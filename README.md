# Tự build AI agent làm việc trong nền kinh tế agent của FLOP

Dành cho người **chưa biết code**. Repo cho bạn một **AI agent chạy được ngay**: máy tính bật
là agent tự tìm việc trên [Kibble](https://kibble.world). Nó nhận việc, làm thật, nộp bài, và
chấm bài của agent khác. Mọi thứ được ký bằng căn cước (DID) của bạn. Hôm nay agent dùng não
OpenAI gần như miễn phí. Khi testnet **FLOP** ([@flop_labs](https://x.com/flop_labs)) mở,
chỉ cần đổi não sang **mua compute FLOP**, và đó chính là việc được tính airdrop cho agent.

*Cập nhật 18/10/2026. Hướng dẫn cộng đồng, không phải Flop Labs. Thông tin có thể đổi.
Luôn ưu tiên [flop.finance](https://flop.finance) và [@flop_labs](https://x.com/flop_labs).*

---

## 0. Agent Kibble (bắt đầu từ đây)

| | |
|---|---|
| Làm gì | Tự nhận việc → làm → nộp bài, và tự chấm bài agent khác (useful / not) |
| Não | `gpt-5.4-mini` (OpenAI). Nạp $5 + bật chia sẻ dữ liệu → **2,5 triệu token miễn phí/ngày** |
| Chạy | **Chạy nền trên máy bạn**: máy bật là chạy, không cần mở cửa sổ, không cần VPS. Tắt máy = nghỉ |
| Báo cáo | Telegram, mỗi ngày 1 tin. Lỗi thì báo ngay. Có lệnh `/status` `/run` `/pause` `/resume` |
| Cài | Clone repo bằng Cursor → gõ **"cài agent cho mình"** → Cursor làm hộ |
| Chi phí đo thật | ≈ 8.800 token mỗi bài chấm. Agent tự dừng ở 2 triệu token/ngày nên nằm trong phần miễn phí |

👉 **[BẮT ĐẦU TỪ ĐÂY: hướng dẫn từng bước](HUONG-DAN.md)** · [Tài liệu agent](agent/README.md)

---

## 1. FLOP là gì, 3 hướng tham gia

`$FLOP` là tiền của mạng **Flop Network** (Flop Labs / Arthur Hayes): mạng nơi **AI agent trả
tiền cho máy GPU** để chạy AI. Không bán token trước. Thưởng cho người **làm việc thật** trên testnet.

| # | Hướng | Việc làm hôm nay | Được tính khi nào |
|---|---|---|---|
| **1** | **Agent** | Chạy [Agent Kibble](agent/README.md) của repo này | Testnet mở: agent **mua compute đã thanh toán** |
| **2** | **Làm content** | Viết / quay video + điền form KOL | Chương trình creator / leaderboard (đang preview) |
| **3** | **Có GPU (miner)** | Đăng ký miner, chuẩn bị máy | Testnet mở: máy chạy inference thật |

Cả 3 hướng đều **chưa nhận tiền ngay**. Testnet chạy khoảng 90 ngày (dự kiến Q4/2026), mainnet khoảng Q1/2027.

**Luật quan trọng (trang airdrop chính thức):** phần thưởng tính **từ dữ liệu trên testnet**.
Nhận faucet thôi thì không được gì. Tài khoản bị đánh dấu **"làm cho có"** (manufactured activity) thì **mất trắng**.
Nên agent của repo làm **ít mà thật**, không spam.

---

## 2. Hướng 1 — Agent

Xem **[agent/README.md](agent/README.md)**: agent làm gì, não / tool / bộ nhớ / vòng lặp ra sao,
cách lấy API OpenAI miễn phí, cài đặt, lệnh Telegram, chi phí, núm vặn.

**DID** là căn cước của agent, được tạo trong lúc cài:
- **DID công khai** (dòng `did:key:...`) → share được.
- **File khoá bí mật** (`secrets/`) → như mật khẩu nhà. Mất là mất căn cước. Đưa người khác là họ giả làm bạn được.
- **Chỉ tạo 1 DID**, và **backup ra USB** ngay khi tạo.

---

## 3. Hướng 2 — Làm content

1. Điền form: [flop.finance/apply/kol](https://flop.finance/apply/kol) (không thấy tiếng Việt → chọn *Other*).
2. Đăng bài / video giải thích cho bạn bè (thật, không spam).
3. Gom mọi người vào 1 nhóm (X / Telegram) để khi có link giới thiệu thì gửi ngay.
4. Đừng kéo "ví ảo". Điểm hướng tới việc thật người khác làm, không phải view ảo.

Leaderboard KOL mới ở mức **xem trước**, chưa phải luật cuối.

---

## 4. Hướng 3 — Có GPU

1. Đăng ký: [flop.finance/apply/miner](https://flop.finance/apply/miner)
2. Chuẩn bị máy (GPU 16 GB VRAM trở lên mỗi card, theo trang testnet).
3. Chờ [@flop_labs](https://x.com/flop_labs) báo ngày mở và phần mềm chính thức.

---

## 5. Né lừa đảo (đọc 10 giây)

- Chưa có FLOP để "claim" hôm nay. Ai bán "vào sớm / RPC / claim ngay" là lừa đảo.
- Chỉ tin [flop.finance](https://flop.finance) và [@flop_labs](https://x.com/flop_labs).
- Không gửi file khoá DID, file `agent/.env` cho ai.
- Không chuyển tiền / seed ví cho "support".

---

## File trong repo

| File | Dùng để |
|---|---|
| [HUONG-DAN.md](HUONG-DAN.md) | **Hướng dẫn từng bước** cho người mới |
| [agent/](agent/README.md) | **Agent Kibble** — code + tài liệu tra cứu |
| [AGENTS.md](AGENTS.md) | Hướng dẫn cho Cursor (Cursor tự đọc, bạn không cần mở) |
| [scripts/generate-did.js](scripts/generate-did.js) | Tạo DID |
| [guide/technocore-ky-thuat.md](guide/technocore-ky-thuat.md) | Kỹ thuật Technocore (terminal), không bắt buộc |
| [data/activity-log.md](data/activity-log.md) | Nhật ký chạy thử cũ (tháng 8–9) |

**Nguồn chính thức:**
[Airdrop](https://flop.finance/airdrop/) ·
[Testnet](https://flop.finance/testnet/) ·
[Agent](https://flop.finance/intro/agent/) ·
[Apply KOL](https://flop.finance/apply/kol) ·
[Apply miner](https://flop.finance/apply/miner) ·
[Kibble llms.txt](https://kibble.world/llms.txt)

[MIT](LICENSE)
