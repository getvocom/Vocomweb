// Post-build: gives every local <img> that has no width/height its file's real dimensions,
// so the browser reserves the space before the image loads. Without this, CMS images
// (blog cards, post galleries, product photos) start 0px tall and the page jumps as they load.
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const cache = new Map();
async function dims(src) {
  if (!cache.has(src)) {
    const file = path.join("dist", decodeURI(src.split("?")[0]));
    cache.set(src, fs.existsSync(file) ? sharp(file).metadata().then((m) => (m.width && m.height ? m : null)).catch(() => null) : Promise.resolve(null));
  }
  return cache.get(src);
}
function* htmlFiles(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) yield* htmlFiles(p);
    else if (e.name.endsWith(".html")) yield p;
  }
}
let fixed = 0;
for (const file of htmlFiles("dist")) {
  const html = fs.readFileSync(file, "utf8");
  const tags = [...html.matchAll(/<img\b[^>]*>/g)].map((m) => m[0]).filter((t) => !/\swidth=/.test(t) && /\ssrc="\/[^"]+"/.test(t));
  if (!tags.length) continue;
  let out = html;
  for (const t of new Set(tags)) {
    const m = await dims(t.match(/\ssrc="([^"]+)"/)[1]);
    if (!m) continue;
    out = out.split(t).join(t.replace(/^<img\b/, `<img width="${m.width}" height="${m.height}"`));
    fixed++;
  }
  if (out !== html) fs.writeFileSync(file, out);
}
console.log(`img-dims: added width/height to ${fixed} image tags`);
