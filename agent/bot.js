// Agent Kibble + Telegram. Máy bật → agent tự tìm việc liên tục (làm việc + chấm bài),
// báo kết quả qua Telegram. Tắt máy = agent nghỉ.
//
// Lệnh Telegram: /status · /run · /pause · /resume · /help
import fs from "node:fs";
import path from "node:path";
import { loadEnv, loadConfig, AGENT_DIR } from "./src/env.js";
import { loadDid } from "./src/did.js";
import { runSession, loadMemory, dayOf, today } from "./src/agent.js";
import * as kibble from "./src/kibble.js";

loadEnv();
const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
if (!TOKEN) {
  console.log("❌ Chưa có TELEGRAM_BOT_TOKEN. Mở file agent/.env và dán token lấy từ @BotFather.");
  process.exit(1);
}
const API = `https://api.telegram.org/bot${TOKEN}`;
const STATE_FILE = path.join(AGENT_DIR, "data", "bot.json"); // chủ bot + trạng thái tạm dừng
const cfg = loadConfig();
const id = loadDid(process.env.DID_LABEL);
let running = false;
let wake = null; // đánh thức vòng chạy sớm (khi gõ /run, /resume)

function state() {
  try {
    return JSON.parse(fs.readFileSync(STATE_FILE, "utf8"));
  } catch {
    return {};
  }
}
function setState(patch) {
  fs.mkdirSync(path.dirname(STATE_FILE), { recursive: true });
  fs.writeFileSync(STATE_FILE, JSON.stringify({ ...state(), ...patch }));
}

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

const FOOTER = "\n\n⌨️ /status · /run · /pause · /resume · /help";

// Mọi tin nhắn đều kèm dòng gợi ý lệnh ở cuối, để người dùng luôn biết mình gõ được gì.
async function send(text, chatId = state().owner) {
  if (!chatId) return console.log(`(chưa có chủ bot, không gửi được) ${text}`);
  text += FOOTER;
  for (let i = 0; i < text.length; i += 4000)
    await tg("sendMessage", { chat_id: chatId, text: text.slice(i, i + 4000), disable_web_page_preview: true }).catch((e) =>
      console.log(`⚠️ ${e.message}`),
    );
}

const HELP = `👋 Mình là agent của bạn trên Kibble — bảng việc tập dượt của mạng FLOP.

Máy tính bật là mình tự tìm việc: nhận việc → làm thật → nộp bài, và chấm bài của agent khác (useful / not), ký bằng DID của bạn.
Mỗi ngày mình dừng khi dùng hết phần token miễn phí.

/status — điểm, hạng, hôm nay đã làm gì
/run — làm ngay 1 việc
/pause — tạm dừng
/resume — chạy lại
Gõ / để mở menu lệnh bất cứ lúc nào.`;

async function statusText() {
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

// Báo cáo 1 ngày: gửi khi hết ngân sách token trong ngày, hoặc sáng hôm sau nếu hôm đó tắt máy sớm.
async function dailyReport(date, why = "") {
  const d = loadMemory().days[date];
  setState({ reported: date });
  if (!d) return;
  let s = { score: "?", rank: null };
  try {
    s = await kibble.score(id.did);
  } catch {}
  const judged = Object.values(loadMemory().judged).filter((j) => j.at?.startsWith(date));
  const useful = judged.filter((j) => j.verdict === "useful").length;
  await send(
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
}

async function session(trigger) {
  if (running) {
    if (trigger !== "tự động") await send("⏳ Đang làm dở 1 việc, đợi xong nhé.");
    return null;
  }
  running = true;
  console.log(`→ việc mới (${trigger}) ${new Date().toLocaleTimeString()}`);
  try {
    // Sang ngày mới mà chưa báo cáo hôm qua → báo hôm qua trước.
    const last = state().last_day;
    if (last && last !== today() && state().reported !== last) await dailyReport(last);
    setState({ last_day: today() });

    const r = await runSession(cfg, id);
    if (r.skipped) {
      if (trigger !== "tự động") await send(`😴 ${r.reason}`);
      // Hết ngân sách token hôm nay → gửi báo cáo ngày (1 lần).
      if (state().reported !== today()) await dailyReport(today(), r.reason);
      return r;
    }
    // Chỉ nhắn khi người dùng tự gõ /run. Còn lại: mỗi ngày 1 báo cáo, để không spam.
    if (trigger !== "tự động" && trigger !== "khởi động") {
      const lines = r.done.map((d) => `• ${d}`).join("\n") || "• (chưa có việc nào đáng làm)";
      await send(`✅ Xong 1 việc\n\n${lines}\n\n📝 ${r.summary}\n\n${await statusText()}`);
    }
    return r;
  } catch (e) {
    // Hết tiền / sai key / Kibble sập → báo ngay, không im lặng.
    console.log(`  ✗ ${e.message}`);
    await send(`❌ Agent gặp lỗi: ${e.message}`);
    return { error: true };
  } finally {
    running = false;
  }
}

async function onMessage(msg) {
  const text = (msg.text || "").trim().split(/\s+/)[0].split("@")[0];
  if (!state().owner) {
    setState({ owner: msg.from.id, owner_name: msg.from.username || msg.from.first_name });
    console.log(`🔑 Chủ bot: ${msg.from.username || msg.from.first_name}`);
  }
  if (msg.from.id !== state().owner) return send("Đây là agent riêng. Tự tạo agent của bạn theo hướng dẫn trong repo nhé.", msg.chat.id);
  if (text === "/status") return send(await statusText());
  if (text === "/run") {
    if (running) return send("⏳ Đang làm dở 1 việc, đợi xong nhé.");
    await send("▶️ Bắt đầu 1 việc…");
    return wake?.();
  }
  if (text === "/pause") {
    setState({ paused: true });
    return send("⏸️ Đã tạm dừng. Gõ /resume để chạy lại.");
  }
  if (text === "/resume") {
    setState({ paused: false });
    await send("▶️ Chạy lại.");
    return wake?.();
  }
  return send(HELP);
}

async function main() {
  const me = await tg("getMe", {});
  // Menu lệnh hiện sẵn ở nút "/" cạnh ô chat Telegram.
  await tg("setMyCommands", {
    commands: [
      { command: "status", description: "Điểm, hạng, hôm nay đã làm gì" },
      { command: "run", description: "Làm ngay 1 việc" },
      { command: "pause", description: "Tạm dừng" },
      { command: "resume", description: "Chạy lại" },
      { command: "help", description: "Agent này làm gì" },
    ],
  }).catch((e) => console.log(`⚠️ ${e.message}`));
  console.log(`✅ Agent đang chạy: https://t.me/${me.username}`);
  console.log(`   DID: ${id.did}`);
  console.log("   Dừng chương trình này (tắt máy / đóng cửa sổ / dừng container) = agent nghỉ.\n");

  // Vòng chạy liên tục: mỗi vòng = 1 việc. Xong việc → nghỉ 30 giây rồi làm việc tiếp; hết việc → nghỉ 15 phút; hết token → nghỉ 30 phút.
  (async () => {
    const L = cfg.limits;
    for (;;) {
      let wait = L.pause_when_idle_min * 60; // giây
      if (!state().paused) {
        const r = await session(wake ? "tự động" : "khởi động");
        if (r && !r.skipped && !r.error && r.done.length) wait = L.pause_between_jobs_sec; // vừa xong 1 việc → làm việc tiếp
        if (r?.skipped) wait = 30 * 60;
      }
      await new Promise((res) => {
        const t = setTimeout(res, wait * 1000);
        wake = () => {
          clearTimeout(t);
          res();
        };
      });
    }
  })();

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
    for (const u of updates) {
      offset = u.update_id + 1;
      if (u.message?.text) onMessage(u.message).catch((e) => console.log(`  ✗ ${e.message}`));
    }
  }
}

main().catch((e) => {
  console.log(`❌ ${e.message}`);
  process.exit(1);
});
