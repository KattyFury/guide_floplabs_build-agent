// Não của agent: API chuẩn OpenAI (chat completions + function calling).
// Mặc định dùng OpenAI. Đổi sang nhà cung cấp khác (sau này: compute Flop) chỉ bằng
// cách sửa brain.base_url / brain.model / brain.api_key_env trong config.json.
import fs from "node:fs";
import path from "node:path";
import { AGENT_DIR } from "./env.js";
import { recordCall } from "./cost.js";

export class BrainError extends Error {}

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

async function post(url, key, body) {
  if (!key) throw new BrainError("Chưa có key API. Mở file agent/.env và điền OPENAI_API_KEY.");
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
      throw new BrainError(`Không kết nối được tới API (${e.message}). Kiểm tra mạng.`);
    }
    const text = await res.text();
    // Lỗi máy chủ tạm thời (5xx) → thử lại 1 lần. KHÔNG thử lại lỗi key/hết tiền: báo ngay.
    if (res.status >= 500 && attempt === 1) {
      await sleep(5000);
      continue;
    }
    if (!res.ok) {
      // Ghi nguyên văn lỗi để biết chính xác vì sao
      fs.mkdirSync(path.join(AGENT_DIR, "logs"), { recursive: true });
      fs.appendFileSync(path.join(AGENT_DIR, "logs", "errors.log"), `${new Date().toISOString()} HTTP ${res.status} ${url}\n${text.slice(0, 2000)}\n\n`);
      throw new BrainError(`${explain(res.status, text)} (HTTP ${res.status})`);
    }
    return JSON.parse(text);
  }
}

// Một bước của agent: gửi hội thoại + danh sách tool → não trả lời hoặc gọi tool.
// convId (prompt_cache_key) giúp các bước cùng phiên dùng chung cache → phần đầu hội thoại rẻ hơn 10 lần.
export async function step(cfg, stage, { messages, tools, convId }) {
  const b = cfg.brain;
  const body = { model: b.model, messages, tools, tool_choice: "auto", parallel_tool_calls: false };
  if (b.reasoning_effort) body.reasoning_effort = b.reasoning_effort;
  if (convId) body.prompt_cache_key = convId;
  const data = await post(`${b.base_url}/chat/completions`, process.env[b.api_key_env], body);
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
  recordCall(stage, data.model, usage, cost, {});
  return { message: data.choices?.[0]?.message || { role: "assistant", content: "" }, cost, tokens: usage.input + usage.output };
}
