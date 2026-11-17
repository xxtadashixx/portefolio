// Convertit scripts/docker-whale.svg en image WebP (2x) : node scripts/render-illustration.js <sortie.webp>
// Playwright produit le PNG (polices du site incluses), Pillow le convertit.
const { chromium } = require("playwright");
const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");

(async () => {
  const out = process.argv[2] || "content/seed/files/docker-anime.webp";
  const font = path.resolve("node_modules/@fontsource-variable/jetbrains-mono/files/jetbrains-mono-latin-wght-normal.woff2");
  const svg = fs.readFileSync("scripts/docker-whale.svg", "utf8");
  const html = `<style>@font-face{font-family:"JetBrains Mono Variable";src:url("file://${font}");font-weight:100 800}body{margin:0}svg{display:block}</style>${svg}`;
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1200, height: 450 }, deviceScaleFactor: 2 });
  await page.setContent(html);
  await page.evaluate(() => document.fonts.ready);
  const png = out.replace(/\.webp$/, ".tmp.png");
  await page.screenshot({ path: png });
  await browser.close();
  execFileSync("python3", ["-I", "-c", "import sys;from PIL import Image;Image.open(sys.argv[1]).convert('RGB').save(sys.argv[2],quality=90,method=6)", png, out]);
  fs.unlinkSync(png);
  console.log(out, fs.statSync(out).size, "octets");
})();
