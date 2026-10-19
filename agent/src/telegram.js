// Phần Telegram của agent (bot.js): gửi tin, trạng thái, báo cáo ngày, chủ bot.
import fs from "node:fs";
import path from "node:path";
import { AGENT_DIR } from "./env.js";
import { loadMemory, dayOf } from "./agent.js";
import * as kibble from "./kibble.js";

const STATE_FILE = path.join(AGENT_DIR, "data", "bot.json"); // chủ bot, tạm dừng, ngày đã báo cáo

export function state() {
  try {
    return JSON.parse(fs.readFileSync(STATE_FILE, "utf8"));
  } catch {
    return {};
  }
}
export function setState(patch) {
  fs.mkdirSync(path.dirname(STATE_FILE), { recursive: true });
  fs.writeFileSync(STATE_FILE, JSON.stringify({ ...state(), ...patch }));
}

export function makeTelegram(token) {
  if (!token) throw new Error("Chưa có TELEGRAM_BOT_TOKEN (lấy từ @BotFather).");
  const API = `https://api.telegram.org/bot${token}`;
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
  return { tg };
}

export const FOOTER = "\n\n⌨️ /status · /run · /pause · /resume · /help · nhắn câu hỏi = đăng việc";

export const COMMANDS = [
  { command: "status", description: "Điểm, hạng, hôm nay đã làm gì" },
  { command: "run", description: "Làm ngay 1 việc" },
  { command: "pause", description: "Tạm dừng" },
  { command: "resume", description: "Chạy lại" },
  { command: "help", description: "Agent này làm gì" },
];

// Mọi tin nhắn đều kèm dòng gợi ý lệnh ở cuối, để người dùng luôn biết mình gõ được gì.
// Trả về true nếu gửi được hết.
export async function send(tg, text, chatId = state().owner) {
  if (!chatId) return console.log(`(chưa có chủ bot, không gửi được) ${text}`), false;
  text += FOOTER;
  let ok = true;
  for (let i = 0; i < text.length; i += 4000)
    await tg("sendMessage", { chat_id: chatId, text: text.slice(i, i + 4000), disable_web_page_preview: true }).catch((e) => {
      ok = false;
      console.log(`⚠️ ${e.message}`);
    });
  return ok;
}

export async function statusText(cfg, id) {
  const L = cfg.limits;
  const day = dayOf(loadMemory());
  let s = { score: "?", rank: null };
  try {
    s = await kibble.score(id.did);
  } catch {}
  return [
    `🪪 ${id.did.slice(0, 16)}…${id.did.slice(-6)}`,
    `🏆 Điểm Kibble: ${s.score}${s.rank ? ` · hạng ${s.rank}` : ""}`,
    `📦 Hôm nay: nộp ${day.results} bài · chấm ${day.attests} bài · ${day.sessions} vòng`,
    `🔋 Token: ${day.tokens.toLocaleString("en")} / ${L.daily_tokens.toLocaleString("en")} · ≈$${day.cost.toFixed(4)} theo giá niêm yết`,
    state().paused ? "⏸️ Đang tạm dừng (/resume để chạy lại)" : "▶️ Đang chạy",
  ].join("\n");
}

// Báo cáo 1 ngày: gửi khi hết ngân sách token trong ngày, hoặc 7h sáng hôm sau (0h UTC) nếu hôm đó dừng sớm.
// Chỉ đánh dấu "đã báo cáo" khi gửi được — mất mạng thì lần sau gửi lại.
export async function dailyReport(tg, id, date, why = "") {
  const d = loadMemory().days[date];
  if (!d) return setState({ reported: date });
  let s = { score: "?", rank: null };
  try {
    s = await kibble.score(id.did);
  } catch {}
  const judged = Object.values(loadMemory().judged).filter((j) => j.at?.startsWith(date));
  const useful = judged.filter((j) => j.verdict === "useful").length;
  const ok = await send(
    tg,
    [
      `📊 Báo cáo ngày ${date}`,
      `📦 Nộp ${d.results || 0} bài · ✍️ chấm ${d.attests || 0} bài (${useful} useful / ${judged.length - useful} not)`,
      `🔋 ${(d.tokens || 0).toLocaleString("en")} token · ${d.sessions || 0} vòng · ≈$${(d.cost || 0).toFixed(4)} theo giá niêm yết`,
      `🏆 Điểm Kibble hiện tại: ${s.score}${s.rank ? ` · hạng ${s.rank}` : ""}`,
      why ? `😴 ${why} Mai chạy tiếp.` : "",
    ]
      .filter(Boolean)
      .join("\n"),
  );
  if (ok) setState({ reported: date });
}

// Người nhắn đầu tiên thành chủ bot. Trả về true nếu tin nhắn là của chủ.
export async function claimOwner(tg, msg) {
  if (!state().owner) {
    setState({ owner: msg.from.id, owner_name: msg.from.username || msg.from.first_name });
    console.log(`🔑 Chủ bot: ${msg.from.username || msg.from.first_name}`);
  }
  if (msg.from.id === state().owner) return true;
  await send(tg, "Đây là agent riêng. Tự tạo agent của bạn theo hướng dẫn trong repo nhé.", msg.chat.id);
  return false;
}

export const command = (msg) => (msg.text || "").trim().split(/\s+/)[0].split("@")[0];
