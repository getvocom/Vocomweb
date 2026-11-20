// Mobile layout audit: WebKit (Safari engine) at phone widths.
// Needs the preview server on :4321 and `npx playwright install webkit`.
// Usage: node scripts/mobile-audit.mjs . [375,390] [/case-studies,/products/*]
import { webkit } from "playwright";
import fs from "node:fs";
import path from "node:path";
const root = process.argv[2];
const widths = (process.argv[3] || "375,390").split(",").map(Number);
const only = process.argv[4];
const { createRequire } = await import("node:module");
const sm = fs.readFileSync(path.join(root, "dist/sitemap.xml"), "utf8");
let paths = [...sm.matchAll(/<loc>https:\/\/www\.vocom\.ai([^<]*)<\/loc>/g)].map((m) => decodeURI(m[1]) || "/");
if (only) paths = paths.filter((p) => only.split(",").some((o) => p === o || (o.endsWith("*") && p.startsWith(o.slice(0, -1)))));
const browser = await webkit.launch();
const out = [];
for (const w of widths) {
  const ctx = await browser.newContext({ viewport: { width: w, height: 800 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1" });
  await ctx.route(/challenges\.cloudflare\.com|googletagmanager|google-analytics|licdn|metricool|doubleclick/, (r) => r.abort());
  const page = await ctx.newPage();
  for (const p of paths) {
    try { await page.goto("http://localhost:4321" + encodeURI(p), { waitUntil: "load", timeout: 30000 }); } catch (e) { out.push({ w, p, err: String(e).slice(0, 120) }); continue; }
    // scroll through so lazy images load
    await page.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 700) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 40)); } window.scrollTo(0, 0); });
    await page.waitForTimeout(300);
    const res = await page.evaluate(() => {
      // stand-in for the Turnstile widget (300px wide when it asks for a click)
      document.querySelectorAll(".turnstile-slot").forEach((s) => { if (!s.firstElementChild) s.innerHTML = '<div data-ts-stub style="width:300px;height:65px"></div>'; });
      const fixedUp = (e) => { for (let a = e; a && a !== document.body; a = a.parentElement) { const s = getComputedStyle(a); if (s.position === "fixed" || s.position === "sticky") return true; } return false; };
      const vis = (e) => { const s = getComputedStyle(e); if (s.visibility === "hidden" || s.display === "none") return false; const r = e.getBoundingClientRect(); return r.width > 2 && r.height > 2; };
      const desc = (e) => { let s = e.tagName.toLowerCase(); if (e.id) s += "#" + e.id; const c = [...e.classList].filter((c) => !/^x[a-z0-9]{6}$/.test(c)).slice(0, 2); if (c.length) s += "." + c.join("."); return s; };
      const issues = [];
      const vw = document.documentElement.clientWidth;
      if (document.documentElement.scrollWidth > vw + 1) issues.push(`page scrolls sideways: ${document.documentElement.scrollWidth}px`);
      // controls and media sticking out of their card or the screen
      for (const e of document.querySelectorAll("input:not([type=hidden]), textarea, select, button, img, iframe, video, [data-ts-stub], table, pre")) {
        if (!vis(e) || e.closest("[hidden], .site-header-slot, .marquee, [class*=ticker], [class*=logos]") || fixedUp(e)) continue;
        const r = e.getBoundingClientRect();
        if (r.right < -1000) continue; // honeypot fields parked off screen on purpose
        // inside a box that clips or scrolls (and itself fits the screen): not visible past the edge
        let clip = null;
        for (let a = e.parentElement; a && a !== document.body; a = a.parentElement) { const s = getComputedStyle(a); if (s.overflowX !== "visible" || s.clipPath !== "none") { clip = a; break; } }
        if (clip) { const cr = clip.getBoundingClientRect(); if (cr.left >= -1 && cr.right <= vw + 1) continue; }
        if (r.right > vw + 1 || r.left < -1) { issues.push(`${desc(e)} past screen edge (${Math.round(r.left)} to ${Math.round(r.right)})`); continue; }
        // nearest ancestor that draws a box (border, shadow or background) and clips nothing
        let a = e.parentElement;
        while (a && a !== document.body) { const s = getComputedStyle(a); if ((s.borderLeftWidth !== "0px" || s.boxShadow !== "none" || (s.backgroundColor !== "rgba(0, 0, 0, 0)" && s.backgroundColor !== "transparent")) && s.overflow === "visible") break; a = a.parentElement; }
        if (a && a !== document.body) { const ar = a.getBoundingClientRect(); if (r.right > ar.right + 1 || r.left < ar.left - 1) issues.push(`${desc(e)} sticks out of ${desc(a)} by ${Math.round(Math.max(r.right - ar.right, ar.left - r.left))}px`); }
      }
      // pictures covering text
      const texts = [...document.querySelectorAll("h1,h2,h3,h4,p,li,a,span,label,dt,dd,td")].filter((t) => vis(t) && !t.closest("details:not([open]) > :not(summary)") && t.childNodes.length && [...t.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()));
      for (const img of document.querySelectorAll("img, video, picture")) {
        if (!vis(img) || img.closest("[hidden], .site-header-slot") || fixedUp(img)) continue;
        const r = img.getBoundingClientRect();
        if (r.width < 40) continue;
        const box = img.closest("picture")?.parentElement || img.parentElement;
        for (const t of texts) {
          if (box.contains(t) || t.contains(img) || fixedUp(t)) continue;
          // text that is placed over an image on purpose sits in a positioned layer
          const tr = t.getBoundingClientRect();
          const ox = Math.min(r.right, tr.right) - Math.max(r.left, tr.left), oy = Math.min(r.bottom, tr.bottom) - Math.max(r.top, tr.top);
          if (ox > 4 && oy > 4) {
            // is the text actually under the image? check painting order at the overlap centre
            const cx = Math.max(r.left, tr.left) + ox / 2, cy = Math.max(r.top, tr.top) + oy / 2;
            if (cy < 0 || cy > innerHeight) { window.scrollTo(0, window.scrollY + cy - innerHeight / 2); }
            const tr2 = t.getBoundingClientRect(), r2 = img.getBoundingClientRect();
            const px = Math.max(r2.left, tr2.left) + ox / 2, py = Math.max(r2.top, tr2.top) + oy / 2;
            const top = document.elementFromPoint(px, py);
            const covered = top && (top === img || img.contains(top) || top.contains(img) || (top.tagName === "IMG" && top !== img));
            issues.push(`${desc(img)} ${covered ? "COVERS" : "overlaps"} text ${desc(t)} "${t.textContent.trim().slice(0, 40)}" (${Math.round(oy)}px)`);
          }
        }
      }
      return [...new Set(issues)];
    });
    if (res.length) out.push({ w, p, issues: res });
    process.stderr.write(".");
  }
  await ctx.close();
}
await browser.close();
for (const o of out) { console.log(`\n[${o.w}] ${o.p}`); (o.issues || [o.err]).forEach((i) => console.log("  " + i)); }
console.log(`\n${out.length} page/width combos with findings`);
