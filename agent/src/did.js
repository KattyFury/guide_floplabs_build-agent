// Đọc DID (căn cước agent) đã tạo bằng scripts/generate-did.js và ký tin nhắn.
// Khoá bí mật nằm ở secrets/ (không bao giờ lên GitHub).
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { AGENT_DIR } from "./env.js";

const ROOT = path.resolve(AGENT_DIR, "..");

export function loadDid(label) {
  if (!label) throw new Error("Chưa có DID_LABEL trong agent/.env (tên DID bạn đã tạo, VD: hieu).");
  const file = path.join(ROOT, "data", `${label}.json`);
  if (!fs.existsSync(file))
    throw new Error(`Không thấy data/${label}.json. Tạo DID trước: node scripts/generate-did.js ${label}`);
  const id = JSON.parse(fs.readFileSync(file, "utf8"));
  const key = crypto.createPrivateKey({
    key: Buffer.from(fs.readFileSync(path.join(ROOT, id.seed_file), "utf8").trim(), "base64"),
    format: "der",
    type: "pkcs8",
  });
  return { did: id.did, label, key };
}

// Technocore thay ký tự điều khiển/định dạng bằng dấu cách trước khi lưu → phải ký đúng chữ sau khi "quét".
export function sweep(text) {
  return String(text).replace(/[\p{Cc}\p{Cf}\p{Cs}\p{Co}\p{Zl}\p{Zp}]/gu, " ").trim();
}

export function sign(id, message) {
  return crypto.sign(null, Buffer.from(message, "utf8"), id.key).toString("base64url");
}
