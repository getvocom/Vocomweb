// Phase 1 capture: for every URL in data/url-inventory.csv, at 1440/768/390 widths,
// save rendered HTML, a full-page screenshot, a visible-content outline (JSON) and
// every framerusercontent.com asset URL requested.
// Usage: node scripts/capture.mjs [--only /path] [--concurrency 4] [--base https://www.vocom.ai]
import { chromium } from "playwright";
import fs from "node:fs/promises";
import path from "node:path";

const args = process.argv.slice(2);
const opt = (k, d) => (args.includes(k) ? args[args.indexOf(k) + 1] : d);
const BASE = opt("--base", "https://www.vocom.ai");
const OUT = opt("--out", "capture");
const ONLY = opt("--only", null);
const CONC = Number(opt("--concurrency", 4));
const WIDTHS = [1440, 768, 390];

const csv = await fs.readFile("data/url-inventory.csv", "utf8");
let paths = csv.trim().split("\n").slice(1).map((l) => new URL(l.split(",")[0]).pathname);
paths = paths.map((p) => decodeURIComponent(p));
if (ONLY) paths = paths.filter((p) => p === ONLY);

const slug = (p) => (p === "/" ? "index" : p.replace(/^\//, "").replace(/\//g, "__"));
for (const d of ["html/rendered", "screens", "outline"]) await fs.mkdir(path.join(OUT, d), { recursive: true });

// Runs in the page: walk the DOM in order and emit only what is visible at this width.
const outlineFn = () => {
  const vis = (el) => {
    const s = getComputedStyle(el);
    if (s.display === "none" || s.visibility === "hidden") return false;
    if (s.display === "contents") return true;
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  };
  const out = [];
  const walk = (el) => {
    if (!(el instanceof Element) || !vis(el)) return;
    const tag = el.tagName.toLowerCase();
    if (["script", "style", "noscript", "svg", "template"].includes(tag)) {
      if (tag === "svg") out.push({ t: "svg", w: Math.round(el.getBoundingClientRect().width) });
      return;
    }
    const r = el.getBoundingClientRect();
    const box = { x: Math.round(r.x), y: Math.round(r.y + scrollY), w: Math.round(r.width), h: Math.round(r.height) };
    if (/^h[1-6]$/.test(tag) || tag === "p" || tag === "li") {
      out.push({ t: tag, text: el.innerText.trim(), box, links: [...el.querySelectorAll("a")].map((a) => a.getAttribute("href")) });
      return;
    }
    if (tag === "img") out.push({ t: "img", src: el.currentSrc || el.src, alt: el.getAttribute("alt"), box, nat: [el.naturalWidth, el.naturalHeight] });
    if (tag === "video") out.push({ t: "video", src: el.currentSrc || el.querySelector("source")?.src, poster: el.poster, box });
    if (tag === "a") out.push({ t: "a", href: el.getAttribute("href"), text: el.innerText.trim().slice(0, 200), box });
    if (["input", "textarea", "select", "button", "label", "form"].includes(tag))
      out.push({ t: tag, name: el.getAttribute("name"), type: el.getAttribute("type"), req: el.required, ph: el.getAttribute("placeholder"), text: el.innerText?.trim().slice(0, 200), box });
    const bg = getComputedStyle(el).backgroundImage;
    if (bg && bg.includes("url(")) out.push({ t: "bg", url: bg, box });
    for (const c of el.children) walk(c);
  };
  walk(document.body);
  return out;
};

async function autoScroll(page) {
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 400) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 120));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(800);
}

const browser = await chromium.launch();
const assets = new Set();
const failures = [];

async function capture(p) {
  for (const w of WIDTHS) {
    const ctx = await browser.newContext({ viewport: { width: w, height: 900 }, deviceScaleFactor: 1 });
    const page = await ctx.newPage();
    page.on("request", (r) => { if (r.url().includes("framerusercontent.com")) assets.add(r.url()); });
    try {
      await page.goto(BASE + encodeURI(p), { waitUntil: "networkidle", timeout: 60000 });
      await autoScroll(page);
      const name = `${slug(p)}@${w}`;
      if (w === 1440) await fs.writeFile(path.join(OUT, "html/rendered", slug(p) + ".html"), await page.content());
      await fs.writeFile(path.join(OUT, "outline", name + ".json"), JSON.stringify(await page.evaluate(outlineFn)));
      await page.screenshot({ path: path.join(OUT, "screens", name + ".png"), fullPage: true });
    } catch (e) {
      failures.push(`${p}@${w}: ${e.message.split("\n")[0]}`);
    }
    await ctx.close();
  }
  process.stdout.write(".");
}

const queue = [...paths];
await Promise.all(Array.from({ length: CONC }, async () => { while (queue.length) await capture(queue.shift()); }));
await browser.close();
const prev = await fs.readFile(path.join(OUT, "assets-seen.txt"), "utf8").catch(() => "");
await fs.writeFile(path.join(OUT, "assets-seen.txt"), [...new Set([...prev.split("\n").filter(Boolean), ...assets])].sort().join("\n") + "\n");
console.log(`\n${paths.length} pages, ${assets.size} asset urls, ${failures.length} failures`);
failures.forEach((f) => console.log("FAIL", f));
