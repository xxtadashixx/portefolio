// Génère les images de l'illustration à partir de scripts/docker-whale.svg :
//   node scripts/render-illustration.js [dossier-de-sortie] [fps] [échelle]
// -> docker-anime-anim.webp (animé, boucle de 4 s) et docker-anime.webp (image fixe, 2x).
// Chaque image est obtenue en plaçant toutes les animations CSS du SVG à l'instant voulu.
const { chromium } = require("playwright");
const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");

const LOOP_MS = 4000;
const outDir = process.argv[2] || "content/seed/files";
const fps = Number(process.argv[3]) || 15;
const scale = Number(process.argv[4]) || 1;
const STILL_AT = 1200; // instant de l'image fixe : le conteneur est en plein vol

(async () => {
  const font = path.resolve("node_modules/@fontsource-variable/jetbrains-mono/files/jetbrains-mono-latin-wght-normal.woff2");
  const svg = fs.readFileSync("scripts/docker-whale.svg", "utf8");
  const html = `<style>@font-face{font-family:"JetBrains Mono Variable";src:url("file://${font}");font-weight:100 800}body{margin:0}svg{display:block}</style>${svg}`;
  const tmp = fs.mkdtempSync(path.join(require("node:os").tmpdir(), "frames-"));
  const browser = await chromium.launch();

  const shoot = async (factor, t, file) => {
    const page = await browser.newPage({ viewport: { width: 1200, height: 450 }, deviceScaleFactor: factor });
    await page.setContent(html);
    await page.evaluate(() => document.fonts.ready);
    return { page, at: async (ms, f) => {
      await page.evaluate((ms) => document.getAnimations().forEach((a) => { a.pause(); a.currentTime = ms; }), ms);
      await page.screenshot({ path: f });
    } };
  };

  const frames = Math.round((LOOP_MS / 1000) * fps);
  const anim = await shoot(scale);
  const files = [];
  for (let i = 0; i < frames; i++) {
    const f = path.join(tmp, `f${String(i).padStart(3, "0")}.png`);
    await anim.at((i * LOOP_MS) / frames, f);
    files.push(f);
  }
  const still = await shoot(2);
  const stillPng = path.join(tmp, "still.png");
  await still.at(STILL_AT, stillPng);
  await browser.close();

  const py = `
import sys, glob
from PIL import Image
out, tmp, fps = sys.argv[1], sys.argv[2], int(sys.argv[3])
frames = [Image.open(f).convert("RGB") for f in sorted(glob.glob(tmp + "/f*.png"))]
frames[0].save(out + "/docker-anime-anim.webp", save_all=True, append_images=frames[1:], duration=round(1000 / fps), loop=0, quality=80, method=5)
Image.open(tmp + "/still.png").convert("RGB").save(out + "/docker-anime.webp", quality=90, method=6)
`;
  execFileSync("python3", ["-I", "-c", py, outDir, tmp, String(fps)]);
  for (const n of ["docker-anime-anim.webp", "docker-anime.webp"]) console.log(n, (fs.statSync(path.join(outDir, n)).size / 1024).toFixed(0), "Ko");
  fs.rmSync(tmp, { recursive: true });
})();
