// Maps resolved Framer attributes to CSS declarations (as ordered [prop, value] maps).
import fs from "node:fs";

const styles = JSON.parse(fs.readFileSync("capture/framer/styles.json", "utf8"));

// ---------- colour tokens ----------
const slug = (s) => s.toLowerCase().replace(/&/g, "and").replace(/%/g, "pct").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
export const tokenNames = {}; // uuid -> css var name
const usedNames = new Set();
for (const c of styles.colorStyles) {
  let n = "color-" + slug(c.name);
  if (usedNames.has(n)) n += "-" + c.id.slice(0, 4);
  usedNames.add(n);
  tokenNames[c.id] = { name: n, value: c.light };
}

// Brand palette: raw values used repeatedly in the design are mapped to tokens.
export const BRAND = {
  "#7a1230ff": "brand-red", "#7a122aff": "brand-red-alt", "#7f173fff": "brand-crimson", "#64142aff": "color-vocom-cta-1",
  "#f1dce5ff": "brand-pink-border", "#fff6faff": "brand-pink-50", "#fcebf3ff": "color-vocom-white", "#f6c2daff": "color-vocom-cta-2",
  "#171017ff": "ink-900", "#2b2228ff": "ink-800", "#554650ff": "ink-600", "#101828ff": "ink-heading", "#667085ff": "gray-500", "#475467ff": "gray-600",
  "#ffffffff": "white", "#000000ff": "black",
};
const hex2 = (n) => Math.round(Math.max(0, Math.min(255, n))).toString(16).padStart(2, "0");
export function canon(c) {
  c = c.trim().toLowerCase();
  if (c === "white") return "#ffffffff";
  if (c === "black") return "#000000ff";
  let m = c.match(/^#([0-9a-f]{3,8})$/);
  if (m) {
    let h = m[1];
    if (h.length === 3 || h.length === 4) h = [...h].map((x) => x + x).join("");
    if (h.length === 6) h += "ff";
    return "#" + h;
  }
  m = c.match(/^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+)\s*)?\)$/);
  if (m) return "#" + hex2(+m[1]) + hex2(+m[2]) + hex2(+m[3]) + hex2((m[4] === undefined ? 1 : +m[4]) * 255);
  return null;
}
export const BRAND_GRADIENT = "linear-gradient(135deg, #7F173F 0%, #DD2E7E 100%)";
function tokenise(s) {
  if (s === BRAND_GRADIENT) return "var(--brand-gradient)";
  const k = canon(s);
  if (k) return BRAND[k] ? `var(--${BRAND[k]})` : s;
  // composite values (borders, shadows): tokenise each colour literal
  return s.replace(/#[0-9a-fA-F]{3,8}\b|rgba?\([^)]*\)/g, (c) => { const kk = canon(c); return kk && BRAND[kk] ? `var(--${BRAND[kk]})` : c; });
}

export function color(v) {
  if (v === undefined || v === null) return v;
  let s = String(v).replace(/\s*\/\*.*?\*\//g, "").trim();
  // var(--token-uuid, fallback) or var(--token-uuid)
  s = s.replace(/var\(--token-([0-9a-f-]{36})(?:,\s*((?:[^()]|\([^()]*\))*))?\)/g, (_, id, fb) => {
    const t = tokenNames[id];
    if (t) return `var(--${t.name})`;
    return fb ? fb.trim() : "transparent";
  });
  return tokenise(s);
}

// ---------- text style presets ----------
export const presets = {};
for (const t of styles.textStyles) presets[t.path.replace(/^\//, "")] = t;

// ---------- helpers ----------
const px = (v) => (typeof v === "number" ? `${v}px` : v);
const isNull = (v) => v === undefined || v === null || v === "null";
const fr = (v) => typeof v === "string" && /^\d*\.?\d+fr$/.test(v);
const DIST = { start: "flex-start", center: "center", end: "flex-end", "space-between": "space-between", "space-around": "space-around", "space-evenly": "space-evenly" };
const ALIGN = { start: "flex-start", center: "center", end: "flex-end" };

export function fontStack(name) {
  if (!name) return null;
  if (name === "Inter") return '"Inter", "Inter Placeholder", sans-serif';
  if (name === "Inter Display") return '"Inter Display", "Inter Display Placeholder", sans-serif';
  if (name === "Inter Variable") return '"Inter Variable", "Inter", sans-serif';
  return `"${name}", sans-serif`;
}

// Size of a node along one axis given its parent's layout.
function sizeDecl(d, axis, val, parent, a) {
  const prop = axis === "x" ? "width" : "height";
  if (isNull(val)) return;
  const pl = parent?.layout;
  const pdir = parent?.stackDirection === "horizontal" ? "x" : "y";
  // Framer grid items fill their cell unless "fill cell" is switched off
  // Framer grid items fill the cell's width by default; height fills only when switched on
  if (pl === "grid" && a.position !== "absolute") {
    if (axis === "x" && a.gridItemFillCellWidth !== false) { d.width = "100%"; return; }
    if (axis === "y" && a.gridItemFillCellHeight === true) { d.height = "100%"; return; }
  }
  if (fr(val)) {
    const n = parseFloat(val);
    if (a.position === "absolute") { d[prop] = "100%"; return; }
    if (pl === "stack") {
      if (pdir === axis) { d.flex = `${n} 0 0px`; d[prop] = "1px"; }
      // cross axis: Framer uses width:100% in columns (robust with wrapping) and stretch in rows
      else if (axis === "x") d.width = "100%";
      else { d["align-self"] = "stretch"; d[prop] = "auto"; }
      return;
    }
    if (pl === "grid") { d[prop] = "100%"; d[axis === "x" ? "justify-self" : "align-self"] = "start"; return; }
    d[prop] = "100%";
    return;
  }
  if (val === "auto") { d[prop] = axis === "y" ? "min-content" : "min-content"; if (a._text) d[prop] = "auto"; return; }
  if (val === "fit-content" || val === "min-content") { d[prop] = val; return; }
  if (val === "fit-image") { d[prop] = "auto"; d._fitImage = true; return; } // emitter adds aspect-ratio
  d[prop] = px(val); // px, %, vh, vw
}

// Absolutely positioned pins.
function pins(d, a) {
  const L = !isNull(a.left), R = !isNull(a.right), T = !isNull(a.top), B = !isNull(a.bottom);
  const tx = [];
  if (L) d.left = px(a.left);
  if (R) d.right = px(a.right);
  if (!L && !R && !isNull(a.centerAnchorX)) { d.left = a.centerAnchorX; tx.push("-50%"); } else tx.push("0");
  if (T) d.top = px(a.top);
  if (B) d.bottom = px(a.bottom);
  if (!T && !B && !isNull(a.centerAnchorY)) { d.top = a.centerAnchorY; tx.push("-50%"); } else tx.push("0");
  if (tx[0] !== "0" || tx[1] !== "0") d._translate = `translate(${tx[0]}, ${tx[1]})`;
}

export function frameCSS(a, parent, opts = {}) {
  const d = {};
  if (a.visible === false) d.display = "none";
  // layout
  if (a.layout === "stack") {
    if (d.display !== "none") d.display = "flex";
    d["flex-direction"] = a.stackDirection === "horizontal" ? "row" : "column";
    if (a.stackWrapEnabled) d["flex-wrap"] = "wrap";
    d["justify-content"] = DIST[a.stackDistribution] || "flex-start";
    d["align-items"] = ALIGN[a.stackAlignment] || "center";
    if (a.stackWrapEnabled) d["align-content"] = ALIGN[a.stackAlignment] || "center";
    if (!isNull(a.gap) && a.gap !== "0px") d.gap = px(a.gap);
  } else if (a.layout === "grid") {
    if (d.display !== "none") d.display = "grid";
    const n = a.gridColumnCount;
    const min = a.gridColumnMinWidth || "1px";
    d["grid-template-columns"] = n === "auto-fill" || n === undefined ? `repeat(auto-fill, minmax(${px(min)}, 1fr))` : `repeat(${n}, minmax(${n === 1 ? "1px" : "1px"}, 1fr))`;
    const rt = a.gridRowHeightType;
    const rows = a.gridRowCount;
    if (rt === "fixed") d["grid-auto-rows"] = px(a.gridRowHeight);
    else if (rt === "fit") d["grid-auto-rows"] = "min-content";
    else d["grid-auto-rows"] = "minmax(0, 1fr)";
    if (rows && rows !== "auto" && rt !== "fit") d["grid-template-rows"] = `repeat(${rows}, ${rt === "fixed" ? px(a.gridRowHeight) : "minmax(0, 1fr)"})`;
    if (!isNull(a.gap) && a.gap !== "0px") d.gap = px(a.gap);
    if (a.gridAlignment) { d["justify-items"] = a.gridAlignment === "center" ? "center" : a.gridAlignment === "end" ? "end" : "start"; d["align-items"] = "start"; }
    if (a.gridMasonry) { d["grid-template-rows"] = "masonry"; d["grid-auto-rows"] = "auto"; d["align-items"] = "start"; }
  } else if (!opts.text) {
    if (d.display !== "none" && opts.block) d.display = "block";
  }
  // position
  const pos = a.position || "relative";
  if (!opts.root) d.position = pos;
  if (pos === "absolute" || pos === "fixed") pins(d, a);
  if (pos === "sticky") { d.top = px(a.positionStickyTop ?? 0); }
  if (parent?.layout === "stack" || parent?.layout === "grid") { if (pos !== "absolute" && pos !== "fixed") d.flex = d.flex || "none"; }
  // size
  sizeDecl(d, "x", a.width, parent, a);
  sizeDecl(d, "y", a.height, parent, a);
  for (const [k, p] of [["maxWidth", "max-width"], ["minWidth", "min-width"], ["maxHeight", "max-height"], ["minHeight", "min-height"]]) if (!isNull(a[k])) d[p] = px(a[k]);
  if (!isNull(a.aspectRatio)) {
    d["aspect-ratio"] = String(a.aspectRatio);
    // Framer's px height is only a fallback for browsers without aspect-ratio; the ratio drives it
    if (/px$/.test(String(a.height)) && a.width !== "auto") { d.height = "auto"; if (d.flex && parent?.stackDirection !== "horizontal") d.flex = "none"; }
  }
  // grid item
  if (a.gridItemColumnSpan && a.gridItemColumnSpan !== 1) d["grid-column"] = a.gridItemColumnSpan === "all" ? "1 / -1" : `span ${a.gridItemColumnSpan}`;
  if (a.gridItemRowSpan && a.gridItemRowSpan !== 1) d["grid-row"] = `span ${a.gridItemRowSpan}`;
  if (a.gridItemHorizontalAlignment) d["justify-self"] = { start: "start", center: "center", end: "end" }[a.gridItemHorizontalAlignment];
  if (a.gridItemVerticalAlignment) d["align-self"] = { start: "start", center: "center", end: "end" }[a.gridItemVerticalAlignment];
  // box
  if (!isNull(a.padding) && a.padding !== "0px") d.padding = a.padding;
  if (!isNull(a.radius) && a.radius !== "0px") d["border-radius"] = px(a.radius);
  if (!isNull(a.fill) && !opts.imageFill) {
    const f = color(a.fill);
    if (typeof f === "string" && f.startsWith("http")) { /* image fill handled by emitter */ }
    else if (typeof f === "string") d.background = f;
  }
  // Framer draws borders as an inset overlay (::after) that never changes layout;
  // global.css renders --bw/--bs/--bc the same way on elements with class "fb".
  if (!isNull(a.border)) {
    const m = String(color(a.border)).match(/^([\d.]+px)\s+(\w+)\s+(.+)$/);
    if (m) { d["--bw"] = m[1]; d["--bs"] = m[2]; d["--bc"] = m[3]; }
    else d.border = color(a.border);
  }
  if (a.borderStyle || a.borderColor || a.borderTop || a.borderRight || a.borderBottom || a.borderLeft) {
    d["--bs"] = a.borderStyle || "solid";
    if (a.borderColor) d["--bc"] = color(a.borderColor);
    d["--bw"] = [a.borderTop, a.borderRight, a.borderBottom, a.borderLeft].map((x) => px(x ?? 0)).join(" ");
  }
  if (Array.isArray(a.boxShadows) && a.boxShadows.length) d["box-shadow"] = a.boxShadows.map(color).join(", ");
  if (a.overflow === "clip") d.overflow = "clip";
  else if (a.overflow === "hidden") d.overflow = "hidden";
  else if (a.overflow === "auto" || a.overflow === "scroll") d.overflow = "auto";
  if (!isNull(a.opacity) && Number(a.opacity) !== 1) d.opacity = String(a.opacity);
  if (!isNull(a.zIndex)) d["z-index"] = String(a.zIndex);
  if (a.cursor && a.cursor !== "auto") d.cursor = a.cursor;
  if (a.userSelect === "none") d["user-select"] = "none";
  if (!isNull(a.backgroundBlur)) d["backdrop-filter"] = `blur(${px(a.backgroundBlur)})`;
  if (!isNull(a.blur)) d.filter = `blur(${px(a.blur)})`;
  if (a.scrollMarginTop) d["scroll-margin-top"] = px(a.scrollMarginTop);
  const tf = [];
  if (d._translate) tf.push(d._translate);
  delete d._translate;
  if (!isNull(a.rotation) && a.rotation !== "0deg") tf.push(`rotate(${a.rotation})`);
  if (tf.length) d.transform = tf.join(" ");
  if (Array.isArray(a.masks) && a.masks.length) {
    const m = a.masks[0];
    d["mask-image"] = `url(${m.mask})`;
    d["mask-size"] = m.maskSize || "cover";
    d["mask-repeat"] = "no-repeat";
    d["mask-position"] = "center";
  }
  return d;
}

// Text styles that live on the RichText container (inherited by blocks/runs).
export function textCSS(a) {
  const d = {};
  let p = a.textStylePreset ? presets[a.textStylePreset] : null;
  const fam = a.fontName || (p && p.font.split("/")[0]);
  const fv = a.fontVariationAxes;
  if (fam) d["font-family"] = fv && fam === "Inter" ? fontStack("Inter Variable") : fontStack(fam);
  const w = a.fontWeight ?? (p && Number(p.font.split("/")[1]));
  if (w !== undefined && !fv) d["font-weight"] = String(w);
  if (fv) {
    d["font-weight"] = String(fv.wght ?? w ?? 400);
    d["font-variation-settings"] = Object.entries(fv).map(([k, v]) => `"${k}" ${v}`).join(", ");
  }
  if (a.fontStyle && a.fontStyle !== "normal") d["font-style"] = a.fontStyle;
  const fs_ = a.fontSize ?? p?.fontSize;
  if (fs_) d["font-size"] = px(fs_);
  const ls = a.letterSpacing ?? p?.letterSpacing;
  if (ls !== undefined) d["letter-spacing"] = ls === "0em" ? "0" : ls;
  const lh = a.lineHeight ?? p?.lineHeight;
  if (lh) d["line-height"] = lh;
  const c = a.textColor ?? p?.color;
  if (c) d.color = color(c);
  const al = a.textAlignment ?? p?.alignment;
  if (al) d["text-align"] = { start: "left", end: "right" }[al] || al;
  const tt = a.textTransform ?? (p?.transform !== "none" ? p?.transform : undefined);
  if (tt && tt !== "none") d["text-transform"] = tt;
  if (a.textDecoration && a.textDecoration !== "none") d["text-decoration"] = a.textDecoration;
  if (a.textWrap === "balance" || p?.balance) d["text-wrap"] = "balance";
  if (a.openTypeFontFeatures) d["font-feature-settings"] = Object.entries(a.openTypeFontFeatures).map(([k, v]) => `"${k}" ${v === "on" ? 1 : 0}`).join(", ");
  if (a.paragraphSpacing ?? p?.paragraphSpacing) d["--para-gap"] = px(a.paragraphSpacing ?? p.paragraphSpacing);
  if (a.textBackgroundColor) {
    d["--text-bg"] = color(a.textBackgroundColor);
    d["--text-bg-radius"] = px(a.textBackgroundRadius || 0);
    d["--text-bg-pad"] = a.textBackgroundPadding || "0";
  }
  return d;
}

export function runCSS(r) {
  const d = {};
  if (r.fontName) d["font-family"] = fontStack(r.fontName);
  if (r.fontWeight) d["font-weight"] = String(r.fontWeight);
  if (r.bold && !r.fontWeight) d["font-weight"] = "700";
  if (r.fontStyle && r.fontStyle !== "normal") d["font-style"] = r.fontStyle;
  if (r.textColor) d.color = color(r.textColor);
  return d;
}

// Framer hover/tap effect objects -> declarations
export function effectCSS(e) {
  if (!e) return null;
  const tf = [];
  if (e.x && e.x !== "0px" || e.y && e.y !== "0px") tf.push(`translate(${e.x || 0}, ${e.y || 0})`);
  if (e.scale !== undefined && e.scale !== 1) tf.push(`scale(${e.scale})`);
  if (e.rotate && e.rotate !== "0deg" && e.rotate !== 0) tf.push(`rotate(${typeof e.rotate === "number" ? e.rotate + "deg" : e.rotate})`);
  const d = {};
  if (tf.length) d.transform = tf.join(" ");
  if (e.opacity !== undefined && e.opacity !== 1) d.opacity = String(e.opacity);
  return d;
}

export function decls(d) {
  return Object.entries(d).filter(([k, v]) => !k.startsWith("_") && v !== undefined && v !== null && v !== "").map(([k, v]) => `${k}:${v}`).join(";");
}
