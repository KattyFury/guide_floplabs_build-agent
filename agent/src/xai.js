// Gọi não AI. Hai kiểu gọi:
// - gather(): Responses API của xAI, có tool tìm X + tìm web chạy sẵn bên xAI.
// - think():  chuẩn OpenAI chat completions — đổi sang nhà cung cấp khác (sau này: Flop)
//             chỉ bằng cách sửa base_url / model / api_key_env trong config.json.
import fs from "node:fs";
import path from "node:path";
import { recordCall } from "./cost.js";
import { AGENT_DIR } from "./env.js";

const TICKS_PER_USD = 1e10; // docs xAI: 100_000_000 ticks = 1 cent

export class BrainError extends Error {}

function explain(status, body) {
  const t = String(body).toLowerCase();
  if (status === 401 || status === 403 && t.includes("key"))
    return "Key Grok sai hoặc đã bị xoá. Tạo key mới tại grok.com/dashboard (loại Grok Inference) rồi dán vào agent/.env.";
  if (status === 402 || t.includes("credit") || t.includes("quota") || t.includes("spending limit") || t.includes("usage limit"))
    return "Hết lượt dùng của gói / hết credit Grok. Xem tại grok.com/dashboard/billing (chờ reset tuần hoặc nạp thêm).";
  if (status === 429) return "Gọi Grok quá nhanh (429). Đợi 1 phút rồi thử lại.";
  return `Grok báo lỗi ${status}: ${String(body).slice(0, 300)}`;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function post(url, key, body) {
  if (!key) throw new BrainError("Chưa có key Grok. Mở file agent/.env và điền XAI_API_KEY.");
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
      throw new BrainError(`Không kết nối được tới Grok (${e.message}). Kiểm tra mạng.`);
    }
    const text = await res.text();
    // Lỗi máy chủ tạm thời (5xx) → thử lại 1 lần. KHÔNG thử lại lỗi key/hết tiền: báo ngay.
    if (res.status >= 500 && attempt === 1) {
      await sleep(5000);
      continue;
    }
    if (!res.ok) {
      // Luôn ghi nguyên văn lỗi vào logs/errors.log để biết chính xác vì sao (VD 402: hết lượt tuần hay giới hạn ngắn hạn)
      fs.mkdirSync(path.join(AGENT_DIR, "logs"), { recursive: true });
      fs.appendFileSync(path.join(AGENT_DIR, "logs", "errors.log"), `${new Date().toISOString()} HTTP ${res.status} ${url}
${text.slice(0, 2000)}

`);
      if (process.env.AGENT_DEBUG) console.error(`[debug] HTTP ${res.status}: ${text.slice(0, 800)}`);
      throw new BrainError(`${explain(res.status, text)} (HTTP ${res.status})`);
    }
    return JSON.parse(text);
  }
}

function priceCost(usage, price) {
  // Dự phòng khi API không trả cost: tính theo bảng giá trong config.json
  const cached = usage.cached || 0;
  return ((usage.input - cached) * price.input + cached * price.cached + usage.output * price.output) / 1e6;
}

// Bước gom dữ liệu: dùng tool tìm X / web có sẵn của xAI.
export async function gather(cfg, stage, { instructions, input, tools, maxTurns, model, maxToolCalls }) {
  const b = cfg.brain;
  const data = await post(`${b.base_url}/responses`, process.env[b.api_key_env], {
    model: model || b.gate_model,
    instructions,
    input,
    tools,
    max_turns: maxTurns,
    // Chặn cứng số lần gọi tool (model hay gọi song song nhiều hơn lời dặn trong prompt)
    ...(maxToolCalls ? { max_tool_calls: maxToolCalls } : {}),
    prompt_cache_key: `agent-${stage}`,
    store: false,
  });
  const text = (data.output || [])
    .filter((o) => o.type === "message")
    .flatMap((o) => o.content || [])
    .filter((c) => c.type === "output_text")
    .map((c) => c.text)
    .join("\n")
    .trim();
  const u = data.usage || {};
  const usage = {
    input: u.input_tokens || 0,
    cached: u.input_tokens_details?.cached_tokens || 0,
    output: u.output_tokens || 0,
    reasoning: u.output_tokens_details?.reasoning_tokens || 0,
  };
  const tool = u.server_side_tool_usage_details || {};
  const cost = u.cost_in_usd_ticks != null ? u.cost_in_usd_ticks / TICKS_PER_USD : priceCost(usage, b.price);
  recordCall(stage, data.model, usage, cost, {
    web: tool.web_search_calls || 0,
    x_calls: tool.x_search_calls || 0,
    x_posts: tool.x_posts_fetched || 0,
    x_users: tool.x_users_fetched || 0,
  });
  return text;
}

// Bước suy nghĩ: không dùng tool, chuẩn OpenAI — phần "ăn compute", sau này chuyển sang Flop.
export async function think(cfg, stage, { system, user, effort, model }) {
  const t = cfg.think;
  const body = {
    model: model || t.model,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
  };
  if (effort && t.supports_effort) body.reasoning_effort = effort;
  const data = await post(`${t.base_url}/chat/completions`, process.env[t.api_key_env], body);
  const u = data.usage || {};
  const usage = {
    input: u.prompt_tokens || 0,
    cached: u.prompt_tokens_details?.cached_tokens || 0,
    output: u.completion_tokens || 0,
    reasoning: u.completion_tokens_details?.reasoning_tokens || 0,
  };
  // completion_tokens của xAI chưa gồm reasoning → cộng vào để tính tiền
  const billedOut = { ...usage, output: usage.output + usage.reasoning };
  const cost = u.cost_in_usd_ticks != null ? u.cost_in_usd_ticks / TICKS_PER_USD : priceCost(billedOut, t.price);
  recordCall(stage, data.model, usage, cost, {});
  return (data.choices?.[0]?.message?.content || "").trim();
}

// Lấy khối JSON đầu tiên trong câu trả lời (model đôi khi bọc ```json).
export function parseJson(text) {
  const m = text.match(/\{[\s\S]*\}/);
  if (!m) return null;
  try {
    return JSON.parse(m[0]);
  } catch {
    return null;
  }
}
