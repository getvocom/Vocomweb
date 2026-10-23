// Builds the web versions of the Vocom product and hero renders from the 4K originals.
// Usage: node scripts/render-images.mjs "<folder with index.csv from Vocom-Renders-4K.zip>"
//   Product renders (listed in data/product-renders.csv or data/page-renders.csv) -> public/assets/img/products/
//     <name>-480|800|1200.webp and .jpg   (shown up to 560px wide, so 1200px covers 2x screens)
//   Hero renders (VC-104 to VC-110) -> public/assets/img/hero/<name>-1280|1920|2560.webp and .jpg
// <name> is the render's descriptive file name without its VC code, e.g. figure-8-aerial-drop-cable.
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const SRC = process.argv[2];
if (!SRC || !fs.existsSync(path.join(SRC, "index.csv"))) throw new Error("pass the folder that holds index.csv");
const parseCsv = (t) => t.trim().split("\n").map((l) => [...l.matchAll(/("([^"]*)"|[^,]*)(,|$)/g)].map((m) => m[2] ?? m[1]).slice(0, -1));
const index = parseCsv(fs.readFileSync(path.join(SRC, "index.csv"), "utf8")).slice(1).map(([id, product, category, file]) => ({ id, product, file }));
const used = new Set(["data/product-renders.csv", "data/page-renders.csv"].flatMap((f) => parseCsv(fs.readFileSync(f, "utf8")).slice(1).map((r) => r[1])).filter((id) => !/^VC-1(0[4-9]|10)$/.test(id)));
const nameOf = (file) => path.basename(file, path.extname(file)).replace(/^(VC|NEW)-\d+_/, "").replace(/^hero-/, "");

async function variants(src, outDir, name, widths) {
  fs.mkdirSync(outDir, { recursive: true });
  let bytes = 0;
  for (const w of widths) {
    const img = sharp(src).resize({ width: w, withoutEnlargement: true });
    bytes += (await img.clone().webp({ quality: 82 }).toFile(path.join(outDir, `${name}-${w}.webp`))).size;
    bytes += (await img.clone().jpeg({ quality: 84, mozjpeg: true }).toFile(path.join(outDir, `${name}-${w}.jpg`))).size;
  }
  return bytes;
}

const out = { products: {}, hero: {} };
let total = 0;
for (const r of index) {
  const src = path.join(SRC, r.file);
  if (used.has(r.id)) { total += await variants(src, "public/assets/img/products", nameOf(r.file), [480, 800, 1200]); out.products[r.id] = nameOf(r.file); }
  else if (/^VC-1(0[4-9]|10)$/.test(r.id)) { total += await variants(src, "public/assets/img/hero", nameOf(r.file), [1280, 1920, 2560]); out.hero[r.id] = nameOf(r.file); }
}
const meta = {};
for (const [id, name] of Object.entries(out.products)) { const m = await sharp(`public/assets/img/products/${name}-1200.jpg`).metadata(); meta[id] = { name, w: m.width, h: m.height }; }
fs.writeFileSync("data/render-images.json", JSON.stringify({ products: meta, hero: out.hero }, null, 1));
console.log(`${Object.keys(out.products).length} product renders, ${Object.keys(out.hero).length} hero renders, ${Math.round(total / 1024 / 1024 * 10) / 10} MB written`);
