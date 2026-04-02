import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const src = path.join(root, "src", "cms.json");
const dest = path.join(root, "public", "cms.json");

if (!fs.existsSync(src)) {
  console.warn("copy-cms-to-public: src/cms.json yok, atlanıyor.");
  process.exit(0);
}

fs.mkdirSync(path.dirname(dest), { recursive: true });
fs.copyFileSync(src, dest);
console.log("copy-cms-to-public: public/cms.json güncellendi.");
