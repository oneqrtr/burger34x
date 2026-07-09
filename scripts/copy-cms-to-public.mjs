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

const publicDir = path.join(root, "public");
const logoCopies = [
  { from: path.join(root, "negatif.png"), to: path.join(publicDir, "logo_final_vectorized.png") },
  { from: path.join(root, "logo_final (1).png"), to: path.join(publicDir, "logo_final.png") },
  { from: path.join(root, "logo_final (1).png"), to: path.join(publicDir, "logo.png") },
];

for (const { from, to } of logoCopies) {
  if (!fs.existsSync(from)) continue;
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.copyFileSync(from, to);
  console.log(`copy-cms-to-public: ${path.basename(from)} → public/${path.basename(to)}`);
}
