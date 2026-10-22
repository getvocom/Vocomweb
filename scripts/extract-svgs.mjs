// Extracts icon and vector SVG markup from the live site so the rebuild uses the exact
// same artwork. Framer icons are drawn from a hidden <svg id> template via <use href>;
// we align the design tree's visible IconNodes (in order) with the DOM's visible
// <svg><use> elements, then read the referenced template.
// Writes src/data/icons.json ("<set>:<name>" -> svg) and src/data/svgs.json (node key -> svg).
// Usage: node scripts/extract-svgs.mjs [--only /path]
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";
import { resolvePage } from "./framer/resolve.mjs";
import { OPAQUE } from "./framer/registry.mjs";

const args = process.argv.slice(2);
const ONLY = args.includes("--only") ? args[args.indexOf("--only") + 1] : null;
const pages = fs.readdirSync("capture/framer/pages").map((f) => JSON.parse(fs.readFileSync(path.join("capture/framer/pages", f), "utf8")));
const WIDTH = { Desktop: 1440, "Desktop Wireframe": 1440, Tablet: 1000, Phone: 390 };
const SAMPLE = { "/blog/:slug": "/blog/distributor-fiber-optic-cable-line", "/products/:slug": "/products/central-tube" };
const VECTOR = new Set(["SVGNode", "ShapeContainerNode"]);

function ordered(tree) {
  const icons = [], vectors = [];
  const walk = (n) => {
    if (n.attrs?.visible === false) return;
    if (n.type === "Code") return;
    if (n.type === "IconNode") { icons.push(n); return; }
    if (VECTOR.has(n.type)) { vectors.push(n); return; }
    (n.children || []).forEach(walk);
  };
  walk(tree);
  return { icons, vectors };
}

const normalise = (svg) => svg
  .replace(/\s(id|class|data-framer-name|role|display)="[^"]*"/g, "")
  .replace(/stroke="var\(--[\w-]+,\s*([^)]*\)?)\)"/g, (m, fb) => `stroke="var(--icon-color, ${fb})"`)
  .replace(/fill="var\(--[\w-]+,\s*([^)]*\)?)\)"/g, (m, fb) => `fill="var(--icon-color, ${fb})"`)
  .replace(/stroke-width="var\(--[\w-]+,\s*([\d.]+)\)"/g, 'stroke-width="var(--icon-stroke, $1)"')
  .replace(/fill-opacity="var\(--[\w-]+,\s*([\d.]+)\)"/g, 'fill-opacity="var(--icon-alpha, $1)"')
  .replace(/\s(width|height)="[\d.]+px"/g, "");

const icons = fs.existsSync("src/data/icons.json") ? JSON.parse(fs.readFileSync("src/data/icons.json", "utf8")) : {};
const svgs = fs.existsSync("src/data/svgs.json") ? JSON.parse(fs.readFileSync("src/data/svgs.json", "utf8")) : {};
const conflicts = [];
const votes = {}; // "<set>:<name>" -> {svg: score}
const browser = await chromium.launch();

for (const p of pages) {
  const route = p.attributes.path;
  if (ONLY && route !== ONLY) continue;
  const r = resolvePage(p, { opaque: OPAQUE });
  for (const bp of r.bps) {
    const { icons: inodes, vectors } = ordered(bp.tree);
    if (!inodes.length && !vectors.length) continue;
    const page = await browser.newPage({ viewport: { width: WIDTH[bp.name] || 1440, height: 900 } });
    await page.goto("https://www.vocom.ai" + encodeURI(SAMPLE[route] || route), { waitUntil: "networkidle", timeout: 60000 });
    const dom = await page.evaluate(() => {
      const vis = (el) => { for (let e = el; e && e !== document.body; e = e.parentElement) { const s = getComputedStyle(e); if (s.display === "none" || s.visibility === "hidden") return false; } return true; };
      // skip header/footer component instances (rebuilt by hand)
      const inChrome = (el) => !!el.closest("header, footer, nav, [data-framer-name='Navigation Bar 2'], [data-framer-name='Simple Footer 2']");
      const uses = [...document.querySelectorAll("svg > use")].map((u) => u.parentElement).filter((s) => vis(s) && !inChrome(s));
      const tpl = (id) => document.getElementById(id)?.outerHTML || null;
      return {
        icons: uses.map((s) => ({ id: s.querySelector("use").getAttribute("href").slice(1), name: s.getAttribute("data-framer-name"), svg: tpl(s.querySelector("use").getAttribute("href").slice(1)) })),
        named: [...document.querySelectorAll("[data-framer-name]")].filter((e) => vis(e) && !inChrome(e)).map((e) => ({ name: e.getAttribute("data-framer-name"), svg: (e.tagName === "svg" ? e : e.querySelector("svg"))?.outerHTML || null })),
      };
    });
    await page.close();
    if (dom.icons.length !== inodes.length) console.log(`${route} ${bp.name}: tree icons ${inodes.length} vs dom ${dom.icons.length}`);
    // LCS alignment on layer names (DOM svgs carry data-framer-name = layer name)
    const A = inodes.map((x) => x.name || ""), B = dom.icons.map((x) => x.name || "");
    const L = Array.from({ length: A.length + 1 }, () => new Array(B.length + 1).fill(0));
    for (let i = A.length - 1; i >= 0; i--) for (let j = B.length - 1; j >= 0; j--) L[i][j] = A[i] === B[j] ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
    const pairs = [];
    for (let i = 0, j = 0; i < A.length && j < B.length;) { if (A[i] === B[j]) { pairs.push([i, j]); i++; j++; } else if (L[i + 1][j] >= L[i][j + 1]) i++; else j++; }
    for (const [i, j] of pairs) {
      const k = `${inodes[i].icon.set}:${inodes[i].icon.name}`;
      const svg = dom.icons[j].svg && normalise(dom.icons[j].svg);
      if (!svg) continue;
      ((votes[k] ||= {})[svg] ||= 0);
      votes[k][svg] += A[i] && A[i] === B[j] ? 3 : 1; // named matches count more
    }
    // vectors: match by name, in order of appearance
    const byName = {};
    for (const e of dom.named) if (e.svg) (byName[e.name] ||= []).push(e.svg);
    const seen = {};
    for (const v of vectors) {
      const list = byName[v.name] || [];
      const i = (seen[v.name] = (seen[v.name] ?? -1) + 1);
      if (list[i] && !svgs[v.key]) svgs[v.key] = normalise(list[i]);
    }
  }
  console.log("done", route);
}
await browser.close();
// Pick each icon's artwork: for Phosphor icons, the candidate that looks most like the
// official Phosphor glyph of that name; otherwise the highest-voted candidate.
const sharp = (await import("sharp")).default;
const raster = async (svg) => {
  const s = svg.replace(/var\(--icon-color, [^)]*\)\)?/g, "#000").replace(/var\(--icon-stroke, ([\d.]+)\)/g, "$1").replace(/var\(--icon-alpha, ([\d.]+)\)/g, "$1");
  const withNs = s.includes("xmlns") ? s : s.replace("<svg", '<svg xmlns="http://www.w3.org/2000/svg"');
  return sharp(Buffer.from(withNs)).resize(48, 48).flatten({ background: "#fff" }).greyscale().raw().toBuffer();
};
const PH = "node_modules/@phosphor-icons/core/assets/regular/";
const allSvgs = [...new Set(Object.values(votes).flatMap((v) => Object.keys(v)))];
const rasters = new Map();
for (const svg of allSvgs) { try { rasters.set(svg, await raster(svg)); } catch {} }
for (const [k, v] of Object.entries(votes)) {
  const ranked = Object.entries(v).sort((a, b) => b[1] - a[1]);
  let pick = ranked[0][0];
  const file = PH + k.split(":")[1].toLowerCase().replace(/\s+/g, "-") + ".svg";
  if (k.startsWith("omX0gWFPqDwhaiWwf6ab:") && fs.existsSync(file)) {
    const ref = await sharp(fs.readFileSync(file)).resize(48, 48).flatten({ background: "#fff" }).greyscale().raw().toBuffer();
    let best = Infinity;
    for (const svg of rasters.keys()) {
      try {
        const r = rasters.get(svg);
        let d = 0; for (let i = 0; i < r.length; i++) d += Math.abs(r[i] - ref[i]);
        if (d < best) { best = d; pick = svg; }
      } catch {}
    }
    conflicts.push({ k, scores: ranked.map((r) => r[1]), resolvedBy: "phosphor-similarity" });
  } else if (ranked.length > 1) conflicts.push({ k, scores: ranked.map((r) => r[1]) });
  icons[k] = pick;
}
// Pinned from the live DOM (scripts notes: the "Logos"/"Logo" set icons render as empty
// elements on the live site; Wifi High read from the homepage card directly).
const pinned = fs.existsSync("capture/icon-overrides.json") ? JSON.parse(fs.readFileSync("capture/icon-overrides.json", "utf8")) : {};
for (const [k, v] of Object.entries(pinned)) icons[k] = v.length ? normalise(v[0]) : "";
fs.writeFileSync("capture/icon-votes.json", JSON.stringify(votes, null, 1));
const owners = {};
for (const [k, svg] of Object.entries(icons)) (owners[svg] ||= []).push(k);
for (const ks of Object.values(owners)) if (ks.length > 1) console.log("same svg for", ks.join(" / "));
fs.writeFileSync("src/data/icons.json", JSON.stringify(icons, null, 1));
fs.writeFileSync("src/data/svgs.json", JSON.stringify(svgs, null, 1));
console.log(Object.keys(icons).length, "icons,", Object.keys(svgs).length, "vectors,", conflicts.length, "conflicts");
if (conflicts.length) console.log(JSON.stringify(conflicts.slice(0, 20)));
