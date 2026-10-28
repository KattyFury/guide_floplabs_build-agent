// Chạy nền trên máy. Máy bật → agent tự tìm việc liên tục (làm việc + chấm bài),
// báo kết quả qua Telegram, trả lời lệnh ngay. Dừng chương trình (tắt máy) = agent nghỉ.
//
// Lệnh Telegram: /status · /run · /pause · /resume · /help
// Nhắn tin thường (câu hỏi / ý tưởng) → soạn thành 1 việc, bấm ✅ Đăng thì mới đăng lên Kibble.
import crypto from "node:crypto";
import { loadEnv, loadConfig } from "./src/env.js";
import { loadDid } from "./src/did.js";
import { runSession, today } from "./src/agent.js";
import { onFallback } from "./src/llm.js";
import * as T from "./src/telegram.js";
import { draftJob, postJob, preview, newAnswers, markSeen, translateVi, judgeAnswer, watchRoom } from "./src/postjob.js";

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
onFallback((text) => send(text)); // OpenAI hỏng → chuyển Claude dự phòng: báo chủ bot để nạp tiền / sửa key

// Gửi báo cáo 1 ngày, không gửi trùng khi hẹn giờ và vòng việc cùng gọi.
let reporting = false;
async function report(date, why) {
  if (reporting || T.state().reported === date) return;
  reporting = true;
  try {
    await T.dailyReport(tg, id, date, why);
  } finally {
    reporting = false;
  }
}

// Sang ngày mới (0h UTC = 7h sáng giờ VN) → gửi ngay báo cáo hôm qua, không đợi vòng việc tiếp theo.
// Kiểm tra mỗi phút, gửi lỗi thì phút sau thử lại.
function reportYesterday() {
  const y = new Date(Date.now() - 864e5).toISOString().slice(0, 10);
  if ((T.state().reported || "") >= y) return;
  report(y).catch((e) => console.log(`  ✗ báo cáo ngày: ${e.message}`));
}

const HELP = `👋 Mình là agent của bạn trên Kibble — bảng việc tập dượt của mạng FLOP.

Máy tính bật là mình tự tìm việc: nhận việc → làm thật → nộp bài, và chấm bài của agent khác (useful / not), ký bằng DID của bạn.
Mỗi ngày mình dừng khi dùng hết phần token miễn phí.

/status — điểm, hạng, hôm nay đã làm gì
/run — làm ngay 1 việc
/pause — tạm dừng
/resume — chạy lại
Gõ / để mở menu lệnh bất cứ lúc nào.

📮 Muốn nhờ cả mạng làm giúp? Nhắn thẳng câu hỏi (tiếng Việt cũng được). Mình soạn lại thành 1 việc chuẩn tiếng Anh, bạn bấm ✅ Đăng thì mới đăng lên Kibble bằng DID của bạn (+2 điểm/việc). Có agent nộp bài là mình báo ngay kèm bản dịch, bạn bấm 👍 Đạt (ACCEPT, +1) hoặc 👎 Không đạt. Đăng ít mà chất — đăng hàng loạt việc na ná nhau bị coi là cày điểm.`;

// Nháp việc chờ chủ bấm nút (mất khi bot khởi động lại).
const drafts = new Map();

async function onIdea(msg) {
  await send("✍️ Đang soạn thành 1 việc…");
  let job;
  try {
    job = await draftJob(cfg, msg.text);
  } catch (e) {
    return send(`❌ Không soạn được: ${e.message}`);
  }
  if (!job.ok) return send(`🤔 Chưa đăng được: ${job.reason_vi}`);
  const key = crypto.randomBytes(4).toString("hex");
  drafts.set(key, job);
  await tg("sendMessage", {
    chat_id: T.state().owner,
    text: `${preview(job)}\n\nChưa ổn thì bấm Huỷ rồi nhắn lại rõ hơn.`,
    disable_web_page_preview: true,
    reply_markup: { inline_keyboard: [[{ text: "✅ Đăng", callback_data: `post:${key}` }, { text: "❌ Huỷ", callback_data: `drop:${key}` }]] },
  });
}

// Cứ 2 phút xem việc mình đăng có bài nộp mới chưa → báo Telegram (kèm bản dịch) + nút chấm.
let checking = false;
async function checkAnswers() {
  if (checking) return;
  checking = true;
  try {
    for (const a of await newAnswers()) {
      let vi = "";
      try {
        vi = await translateVi(cfg, a.result);
      } catch (e) {
        vi = `(không dịch được: ${e.message})`;
      }
      const ok = await tg("sendMessage", {
        chat_id: T.state().owner,
        text: [`📬 Việc bạn đăng đã có bài nộp`, a.title, "", `🇻🇳 ${vi}`, "", `📄 Bản gốc (${a.worker.slice(0, 24)}):`, a.result, "", `Mã việc: ${a.job_id}`]
          .join("\n")
          .slice(0, 4000),
        disable_web_page_preview: true,
        reply_markup: { inline_keyboard: [[{ text: "👍 Đạt (ACCEPT)", callback_data: `acc:${a.job_id}` }, { text: "👎 Không đạt", callback_data: `rej:${a.job_id}` }]] },
      }).then(() => true, (e) => (console.log(`⚠️ ${e.message}`), false));
      if (ok) markSeen(a.job_id, a.result_hash);
      console.log(`  📬 bài nộp cho việc ${a.job_id} → ${ok ? "đã báo" : "báo lỗi, 2 phút sau thử lại"}`);
    }
  } catch (e) {
    console.log(`  ✗ xem bài nộp: ${e.message}`);
  } finally {
    checking = false;
  }
}

async function onButton(q) {
  await tg("answerCallbackQuery", { callback_query_id: q.id }).catch(() => {});
  if (q.from.id !== T.state().owner) return;
  const [act, key] = String(q.data).split(":");
  // Bỏ nút để không bấm 2 lần.
  await tg("editMessageReplyMarkup", { chat_id: q.message.chat.id, message_id: q.message.message_id, reply_markup: { inline_keyboard: [] } }).catch(() => {});
  if (act === "acc" || act === "rej") {
    const r = await judgeAnswer(id, key, act === "acc");
    console.log(`  🧾 chấm bài nộp việc ${key} → ${act} ${r.ok ? "ok" : r.error || r.http}`);
    if (!r.ok) return send(`❌ Chưa chấm được: ${r.error || `HTTP ${r.http}`}`);
    return send(act === "acc" ? `👍 Đã ACCEPT bài nộp việc ${key} (+1 điểm cho bạn).` : `👎 Đã chấm không đạt bài nộp việc ${key}.`);
  }
  const job = drafts.get(key);
  drafts.delete(key);
  if (!job) return send("⌛ Nháp này không còn (đã xử lý hoặc bot vừa khởi động lại). Nhắn lại câu hỏi nhé.");
  if (act !== "post") return send("🗑️ Đã huỷ, không đăng.");
  const r = await postJob(id, job);
  console.log(`  📮 đăng việc ${r.job_id} → ${r.ok ? "ok" : r.error || r.http}`);
  if (!r.ok) return send(`❌ Kibble không nhận: ${r.error || `HTTP ${r.http}`}`);
  await send(`📮 Đã đăng việc ${r.job_id}\n${job.title}\n\nAgent của bạn sẽ không tự nhận hay tự chấm việc này (luật Kibble). Xem trên https://kibble.world`);
}

async function session(trigger) {
  if (running) {
    if (trigger !== "tự động") await send("⏳ Đang làm dở 1 việc, đợi xong nhé.");
    return null;
  }
  running = true;
  try {
    // Sang ngày mới mà chưa báo cáo hôm qua → báo hôm qua trước.
    const last = T.state().last_day;
    if (last && last !== today()) await report(last);
    T.setState({ last_day: today() });

    const r = await runSession(cfg, id);
    if (r.idle) {
      // Bảng chưa có gì mới → không hỏi não, chỉ báo khi người dùng tự gõ /run.
      if (trigger !== "tự động" && trigger !== "khởi động") await send(`😴 ${r.reason}`);
      return r;
    }
    console.log(`→ việc mới (${trigger}) ${new Date().toLocaleTimeString()}`);
    if (r.skipped) {
      if (trigger !== "tự động") await send(`😴 ${r.reason}`);
      // Hết ngân sách token hôm nay → gửi báo cáo ngày (1 lần).
      await report(today(), r.reason);
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
  if (text.startsWith("/") || !msg.text.trim()) return send(HELP);
  return onIdea(msg);
}

async function main() {
  const me = await tg("getMe", {});
  // Menu lệnh hiện sẵn ở nút "/" cạnh ô chat Telegram.
  await tg("setMyCommands", { commands: T.COMMANDS }).catch((e) => console.log(`⚠️ ${e.message}`));
  console.log(`✅ Agent đang chạy: https://t.me/${me.username}`);
  console.log(`   DID: ${id.did}`);
  console.log("   Dừng chương trình này (tắt máy / đóng cửa sổ / dừng container) = agent nghỉ.\n");

  setInterval(reportYesterday, 60_000);
  setInterval(checkAnswers, 2 * 60_000);
  watchRoom(); // đọc room kibble liên tục để bắt bài nộp cho việc mình đăng

  // Vòng chạy liên tục: mỗi vòng = 1 việc. Xong việc → nghỉ 30 giây rồi làm việc tiếp; bảng chưa có gì mới → xem lại sau 2 phút
  // (code tự xem, 0 token); não xem rồi mà không có việc đáng làm → nghỉ 15 phút; hết token → nghỉ 30 phút.
  (async () => {
    const L = cfg.limits;
    for (;;) {
      let wait = L.pause_when_idle_min * 60; // giây
      if (!T.state().paused) {
        const r = await session(wake ? "tự động" : "khởi động");
        if (r && !r.skipped && !r.error && r.done.length) wait = L.pause_between_jobs_sec; // vừa xong 1 việc → làm việc tiếp
        if (r?.idle) wait = L.check_board_sec;
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
      updates = await tg("getUpdates", { offset, timeout: 50, allowed_updates: ["message", "callback_query"] });
    } catch (e) {
      console.log(`⚠️ Mất kết nối Telegram (${e.message}), thử lại sau 10 giây…`);
      await new Promise((r) => setTimeout(r, 10_000));
      continue;
    }
    for (const u of updates) {
      offset = u.update_id + 1;
      if (u.message?.text) onMessage(u.message).catch((e) => console.log(`  ✗ ${e.message}`));
      if (u.callback_query) onButton(u.callback_query).catch((e) => console.log(`  ✗ ${e.message}`));
    }
  }
}

main().catch((e) => {
  console.log(`❌ ${e.message}`);
  process.exit(1);
});
