// Dev helper: node scripts/crop.mjs <png> <outdir> [sliceHeight] -> writes vertical slices for inspection
import sharp from "sharp"; import path from "node:path";
const [src, out, hArg] = process.argv.slice(2); const H = Number(hArg || 1100);
const m = await sharp(src).metadata(); const base = path.basename(src, ".png");
for (let y = 0, i = 0; y < m.height; y += H, i++)
  await sharp(src).extract({ left: 0, top: y, width: m.width, height: Math.min(H, m.height - y) }).toFile(path.join(out, `${base}-${String(i).padStart(2, "0")}.png`));
console.log(Math.ceil(m.height / H), "slices");
