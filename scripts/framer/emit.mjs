// Emits Astro markup + CSS from resolved breakpoint trees.
// The primary (desktop) breakpoint is the base; every other breakpoint gets only the
// declarations that differ, inside its own media query.
import crypto from "node:crypto";
import fs from "node:fs";
import { frameCSS, textCSS, runCSS, effectCSS, decls, color, presets } from "./css.mjs";

// Tags for CMS-bound text, measured on the live site (Framer's API does not expose them).
// Grid row sizing the Framer API leaves out, measured on the live site (scripts/grid-rows.mjs).
const GRID_ROWS = fs.existsSync("capture/grid-rows.json") ? JSON.parse(fs.readFileSync("capture/grid-rows.json", "utf8")) : {};
const FIELD_TAGS = fs.existsSync("capture/cms-field-tags.json") ? JSON.parse(fs.readFileSync("capture/cms-field-tags.json", "utf8")) : {};
import { fieldIndex } from "./resolve.mjs";

const RESET = {
  "max-width": "none", "min-width": "0", "max-height": "none", "min-height": "0",
  padding: "0", gap: "0", background: "none", border: "none", "box-shadow": "none",
  transform: "none", "border-radius": "0", opacity: "1", flex: "none", "align-self": "auto",
  "flex-wrap": "nowrap", "grid-column": "auto", "grid-row": "auto", "z-index": "auto",
  "backdrop-filter": "none", filter: "none", "text-wrap": "wrap", "text-transform": "none",
  "font-variation-settings": "normal", "font-feature-settings": "normal", "aspect-ratio": "auto",
  "border-width": "0", overflow: "visible", "justify-self": "auto", top: "auto", left: "auto", right: "auto", bottom: "auto",
  "grid-template-rows": "none", "grid-auto-rows": "auto", "align-content": "normal",
  "--bw": "0", "--bs": "solid", "--bc": "transparent",
};

export function diff(base, other) {
  const out = {};
  for (const [k, v] of Object.entries(other)) if (base[k] !== v) out[k] = v;
  for (const k of Object.keys(base)) if (!(k in other)) out[k] = RESET[k] ?? "initial";
  return out;
}

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\{/g, "&#123;").replace(/\}/g, "&#125;");
const attr = (s) => String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/\{/g, "&#123;").replace(/\}/g, "&#125;");
const kebab = (s) => (s || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const isProp = (v) => v && typeof v === "object" && typeof v.prop === "string";
const isCms = (v) => v && typeof v === "object" && typeof v.cms === "string";

// ---------- CMS field keys ----------
export const FIELD_KEYS = {
  "Blog Thumbnail Title": "cardTitle", "Main Image / Thumbnail Image": "image", "Show on the homepage": "showOnHomepage",
  Industry: "industry", Product: "product", "Full Post Title": "title", "Intro Section Body": "intro",
  "Button Text": "buttonText", "Page Link": "buttonLink",
  "First Section Title": "section1Title", "First Section Body": "section1Body", "Second Section Title": "section2Title", "Second Section Body": "section2Body",
  "Third Section Title": "section3Title", "Third Section Body": "section3Body", "Fourth Section Title": "section4Title", "Fourth Section Body": "section4Body",
  "Fifth Section Title": "section5Title", "Fifth Section Body": "section5Body",
  "Gallery Img 1": "gallery1", "Gallery Img 2": "gallery2", "Gallery Side Img 1": "gallerySide1", "Gallery Side Img 2": "gallerySide2",
  "Gallery Img 3": "gallery3", "Gallery Img 4": "gallery4", "Bottom Section Heading": "bottomHeading", "Bottom Section Body": "bottomBody",
  "Final Section Heading": "finalHeading", "Final Section Body": "finalBody", "Show Image Carousel": "showCarousel",
  "Carousel Img 1": "carousel1", "Carousel Img 2": "carousel2", "Carousel Img 3": "carousel3", "Carousel Img 4": "carousel4",
  "Meta Title": "metaTitle", "Meta Description": "description",
  Name: "name", Category: "category", Codes: "codes", "Fiber Counts": "fiberCounts", "Construction And Rating": "construction",
  "Typical Use": "typicalUse", Description: "description", Image: "image",
};
export const COLLECTION_VAR = { Posts: "posts", Products: "products" };
export const DETAIL_PATH = { Posts: "/blog/", Products: "/products/" };

export class Emitter {
  // bps: [{name, range}] with the primary breakpoint first. Ranges that can never
  // match (min > max) are dropped by the caller.
  constructor({ assets, icons, registry, page, bps }) {
    this.assets = assets;
    this.icons = icons;
    this.registry = registry;
    this.page = page;
    this.bps = bps;
    this.rules = new Map(); // class -> {base, bps:[decls per other bp], hover, eff, tap}
    this.imports = new Set();
    this.collections = new Set();
    this.warnings = [];
    this.textDiffs = [];
    this.headingLog = [];
    this.cmsStack = [];
    this.keyClass = new Map();
    this.altRules = bps.map(() => []);
  }

  cls(sig, ruleParts, readable) {
    const h = "x" + crypto.createHash("sha1").update(sig).digest("base64url").replace(/[-_]/g, "").slice(0, 6).toLowerCase();
    if (!this.rules.has(h)) this.rules.set(h, ruleParts);
    return readable ? `${readable} ${h}` : h;
  }

  nodeCSS(n, parentAttrs, root) {
    if (!n) return null;
    const a = n.attrs || {};
    if (n.type === "RichTextNode") {
      const d = frameCSS({ ...a, _text: true }, parentAttrs, { text: true, root });
      if (d.display !== "none") d.display = "block";
      Object.assign(d, textCSS(a));
      if (a.width === "auto") d["white-space"] = "pre";
      else { d["white-space"] = "pre-wrap"; d["overflow-wrap"] = "break-word"; d["word-break"] = "break-word"; }
      if (a.overflow === "hidden") d["text-overflow"] = "ellipsis";
      return d;
    }
    if (n.type === "IconNode" || n.type === "SVGNode" || n.type === "ShapeContainerNode") {
      const d = frameCSS(a, parentAttrs, { root });
      if (d.display !== "none") d.display = "block";
      return d;
    }
    const d = frameCSS(a, parentAttrs, { root, block: true });
    if (!d.display) d.display = "block";
    if (d._fitImage) {
      // Framer "fit image": the frame takes the image's aspect ratio
      const src = typeof a.fill === "string" ? a.fill : a.fill?.src;
      const as = src && this.assets.get(String(src).split("?")[0]);
      if (as?.w && as?.h) d["aspect-ratio"] = `${as.w} / ${as.h}`;
      delete d._fitImage;
    }
    if (n.type === "RelativeOverlayNode") {
      d.position = "absolute"; d.top = `calc(100% + ${a.floatingOffsetY || "0px"})`; d.left = "50%";
      d.transform = "translateX(-50%)"; d["z-index"] = "20"; delete d.flex;
    }
    if ((typeof a.fill === "string" && a.fill.startsWith("http")) || isCms(a.fill) || isProp(a.fill) || (a.fill && typeof a.fill === "object")) delete d.background;
    return d;
  }

  // ctx: {nodes:[n, ...counterparts per other bp], maps:[null, Map...], parents:[attrs per bp], ...}
  emit(n, ctx) {
    const { inLink, hoverRoot } = ctx;
    const t = n.type;
    const list = this.bps.map((_, i) => (i === 0 ? n : ctx.nodes?.[i] || n));
    // Hidden at every breakpoint and never revealed by a tap variant: Framer omits it, so do we.
    if (list.every((x) => x.attrs?.visible === false) && !(ctx.altCtx?.alts || []).some((al) => al.map.has(n.key) && al.map.get(n.key).attrs?.visible !== false)) return "";
    if (t === "Code") return this.code(n, ctx, list);
    const root = !!ctx.root;
    const ds = list.map((x, i) => this.nodeCSS(x, ctx.parents?.[i], root));
    // Framer lets breakpoints reorder children: mirror that with CSS order
    if (ctx.orders?.some(Boolean)) ds.forEach((d, i) => { const o = ctx.orders[i] || ctx.orders[0]; if (o?.has(n.key)) d.order = String(o.get(n.key)); });
    const gr = GRID_ROWS[n.key.split("/").pop()];
    if (gr) ds.forEach((d, i) => {
      const m = gr[{ "Desktop Wireframe": "Desktop", "Desktop 2": "Desktop" }[this.bps[i].name] || this.bps[i].name];
      if (m?.autoRows && m.autoRows !== "auto") { d["grid-auto-rows"] = m.autoRows.replace("minmax(0px", "minmax(0"); delete d["grid-template-rows"]; }
    });
    if (root) ds.forEach((d, i) => { d.width = "100%"; if (i === 0) d["min-height"] = "100vh"; else delete d["min-height"]; });
    const diffs = ds.slice(1).map((d) => diff(ds[0], d));
    let hv = null, hvSel = null;
    const strip = (hd) => { for (const k of ["flex", "width", "height", "position", "top", "left", "right", "bottom", "max-width", "z-index"]) delete hd[k]; return hd; };
    if (n.hover) {
      const hd = strip(diff(ds[0], this.nodeCSS({ ...n, attrs: { ...n.attrs, ...n.hover.attrs } }, ctx.parents?.[0], root)));
      if (Object.keys(hd).length) { hv = hd; hvSel = "self"; }
    } else if (hoverRoot && hoverRoot.map.has(n.key)) {
      const hd = strip(diff(ds[0], this.nodeCSS(hoverRoot.map.get(n.key), ctx.parents?.[0], root)));
      if (Object.keys(hd).length) { hv = hd; hvSel = hoverRoot.cls; }
    }
    const eff = effectCSS(n.attrs?.hoverEffect);
    const tap = effectCSS(n.attrs?.tapEffect);
    const transition = n.attrs?.transition || n.attrs?.hoverEffect?.transition || (hoverRoot ? hoverRoot.transition : null);
    if ((hv || (eff && Object.keys(eff).length) || (tap && Object.keys(tap).length)) && transition) ds[0].transition = "all 0.3s cubic-bezier(0.44, 0, 0.56, 1)";
    const readable = kebab(n.component || (n.name && !/^(none|frame|text)$/i.test(n.name) ? n.name : ""));
    const c = this.cls(JSON.stringify({ ds0: ds[0], diffs, hv, hvSel, eff, tap }), { base: ds[0], bps: diffs, hover: hv ? [hvSel, hv] : null, eff, tap }, readable && readable.length < 40 ? readable : "");
    const myCls = c.split(" ").pop();
    this.keyClass.set(n.key, myCls);

    const kids = (x) => (x?.children || []).map((c) => c.key);
    const baseOrder = kids(n);
    const reordered = list.map((x, i) => i > 0 && x !== n && kids(x).filter((k) => baseOrder.includes(k)).join("|") !== baseOrder.filter((k) => kids(x).includes(k)).join("|"));
    const orders = reordered.some(Boolean) ? list.map((x, i) => (i === 0 || reordered[i] ? new Map(kids(i === 0 ? n : x).map((k, j) => [k, j])) : null)) : null;
    const childCtx = (child) => ({
      orders,
      nodes: this.bps.map((_, i) => (i === 0 ? child : ctx.maps?.[i]?.get(child.key))),
      maps: ctx.maps,
      parents: list.map((x) => x.attrs),
      inLink: inLink || !!linkOf(n),
      hoverRoot: n.hover ? { map: indexTree(n.hover), cls: myCls, transition: n.attrs.transition } : hoverRoot,
      variantIds: n.variantIds || ctx.variantIds,
      altCtx: n.alts?.length ? { rootCls: myCls, base: n.variant, alts: n.alts.map((al) => ({ name: al.name, map: indexTree(al) })) } : ctx.altCtx,
    });

    if (t === "RichTextNode") { this._inLink = !!inLink; const out = this.text(n, c, list); this._inLink = false; return out; }
    if (t === "IconNode") return this.icon(n, c);
    if (t === "SVGNode" || t === "ShapeContainerNode" || t === "PathNode" || t === "BooleanShapeNode") return this.svg(n, c);
    if (t === "FormPlainTextInputNode" || t === "FormSelectNode") return this.formField(n, c);

    const [wrapOpen, wrapClose] = this.condWrap(n.attrs?.visible);
    const a = n.attrs || {};
    const link = linkOf(n);
    let tag = a.htmlTag && a.htmlTag !== "div" ? a.htmlTag : "div";
    let cls = c;
    let attrs = "";
    if (a.elementId) attrs += ` id="${attr(a.elementId)}"`;
    if (link && !inLink) { tag = "a"; attrs += this.hrefAttrs(link); }
    else if (link && inLink) this.warnings.push(`nested link dropped at ${n.key} -> ${JSON.stringify(link)}`);
    if (a.formSubmitButtonId) tag = "form";
    // interactivity: overlays (dropdowns), tap-to-switch variants (menus, accordions, tabs)
    const hasAlts = list.some((x) => x?.alts?.length);
    if (t === "RelativeOverlayNode") cls += " overlay";
    if (a.gridMasonry) cls += " masonry";
    if ([ds[0], ...diffs, hv || {}].some((d) => d["--bw"] && d["--bw"] !== "initial")) cls += " fb";
    if (a.loopEffect?.rotate) cls += " loop-spin";
    if (JSON.stringify(a.onHover || "").includes("SHOW_OVERLAY")) cls += " has-overlay";
    if (hasAlts) attrs += ` data-variants data-variant="${attr(n.variant || "")}"`;
    const tapSrc = [...list].reverse().find((x) => x?.attrs?.onTap)?.attrs.onTap;
    const tapTarget = JSON.stringify(tapSrc || "").match(/"variant":"([\w-]+)"/);
    if (tapTarget && ctx.variantIds?.[tapTarget[1]]) attrs += ` data-set-variant="${attr(ctx.variantIds[tapTarget[1]])}" role="button" tabindex="0"`;

    let inner = "";
    const fill = a.fill;
    // image swaps between tap-switched variants (e.g. tabs that change the picture)
    if (ctx.altCtx && typeof fill === "string" && fill.startsWith("http")) {
      const swaps = ctx.altCtx.alts.map((al) => ({ name: al.name, f: al.map.get(n.key)?.attrs?.fill })).filter((x) => typeof x.f === "string" && x.f.startsWith("http") && x.f !== fill);
      if (swaps.length) {
        const root = ctx.altCtx.rootCls;
        for (const sw of swaps) {
          const v = kebab(sw.name);
          inner += this.img(sw.f, a, list).replace('class="fill-img"', `class="fill-img show-v-${v}"`);
          this.altRules[0].push(`.${root} .show-v-${v}{display:none}`, `.${root}[data-variant="${sw.name}"] .show-v-${v}{display:block}`, `.${root}[data-variant="${sw.name}"] .hide-v-${v}{display:none}`);
        }
        inner += this.img(fill, a, list).replace('class="fill-img"', `class="fill-img ${swaps.map((sw) => "hide-v-" + kebab(sw.name)).join(" ")}"`);
      } else inner += this.img(fill, a, list);
    } else if (typeof fill === "string" && fill.startsWith("http")) inner += this.img(fill, a, list);
    else if (fill && typeof fill === "object" && typeof fill.src === "string") inner += this.img(fill.src, { ...a, altText: a.altText ?? fill.alt, fillImagePositionX: a.fillImagePositionX ?? fill.positionX, fillImagePositionY: a.fillImagePositionY ?? fill.positionY, _fit: fill.fit }, list);
    else if (isCms(fill)) inner += this.cmsImg(fill.cms, a.height === "fit-image" || a.width === "fit-image");
    else if (isProp(fill)) inner += `{${fill.prop}?.src && <img class="fill-img" src={${fill.prop}.src} alt={${fill.prop}.alt ?? ""} loading="lazy" decoding="async"/>}`;

    if (a.collectionList) inner += this.collectionList(n, childCtx);
    else for (const ch of n.children || []) inner += this.emit(ch, childCtx(ch));
    if (hasAlts) this.altCSS(list, myCls, ctx.parents);

    return `${wrapOpen}<${tag} class="${cls}"${attrs}>${inner}</${tag}>${wrapClose}`;
  }

  condWrap(vis) {
    if (vis && typeof vis === "object" && vis.cmsIsSet) return [`{${this.cmsExpr(vis.cmsIsSet)} && (`, ")}"];
    if (vis && typeof vis === "object" && vis.propIsSet) return [`{${vis.propIsSet} && (`, ")}"];
    return ["", ""];
  }

  hrefAttrs(link) {
    let s = "";
    if (link.collectionItem || (typeof link.href === "string" && /\/:[\w]+/.test(link.href) && this.cmsStack.length)) s += ` href={${this.cmsLink(link)}}`;
    else {
      const h = link.href;
      if (isCms(h)) s += ` href={${this.cmsExpr(h.cms)}}`;
      else if (isProp(h)) s += ` href={${h.prop}}`;
      else s += ` href="${attr(normalizeHref(h))}"`;
    }
    if (link.openInNewTab) s += ` target="_blank"`;
    if (link.rel) s += ` rel="${attr(Array.isArray(link.rel) ? link.rel.join(" ") : link.rel)}"`;
    else if (link.openInNewTab) s += ` rel="noopener"`;
    return s;
  }

  // ---------- text ----------
  text(n, c, list) {
    // Copy that differs between breakpoints: one element per distinct text, shown only
    // at its breakpoints (Framer does the same with per-breakpoint variants).
    if (!this._splitting) {
      const key = (x) => JSON.stringify((x?.blocks || []).map((b) => b.runs.map((r) => (r.br ? "\n" : r.text))));
      const groups = new Map();
      list.forEach((x, i) => { const k = key(x); if (!groups.has(k)) groups.set(k, []); groups.get(k).push(i); });
      if (groups.size > 1) {
        let out = "";
        for (const idxs of groups.values()) {
          const has0 = idxs.includes(0);
          const base = has0 ? {} : { display: "none" };
          const bps = this.bps.slice(1).map((_, j) => { const i = j + 1; if (has0 && !idxs.includes(i)) return { display: "none" }; if (!has0 && idxs.includes(i)) return { display: "block" }; return {}; });
          const vis = this.cls(JSON.stringify({ vis: idxs, n: this.bps.length }), { base, bps });
          this._splitting = true;
          out += this.text(list[idxs[0]], `${c} ${vis}`, list);
          this._splitting = false;
        }
        list.slice(1).forEach((other, i) => this.textDiffs.push({ key: n.key, bp: this.bps[i + 1].name, desktop: key(n), other: key(other) }));
        return out;
      }
    }
    const blocks = n.blocks || [];
    const txt = (x) => (x?.blocks || []).map((b) => b.runs.map((r) => (typeof r.text === "string" ? r.text : r.br ? "\n" : JSON.stringify(r.text))).join("")).join("\n");

    const [wrapOpen, wrapClose] = this.condWrap(n.attrs?.visible);
    const tb = n.attrs?.textBackgroundColor;
    const runs = (b) => {
      let s = "";
      for (const r of b.runs) {
        if (r.br) { s += "<br/>"; continue; }
        let inner;
        if (isCms(r.text)) inner = `{${this.cmsExpr(r.text.cms)}}`;
        else if (isProp(r.text)) inner = `{${r.text.prop}}`;
        else if (/^\s+$/.test(r.text ?? "") ) inner = `{${JSON.stringify(r.text)}}`; // survives HTML compression
        else inner = esc(r.text ?? "");
        const rc = runCSS(r);
        if (r.bold) { inner = `<strong>${inner}</strong>`; if (rc["font-weight"] === "700") delete rc["font-weight"]; }
        if (Object.keys(rc).length) {
          const k = this.cls(JSON.stringify({ run: rc }), { base: rc, bps: [] });
          inner = `<span class="${k}">${inner}</span>`;
        }
        if (r.link) inner = `<a${this.hrefAttrs(r.link)} class="text-link">${inner}</a>`;
        s += inner;
      }
      if (tb) s = `<span class="text-bg">${s}</span>`;
      // link on the whole text layer (Framer renders <p><a>text</a></p>)
      const nl = linkOf(n);
      if (nl && !this._inLink) s = `<a${this.hrefAttrs(nl)}>${s}</a>`;
      return s;
    };
    // CMS-bound text has no tag in the Framer data: use the preset's tag, else the live site's
    const bound = blocks.length === 1 && blocks[0].runs.length === 1 && isCms(blocks[0].runs[0].text) ? blocks[0].runs[0].text.cms : null;
    if (bound) {
      const fname = fieldIndex[bound]?.field.name;
      const inList = this.cmsStack.length && this.cmsStack[this.cmsStack.length - 1].v !== "entry";
      const preset = n.attrs?.textStylePreset && presets[n.attrs.textStylePreset];
      const isTpl = this.page.includes(":");
      const t = preset?.tag || (inList && isTpl ? "p" : FIELD_TAGS[this.page]?.[fname] || "p");
      blocks[0] = { ...blocks[0], tag: t };
    }
    const tagOf = (b) => {
      if (b.tag === "h1") {
        this.h1Seen = (this.h1Seen || 0) + 1;
        if (this.h1Seen > 1 && this.demoteExtraH1) {
          const words = b.runs.map((r) => (typeof r.text === "string" ? r.text : "")).join("");
          const asP = words.length > 90 || /[.!?]$/.test(words.trim());
          this.headingLog.push({ text: words, to: asP ? "p" : "h2" });
          return asP ? "p" : "h2";
        }
      }
      return b.tag;
    };
    if (blocks.length === 1) {
      const tg = tagOf(blocks[0]);
      return `${wrapOpen}<${tg} class="${c}">${runs(blocks[0])}</${tg}>${wrapClose}`;
    }
    const inner = blocks.map((b) => { const tg = tagOf(b); return `<${tg}>${runs(b)}</${tg}>`; }).join("");
    return `${wrapOpen}<div class="${c} rt">${inner}</div>${wrapClose}`;
  }

  // ---------- media ----------
  img(url, a, list) {
    const as = this.assets.get(url.split("?")[0]);
    const alt = a.altText ?? "";
    const pos = `${a.fillImagePositionX || "center"} ${a.fillImagePositionY || "center"}`;
    const fit = a._fit === "fit" || a._fit === "contain" ? "object-fit:contain;" : "";
    const style = pos !== "center center" || fit ? ` style="${fit}${pos !== "center center" ? `object-position:${pos}` : ""}"` : "";
    if (!as) { this.warnings.push("asset missing " + url); return `<img class="fill-img" src="${attr(url)}" alt="${attr(alt)}" loading="lazy" decoding="async"${style}/>`; }
    const srcset = as.variants?.length ? ` srcset="${as.variants.map((v) => `${v.path} ${v.w}w`).join(", ")}, ${as.path} ${as.w}w" sizes="${this.sizes(list)}"` : "";
    const wh = as.w && as.h ? ` width="${as.w}" height="${as.h}"` : "";
    return `<img class="fill-img" src="${as.path}"${srcset}${wh} alt="${attr(alt)}" loading="lazy" decoding="async"${style}/>`;
  }
  sizes(list) {
    const ws = list.map((x) => x?.rect?.width).map((w) => (w ? Math.round(w) + "px" : "100vw"));
    const parts = [];
    this.bps.forEach((bp, i) => { if (i > 0) parts.push(`${bp.range} ${ws[i]}`); });
    return [...parts, ws[0]].join(", ");
  }
  cmsImg(fieldId, fit) {
    const e = this.cmsExpr(fieldId);
    return `{${e}?.src && <img class="fill-img${fit ? " fit" : ""}" src={${e}.src} alt={${e}.alt ?? ""} loading="lazy" decoding="async"/>}`;
  }

  icon(n, c) {
    const svg = this.icons.get(n);
    if (svg === "") return `<span class="${c}"></span>`; // renders empty on the live site too
    if (!svg) { this.warnings.push(`icon missing ${n.icon?.name} at ${n.key}`); return `<span class="${c}" data-missing-icon="${attr(n.icon?.name || "")}"></span>`; }
    const a = n.attrs || {};
    const style = [];
    if (a.$control__color) style.push(`--icon-color:${color(a.$control__color)}`);
    if (a.$control__width) style.push(`--icon-stroke:${a.$control__width}`);
    if (a.$control__alpha) style.push(`--icon-alpha:${a.$control__alpha}`);
    return svg.replace("<svg", `<svg class="${c} icon"${style.length ? ` style="${style.join(";")}"` : ""} aria-hidden="true"`);
  }

  svg(n, c) {
    const markup = this.icons.svgFor?.(n, this.page);
    if (!markup) { this.warnings.push(`svg missing ${n.name} at ${n.key}`); return `<div class="${c}" data-missing-svg="${attr(n.name || "")}"></div>`; }
    return `<div class="${c}">${markup}</div>`;
  }

  formField(n, c) {
    const a = n.attrs;
    const name = a.formInputName || "";
    const req = a.formInputRequired ? " required" : "";
    const ph = a.formInputPlaceholder ? ` placeholder="${attr(a.formInputPlaceholder)}"` : "";
    if (n.type === "FormSelectNode") {
      const opts = (a.formSelectOptions || []).map((o) => (o.type === "divider" ? "<hr/>" : `<option value="${attr(o.disabled ? "" : o.title)}"${o.disabled ? " disabled" : ""}${o.value === a.formInputValue || (!a.formInputValue && o.disabled) ? " selected" : ""}>${esc(o.title)}</option>`)).join("");
      return `<select class="${c} field" name="${attr(name)}"${req}>${opts}</select>`;
    }
    const type = a.formTextInputType || "text";
    if (type === "textarea") return `<textarea class="${c} field" name="${attr(name)}"${ph}${req}></textarea>`;
    return `<input class="${c} field" type="${type}" name="${attr(name)}"${ph}${req}/>`;
  }

  code(n, ctx, list) {
    // hidden at every breakpoint: Framer does not render it either
    if (list.every((x) => x.attrs?.visible === false)) return "";
    const fn = this.registry[n.component];
    // Some pages keep the desktop nav at tablet/phone widths on the live site, which overflows.
    // The rebuild uses the responsive header there instead (see notes/flags.md).
    const navFix = (x, i) => (n.component === "Navigation Bar 2" && i > 0 && x.controls?.variant === "Desktop" ? { ...x.attrs, width: "1fr" } : x.attrs || {});
    const ds = list.map((x, i) => frameCSS(navFix(x, i), ctx.parents?.[i], { block: true }));
    const c = this.cls(JSON.stringify({ code: n.component, ds }), { base: ds[0], bps: ds.slice(1).map((d) => diff(ds[0], d)) }, kebab(n.component));
    if (!fn) { this.warnings.push(`code component not handled: ${n.component} at ${n.key}`); return `<div class="${c}" data-todo="${attr(n.component)}"></div>`; }
    return fn.call(this, n, c, ctx, list);
  }

  // ---------- CMS ----------
  cmsExpr(fieldId) {
    const fi = fieldIndex[fieldId];
    if (!fi) return "undefined";
    const key = FIELD_KEYS[fi.field.name] || fi.field.name;
    for (let i = this.cmsStack.length - 1; i >= 0; i--) if (this.cmsStack[i].collection === fi.collection) return `${this.cmsStack[i].v}.data.${key}`;
    this.warnings.push(`unbound cms field ${fi.collection}.${fi.field.name}`);
    return "undefined";
  }
  cmsLink() {
    const top = this.cmsStack[this.cmsStack.length - 1];
    if (!top) return `"#"`;
    return `"${DETAIL_PATH[top.collection]}" + ${top.v}.id`;
  }
  collectionList(n, childCtx) {
    const cl = n.attrs.collectionList;
    const coll = cl.collection;
    this.collections.add(coll);
    const v = "item" + (this.cmsStack.length || "");
    const conds = (cl.filters || []).map((f) => {
      const fi = fieldIndex[f.variableId];
      const key = FIELD_KEYS[fi.field.name];
      const tr = f.transforms[0];
      const val = tr.value;
      let rhs;
      if (isCms(val)) rhs = this.cmsExpr(val.cms);
      else if (typeof val === "string" && val.startsWith("var(--variable-")) {
        const id = val.slice(15, -1);
        rhs = fieldIndex[id] ? this.cmsExpr(id) : "searchTerm";
      } else if (val === undefined) rhs = "searchTerm"; // bound to an unresolved page variable (search box)
      else if (rhs === undefined) rhs = JSON.stringify(val);
      if (tr.name === "equals") return `${v}.data.${key} === ${rhs}`;
      if (tr.name === "contains") return `String(${v}.data.${key} ?? "").toLowerCase().includes(String(${rhs}).toLowerCase())`;
      return "true";
    });
    const op = cl.filtersOperator === "or" ? " || " : " && ";
    let expr = COLLECTION_VAR[coll];
    if (conds.length) expr += `.filter((${v}) => ${conds.join(op)})`;
    if (cl.sorting?.length) {
      const s = cl.sorting[0];
      const key = FIELD_KEYS[fieldIndex[s.variable]?.field.name];
      expr += `.slice().sort((a, b) => String(a.data.${key}).localeCompare(String(b.data.${key}))${s.direction === "desc" ? " * -1" : ""})`;
    }
    if (cl.limit) expr += `.slice(0, ${Number(cl.limit)})`;
    this.cmsStack.push({ collection: coll, v });
    let body = "";
    for (const ch of n.children || []) body += this.emit(ch, childCtx(ch));
    this.cmsStack.pop();
    return `{${expr}.map((${v}) => (${body}))}`;
  }

  // CSS for tap-switched variants: diff each node of the alternate variant against the
  // variant shown by default at that breakpoint, scoped to [data-variant="<alt>"].
  altCSS(list, rootCls, parents) {
    list.forEach((node, bi) => {
      if (!node?.alts?.length) return;
      const pAttrs = parents?.[bi];
      for (const alt of node.alts) {
        const baseMap = new Map(), altMap = new Map();
        const index = (x, m, pa) => { m.set(x.key, { x, pa }); for (const ch of x.children || []) index(ch, m, x.attrs); };
        index(node, baseMap, pAttrs);
        index({ ...node, attrs: alt.attrs, children: alt.children }, altMap, pAttrs);
        for (const [key, { x, pa }] of altMap) {
          const b = baseMap.get(key);
          const cls = this.keyClass.get(key);
          if (!b || !cls) continue;
          const d = diff(this.nodeCSS(b.x, b.pa, false), this.nodeCSS(x, pa, false));
          if (key === node.key) for (const k of ["width", "flex", "position", "top", "left", "z-index"]) delete d[k];
          if (!Object.keys(d).length) continue;
          const sel = key === node.key ? `.${rootCls}[data-variant="${alt.name}"]` : `.${rootCls}[data-variant="${alt.name}"] .${cls}`;
          this.altRules[bi].push(`${sel}{${decls(d)}}`);
        }
      }
    });
  }

  // ---------- CSS output ----------
  css() {
    let base = "", extra = "";
    const per = this.bps.map(() => "");
    for (const [k, r] of this.rules) {
      if (Object.keys(r.base).length) base += `.${k}{${decls(r.base)}}\n`;
      (r.bps || []).forEach((d, i) => { if (d && Object.keys(d).length) per[i + 1] += `.${k}{${decls(d)}}\n`; });
      if (r.hover) {
        const [sel, d] = r.hover;
        extra += sel === "self" ? `.${k}:hover{${decls(d)}}\n` : `.${sel}:hover .${k}{${decls(d)}}\n`;
      }
      if (r.eff && Object.keys(r.eff).length) extra += `.${k}:hover{${decls(r.eff)}}\n`;
      if (r.tap && Object.keys(r.tap).length) extra += `.${k}:active{${decls(r.tap)}}\n`;
    }
    let out = base + extra + this.altRules[0].map((x) => x + "\n").join("");
    this.bps.forEach((bp, i) => {
      if (i === 0) return;
      const body = per[i] + this.altRules[i].map((x) => x + "\n").join("");
      if (body) out += `@media ${bp.range}{\n${body}}\n`;
    });
    return out;
  }
}

export function linkOf(n) {
  let l = n.attrs?.link;
  if (!l) return null;
  // a link variable resolved to a link object: {href: {href, collectionItem}}
  if (l && typeof l.href === "object" && l.href && (l.href.href || l.href.collectionItem)) l = { ...l, ...l.href };
  if (typeof l === "object" && (l.href || l.collectionItem)) return l;
  return null;
}

export function normalizeHref(h) {
  if (typeof h !== "string") return "#";
  if (h.startsWith("./")) h = "/" + h.slice(2);
  if (h === "/") return "/";
  if (/^\/[^#?]*\/$/.test(h)) h = h.replace(/\/$/, "");
  return h;
}

export function indexTree(t) {
  const m = new Map();
  const walk = (x) => { if (x.key) m.set(x.key, x); (x.children || []).forEach(walk); };
  (t.children || []).forEach(walk);
  return m;
}

// Primary breakpoint first, drop ranges that can never match.
export function usableBps(bps) {
  const ok = (r) => {
    const mn = r.match(/min-width:\s*([\d.]+)px/), mx = r.match(/max-width:\s*([\d.]+)px/);
    return !(mn && mx && +mn[1] > +mx[1]);
  };
  const prim = bps.find((b) => b.primary);
  return [prim, ...bps.filter((b) => b !== prim && ok(b.range))];
}
