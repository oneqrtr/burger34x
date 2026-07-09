import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");
const indexHtml = path.join(dist, "index.html");
const fallbackHtml = path.join(dist, "404.html");
const nojekyll = path.join(dist, ".nojekyll");

if (!fs.existsSync(indexHtml)) {
  console.warn("spa-fallback: dist/index.html yok, atlanıyor.");
  process.exit(0);
}

fs.copyFileSync(indexHtml, fallbackHtml);
fs.writeFileSync(nojekyll, "");
console.log("spa-fallback: 404.html ve .nojekyll oluşturuldu (GitHub Pages SPA).");
