// Confirms pages render their full content with JavaScript disabled: compares the
// visible text blocks with JS off vs on. Usage: node scripts/check-nojs.mjs [base] [paths...]
import { chromium } from "playwright";
const base = process.argv[2] || "http://localhost:4321";
const paths = process.argv.slice(3).length ? process.argv.slice(3) : ["/", "/fiber-optic-cables", "/vocom-ai", "/vocom-international", "/contact-vocomai", "/blog", "/blog/plc-vs-iepl", "/products/central-tube"];
const b = await chromium.launch();
const grab = async (js, p) => {
  const ctx = await b.newContext({ javaScriptEnabled: js, viewport: { width: 1440, height: 900 } });
  const pg = await ctx.newPage();
  await pg.route(/googletagmanager|licdn|linkedin|metricool|\.mp4/, (r) => r.abort());
  await pg.goto(base + encodeURI(p), { waitUntil: "load" });
  const t = await pg.evaluate(() => [...document.querySelectorAll("h1,h2,h3,h4,p,li")].filter((e) => e.getClientRects().length && getComputedStyle(e).visibility !== "hidden").map((e) => e.innerText.trim()).filter(Boolean));
  const imgs = await pg.evaluate(() => [...document.images].filter((i) => i.getBoundingClientRect().width > 2).length);
  await ctx.close();
  return { t, imgs };
};
let fail = 0;
for (const p of paths) {
  const on = await grab(true, p), off = await grab(false, p);
  const missing = on.t.filter((x) => !off.t.includes(x));
  const ok = missing.length === 0 && off.imgs >= on.imgs;
  if (!ok) fail++;
  console.log(ok ? "OK  " : "DIFF", p, `text blocks ${off.t.length}/${on.t.length}, images ${off.imgs}/${on.imgs}`, missing.slice(0, 3));
}
await b.close();
process.exit(fail ? 1 : 0);
