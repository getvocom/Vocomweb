// SEO + content parity: live site vs local build, URL by URL.
// Compares status, title, meta description, canonical, robots, OG/Twitter tags,
// H1 and H2/H3 lists, visible text (at 1440px), internal links, images + alt text,
// and JSON-LD. Writes notes/parity-report.md and capture/parity.json.
// Usage: node scripts/parity-check.mjs [--base http://localhost:4321] [--live https://www.vocom.ai] [--only /path] [--fresh]
//   --fresh re-fetches the live HTML instead of using capture/html/raw.
import fs from "node:fs";
import { chromium } from "playwright";

const args = process.argv.slice(2);
const opt = (k, d) => (args.includes(k) ? args[args.indexOf(k) + 1] : d);
const BASE = opt("--base", "http://localhost:4321");
const LIVE = opt("--live", "https://www.vocom.ai");
const ONLY = opt("--only", null);
const FRESH = args.includes("--fresh");

const inv = fs.readFileSync("data/url-inventory.csv", "utf8").trim().split("\n").slice(1);
let paths = inv.map((l) => decodeURIComponent(new URL(l.split(",")[0]).pathname));
if (ONLY) paths = paths.filter((p) => ONLY.split(",").includes(p));
const slug = (p) => (p === "/" ? "index" : p.replace(/^\//, "").replace(/\//g, "__"));

// asset URL normalisation: framerusercontent -> self-hosted path, so moved assets compare equal
const assetMap = new Map();
for (const r of fs.readFileSync("data/asset-map.csv", "utf8").trim().split("\n").slice(1)) {
  const [u, local] = r.split(",");
  assetMap.set(u, local);
}
const normUrl = (u) => {
  if (!u) return u;
  const bare = u.split("?")[0];
  if (assetMap.has(bare)) return "https://www.vocom.ai" + assetMap.get(bare);
  return u;
};
const normText = (s) => s.replace(/\s+/g, " ").replace(/[​-‍﻿]/g, "").trim();
const uniq = (a) => [...new Set(a)];
const decode = (s) => s.replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n)).replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16))).replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;|&#x27;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&nbsp;/g, " ");

function headOf(html) {
  const head = html.slice(0, html.indexOf("</head>") + 7);
  const out = { meta: {}, canonical: null, title: null };
  out.title = decode((head.match(/<title>([\s\S]*?)<\/title>/) || [])[1] || "").trim();
  for (const m of head.matchAll(/<meta\s+([^>]*?)\/?>/g)) {
    const a = Object.fromEntries([...m[1].matchAll(/([\w:-]+)="([^"]*)"/g)].map((x) => [x[1], decode(x[2])]));
    const k = a.name || a.property;
    if (k && a.content !== undefined && !["viewport", "generator", "framer-search-index", "framer-search-index-fallback"].includes(k)) out.meta[k] ??= a.content;
  }
  out.canonical = (head.match(/<link\s+rel="canonical"\s+href="([^"]+)"/) || head.match(/<link[^>]*href="([^"]+)"[^>]*rel="canonical"/) || [])[1] || null;
  return out;
}
function headings(html) {
  const body = html.slice(html.indexOf("<body"));
  const h = { h1: [], h2: [], h3: [] };
  for (const m of body.matchAll(/<(h[1-3])\b[^>]*>([\s\S]*?)<\/\1>/g)) h[m[1]].push(normText(decode(m[2].replace(/<[^>]+>/g, ""))));
  return { h1: uniq(h.h1), h2: uniq(h.h2), h3: uniq(h.h3) };
}
function jsonld(html) {
  const out = [];
  for (const m of html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)) {
    try { out.push(JSON.parse(m[1].replace(/https:\/\/framerusercontent\.com\/[^"\s]+/g, (u) => normUrl(u)))); } catch { out.push({ unparseable: true }); }
  }
  return out.map((o) => JSON.stringify(o)).sort();
}
function internalLinks(html, base) {
  const body = html.slice(html.indexOf("<body"));
  const s = new Set();
  for (const m of body.matchAll(/<a\b[^>]*href="([^"]+)"/g)) {
    let h = decode(m[1]);
    if (/^(mailto|tel|javascript):/.test(h)) continue;
    try {
      const u = new URL(h, base);
      if (!/(^|\.)vocom\.ai$|localhost/.test(u.hostname)) continue;
      let p = decodeURIComponent(u.pathname).replace(/\/$/, "") || "/";
      s.add(p + (u.hash || ""));
    } catch {}
  }
  return [...s].sort();
}

// visible content at 1440 (same walker as the capture)
const outlineFn = () => {
  const vis = (el) => { const s = getComputedStyle(el); if (s.display === "none" || s.visibility === "hidden") return false; if (s.display === "contents") return true; const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
  const text = [], imgs = [];
  const walk = (el) => {
    if (!(el instanceof Element) || !vis(el)) return;
    const tag = el.tagName.toLowerCase();
    if (["script", "style", "noscript", "svg", "template"].includes(tag)) return;
    if (/^h[1-6]$/.test(tag) || tag === "p" || tag === "li" || tag === "td" || tag === "th" || tag === "summary") { const t = el.innerText.trim(); if (t) text.push(t); if (tag !== "summary") return; }
    if (tag === "img" && el.getBoundingClientRect().width > 2) imgs.push(el.getAttribute("alt") ?? null);
    for (const c of el.children) walk(c);
  };
  walk(document.body);
  return { text, imgs };
};

const browser = await chromium.launch();
async function visible(url) {
  const p = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await p.route(/googletagmanager|licdn|linkedin|metricool|events\.framer/, (r) => r.abort());
  const res = await p.goto(url, { waitUntil: "networkidle", timeout: 60000 });
  const o = await p.evaluate(outlineFn);
  const html = await p.content();
  await p.close();
  return { status: res.status(), ...o, html };
}

const results = [];
for (const path of paths) {
  const r = { path, issues: [] };
  const liveRaw = FRESH ? await (await fetch(LIVE + encodeURI(path))).text() : fs.readFileSync(`capture/html/raw/${slug(path)}.html`, "utf8");
  const resp = await fetch(BASE + encodeURI(path), { redirect: "manual" });
  r.status = resp.status;
  if (resp.status !== 200) { r.issues.push(`status ${resp.status}`); results.push(r); continue; }
  const localRaw = await resp.text();
  // head
  const L = headOf(liveRaw), M = headOf(localRaw);
  if (L.title !== M.title) r.issues.push(`title: live "${L.title}" vs local "${M.title}"`);
  if (L.canonical !== M.canonical) r.issues.push(`canonical: ${L.canonical} vs ${M.canonical}`);
  for (const k of new Set([...Object.keys(L.meta), ...Object.keys(M.meta)])) {
    const a = normUrl(L.meta[k]), b = normUrl(M.meta[k]);
    if (a !== b) r.issues.push(`meta ${k}: "${a}" vs "${b}"`);
  }
  // headings (approved change: extra H1s demoted)
  const HL = headings(liveRaw), HM = headings(localRaw);
  r.h1 = { live: HL.h1, local: HM.h1 };
  if (HM.h1.length !== 1) r.issues.push(`local has ${HM.h1.length} H1`);
  if (HL.h1[0] !== HM.h1[0]) r.issues.push(`H1: "${HL.h1[0]}" vs "${HM.h1[0]}"`);
  const demoted = new Set(HL.h1.slice(1));
  for (const lvl of ["h2", "h3"]) {
    const live = HL[lvl], local = HM[lvl].filter((x) => !(lvl === "h2" && demoted.has(x)));
    const miss = live.filter((x) => !local.includes(x)), extra = local.filter((x) => !live.includes(x));
    if (miss.length || extra.length) r.issues.push(`${lvl.toUpperCase()} list differs: missing ${JSON.stringify(miss.slice(0, 5))} extra ${JSON.stringify(extra.slice(0, 5))}`);
    else if (live.join("|") !== local.join("|")) r.issues.push(`${lvl.toUpperCase()} order differs`);
  }
  // JSON-LD
  const JL = jsonld(liveRaw), JM = jsonld(localRaw);
  // the live site adds BlogPosting with JavaScript on /blog/* (not in raw HTML); local renders it statically
  const JMc = path.startsWith("/blog/") ? JM.filter((j) => !j.includes('"BlogPosting"')) : JM;
  if (JL.join() !== JMc.join()) r.issues.push(`JSON-LD differs (live ${JL.length}, local ${JMc.length})`);
  // links
  const IL = internalLinks(liveRaw, LIVE + encodeURI(path)), IM = internalLinks(localRaw, BASE + encodeURI(path));
  const lm = IL.filter((x) => !IM.includes(x)), le = IM.filter((x) => !IL.includes(x));
  if (lm.length || le.length) r.issues.push(`internal links: missing ${JSON.stringify(lm.slice(0, 8))} extra ${JSON.stringify(le.slice(0, 8))}`);
  // visible text + images at 1440
  const liveOutline = JSON.parse(fs.readFileSync(`capture/outline/${slug(path)}@1440.json`, "utf8"));
  const liveText = uniq(liveOutline.filter((x) => /^(h[1-6]|p|li)$/.test(x.t) && x.text).map((x) => normText(x.text)));
  const liveImgs = liveOutline.filter((x) => x.t === "img" && x.box?.w > 2).map((x) => x.alt);
  const V = await visible(BASE + encodeURI(path));
  const localText = uniq(V.text.map(normText));
  const tm = liveText.filter((x) => !localText.includes(x)), te = localText.filter((x) => !liveText.includes(x));
  r.text = { missing: tm, extra: te };
  if (tm.length || te.length) r.issues.push(`visible text: ${tm.length} live blocks missing locally, ${te.length} extra`);
  const altSort = (a) => a.map((x) => x ?? "(no alt)").sort();
  r.images = { live: liveImgs.length, local: V.imgs.length };
  if (liveImgs.length !== V.imgs.length) r.issues.push(`images at 1440: live ${liveImgs.length} vs local ${V.imgs.length}`);
  const la = altSort(liveImgs), ma = altSort(V.imgs);
  const altMiss = la.filter((x) => !ma.includes(x));
  if (altMiss.length) r.issues.push(`alt texts missing locally: ${JSON.stringify(uniq(altMiss).slice(0, 5))}`);
  results.push(r);
  console.log(path, r.issues.length ? r.issues.length + " issues" : "OK");
}
await browser.close();
fs.writeFileSync(ONLY ? "capture/parity-partial.json" : "capture/parity.json", JSON.stringify(results, null, 1));
if (!ONLY) {
  const ok = results.filter((r) => !r.issues.length).length;
  const md = [
    "# Parity report", "",
    `Generated ${new Date().toISOString()} comparing ${LIVE} with ${BASE}.`, "",
    `**${ok} of ${results.length} URLs match on every check.**`, "",
    "Checks: status, title, meta description, canonical, robots, OG/Twitter tags, H1, H2/H3 lists, JSON-LD, internal links, visible text at 1440px, image count and alt text.",
    "Approved differences that are not counted as issues: extra H1s demoted to H2/p (see notes/heading-changes.md); asset URLs moved from framerusercontent.com to /assets; BlogPosting JSON-LD rendered in HTML instead of injected by JavaScript.", "",
    ...results.filter((r) => r.issues.length).flatMap((r) => [`## ${r.path}`, "", ...r.issues.map((i) => `- ${i}`), ""]),
  ];
  fs.writeFileSync("notes/parity-report.md", md.join("\n") + "\n");
}
