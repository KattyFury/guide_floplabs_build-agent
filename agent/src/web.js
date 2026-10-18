// Tự tìm + tự đọc web MIỄN PHÍ (không cần key), thay cho tool tìm web trả phí của Grok.
// Grok chỉ nhận phần chữ đã cắt gọn → ít token hơn nhiều.

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function decode(s) {
  return s
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n));
}

const strip = (s) => decode(String(s || "").replace(/<[^>]+>/g, "")).replace(/\s+/g, " ").trim();

async function get(url) {
  const r = await fetch(url, {
    headers: { "User-Agent": UA, "Accept-Language": "en-US,en;q=0.9" },
    signal: AbortSignal.timeout(15_000),
  });
  return r.ok ? r.text() : "";
}

// Brave Search (trang HTML). Đã thử 18/10: tìm 5 lần liên tiếp vẫn ra kết quả tốt.
async function brave(query, n) {
  const html = await get(`https://search.brave.com/search?q=${encodeURIComponent(query)}&source=web`);
  return html
    .split('data-type="web"')
    .slice(1)
    .map((p) => ({
      url: (p.match(/href="(https?:\/\/[^"]+)"/) || [])[1],
      title: strip((p.match(/class="title[^"]*"[^>]*>([\s\S]*?)<\/div>/) || [])[1]),
      snippet: strip((p.match(/class="(?:snippet-description|content)[^"]*"[^>]*>([\s\S]*?)<\/div>/) || [])[1]),
    }))
    .filter((r) => r.url && !r.url.includes("brave.com"))
    .slice(0, n);
}

// DuckDuckGo (bản HTML) — dự phòng. Hay bắt giải captcha sau ~3 lần tìm liền.
async function ddg(query, n) {
  const html = await get(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`);
  const out = [];
  const re = /class="result__a" href="([^"]+)"[^>]*>([\s\S]*?)<\/a>[\s\S]*?class="result__snippet"[^>]*>([\s\S]*?)<\/a>/g;
  for (let m; (m = re.exec(html)) && out.length < n; ) {
    const raw = decode(m[1]);
    const u = raw.match(/uddg=([^&]+)/);
    const url = u ? decodeURIComponent(u[1]) : raw.startsWith("//") ? "https:" + raw : raw;
    if (!url.includes("duckduckgo.com/y.js")) out.push({ title: strip(m[2]), url, snippet: strip(m[3]) });
  }
  return out;
}

// Tìm web miễn phí. Trả về [{title, url, snippet}] (rỗng nếu cả 2 nguồn đều chặn).
// (Bing bị loại: nhận ra bot là trả kết quả rác.)
export async function search(query, n = 5) {
  for (const engine of [brave, ddg]) {
    try {
      const r = await engine(query, n);
      await sleep(1000); // tìm dồn dập dễ bị chặn
      if (r.length) return r;
    } catch {}
  }
  return [];
}

// Tải 1 trang → chữ thuần, cắt còn maxChars. Trang viết toàn bằng JavaScript sẽ ra rất ít chữ.
export async function readPage(url, maxChars = 4000) {
  try {
    const r = await fetch(url, {
      headers: { "User-Agent": UA, Accept: "text/html,text/plain" },
      redirect: "follow",
      signal: AbortSignal.timeout(15_000),
    });
    const type = r.headers.get("content-type") || "";
    if (!r.ok || !/html|text|markdown/.test(type)) return "";
    const html = (await r.text()).slice(0, 2_000_000);
    const text = decode(
      html
        .replace(/<!--[\s\S]*?-->/g, " ")
        .replace(/<(script|style|noscript|svg|head|nav|footer|iframe)[\s\S]*?<\/\1>/gi, " ")
        .replace(/<\/(p|div|li|h[1-6]|tr|br|section|article)>/gi, "\n")
        .replace(/<[^>]+>/g, " "),
    )
      .replace(/[ \t]+/g, " ")
      .replace(/\n\s*\n+/g, "\n")
      .trim();
    return text.slice(0, maxChars);
  } catch {
    return "";
  }
}

export function host(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

export function formatResults(results) {
  return results.map((r) => `- ${r.title} | ${r.url}\n  ${r.snippet}`).join("\n");
}
