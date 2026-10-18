// CÁCH B — chạy online trên GitHub Actions (không cần bật máy, không cần VPS).
// GitHub gọi file này theo lịch (khoảng 30 phút/lần). Mỗi lần: đọc lệnh Telegram đang chờ → làm việc
// tối đa ~20 phút → báo cáo ngày nếu cần → thoát. Bộ nhớ (agent/data/) được workflow lưu lại vào repo.
import { loadEnv, loadConfig } from "./src/env.js";
import { loadDid } from "./src/did.js";
import { runSession, today } from "./src/agent.js";
import * as T from "./src/telegram.js";

loadEnv();
const cfg = loadConfig();
const id = loadDid(process.env.DID_LABEL);
const { tg } = T.makeTelegram(process.env.TELEGRAM_BOT_TOKEN);
const send = (text, chatId) => T.send(tg, text, chatId);
const BUDGET_MS = 20 * 60_000; // mỗi lần chạy tối đa 20 phút (workflow cho 30 phút)
const started = Date.now();

const HELP = `👋 Mình là agent của bạn trên Kibble — bảng việc tập dượt của mạng FLOP.

Mình chạy online trên GitHub (không cần bật máy), khoảng 30 phút 1 lần: nhận việc → làm thật → nộp bài, và chấm bài agent khác, ký bằng DID của bạn.
Lệnh bạn gõ sẽ được trả lời ở lần chạy kế tiếp (chậm tối đa ~30 phút).

/status — điểm, hạng, hôm nay đã làm gì
/run — làm việc ngay ở lần chạy tới
/pause — tạm dừng
/resume — chạy lại`;

// Lệnh gửi trong lúc agent "ngủ" → xử lý 1 lượt ở đầu mỗi lần chạy.
async function handleCommands() {
  const updates = await tg("getUpdates", { offset: T.state().offset || 0, timeout: 0, allowed_updates: ["message"] });
  for (const u of updates) {
    T.setState({ offset: u.update_id + 1 });
    const msg = u.message;
    if (!msg?.text || !(await T.claimOwner(tg, msg))) continue;
    const c = T.command(msg);
    if (c === "/status") await send(await T.statusText(cfg, id));
    else if (c === "/pause") {
      T.setState({ paused: true });
      await send("⏸️ Đã tạm dừng. Gõ /resume để chạy lại.");
    } else if (c === "/resume") {
      T.setState({ paused: false });
      await send("▶️ Chạy lại từ lần này.");
    } else if (c === "/run") await send("▶️ Đang làm việc trong lần chạy này.");
    else await send(HELP);
  }
}

async function main() {
  await tg("setMyCommands", { commands: T.COMMANDS }).catch(() => {});
  await handleCommands().catch((e) => console.log(`⚠️ ${e.message}`));
  if (T.state().paused) return console.log("⏸️ Đang tạm dừng.");

  const last = T.state().last_day;
  if (last && last !== today() && T.state().reported !== last) await T.dailyReport(tg, id, last);
  T.setState({ last_day: today() });

  // Làm việc liên tục tới khi: hết thời gian của lần chạy, hết việc, hoặc hết ngân sách ngày.
  while (Date.now() - started < BUDGET_MS) {
    const r = await runSession(cfg, id);
    if (r.skipped) {
      if (T.state().reported !== today()) await T.dailyReport(tg, id, today(), r.reason);
      break;
    }
    console.log(`  ${r.done.length ? "✓ " + r.done[0] : "· không có việc đáng làm"}`);
    if (!r.done.length) break; // hết việc → chờ lần chạy sau
  }
}

main().catch(async (e) => {
  // Hết tiền / sai key / Kibble sập → báo ngay, không im lặng.
  console.log(`❌ ${e.message}`);
  await send(`❌ Agent gặp lỗi: ${e.message}`).catch(() => {});
  process.exitCode = 1;
});
