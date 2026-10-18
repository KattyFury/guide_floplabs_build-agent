// Luồng chính: link X → cổng lọc (rẻ) → nếu làm được: gom dữ liệu → trọng tài viết kết luận.
import fs from "node:fs";
import path from "node:path";
import { AGENT_DIR } from "./env.js";
import { gather, think, parseJson } from "./xai.js";
import { startRun, endRun } from "./cost.js";
import * as P from "./prompts.js";

const CACHE_FILE = path.join(AGENT_DIR, "data", "cache.json");

const NOT_OK = {
  b2b: "🏢 Dành cho doanh nghiệp/tổ chức — cá nhân không tham gia được.",
  ai_only: "🤖 Dự án AI thuần — không có ví, chain, token hay điểm để farm. Có token thì kiểm tra lại.",
  web2: "🌐 Dự án web2 — có quỹ crypto đầu tư không có nghĩa là có airdrop.",
  unclear: "❓ Chưa đủ thông tin để biết có làm được không. Thử lại sau vài ngày.",
};

// Nhận "https://x.com/abc", "x.com/abc/status/..", "@abc" hoặc "abc".
export function parseHandle(text) {
  const t = String(text).trim();
  const url = t.match(/(?:x|twitter)\.com\/(?:#!\/)?@?([A-Za-z0-9_]{1,15})/i);
  if (url && !["home", "i", "search", "intent", "share"].includes(url[1].toLowerCase())) return url[1];
  const at = t.match(/^@?([A-Za-z0-9_]{1,15})$/);
  return at ? at[1] : null;
}

function readCache() {
  try {
    return JSON.parse(fs.readFileSync(CACHE_FILE, "utf8"));
  } catch {
    return {};
  }
}

function writeCache(key, value) {
  const c = readCache();
  c[key] = { ...value, at: Date.now() };
  fs.mkdirSync(path.dirname(CACHE_FILE), { recursive: true });
  fs.writeFileSync(CACHE_FILE, JSON.stringify(c, null, 1));
}

function isoDaysAgo(n) {
  return new Date(Date.now() - n * 86400_000).toISOString().slice(0, 10);
}

// Dữ liệu onchain miễn phí (không cần key). Chỉ tra theo ĐÚNG contract + chain:
// tra theo ticker dễ dính token trùng tên trên chain khác (đã gặp: "MON" ra token Solana không liên quan).
async function dexscreener(chain, contract) {
  try {
    const r = await fetch(`https://api.dexscreener.com/tokens/v1/${encodeURIComponent(chain)}/${encodeURIComponent(contract)}`, {
      signal: AbortSignal.timeout(15_000),
    });
    const pairs = (await r.json()).sort?.((a, b) => (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0)) || [];
    const p = pairs[0];
    if (!p) return `DexScreener: no pair for ${contract} on ${chain}.`;
    return `DexScreener (official contract, top pair of ${pairs.length}): ${p.baseToken.symbol} on ${p.chainId}/${p.dexId}, price $${p.priceUsd}, FDV $${p.fdv}, mcap $${p.marketCap}, liquidity $${Math.round(p.liquidity?.usd || 0)}, 24h volume $${Math.round(p.volume?.h24 || 0)}.`;
  } catch (e) {
    return `DexScreener unavailable (${e.message}).`;
  }
}

// opts.fresh = true → bỏ qua kết quả cũ trong bộ nhớ.
export async function research(cfg, handle, opts = {}) {
  const key = handle.toLowerCase();
  const cached = readCache()[key];
  if (!opts.fresh && cached && Date.now() - cached.at < cfg.cache_days * 86400_000) {
    return { ...cached, fromCache: true };
  }

  startRun(handle);
  const today = new Date().toISOString().slice(0, 10);

  // 1) Cổng lọc — rẻ: chỉ đọc bài của chính dự án + website.
  const gateText = await gather(cfg, "gate", {
    model: cfg.brain.gate_model,
    instructions: P.GATE,
    input: `Today: ${today}. X handle: @${handle}`,
    // Chỉ tìm web: bài X tính tiền theo từng bài ($0.005/bài) nên để dành cho bước sau.
    tools: [{ type: "web_search" }],
    maxTurns: cfg.gate.max_turns,
    maxToolCalls: cfg.gate.max_tool_calls,
  });
  const gate = parseJson(gateText) || { verdict: "unclear", why: gateText.slice(0, 200) };

  if (gate.verdict !== "ok") {
    const report = `🔍 ${gate.name || "@" + handle} — KHÔNG LÀM ĐƯỢC\n\nLà gì: ${gate.what || "?"}\n\n${NOT_OK[gate.verdict] || NOT_OK.unclear}\nLý do: ${gate.why || "?"}`;
    const cost = endRun({ verdict: gate.verdict });
    const out = { handle, verdict: gate.verdict, report, details: gateText, cost };
    writeCache(key, out);
    return out;
  }

  // 2) Gom dữ liệu — tìm X (không chỉ của dự án) + web.
  const evidence = await gather(cfg, "gather", {
    instructions: P.GATHER,
    input: `Today: ${today}. X handle: @${handle}. Screening: ${gate.name} — ${gate.what}. Website: ${gate.website || "unknown"}.`,
    tools: [{ type: "x_search", from_date: isoDaysAgo(cfg.research.x_days) }, { type: "web_search" }],
    maxTurns: cfg.research.gather_turns,
    maxToolCalls: cfg.research.max_tool_calls,
  });
  let facts = `Project: ${gate.name} (@${handle})\n${evidence}`;
  const contractOk = /^0x[0-9a-fA-F]{40}$|^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(gate.contract || "");
  if (gate.has_token && gate.chain && contractOk) facts += `\n${await dexscreener(gate.chain.toLowerCase(), gate.contract)}`;

  // 3) Trọng tài viết kết luận ngắn, kiểu ELI12.
  const report = await think(cfg, "judge", { system: P.JUDGE, user: facts, effort: cfg.think.effort });

  const cost = endRun({ verdict: "ok" });
  const out = { handle, verdict: "ok", report, details: facts, cost };
  writeCache(key, out);
  return out;
}
