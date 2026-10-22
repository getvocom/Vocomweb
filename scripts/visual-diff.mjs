// Visual parity: screenshots the local build at 1440/768/390 and compares with the
// live captures in capture/screens. Writes side-by-side + diff images to
// capture/visual/ and a summary to notes/visual-report.md.
// Usage: node scripts/visual-diff.mjs [--base http://localhost:4321] [--only /path] [--widths 1440,390]
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";
import { PNG } from "pngjs";
import pixelmatch from "pixelmatch";
import sharp from "sharp";

const args = process.argv.slice(2);
const opt = (k, d) => (args.includes(k) ? args[args.indexOf(k) + 1] : d);
const BASE = opt("--base", "http://localhost:4321");
const ONLY = opt("--only", null);
const WIDTHS = opt("--widths", "1440,768,390").split(",").map(Number);
const OUT = "capture/visual";
fs.mkdirSync(OUT, { recursive: true });

const csv = fs.readFileSync("data/url-inventory.csv", "utf8").trim().split("\n").slice(1);
let paths = csv.map((l) => decodeURIComponent(new URL(l.split(",")[0]).pathname));
if (ONLY) paths = paths.filter((p) => ONLY.split(",").includes(p));
const slug = (p) => (p === "/" ? "index" : p.replace(/^\//, "").replace(/\//g, "__"));

async function autoScroll(page) {
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 400) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 60)); }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(500);
}

async function load(file) { return PNG.sync.read(fs.readFileSync(file)); }
function pad(img, w, h) {
  const out = new PNG({ width: w, height: h });
  out.data.fill(255);
  PNG.bitblt(img, out, 0, 0, Math.min(img.width, w), Math.min(img.height, h), 0, 0);
  return out;
}

const browser = await chromium.launch();
const rows = [];
const jobs = paths.flatMap((p) => WIDTHS.map((w) => [p, w]));
const CONC = Number(opt("--concurrency", 6));
async function job(p, w) {
  {
    const ref = `capture/screens/${slug(p)}@${w}.png`;
    if (!fs.existsSync(ref)) return;
    const ctx = await browser.newContext({ viewport: { width: w, height: 900 } });
    const page = await ctx.newPage();
    // block third-party trackers so they don't affect layout or timing
    await page.route(/googletagmanager|licdn|linkedin|metricool|\.(mp4|webm|mov)(\?|$)|calendly/, (r) => r.abort());
    await page.goto(BASE + encodeURI(p), { waitUntil: "networkidle", timeout: 90000 });
    await autoScroll(page);
    // video frames never match between captures: mask video boxes on both images
    const masks = await page.evaluate(() => [...document.querySelectorAll("video, iframe")].map((v) => { const r = v.getBoundingClientRect(); return [r.x, r.y + scrollY, r.width, r.height].map(Math.round); }).filter((m) => m[2] > 0 && m[3] > 0));
    const mine = `${OUT}/${slug(p)}@${w}.local.png`;
    await page.screenshot({ path: mine, fullPage: true, timeout: 120000 });
    await ctx.close();
    const a = await load(ref), b = await load(mine);
    const W = Math.max(a.width, b.width), H = Math.max(a.height, b.height);
    const A = pad(a, W, H), B = pad(b, W, H), D = new PNG({ width: W, height: H });
    for (const [x, y, w2, h2] of masks) for (const img of [A, B]) for (let yy = Math.max(0, y); yy < Math.min(H, y + h2); yy++) for (let xx = Math.max(0, x); xx < Math.min(W, x + w2); xx++) { const i = (yy * W + xx) * 4; img.data[i] = img.data[i + 1] = img.data[i + 2] = 128; }
    const n = pixelmatch(A.data, B.data, D.data, W, H, { threshold: 0.15 });
    const pct = (100 * n) / (W * H);
    if (ONLY || args.includes("--images")) {
    fs.writeFileSync(`${OUT}/${slug(p)}@${w}.diff.png`, PNG.sync.write(D));
    // side by side (live | local) for review
    await sharp({ create: { width: W * 2 + 20, height: H, channels: 3, background: "#888" } })
      .composite([{ input: ref, left: 0, top: 0 }, { input: mine, left: W + 20, top: 0 }])
      .png().toFile(`${OUT}/${slug(p)}@${w}.side.png`);
    }
    rows.push({ p, w, pct: pct.toFixed(2), live: a.height, local: b.height });
    console.log(p, w, pct.toFixed(2) + "%", `height live ${a.height} local ${b.height}`);
  }
}
await Promise.all(Array.from({ length: CONC }, async () => { while (jobs.length) { const [p, w] = jobs.shift(); try { await job(p, w); } catch (e) { console.log("ERR", p, w, e.message.split("\n")[0]); } } }));
rows.sort((x, y) => paths.indexOf(x.p) - paths.indexOf(y.p) || y.w - x.w);
await browser.close();
const md = ["# Visual parity report", "", `Generated ${new Date().toISOString()}. Pixel difference vs live capture (threshold 0.15).`, "", "| URL | Width | Diff % | Live height | Local height |", "|---|---|---|---|---|",
  ...rows.map((r) => `| ${r.p} | ${r.w} | ${r.pct} | ${r.live} | ${r.local} |`)];
fs.writeFileSync(ONLY ? `${OUT}/report-partial.md` : "notes/visual-report.md", md.join("\n") + "\n");
