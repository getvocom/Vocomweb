// Renderers for Framer code components and components that need hand-built
// interactivity. Each receives (node, className, ctx) with `this` = Emitter.
import fs from "node:fs";
import { color } from "./css.mjs";

// Icon code components -> inline SVG from the official icon packages.
function iconSvg(file, colorValue, mirrored) {
  if (!fs.existsSync(file)) return null;
  let svg = fs.readFileSync(file, "utf8").replace(/<\?xml[^>]*>/, "").trim();
  svg = svg.replace(/fill="currentColor"/g, "").replace("<svg", `<svg fill="${colorValue}" width="100%" height="100%" aria-hidden="true"${mirrored ? ' style="transform:scaleX(-1)"' : ""}`);
  return svg;
}
const PH_WEIGHT = { Regular: "regular", Bold: "bold", Fill: "fill", Light: "light", Thin: "thin", Duotone: "duotone" };
const MAT_STYLE = { Filled: "filled", Outlined: "outlined", Rounded: "round", Sharp: "sharp", TwoTone: "two-tone" };
const snake = (s) => String(s).replace(/([a-z0-9])([A-Z])/g, "$1_$2").replace(/([A-Za-z])(\d)/g, "$1_$2").toLowerCase();
const kebabName = (s) => String(s).replace(/([a-z0-9])([A-Z])/g, "$1-$2").replace(/\s+/g, "-").toLowerCase();

// Components the resolver must not inline (rendered by the registry instead).
export const OPAQUE = new Set([
  "Navigation Bar 2", "Simple Footer 2", "Cookie Banner", "Smooth Scroll",
  "faq/accordian_item", "faq/accordian_item 2", "FAQ", "Faq Accordion",
]);

const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\{/g, "&#123;").replace(/\}/g, "&#125;");
const attr = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/"/g, "&quot;");
const parseJSON = (s) => { try { return typeof s === "string" ? JSON.parse(s) : s; } catch { return null; } };

export const registry = {
  "Navigation Bar 2"(n, c) {
    this.imports.add('import Header from "@/components/Header.astro";');
    // One header size/position on every page (the Framer pages each had their own widths).
    return `<div class="site-header-slot header-slot" data-pagefind-ignore><Header /></div>`;
  },
  "Simple Footer 2"(n, c) {
    this.imports.add('import Footer from "@/components/Footer.astro";');
    const props = ["footerTagline", "title", "menu1", "menu2", "menu3", "link1", "link2", "link3"]
      .filter((k) => typeof n.controls[k] === "string")
      .map((k) => ` ${k}="${attr(n.controls[k])}"`).join("");
    return `<div class="${c} footer-slot" data-pagefind-ignore><Footer${props} /></div>`;
  },
  "Cookie Banner"() { return ""; },
  // FormSpark email field with no form ID configured; not rendered on the live site.
  Input() { return ""; },
  // Only used inside layers hidden at every breakpoint on the live site.
  "testimonial/cardcontainer"() { return ""; },
  Slideshow() { return ""; },
  "Smooth Scroll"() { return ""; },

  Video(n, c) {
    const k = n.controls;
    const src = k.file || k.url || k.srcFile;
    const a = this.assets.get(String(src).split("?")[0]);
    const local = a ? a.path : src;
    const poster = typeof k.posterImage === "string" ? this.assets.get(k.posterImage.split("?")[0])?.path : null;
    const flags = [k.playing !== false && k.playing !== "false" ? "autoplay" : "", k.loop !== false && k.loop !== "false" ? "loop" : "", k.muted !== false && k.muted !== "false" ? "muted" : "", "playsinline", k.controls === true || k.controls === "true" ? "controls" : ""].filter(Boolean).join(" ");
    const fit = (k.fit || "Cover").toLowerCase();
    const radius = k.radius ? `border-radius:${k.radius};` : "";
    // Videos load and play only when on screen (Base.astro script), like Framer's player.
    const lazyFlags = flags.replace("autoplay", "").replace(/\s+/g, " ").trim();
    const auto = flags.includes("autoplay") ? " data-autoplay" : "";
    return `<div class="${c}"><video class="video-fill" data-src="${attr(local)}"${auto}${poster ? ` poster="${poster}"` : ""} ${lazyFlags} preload="none" style="object-fit:${fit};${radius}"></video></div>`;
  },

  Phosphor(n, c) {
    const k = n.controls;
    const name = kebabName(k.select === true || k.select === "true" ? k.name : k.name1 || k.name);
    const w = PH_WEIGHT[k.weight] || "regular";
    const file = `node_modules/@phosphor-icons/core/assets/${w}/${name}${w === "regular" ? "" : "-" + w}.svg`;
    const svg = iconSvg(file, color(k.color) || "currentColor", k.mirrored === true || k.mirrored === "true");
    if (!svg) { this.warnings.push(`phosphor icon not found: ${name} (${w})`); return `<div class="${c}"></div>`; }
    return `<div class="${c}">${svg}</div>`;
  },
  Material(n, c) {
    const k = n.controls;
    const name = snake(k.select === true || k.select === "true" ? k.name : k.name1 || k.name);
    const style = MAT_STYLE[k.style] || "filled";
    const file = `node_modules/@material-design-icons/svg/${style}/${name}.svg`;
    const svg = iconSvg(file, color(k.color) || "currentColor", k.mirrored === true || k.mirrored === "true");
    if (!svg) { this.warnings.push(`material icon not found: ${name} (${style})`); return `<div class="${c}"></div>`; }
    return `<div class="${c}">${svg}</div>`;
  },

  "Elements / Logo"(n, c) {
    const k = n.controls;
    const logo = typeof k.logo === "string" ? parseJSON(k.logo) || { src: k.logo } : k.logo || {};
    const src = String(logo.src || "").split("?")[0];
    const a = this.assets.get(src);
    const href = k.logoLink || "/";
    return `<a class="${c} site-logo" href="${attr(href === "./" ? "/" : href)}"><img src="${attr(a ? a.path : src)}" alt="${attr(logo.alt || "Vocom logo")}" width="33" height="35" style="display:block;height:35px;width:auto;object-fit:contain;object-position:left center"/></a>`;
  },

  "faq/accordian_item 2"(n, c) {
    this.imports.add('import FaqItem from "@/components/FaqItem.astro";');
    const k = n.controls;
    const ans = k.answer && typeof k.answer === "object" && k.answer.cms ? `{${this.cmsExpr(k.answer.cms)}}` : esc(k.answer ?? "");
    return `<div class="${c}"><FaqItem question="${attr(k.question)}">${ans}</FaqItem></div>`;
  },

  "tab/step_item"(n, c, ctx) {
    // Open state per container variant: the item is open where its variant is X6jkb9FCJ.
    this.imports.add('import StepItem from "@/components/StepItem.astro";');
    const OPEN = "X6jkb9FCJ";
    const k = n.controls;
    const openIn = [];
    if (k.variant === OPEN && ctx.altCtx) openIn.push(ctx.altCtx.base);
    for (const al of ctx.altCtx?.alts || []) if (al.map.get(n.key)?.controls?.variant === OPEN) openIn.push(al.name);
    const tap = JSON.stringify(n.attrs?.onTap || "").match(/"variant":"([\w-]+)"/);
    const target = tap && ctx.variantIds?.[tap[1]];
    const text = (v) => (v && typeof v === "object" && v.prop ? `{${v.prop}}` : esc(v ?? ""));
    return `<div class="${c}"${target ? ` data-set-variant="${attr(target)}" role="button" tabindex="0"` : ""}><StepItem number="${attr(k.number ?? "")}" openIn="${attr(openIn.join("|"))}" open={${k.variant === OPEN}}><Fragment slot="heading">${text(k.amount)}</Fragment>${text(k.description)}</StepItem></div>`;
  },

  "faq/accordian_item"(n, c) {
    return registry["faq/accordian_item 2"].call(this, n, c);
  },

  "Button 5"(n, c) {
    this.imports.add('import SubmitButton from "@/components/SubmitButton.astro";');
    return `<div class="${c}"><SubmitButton /></div>`;
  },

  Calendly(n, c) {
    const k = n.controls;
    const url = `https://calendly.com/${k.calendar}?embed_type=Inline&hide_event_type_details=${k.details === false || k.details === "false" ? 1 : 0}&hide_gdpr_banner=${k.gDPR === false || k.gDPR === "false" ? 1 : 0}`;
    return `<div class="${c}"><iframe src="${attr(url)}" title="Schedule a meeting" loading="lazy" style="width:100%;height:100%;border:0;display:block"></iframe></div>`;
  },

  BENEFITS(n, c) {
    // fixed Feather "eye" icon in a white tile, title + description
    const k = n.controls;
    return `<div class="${c} benefit"><div class="benefit-icon"><svg viewBox="0 0 24 24" fill="none" stroke="rgb(39, 39, 39)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg></div><div class="benefit-texts"><p class="benefit-title">${esc(k.title)}</p><p class="benefit-desc">${esc(k.description)}</p></div></div>`;
  },

  IndustryTable(n, c) {
    const k = n.controls;
    const h = parseJSON(k.headers) || {};
    const head = (key, fallback) => h[key]?.value ?? fallback;
    const cols = [["industry", "Industry"], ["businessSales", head("businessSales", "Business Sales")], ["customerService", head("customerService", "Customer service")], ["afterSalesService", head("afterSalesService", "After-sales service")]];
    const rows = (Array.isArray(k.rows) ? k.rows : parseJSON(k.rows) || []).map((r) => `<tr>${cols.map(([key]) => `<td>${esc(r[key] ?? "")}</td>`).join("")}</tr>`).join("");
    return `<div class="${c} industry-table"><table><thead><tr>${cols.map(([, t]) => `<th>${esc(t)}</th>`).join("")}</tr></thead><tbody>${rows}</tbody></table></div>`;
  },

  "Button/Primary Button"(n, c) {
    const k = n.controls;
    const nt = k.newTab === true || k.newTab === "true";
    return `<div class="${c}"><a class="btn-red" href="${attr(k.link || "#")}"${nt ? ' target="_blank" rel="noopener"' : ""}><span>${esc(k.title)}</span></a></div>`;
  },

  Feather(n, c) {
    const k = n.controls;
    // an unbound name falls back to the component default, which renders "briefcase" on the live site
    const raw = k.select === true || k.select === "true" ? k.name : k.name1 || k.name;
    const name = typeof raw === "string" ? kebabName(raw) : "briefcase";
    const file = `node_modules/feather-icons/dist/icons/${name}.svg`;
    if (!fs.existsSync(file)) { this.warnings.push(`feather icon not found: ${name}`); return `<div class="${c}"></div>`; }
    const svg = fs.readFileSync(file, "utf8").replace(/stroke="currentColor"/, `stroke="${color(k.color) || "currentColor"}"`).replace(/\swidth="24" height="24"/, ' width="100%" height="100%" aria-hidden="true"');
    return `<div class="${c}">${svg}</div>`;
  },

  "Icon Arrow"(n, c) {
    // up-right arrow, copied from the live site's sprite (#svg318331668)
    return `<div class="${c}"><svg viewBox="0 0 16 16" width="100%" height="100%" aria-hidden="true"><path d="M 13.667 1.583 L 4 1.583 C 3.586 1.583 3.25 1.919 3.25 2.333 C 3.25 2.747 3.586 3.083 4 3.083 L 11.856 3.083 L 1.803 13.136 C 1.51 13.429 1.51 13.904 1.803 14.197 C 2.096 14.49 2.571 14.49 2.864 14.197 L 12.917 4.144 L 12.917 12 C 12.917 12.414 13.252 12.75 13.667 12.75 C 14.081 12.75 14.417 12.414 14.417 12 L 14.417 2.333 C 14.417 1.919 14.081 1.583 13.667 1.583 Z" fill="var(--icon-color, var(--white))"></path></svg></div>`;
  },

  Counter(n, c) {
    // Stats are rendered as static final values so crawlers never read the start number.
    const k = n.controls;
    const end = k.endNumber ?? k.number ?? "";
    const font = parseJSON(k.font) || {};
    const style = [
      k.fontSize ? `font-size:${k.fontSize}px` : font.fontSize ? `font-size:${font.fontSize}` : "",
      k.fontColor ? `color:${color(k.fontColor)}` : "",
    ].filter(Boolean).join(";");
    return `<div class="${c} counter"><span style="${attr(style)}">${esc(k.prefix || "")}${esc(end)}${esc(k.suffix || "")}</span></div>`;
  },
};
