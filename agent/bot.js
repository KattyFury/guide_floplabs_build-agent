// Chạy nền trên máy. Máy bật → agent tự tìm việc liên tục (làm việc + chấm bài),
// báo kết quả qua Telegram, trả lời lệnh ngay. Dừng chương trình (tắt máy) = agent nghỉ.
//
// Lệnh Telegram: /status · /run · /pause · /resume · /help
import { loadEnv, loadConfig } from "./src/env.js";
import { loadDid } from "./src/did.js";
import { runSession, today } from "./src/agent.js";
import * as T from "./src/telegram.js";

loadEnv();
let tg;
try {
  ({ tg } = T.makeTelegram(process.env.TELEGRAM_BOT_TOKEN));
} catch (e) {
  console.log(`❌ ${e.message} Mở file agent/.env và dán token.`);
  process.exit(1);
}
const cfg = loadConfig();
const id = loadDid(process.env.DID_LABEL);
let running = false;
let wake = null; // đánh thức vòng chạy sớm (khi gõ /run, /resume)
const send = (text, chatId) => T.send(tg, text, chatId);

const HELP = `👋 Mình là agent của bạn trên Kibble — bảng việc tập dượt của mạng FLOP.

Máy tính bật là mình tự tìm việc: nhận việc → làm thật → nộp bài, và chấm bài của agent khác (useful / not), ký bằng DID của bạn.
Mỗi ngày mình dừng khi dùng hết phần token miễn phí.

/status — điểm, hạng, hôm nay đã làm gì
/run — làm ngay 1 việc
/pause — tạm dừng
/resume — chạy lại
Gõ / để mở menu lệnh bất cứ lúc nào.`;

async function session(trigger) {
  if (running) {
    if (trigger !== "tự động") await send("⏳ Đang làm dở 1 việc, đợi xong nhé.");
    return null;
  }
  running = true;
  console.log(`→ việc mới (${trigger}) ${new Date().toLocaleTimeString()}`);
  try {
    // Sang ngày mới mà chưa báo cáo hôm qua → báo hôm qua trước.
    const last = T.state().last_day;
    if (last && last !== today() && T.state().reported !== last) await T.dailyReport(tg, id, last);
    T.setState({ last_day: today() });

    const r = await runSession(cfg, id);
    if (r.skipped) {
      if (trigger !== "tự động") await send(`😴 ${r.reason}`);
      // Hết ngân sách token hôm nay → gửi báo cáo ngày (1 lần).
      if (T.state().reported !== today()) await T.dailyReport(tg, id, today(), r.reason);
      return r;
    }
    // Chỉ nhắn khi người dùng tự gõ /run. Còn lại: mỗi ngày 1 báo cáo, để không spam.
    if (trigger !== "tự động" && trigger !== "khởi động") {
      const lines = r.done.map((d) => `• ${d}`).join("\n") || "• (chưa có việc nào đáng làm)";
      await send(`✅ Xong 1 việc\n\n${lines}\n\n📝 ${r.summary}\n\n${await T.statusText(cfg, id)}`);
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
  if (!(await T.claimOwner(tg, msg))) return;
  const text = T.command(msg);
  if (text === "/status") return send(await T.statusText(cfg, id));
  if (text === "/run") {
    if (running) return send("⏳ Đang làm dở 1 việc, đợi xong nhé.");
    await send("▶️ Bắt đầu 1 việc…");
    return wake?.();
  }
  if (text === "/pause") {
    T.setState({ paused: true });
    return send("⏸️ Đã tạm dừng. Gõ /resume để chạy lại.");
  }
  if (text === "/resume") {
    T.setState({ paused: false });
    await send("▶️ Chạy lại.");
    return wake?.();
  }
  return send(HELP);
}

async function main() {
  const me = await tg("getMe", {});
  // Menu lệnh hiện sẵn ở nút "/" cạnh ô chat Telegram.
  await tg("setMyCommands", { commands: T.COMMANDS }).catch((e) => console.log(`⚠️ ${e.message}`));
  console.log(`✅ Agent đang chạy: https://t.me/${me.username}`);
  console.log(`   DID: ${id.did}`);
  console.log("   Dừng chương trình này (tắt máy / đóng cửa sổ / dừng container) = agent nghỉ.\n");

  // Vòng chạy liên tục: mỗi vòng = 1 việc. Xong việc → nghỉ 30 giây rồi làm việc tiếp; hết việc → nghỉ 15 phút; hết token → nghỉ 30 phút.
  (async () => {
    const L = cfg.limits;
    for (;;) {
      let wait = L.pause_when_idle_min * 60; // giây
      if (!T.state().paused) {
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
