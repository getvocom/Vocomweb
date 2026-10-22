// Icon and vector SVG lookup.
//  - src/data/icons.json: "<set>:<name>" -> svg, extracted from the live DOM (scripts/extract-svgs.mjs)
//  - capture/vectors-framer.json: Framer node id -> svg, exported with framer.exportSVG()
import fs from "node:fs";
import { color } from "./css.mjs";

const load = (f) => (fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, "utf8")) : {});
const icons = load("src/data/icons.json");
const vectors = load("capture/vectors-framer.json");

function prepVector(svg) {
  // scale to the layer box, resolve Framer colour tokens
  const w = svg.match(/<svg[^>]*\swidth="([\d.]+)"/)?.[1], h = svg.match(/<svg[^>]*\sheight="([\d.]+)"/)?.[1];
  let s = svg.replace(/var\(--token-[0-9a-f-]{36}(?:,\s*(?:[^()]|\([^()]*\))*)?\)/g, (m) => color(m));
  if (w && h && !/viewBox=/.test(s)) s = s.replace("<svg", `<svg viewBox="0 0 ${w} ${h}"`);
  return s.replace(/(<svg[^>]*?)\swidth="[\d.]+"/, "$1").replace(/(<svg[^>]*?)\sheight="[\d.]+"/, "$1")
    .replace("<svg", '<svg width="100%" height="100%" preserveAspectRatio="none" aria-hidden="true"');
}

export const iconLib = {
  get(n) {
    const v = icons[`${n.icon?.set}:${n.icon?.name}`];
    return v === undefined ? null : v;
  },
  svgFor(n) {
    const v = vectors[n.id];
    return v ? prepVector(v) : null;
  },
};
