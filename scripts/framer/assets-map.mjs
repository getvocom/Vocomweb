// Loads data/asset-map.csv (written by scripts/assets.mjs) into a Map keyed by original URL.
import fs from "node:fs";

export function loadAssets() {
  const m = new Map();
  if (!fs.existsSync("data/asset-map.csv")) return m;
  const [head, ...rows] = fs.readFileSync("data/asset-map.csv", "utf8").trim().split("\n");
  const cols = head.split(",");
  for (const r of rows) {
    const v = r.split(",");
    const o = Object.fromEntries(cols.map((c, i) => [c, v[i]]));
    m.set(o.original_url, {
      path: o.local_path, w: Number(o.width) || 0, h: Number(o.height) || 0,
      variants: o.variants ? o.variants.split(" ").filter(Boolean).map((x) => { const [p, w] = x.split("@"); return { path: p, w: Number(w) }; }) : [],
    });
  }
  return m;
}
