// Nav check: on every page at 1280/1440/1920, hovers each header dropdown, moves the mouse
// down onto its first link like a person would, and checks the link is still open and clickable.
// Usage: node scripts/nav-check.mjs [base URL]   (default: local preview on :4321)
import { chromium } from "playwright";
import fs from "node:fs";
const BASE = process.argv[2] || "http://localhost:4321";
const csv = fs.readFileSync("data/url-inventory.csv", "utf8").trim().split("\n").slice(1);
let paths = [...new Set(csv.map((l) => decodeURIComponent(new URL(l.split(",")[0]).pathname)).filter(p=>!p.startsWith("/blog/")&&!p.startsWith("/products/")))].concat(["/blog/plc-vs-iepl","/products/figure-8","/indoor-fiber-optic-cable"]);
const browser = await chromium.launch();
const page = await browser.newPage();
const bad = [];
for (const w of [1280, 1440, 1920]) for (const p of paths) {
  await page.setViewportSize({ width: w, height: 900 });
  await page.goto(BASE + encodeURI(p), { waitUntil: "load" });
  const n = await page.locator(".site-header-slot .has-overlay:visible").count();
  if (!n) { bad.push(`${w} ${p}: no dropdowns`); continue; }
  for (let i = 0; i < n; i++) {
    const dd = page.locator(".site-header-slot .has-overlay:visible").nth(i);
    const label = (await dd.innerText()).split("\n")[0].trim();
    const box = await dd.boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.waitForTimeout(150);
    const link = dd.locator(".overlay a").first();
    const lb = await link.boundingBox();
    if (!lb) { bad.push(`${w} ${p} [${label}]: menu did not open`); continue; }
    // move down to the link in steps, like a person would
    for (let s = 1; s <= 6; s++) { await page.mouse.move(box.x + box.width / 2 + ((lb.x + 20 - box.x - box.width / 2) * s) / 6, box.y + box.height / 2 + ((lb.y + lb.height / 2 - box.y - box.height / 2) * s) / 6); await page.waitForTimeout(30); }
    const ok = await link.evaluate((a) => { const r = a.getBoundingClientRect(); if (!r.width) return "closed while moving to it"; const t = document.elementFromPoint(r.x + 20, r.y + r.height / 2); return t === a || a.contains(t) ? "ok" : "covered by " + (t ? t.tagName + "." + t.className : "nothing"); });
    if (ok !== "ok") bad.push(`${w} ${p} [${label}]: ${ok}`);
    await page.mouse.move(5, 600);
  }
}
await browser.close();
console.log(bad.length ? bad.join("\n") : "all dropdowns OK");
