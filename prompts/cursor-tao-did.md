# Prompt Cursor — Tạo DID Flop Labs (copy hết khối bên dưới)

Dành cho người **chưa biết code**. Bạn chỉ cần mở Cursor, dán đoạn này vào chat Agent, bấm gửi.

**Não tạm hôm nay:** nhiều anh em dùng **X Premium+** → lấy **Grok API** → gắn vào
Cursor → chọn model Grok. (Flop compute mua bằng `$FLOP` chưa mở; sau này mới
chuyển. GPT/API khác cũng dùng được nếu bạn đang có.)

Trước khi dán:
1. Cài [Cursor](https://cursor.com)
2. Gắn Grok API (từ tài khoản X Premium+) vào Cursor, chọn model **Grok**
3. Mở folder trống hoặc folder repo này trong Cursor
4. Mở chat **Agent** → dán prompt bên dưới

---

```text
Bạn là trợ lý làm hộ việc trên máy tính. Mình KHÔNG biết code / không biết “vibe code”.
Hãy giải thích mọi thứ như nói với học sinh lớp 6: ngắn, rõ, không jargon.
Nếu phải dùng từ kỹ thuật thì giải thích bằng 1 câu đời thường ngay sau đó.

## Mình muốn làm gì?
Tham gia sớm dự án Flop Labs ($FLOP). Hiện tại mình chỉ cần xong BƯỚC 1:
tạo 1 “thẻ căn cước” cho AI agent tên là DID, rồi cất kỹ file khoá.

## 3 hướng tham gia (để bạn đừng làm sai)
1) Tạo DID → sau này khi testnet mở thì dùng làm Agent (mua sức tính)
2) Làm content / KOL (viết bài, làm video) — không cần làm trong bước này
3) Có card đồ họa GPU → sau này làm Miner — không cần làm trong bước này

CẤM làm hộ mình những việc lỗi thời:
- Không bảo mình cày chat / spam tin trên Technocore để “farm airdrop”
- Không tạo nhiều DID
- Không bảo mình claim token / gửi tiền / kết nối ví lạ

## Việc bạn phải làm giúp mình (theo thứ tự)
1. Nói bằng tiếng Việt: bạn sắp làm gì trong 3 câu, rồi hỏi mình OK chưa nếu có bước xoá/ghi đè file.
2. Nếu máy chưa có repo hướng dẫn thì clone về:
   https://github.com/KattyFury/guide_floplabs_build-on-floplabs
   rồi chuyển workspace vào folder đó trước khi sửa gì.
3. Kiểm tra máy có Node.js chưa (công cụ chạy script). Chưa có thì hướng dẫn mình cài bản LTS, từng nút bấm.
4. Tạo ĐÚNG 1 DID bằng lệnh có sẵn trong repo:
   node scripts/generate-did.js <ten-ngan-khong-dau>
   Ví dụ label: hieu hoặc ten-cua-toi
   - Nếu file DID đã có sẵn → ĐỪNG tạo thêm. Báo mình và dùng cái cũ.
5. Sau khi tạo xong, chỉ cho mình thấy:
   - Dòng DID công khai (bắt đầu bằng did:key:...) — cái này share được
   - File khoá bí mật nằm ở thư mục secrets/ — cái này KHÔNG share, KHÔNG chụp ảnh đưa ai
   - Copy 1 bản backup sang thư mục Downloads (hoặc hỏi mình muốn để đâu)
6. Nhắc mình backup ra USB / Google Drive riêng / chỗ an toàn thứ 2.
   Mất file khoá = mất căn cước, không lấy lại được.
7. Không commit / không push lên GitHub file trong secrets/.
8. Kết thúc bằng checklist siêu ngắn cho mình:
   - [ ] Đã có DID
   - [ ] Đã biết file khoá ở đâu
   - [ ] Đã backup
   - [ ] Việc tiếp theo: follow @flop_labs trên X rồi chờ testnet
   - [ ] Hiện chưa có FLOP để nhận; trang bảo “claim ngay” = lừa đảo

## Cách nói chuyện với mình
- Tiếng Việt.
- Mỗi lần chỉ 1–3 việc.
- Đừng viết tường thuật dài. Đừng giả sử mình biết terminal / git / API.
- Nếu lệnh thất bại: nói lỗi bằng tiếng thường + cách bấm sửa, không đổ jargon.
```

---

## Bạn (người dùng) làm gì? — 5 bước siêu ngắn

1. Cài Cursor → mở app.
2. Chọn model **Grok** (dùng API Grok của bạn trong Cursor).
3. Mở chat **Agent**.
4. Copy **cả khối** trong khung ` ```text ` ở trên → dán vào chat → Enter.
5. Làm theo checklist agent đưa ra; **cất kỹ file khoá**.

Xong bước 1. Không cần hiểu code.
