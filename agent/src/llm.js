// Não của agent: API chuẩn OpenAI (chat completions + function calling).
// Mặc định dùng OpenAI. Đổi sang nhà cung cấp khác (sau này: compute Flop) chỉ bằng
// cách sửa brain.base_url / brain.model / brain.api_key_env trong config.json.
//
// Não dự phòng (tuỳ chọn): Claude qua SDK chính thức @anthropic-ai/sdk (config brain_fallback).
// Chỉ bật khi agent/.env có ANTHROPIC_API_KEY. OpenAI hỏng vì lý do không phải lỗi của request
// (key sai, hết tiền, quá nhanh, máy chủ lỗi, mất mạng) → hỏi Claude cùng hội thoại đó.
// Hội thoại vẫn lưu theo định dạng OpenAI; chỉ lúc gửi sang Claude mới đổi định dạng.
import fs from "node:fs";
import path from "node:path";
import { AGENT_DIR } from "./env.js";
import { recordCall } from "./cost.js";

export class BrainError extends Error {
  constructor(message, { status = 0, fallback = false } = {}) {
    super(message);
    this.status = status;
    this.fallback = fallback; // true = lỗi phía nhà cung cấp, đáng thử não dự phòng
  }
}

function explain(status, body) {
  const t = String(body).toLowerCase();
  if (status === 401) return "Key API sai hoặc đã bị xoá. Tạo key mới tại platform.openai.com/api-keys rồi dán vào agent/.env.";
  if (t.includes("insufficient_quota") || t.includes("billing") || t.includes("credit") || status === 402)
    return "Tài khoản OpenAI hết tiền / chưa nạp. Nạp tại platform.openai.com/settings/organization/billing.";
  if (t.includes("model_not_found") || t.includes("does not exist")) return "Tài khoản chưa dùng được model này (xem brain.model trong config.json).";
  if (status === 429) return "Gọi API quá nhanh (429). Agent sẽ thử lại ở phiên sau.";
  return `API báo lỗi ${status}: ${String(body).slice(0, 300)}`;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const worthFallback = (status) => status === 401 || status === 402 || status === 403 || status === 429 || status >= 500;

function logError(line, text) {
  fs.mkdirSync(path.join(AGENT_DIR, "logs"), { recursive: true });
  fs.appendFileSync(path.join(AGENT_DIR, "logs", "errors.log"), `${new Date().toISOString()} ${line}\n${String(text).slice(0, 2000)}\n\n`);
}

async function post(url, key, body) {
  if (!key) throw new BrainError("Chưa có key API. Mở file agent/.env và điền OPENAI_API_KEY.", { fallback: true });
  for (let attempt = 1; ; attempt++) {
    let res;
    try {
      res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(300_000),
      });
    } catch (e) {
      throw new BrainError(`Không kết nối được tới API (${e.message}). Kiểm tra mạng.`, { fallback: true });
    }
    const text = await res.text();
    // Lỗi máy chủ tạm thời (5xx) → thử lại 1 lần. KHÔNG thử lại lỗi key/hết tiền: báo ngay.
    if (res.status >= 500 && attempt === 1) {
      await sleep(5000);
      continue;
    }
    if (!res.ok) {
      // Ghi nguyên văn lỗi để biết chính xác vì sao
      logError(`HTTP ${res.status} ${url}`, text);
      throw new BrainError(`${explain(res.status, text)} (HTTP ${res.status})`, { status: res.status, fallback: worthFallback(res.status) });
    }
    return JSON.parse(text);
  }
}

// ---- Não dự phòng: Claude ----

// Sau lỗi key / hết tiền ở OpenAI thì bỏ qua OpenAI chừng này, để mỗi bước không phải trả 1 lần gọi hỏng trước.
const PRIMARY_PAUSE_MS = 5 * 60_000;
let primaryPausedUntil = 0;
let claude = null;
let notify = null;

// bot.js đăng ký hàm báo Telegram: OpenAI hỏng mà chuyển sang Claude thì chủ bot vẫn biết để nạp tiền / sửa key.
export function onFallback(fn) {
  notify = fn;
}

function fallbackReady(cfg) {
  const fb = cfg.brain_fallback;
  return Boolean(fb && process.env[fb.api_key_env]);
}

async function claudeClient(fb) {
  if (!claude) {
    let Anthropic;
    try {
      ({ default: Anthropic } = await import("@anthropic-ai/sdk"));
    } catch {
      throw new BrainError("Chưa cài thư viện Claude. Mở terminal trong thư mục agent, chạy: npm install");
    }
    claude = new Anthropic({ apiKey: process.env[fb.api_key_env], maxRetries: 1, timeout: 300_000 });
  }
  return claude;
}

const parseArgs = (s) => {
  try {
    return JSON.parse(s || "{}");
  } catch {
    return {};
  }
};

// Hội thoại định dạng OpenAI → định dạng Claude (system tách riêng, tool → tool_result, tin cùng vai gộp lại).
function toClaude(messages) {
  const system = [];
  const out = [];
  const push = (role, blocks) => {
    if (!blocks.length) return;
    const last = out.at(-1);
    if (last && last.role === role) last.content.push(...blocks);
    else out.push({ role, content: blocks });
  };
  const text = (s) => (s ? [{ type: "text", text: String(s) }] : []);
  for (const m of messages) {
    if (m.role === "system") {
      if (!out.length) system.push(String(m.content ?? ""));
      else push("user", text(`[Instruction] ${m.content ?? ""}`));
    } else if (m.role === "tool") {
      push("user", [{ type: "tool_result", tool_use_id: m.tool_call_id, content: String(m.content ?? "") || "(empty)" }]);
    } else if (m.role === "assistant") {
      const calls = (m.tool_calls || []).map((c) => ({ type: "tool_use", id: c.id, name: c.function.name, input: parseArgs(c.function.arguments) }));
      push("assistant", [...text(m.content), ...calls]);
    } else {
      push("user", text(m.content));
    }
  }
  return { system: system.join("\n\n"), messages: out };
}

function claudeTools(tools) {
  return (tools || []).map((t) => ({ name: t.function.name, description: t.function.description || "", input_schema: t.function.parameters || { type: "object", properties: {} } }));
}

function claudeMeter(fb, u) {
  const read = u.cache_read_input_tokens || 0;
  const write = u.cache_creation_input_tokens || 0;
  const usage = { input: (u.input_tokens || 0) + read + write, cached: read, output: u.output_tokens || 0, reasoning: 0 };
  const p = fb.price; // đọc cache = 0.1× giá input, ghi cache = 1.25×
  const cost = ((u.input_tokens || 0) * p.input + read * p.input * 0.1 + write * p.input * 1.25 + usage.output * p.output) / 1e6;
  return { usage, cost };
}

async function askClaude(cfg, { messages, tools, toolChoice, json }) {
  const fb = cfg.brain_fallback;
  const client = await claudeClient(fb);
  const conv = toClaude(messages);
  const params = {
    model: fb.model,
    max_tokens: 16000,
    system: json ? `${conv.system}\n\nRespond with only one JSON object, no other text.` : conv.system,
    messages: conv.messages,
    thinking: { type: "disabled" }, // như reasoning_effort "none" bên OpenAI; hội thoại không mang khối suy nghĩ nào
    cache_control: { type: "ephemeral" },
  };
  if (tools?.length) {
    params.tools = claudeTools(tools);
    params.tool_choice = { type: toolChoice === "required" ? "any" : toolChoice === "none" ? "none" : "auto", disable_parallel_tool_use: true };
  }
  let msg;
  try {
    msg = await client.messages.create(params);
  } catch (e) {
    logError(`Claude ${e.status || ""}`, e.message);
    const t = String(e.message).toLowerCase();
    if (e.status === 401) throw new BrainError("Key Claude (ANTHROPIC_API_KEY) sai hoặc đã bị xoá.", { status: 401 });
    if (e.status === 402 || t.includes("credit balance")) throw new BrainError("Tài khoản Claude hết tiền. Nạp tại console.anthropic.com → Settings → Billing.", { status: e.status });
    if (e.status === 429) throw new BrainError("Claude báo gọi quá nhanh (429). Agent sẽ thử lại ở phiên sau.", { status: 429 });
    throw new BrainError(`Claude báo lỗi ${e.status || ""}: ${String(e.message).slice(0, 300)}`, { status: e.status || 0 });
  }
  if (msg.stop_reason === "refusal") throw new BrainError("Claude từ chối trả lời yêu cầu này.");
  const content = msg.content.filter((b) => b.type === "text").map((b) => b.text).join("");
  const calls = msg.content.filter((b) => b.type === "tool_use").map((b) => ({ id: b.id, type: "function", function: { name: b.name, arguments: JSON.stringify(b.input) } }));
  const message = { role: "assistant", content: content || null, ...(calls.length ? { tool_calls: calls } : {}) };
  return { message, model: msg.model, ...claudeMeter(fb, msg.usage) };
}

// Gọi OpenAI; hỏng vì lý do phía nhà cung cấp mà có Claude dự phòng thì gọi Claude.
async function withFallback(cfg, primary, fallback) {
  if (fallbackReady(cfg) && Date.now() < primaryPausedUntil) return fallback();
  try {
    return await primary();
  } catch (e) {
    if (!(e instanceof BrainError) || !e.fallback || !fallbackReady(cfg)) throw e;
    const firstTime = Date.now() >= primaryPausedUntil;
    if (e.status === 401 || e.status === 402 || e.status === 403 || /hết tiền/.test(e.message)) primaryPausedUntil = Date.now() + PRIMARY_PAUSE_MS;
    console.log(`  ↪ OpenAI hỏng (${e.message}) → dùng Claude dự phòng`);
    if (notify && firstTime) Promise.resolve(notify(`⚠️ OpenAI hỏng: ${e.message}\n↪ Đang dùng Claude (${cfg.brain_fallback.model}) dự phòng.`)).catch(() => {});
    try {
      return await fallback();
    } catch (e2) {
      throw new BrainError(`OpenAI: ${e.message} · Claude dự phòng: ${e2.message}`, { status: e2.status });
    }
  }
}

// ---- Gọi não ----

// Một bước của agent: gửi hội thoại + danh sách tool → não trả lời hoặc gọi tool.
// convId (prompt_cache_key) giúp các bước cùng phiên dùng chung cache → phần đầu hội thoại rẻ hơn 10 lần.
export async function step(cfg, stage, { messages, tools, convId }) {
  const b = cfg.brain;
  return withFallback(
    cfg,
    async () => {
      const body = { model: b.model, messages, tools, tool_choice: "auto", parallel_tool_calls: false };
      if (b.reasoning_effort) body.reasoning_effort = b.reasoning_effort;
      if (convId) body.prompt_cache_key = convId;
      const data = await post(`${b.base_url}/chat/completions`, process.env[b.api_key_env], body);
      const { usage, cost } = meter(b, data);
      recordCall(stage, data.model, usage, cost, {});
      return { message: data.choices?.[0]?.message || { role: "assistant", content: "" }, cost, tokens: usage.input + usage.output };
    },
    async () => {
      const r = await askClaude(cfg, { messages, tools, toolChoice: "auto" });
      recordCall(stage, r.model, r.usage, r.cost, {});
      return { message: r.message, cost: r.cost, tokens: r.usage.input + r.usage.output };
    },
  );
}

// Hỏi não 1 lần, không tool (ví dụ: soạn việc để đăng). Người gọi tự ghi log token.
export async function ask(cfg, { system, user, json = false }) {
  const b = cfg.brain;
  const messages = [{ role: "system", content: system }, { role: "user", content: user }];
  return withFallback(
    cfg,
    async () => {
      const body = { model: b.model, messages };
      if (b.reasoning_effort) body.reasoning_effort = b.reasoning_effort;
      if (json) body.response_format = { type: "json_object" };
      const data = await post(`${b.base_url}/chat/completions`, process.env[b.api_key_env], body);
      return { text: data.choices?.[0]?.message?.content || "", model: data.model, ...meter(b, data) };
    },
    async () => {
      const r = await askClaude(cfg, { messages, json });
      // Claude đôi khi bọc JSON trong ```json ... ``` → bỏ để JSON.parse ở nơi gọi không vỡ.
      const text = json ? (r.message.content || "").replace(/^\s*```(?:json)?\s*|\s*```\s*$/g, "") : r.message.content || "";
      return { text, model: r.model, usage: r.usage, cost: r.cost };
    },
  );
}

function meter(b, data) {
  const u = data.usage || {};
  const usage = {
    input: u.prompt_tokens || 0,
    cached: u.prompt_tokens_details?.cached_tokens || 0,
    output: u.completion_tokens || 0, // OpenAI: đã gồm token suy nghĩ ẩn
    reasoning: u.completion_tokens_details?.reasoning_tokens || 0,
  };
  // Giá niêm yết (khi vượt phần token miễn phí mỗi ngày mới bị tính tiền thật).
  const p = b.price;
  const cost = ((usage.input - usage.cached) * p.input + usage.cached * p.cached + usage.output * p.output) / 1e6;
  return { usage, cost };
}
