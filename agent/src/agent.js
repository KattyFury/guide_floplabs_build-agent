// Luồng chính: link X → cổng lọc (rẻ) → nếu làm được: tự đọc web miễn phí → trọng tài viết kết luận.
// Tìm X (trả phí theo bài) chỉ chạy khi người dùng bật: opts.withX.
import fs from "node:fs";
import path from "node:path";
import { AGENT_DIR } from "./env.js";
import { gather, think, parseJson } from "./xai.js";
import { startRun, endRun } from "./cost.js";
import * as P from "./prompts.js";
import * as web from "./web.js";

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

// Đọc nhiều trang song song, bỏ trang trống (thường là trang viết toàn bằng JavaScript).
async function readPages(urls, chars) {
  const texts = await Promise.all(urls.map((u) => web.readPage(u, chars)));
  return urls.map((u, i) => (texts[i].length > 200 ? `### ${u}\n${texts[i]}` : "")).filter(Boolean);
}

// opts.fresh = true → bỏ qua kết quả cũ. opts.withX = true → thêm tìm trên X (tốn hơn).
export async function research(cfg, handle, opts = {}) {
  const key = handle.toLowerCase() + (opts.withX ? ":x" : "");
  const cached = readCache()[key];
  if (!opts.fresh && cached && Date.now() - cached.at < cfg.cache_days * 86400_000) {
    return { ...cached, fromCache: true };
  }

  startRun(handle + (opts.withX ? " +X" : ""));
  const today = new Date().toISOString().slice(0, 10);
  const W = cfg.web;

  // 1) Cổng lọc — chỉ đọc kết quả tìm miễn phí; Grok bản không suy nghĩ phân loại + chỉ ra website chính thức.
  const found = await web.search(`${handle} crypto`, W.results_per_query + 3);
  if (!found.length) throw new Error("Không tìm được web lúc này (máy tìm kiếm đang chặn). Đợi vài phút rồi thử lại.");
  const gateText = await think(cfg, "gate", {
    model: cfg.brain.gate_model,
    system: P.GATE,
    user: `Today: ${today}. X handle: @${handle}\n\nWeb search results:\n${web.formatResults(found)}`,
  });
  const gate = parseJson(gateText) || { verdict: "unclear", why: gateText.slice(0, 200) };

  if (gate.verdict !== "ok") {
    const report = `🔍 ${gate.name || "@" + handle} — KHÔNG LÀM ĐƯỢC\n\nLà gì: ${gate.what || "?"}\n\n${NOT_OK[gate.verdict] || NOT_OK.unclear}\nLý do: ${gate.why || "?"}`;
    const cost = endRun({ verdict: gate.verdict });
    const out = { handle, verdict: gate.verdict, report, details: gateText, cost };
    writeCache(key, out);
    return out;
  }

  // 2) Gom dữ liệu MIỄN PHÍ: vài lượt tìm DuckDuckGo + đọc các trang chính thức.
  const name = gate.name || handle;
  const queries = [
    `${name} how to participate testnet airdrop points`,
    `${name} raised funding investors`,
    `${name} tokenomics token`,
    `${name} scam OR hack OR fake`,
  ];
  const results = [];
  for (const q of queries) results.push({ q, r: await web.search(q, W.results_per_query) });

  // Trang để đọc: website + các trang cùng domain (docs, blog…) tìm được.
  const website = /^https?:\/\//.test(gate.website || "") ? gate.website : "";
  const root = web.host(website).split(".").slice(-2).join(".");
  const sameSite = results.flatMap((x) => x.r.map((r) => r.url)).filter((u) => root && web.host(u).endsWith(root));
  const urls = [...new Set([website, ...sameSite])].filter(Boolean).slice(0, W.max_pages);
  const pages = await readPages(urls, W.page_chars);

  let facts =
    `Project: ${name} (@${handle}). Today: ${today}.\n\n` +
    results.map((x) => `## Search: ${x.q}\n${web.formatResults(x.r) || "none"}`).join("\n\n") +
    `\n\n## Official pages\n${pages.join("\n\n") || "none readable"}`;

  const contractOk = /^0x[0-9a-fA-F]{40}$|^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(gate.contract || "");
  if (gate.has_token && gate.chain && contractOk) facts += `\n\n${await dexscreener(gate.chain.toLowerCase(), gate.contract)}`;

  // 2b) Tuỳ chọn: tìm trên X qua Grok (trả theo bài ~$0.005/bài).
  if (opts.withX) {
    const xNotes = await gather(cfg, "x_search", {
      instructions: P.GATHER_X,
      input: `Today: ${today}. Project: ${name}, X handle: @${handle}.`,
      tools: [{ type: "x_search", from_date: isoDaysAgo(cfg.x.days) }],
      maxTurns: cfg.x.max_turns,
    });
    facts += `\n\n## X (last ${cfg.x.days} days)\n${xNotes}`;
  }

  // 3) Trọng tài viết kết luận ngắn, kiểu ELI12.
  const report = await think(cfg, "judge", { system: P.JUDGE, user: facts, effort: cfg.think.effort });

  const cost = endRun({ verdict: "ok" });
  const out = { handle, verdict: "ok", report, details: facts, cost };
  writeCache(key, out);
  return out;
}
