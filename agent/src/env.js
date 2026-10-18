// Đọc file .env (không cần thư viện ngoài).
// Mặc định đọc agent/.env. Có thể trỏ sang file khác bằng biến ENV_FILE.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const AGENT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

export function loadEnv() {
  const file = process.env.ENV_FILE || path.join(AGENT_DIR, ".env");
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!m || process.env[m[1]]) continue;
    process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

export function loadConfig() {
  return JSON.parse(fs.readFileSync(path.join(AGENT_DIR, "config.json"), "utf8"));
}
