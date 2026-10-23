// Finds images shown larger than their file can support on a high-resolution (2x) screen.
// Usage: node scripts/image-sharpness.mjs [base URL]
import fs from "node:fs";
import { chromium } from "playwright";
const BASE = process.argv[2] || "http://localhost:4321";
const csv = fs.readFileSync("data/url-inventory.csv", "utf8").trim().split("\n").slice(1);
let paths = [...new Set(csv.map((l) => decodeURIComponent(new URL(l.split(",")[0]).pathname)))];
for (const x of JSON.parse(fs.readFileSync("scripts/framer/extra-pages.json", "utf8")).pages) if (!paths.includes(x.path)) paths.push(x.path);
const b = await chromium.launch();
const found = new Map();
const queue = [...paths];
async function worker() {
  const p = await b.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
  while (queue.length) {
    const u = queue.shift();
    try {
      await p.goto(BASE + encodeURI(u), { waitUntil: "load", timeout: 60000 });
      await p.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 600) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 40)); } });
      await p.waitForTimeout(800);
      const rows = await p.evaluate(() => [...document.images].filter((i) => i.getClientRects().length && i.naturalWidth).map((i) => {
        const r = i.getBoundingClientRect(); const cs = getComputedStyle(i);
        // object-fit: cover scales the image to cover the box; work out the scale actually applied
        let scale = r.width / i.naturalWidth;
        if (cs.objectFit === "cover") scale = Math.max(r.width / i.naturalWidth, r.height / i.naturalHeight);
        if (cs.objectFit === "contain") scale = Math.min(r.width / i.naturalWidth, r.height / i.naturalHeight);
        return { src: (i.currentSrc || i.src).replace(location.origin, ""), shown: Math.round(r.width) + "x" + Math.round(r.height), file: i.naturalWidth + "x" + i.naturalHeight, scale: +(scale * 2).toFixed(2) };
      }).filter((x) => x.scale > 1.25 && !/\.svg/.test(x.src)));
      for (const r of rows) { const k = r.src; if (!found.has(k) || found.get(k).scale < r.scale) found.set(k, { ...r, page: u }); }
    } catch (e) {}
  }
  await p.close();
}
await Promise.all(Array.from({ length: 4 }, worker));
await b.close();
const list = [...found.values()].sort((a, b) => b.scale - a.scale);
for (const r of list) console.log(`${r.scale}x  ${r.src}  file ${r.file}, shown ${r.shown} on ${r.page}`);
console.log(`\n${list.length} images look soft on a 2x screen (scale > 1.25)`);
