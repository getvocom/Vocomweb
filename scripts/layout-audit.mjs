// Layout audit: loads every page at 1440/768/390 and reports things that look broken
// regardless of what the live site does:
//   - horizontal scroll (page wider than the viewport)
//   - text running past the right edge of the screen
//   - content spilling out of the bottom of a fixed-height box and covering the next one
//   - images that failed to load
// Usage: node scripts/layout-audit.mjs [--base http://localhost:4321] [--only /a,/b] [--widths 390]
import fs from "node:fs";
import { chromium } from "playwright";

const args = process.argv.slice(2);
const opt = (k, d) => (args.includes(k) ? args[args.indexOf(k) + 1] : d);
const BASE = opt("--base", "http://localhost:4321");
const ONLY = opt("--only", null);
const WIDTHS = opt("--widths", "1440,768,390").split(",").map(Number);

const csv = fs.readFileSync("data/url-inventory.csv", "utf8").trim().split("\n").slice(1);
let paths = csv.map((l) => decodeURIComponent(new URL(l.split(",")[0]).pathname));
for (const extra of ["/fiber-optic-cable-for-distributors", "/indoor-fiber-optic-cable", "/fiber-optic-cable-referral-partners"]) if (!paths.includes(extra)) paths.push(extra);
if (ONLY) paths = paths.filter((p) => ONLY.split(",").includes(p));

function inspect() {
  const vw = document.documentElement.clientWidth;
  const issues = [];
  const label = (e) => (e.innerText || e.getAttribute("alt") || e.className || e.tagName).toString().trim().replace(/\s+/g, " ").slice(0, 60);
  const visible = (e) => { const s = getComputedStyle(e); return s.display !== "none" && s.visibility !== "hidden" && e.getClientRects().length; };
  const hiddenByAncestor = (e) => { for (let p = e.parentElement; p && p !== document.body; p = p.parentElement) { const s = getComputedStyle(p); if (s.overflowX === "hidden" || s.overflowX === "clip" || s.overflow === "hidden") { const r = p.getBoundingClientRect(); if (r.right <= vw + 1) return p; } } return null; };
  if (document.documentElement.scrollWidth > vw + 1) issues.push(`horizontal scroll: page is ${document.documentElement.scrollWidth}px wide`);
  // Text past the right edge (clipped or not).
  for (const e of document.querySelectorAll("h1,h2,h3,h4,h5,h6,p,a,span,li,label,button")) {
    if (!visible(e) || e.closest("[data-pagefind-ignore],.cookie-banner,.newsletter-popup,nav,header")) continue;
    if (!e.innerText || !e.innerText.trim()) continue;
    const r = e.getBoundingClientRect();
    if (r.width && r.right > vw + 2 && e.scrollWidth > 0) {
      const clip = hiddenByAncestor(e);
      issues.push(`text past screen edge${clip ? " (cut off)" : ""}: "${label(e)}" <${e.tagName.toLowerCase()} class="${e.className}"> parent "${e.parentElement.className}"`);
    }
  }
  // Children spilling out of the bottom of a fixed-height box (and overlapping the next box).
  for (const box of document.querySelectorAll("a, article, li, div")) {
    if (!visible(box)) continue;
    const s = getComputedStyle(box);
    if (s.overflow !== "visible" || !/px$/.test(s.height) || box.closest("header,nav,.has-overlay")) continue;
    const r = box.getBoundingClientRect();
    if (r.height < 40) continue;
    let maxBottom = r.bottom;
    for (const c of box.children) { if (!visible(c) || getComputedStyle(c).position === "absolute" || getComputedStyle(c).position === "fixed") continue; maxBottom = Math.max(maxBottom, c.getBoundingClientRect().bottom); }
    if (maxBottom - r.bottom > 24 && box.parentElement && getComputedStyle(box.parentElement).display.includes("grid")) issues.push(`content spills ${Math.round(maxBottom - r.bottom)}px out of card: "${label(box)}"`);
  }
  for (const img of document.querySelectorAll("img")) {
    if (!visible(img)) continue;
    if (img.complete && img.naturalWidth === 0) issues.push(`image failed: ${img.getAttribute("src")}`);
  }
  return [...new Set(issues)];
}

const browser = await chromium.launch();
const results = [];
let queue = paths.flatMap((p) => WIDTHS.map((w) => [p, w]));
async function worker() {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  while (queue.length) {
    const [p, w] = queue.shift();
    await page.setViewportSize({ width: w, height: 900 });
    try {
      await page.goto(BASE + encodeURI(p), { waitUntil: "load", timeout: 60000 });
      await page.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 500) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 40)); } window.scrollTo(0, 0); });
      await page.waitForTimeout(400);
      const issues = await page.evaluate(inspect);
      for (const i of issues) { results.push(`${p} ${w} ${i}`); console.log(`${p} ${w} ${i}`); }
    } catch (e) { console.log(`${p} ${w} ERROR ${e.message.split("\n")[0]}`); }
  }
  await ctx.close();
}
await Promise.all(Array.from({ length: 4 }, worker));
await browser.close();
console.log(`\n${results.length} issues`);
