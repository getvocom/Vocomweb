// Downloads every asset in capture/asset-urls.txt to public/assets/ with readable names,
// generates responsive WebP variants for large raster images (never re-cropped),
// and writes data/asset-map.csv (original_url -> local path, size, variants).
// Usage: node scripts/assets.mjs
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import sharp from "sharp";

const OUT = "public/assets";
fs.mkdirSync(OUT, { recursive: true });
const lines = fs.readFileSync("capture/asset-urls.txt", "utf8").trim().split("\n").map((l) => l.split("\t"));
const prev = new Map();
if (fs.existsSync("data/asset-map.csv")) for (const r of fs.readFileSync("data/asset-map.csv", "utf8").trim().split("\n").slice(1)) prev.set(r.split(",")[0], r);

const slug = (s) => s.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").split("-").slice(0, 8).join("-") || "asset";
const used = new Set();
const rows = [];
const WIDTHS = [512, 1024, 2048];

async function get(url) {
  for (let i = 0; i < 3; i++) {
    try {
      const r = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
      if (!r.ok) throw new Error("HTTP " + r.status);
      return Buffer.from(await r.arrayBuffer());
    } catch (e) { if (i === 2) throw e; }
  }
}

async function one([url, hint]) {
  const ext = path.extname(new URL(url).pathname).toLowerCase() || ".bin";
  const h = crypto.createHash("sha1").update(url).digest("hex").slice(0, 6);
  let base = slug(/^(placeholder|live|header)$/i.test(hint || "") ? `${hint}-image` : hint || "asset");
  const kind = /\.(mp4|webm|mov)$/.test(ext) ? "video" : /\.json$/.test(ext) ? "lottie" : "img";
  const sub = kind === "video" ? "video" : kind === "lottie" ? "lottie" : "img";
  let name = `${base}-${h}${ext === ".jpeg" ? ".jpg" : ext}`;
  while (used.has(name)) name = `${base}-${h}x${ext}`;
  used.add(name);
  fs.mkdirSync(path.join(OUT, sub), { recursive: true });
  const dest = path.join(OUT, sub, name);
  const local = `/assets/${sub}/${name}`;
  if (!fs.existsSync(dest)) fs.writeFileSync(dest, await get(url));
  let w = "", hgt = "", variants = [];
  if (kind === "img" && !/\.(svg|gif)$/.test(ext)) {
    const meta = await sharp(dest).metadata();
    w = meta.width; hgt = meta.height;
    for (const vw of WIDTHS) {
      if (vw >= meta.width) continue;
      const vname = name.replace(/\.[^.]+$/, `-${vw}w.webp`);
      const vdest = path.join(OUT, sub, vname);
      if (!fs.existsSync(vdest)) await sharp(dest).resize({ width: vw }).webp({ quality: 90 }).toFile(vdest);
      variants.push(`/assets/${sub}/${vname}@${vw}`);
    }
  } else if (ext === ".svg") {
    const s = fs.readFileSync(dest, "utf8");
    const vb = s.match(/viewBox="[\d.]+ [\d.]+ ([\d.]+) ([\d.]+)"/);
    if (vb) { w = Math.round(+vb[1]); hgt = Math.round(+vb[2]); }
  }
  rows.push([url, local, kind, w, hgt, variants.join(" "), (hint || "").replace(/[,\n]/g, " ")]);
}

const q = [...lines];
await Promise.all(Array.from({ length: 8 }, async () => { while (q.length) { const l = q.shift(); try { await one(l); } catch (e) { console.error("FAIL", l[0], e.message); } } }));
rows.sort((a, b) => a[1].localeCompare(b[1]));
fs.writeFileSync("data/asset-map.csv", "original_url,local_path,kind,width,height,variants,source_hint\n" + rows.map((r) => r.join(",")).join("\n") + "\n");
console.log(rows.length, "assets");
