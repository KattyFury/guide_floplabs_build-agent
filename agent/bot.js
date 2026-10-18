// Bot Telegram. Chạy khi máy tính bật + cửa sổ này còn mở. Tắt cửa sổ = agent nghỉ.
import fs from "node:fs";
import path from "node:path";
import { loadEnv, loadConfig, AGENT_DIR } from "./src/env.js";
import { research, parseHandle } from "./src/agent.js";
import { costLine, todayTotal } from "./src/cost.js";

loadEnv();
const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
if (!TOKEN) {
  console.log("❌ Chưa có TELEGRAM_BOT_TOKEN. Mở file agent/.env và dán token lấy từ @BotFather.");
  process.exit(1);
}
const API = `https://api.telegram.org/bot${TOKEN}`;
const OWNER_FILE = path.join(AGENT_DIR, "data", "owner.json");
const lastDetails = new Map();

async function tg(method, body) {
  const r = await fetch(`${API}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(70_000),
  });
  const j = await r.json();
  if (!j.ok) throw new Error(`Telegram: ${j.description}`);
  return j.result;
}

// Telegram giới hạn 4096 ký tự/tin → cắt nhỏ. Gửi chữ thường (không markdown) để không lỗi định dạng.
async function send(chatId, text) {
  for (let i = 0; i < text.length; i += 4000) {
    await tg("sendMessage", { chat_id: chatId, text: text.slice(i, i + 4000), disable_web_page_preview: true });
  }
}

// Bot riêng: người đầu tiên nhắn tin trở thành chủ. Người khác không dùng được (tránh tốn lượt của bạn).
function owner() {
  try {
    return JSON.parse(fs.readFileSync(OWNER_FILE, "utf8")).id;
  } catch {
    return null;
  }
}

const HELP = `👋 Mình là agent research kèo.

Gửi mình link X của dự án, ví dụ:
https://x.com/flop_labs

Mình sẽ:
1) Kiểm tra kèo này cá nhân có làm được không (rẻ, vài giây)
2) Nếu làm được: đọc web + X, chấm điểm, chỉ cách tham gia (khoảng 1 phút)

Lệnh:
/chitiet — xem dữ liệu agent đã gom cho kèo vừa hỏi
/moi <link> — research lại từ đầu, bỏ qua kết quả cũ
/chiphi — hôm nay đã tốn bao nhiêu`;

async function handle(msg, cfg) {
  const chatId = msg.chat.id;
  const text = (msg.text || "").trim();
  let me = owner();
  if (!me) {
    fs.mkdirSync(path.dirname(OWNER_FILE), { recursive: true });
    fs.writeFileSync(OWNER_FILE, JSON.stringify({ id: msg.from.id, name: msg.from.username || msg.from.first_name }));
    me = msg.from.id;
    console.log(`🔑 Chủ bot: ${msg.from.username || msg.from.first_name} (${me})`);
  }
  if (msg.from.id !== me) return send(chatId, "Đây là bot riêng. Bạn tự tạo agent của mình theo hướng dẫn trong repo nhé.");

  if (text === "/start" || text === "/help") return send(chatId, HELP);
  if (text === "/chiphi") {
    const t = todayTotal();
    return send(chatId, `💸 Hôm nay: ${t.runs} lần research · ≈$${t.usd}`);
  }
  if (text === "/chitiet") return send(chatId, lastDetails.get(chatId) || "Chưa có kèo nào. Gửi link X trước nhé.");

  const fresh = text.startsWith("/moi");
  const h = parseHandle(fresh ? text.slice(4) : text);
  if (!h) return send(chatId, "Mình chưa hiểu. Gửi link X dạng https://x.com/tenduan nhé. Gõ /help để xem hướng dẫn.");

  await send(chatId, `⏳ Đang kiểm tra @${h}… (vài giây tới khoảng 1 phút)`);
  console.log(`→ research @${h}${fresh ? " (mới)" : ""}`);
  try {
    const r = await research(cfg, h, { fresh });
    lastDetails.set(chatId, r.details);
    const foot = r.fromCache ? "♻️ Kết quả trong 7 ngày qua (không tốn lượt). Gõ /moi để research lại." : costLine(r.cost);
    await send(chatId, `${r.report}\n\n${foot}`);
    console.log(`  ✓ ${r.verdict} ${r.fromCache ? "(bộ nhớ)" : "$" + r.cost.cost_usd}`);
  } catch (e) {
    console.log(`  ✗ ${e.message}`);
    await send(chatId, `❌ ${e.message}`);
  }
}

async function main() {
  const cfg = loadConfig();
  const me = await tg("getMe", {});
  console.log(`✅ Agent đang chạy: https://t.me/${me.username}`);
  console.log("   Giữ cửa sổ này mở. Tắt cửa sổ hoặc tắt máy = agent nghỉ.\n");
  let offset = 0;
  for (;;) {
    let updates = [];
    try {
      updates = await tg("getUpdates", { offset, timeout: 50, allowed_updates: ["message"] });
    } catch (e) {
      console.log(`⚠️ Mất kết nối Telegram (${e.message}), thử lại sau 10 giây…`);
      await new Promise((r) => setTimeout(r, 10_000));
      continue;
    }
    // Xử lý lần lượt từng tin để không chạy nhiều research cùng lúc.
    for (const u of updates) {
      offset = u.update_id + 1;
      if (u.message?.text) await handle(u.message, cfg).catch((e) => console.log(`  ✗ ${e.message}`));
    }
  }
}

main().catch((e) => {
  console.log(`❌ ${e.message}`);
  process.exit(1);
});
