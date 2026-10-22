// Broken-link check on the built site: every internal href/src in dist/*.html must
// resolve to a file in dist/ (Cloudflare Pages rules: /x -> x.html or x/index.html).
// Also flags anchors (#id) that don't exist on the target page.
// Usage: node scripts/check-links.mjs
import fs from "node:fs";
import path from "node:path";

const DIST = "dist";
const pages = [];
const walk = (d) => { for (const f of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, f.name); if (f.isDirectory()) walk(p); else if (p.endsWith(".html")) pages.push(p); } };
walk(DIST);
const redirects = new Set(fs.readFileSync("public/_redirects", "utf8").split("\n").filter((l) => l.trim() && !l.startsWith("#")).map((l) => l.trim().split(/\s+/)[0]));
const resolve = (p) => {
  if (redirects.has(p)) return "redirect";
  const clean = decodeURIComponent(p).replace(/\/$/, "") || "/";
  const cands = clean === "/" ? ["index.html"] : [clean.slice(1), clean.slice(1) + ".html", clean.slice(1) + "/index.html"];
  return cands.map((c) => path.join(DIST, c)).find((f) => fs.existsSync(f) && fs.statSync(f).isFile()) || null;
};
const idsCache = new Map();
const ids = (file) => { if (!idsCache.has(file)) idsCache.set(file, new Set([...fs.readFileSync(file, "utf8").matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]))); return idsCache.get(file); };
const broken = [];
let checked = 0;
for (const page of pages) {
  const html = fs.readFileSync(page, "utf8");
  for (const m of html.matchAll(/\s(?:href|src)="([^"]+)"/g)) {
    let u = m[1].replace(/&amp;/g, "&");
    if (/^(https?:|mailto:|tel:|data:|javascript:|#$)/.test(u) || u.startsWith("//")) continue;
    const [p, hash] = u.split("#");
    const target = p ? resolve(p.split("?")[0]) : page;
    checked++;
    if (!target) broken.push(`${page}: ${u}`);
    else if (hash && target !== "redirect" && target.endsWith(".html") && !ids(target).has(hash)) broken.push(`${page}: ${u} (missing #${hash})`);
  }
  for (const m of html.matchAll(/\ssrcset="([^"]+)"/g)) for (const part of m[1].split(",")) { const u = part.trim().split(" ")[0]; checked++; if (u.startsWith("/") && !fs.existsSync(path.join(DIST, decodeURIComponent(u)))) broken.push(`${page}: ${u}`); }
}
console.log(`${pages.length} pages, ${checked} links checked, ${broken.length} broken`);
[...new Set(broken)].slice(0, 100).forEach((b) => console.log("BROKEN", b));
process.exit(broken.length ? 1 : 0);
