// Framer omits default grid row settings from its API data for some grids. This reads the
// computed row sizing of those grids from the live site and writes capture/grid-rows.json
// (node id -> {Desktop, Tablet, Phone: {autoRows, templateRows}}), used by css.mjs.
// Usage: node scripts/grid-rows.mjs
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const targets = [];
for (const f of fs.readdirSync("capture/framer/pages")) {
  const d = JSON.parse(fs.readFileSync(path.join("capture/framer/pages", f), "utf8"));
  const route = d.attributes.path.replace(":Posts", "distributor-fiber-optic-cable-line").replace(":Products", "central-tube").replace(":slug", "x");
  const prim = d.children.find((c) => c.$isPrimary);
  const walk = (n, idx) => {
    const a = n.attributes || {};
    if (a.layout === "grid" && !("gridRowHeightType" in a)) targets.push({ route, id: n.id, name: n.name || null, collection: !!a.collectionList, cols: a.gridColumnCount, gap: a.gap });
    (n.children || []).forEach((c) => walk(c));
  };
  walk(prim);
}
const out = {};
const b = await chromium.launch();
for (const [bp, w] of [["Desktop", 1440], ["Tablet", 1000], ["Phone", 390]]) {
  for (const route of [...new Set(targets.map((t) => t.route))]) {
    const p = await b.newPage({ viewport: { width: w, height: 900 } });
    await p.goto("https://www.vocom.ai" + encodeURI(route), { waitUntil: "networkidle" });
    for (const t of targets.filter((x) => x.route === route)) {
      const r = await p.evaluate(({ name, collection }) => {
        const vis = (e) => { for (let x = e; x; x = x.parentElement) if (getComputedStyle(x).display === "none") return false; return true; };
        let els = [...document.querySelectorAll(name ? `[data-framer-name="${name}"]` : "div")].filter((e) => getComputedStyle(e).display === "grid" && vis(e));
        if (!name && collection) els = els.filter((e) => e.querySelector("a[href*='blog/'], a[href*='products/']"));
        const e = els[0];
        if (!e) return null;
        const s = getComputedStyle(e);
        return { autoRows: s.gridAutoRows, templateRows: s.gridTemplateRows.split(" ").length > 1 ? "auto" : s.gridTemplateRows };
      }, t);
      (out[t.id] ||= { route, name: t.name })[bp] = r;
    }
    await p.close();
  }
}
await b.close();
fs.writeFileSync("capture/grid-rows.json", JSON.stringify(out, null, 1));
console.log(JSON.stringify(out, null, 1).slice(0, 3000));
