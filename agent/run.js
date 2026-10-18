// Chạy thử không cần Telegram:  node agent/run.js https://x.com/tenduan
// --fresh: bỏ qua bộ nhớ · --x: thêm tìm trên X (tốn hơn) · --details: in dữ liệu đã gom
import { loadEnv, loadConfig } from "./src/env.js";
import { research, parseHandle } from "./src/agent.js";
import { costLine } from "./src/cost.js";

loadEnv();
const args = process.argv.slice(2);
const handle = parseHandle(args.find((a) => !a.startsWith("--")) || "");
if (!handle) {
  console.log("Cách dùng: node agent/run.js https://x.com/tenduan [--fresh] [--x] [--details]");
  process.exit(1);
}

try {
  const r = await research(loadConfig(), handle, { fresh: args.includes("--fresh"), withX: args.includes("--x") });
  console.log(r.report);
  if (args.includes("--details")) console.log("\n----- CHI TIẾT -----\n" + r.details);
  console.log("\n" + (r.fromCache ? "♻️ Lấy từ bộ nhớ (không tốn token)." : costLine(r.cost)));
} catch (e) {
  console.error("❌ " + e.message);
  process.exit(1);
}
