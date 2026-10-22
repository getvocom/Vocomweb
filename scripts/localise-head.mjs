// Rewrites framerusercontent.com URLs in src/data/head/*.json (og:image, favicons,
// JSON-LD logos) to the self-hosted copies listed in data/asset-map.csv.
// Usage: node scripts/localise-head.mjs
import fs from "node:fs";
import path from "node:path";
import { loadAssets } from "./framer/assets-map.mjs";

const assets = loadAssets();
let n = 0, missing = new Set();
for (const f of fs.readdirSync("src/data/head")) {
  const p = path.join("src/data/head", f);
  const s = fs.readFileSync(p, "utf8").replace(/https:\/\/framerusercontent\.com\/[^"\\\s)]+/g, (u) => {
    const a = assets.get(u.split("?")[0]);
    if (!a) { missing.add(u); return u; }
    n++;
    return "https://www.vocom.ai" + a.path;
  });
  fs.writeFileSync(p, s);
}
console.log("rewrote", n, "urls; missing", [...missing]);
