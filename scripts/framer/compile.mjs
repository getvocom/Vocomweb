// One-time converter: Framer design tree (capture/framer) -> Astro pages + CSS.
// Usage:
//   node scripts/framer/compile.mjs --collect          # write capture/asset-urls.txt
//   node scripts/framer/compile.mjs [--only /about]    # write src/pages + src/styles/pages
// After the initial conversion the generated .astro files are the source of truth;
// re-running overwrites them, so only do so before hand edits (see CLAUDE.md).
import fs from "node:fs";
import path from "node:path";
import { resolvePage, cms } from "./resolve.mjs";
import { Emitter, usableBps } from "./emit.mjs";
import { registry, OPAQUE } from "./registry.mjs";
import { loadAssets } from "./assets-map.mjs";
import { iconLib } from "./icons.mjs";

const args = process.argv.slice(2);
const ONLY = args.includes("--only") ? args[args.indexOf("--only") + 1] : null;
const COLLECT = args.includes("--collect");

const PAGES_DIR = "capture/framer/pages";
const pageFiles = fs.readdirSync(PAGES_DIR).filter((f) => f.endsWith(".json"));
const pages = pageFiles.map((f) => JSON.parse(fs.readFileSync(path.join(PAGES_DIR, f), "utf8")));

// pages whose extra H1s are demoted (Tom: "use SEO best practice")
const headingLog = [];

function walk(t, fn) { fn(t); (t.children || []).forEach((c) => walk(c, fn)); }
// includes hover and tap-variant trees (for asset collection only; their keys repeat)
function walkAll(t, fn) { fn(t); (t.children || []).forEach((c) => walkAll(c, fn)); if (t.hover) (t.hover.children || []).forEach((c) => walkAll(c, fn)); for (const al of t.alts || []) { fn(al); (al.children || []).forEach((c) => walkAll(c, fn)); } }

if (COLLECT) {
  const urls = new Map(); // url -> naming hint
  let hint = "";
  const add = (v) => { if (typeof v === "string" && /^https:\/\/framerusercontent\.com\//.test(v)) { const u = v.split("?")[0]; if (!urls.get(u)) urls.set(u, hint); } };
  for (const p of pages) {
    const r = resolvePage(p, { opaque: OPAQUE });
    for (const bp of r.bps) walkAll(bp.tree, (n) => {
      hint = n.attrs?.altText || (n.name && !/^(none|image|frame)$/i.test(n.name) ? n.name : "") || (p.attributes.path === "/" ? "home" : p.attributes.path.slice(1));
      add(n.attrs?.fill); add(n.attrs?.fill?.src);
      if (n.controls) for (const v of Object.values(n.controls)) { add(v); if (typeof v === "string" && v.includes("framerusercontent")) (v.match(/https:\/\/framerusercontent\.com\/[^"'\s)]+/g) || []).forEach(add); }
      if (n.attrs?.masks) n.attrs.masks.forEach((m) => add(m.mask));
    });
    hint = "og-" + (p.attributes.path === "/" ? "home" : p.attributes.path.slice(1));
    add(p.attributes?.metadata?.socialImage);
  }
  for (const c of Object.values(cms)) for (const it of c.items) for (const v of Object.values(it.fieldData)) if (v?.type === "image" && v.value?.url) { hint = (c.name === "Posts" ? "blog-" : "product-") + it.slug; add(v.value.url); }
  // head assets (og images, favicons, JSON-LD logos)
  // head assets from the live HTML (og/twitter images, favicons, JSON-LD logos)
  for (const f of fs.readdirSync("capture/html/raw")) {
    const s = fs.readFileSync(path.join("capture/html/raw", f), "utf8");
    const head = s.slice(0, s.indexOf("</head>")) + (s.match(/<script type="application\/ld\+json">[\s\S]*?<\/script>/g) || []).join("");
    hint = "og-" + f.replace(".html", "");
    (head.match(/https:\/\/framerusercontent\.com\/[^"'\\\s)&]+/g) || []).filter((u) => /\.(png|jpe?g|webp|gif|svg|avif|ico)$/i.test(u.split("?")[0])).forEach(add);
  }
  hint = "live";
  for (const u of fs.readFileSync("capture/assets-seen.txt", "utf8").split("\n")) if (/\/(images|assets)\/[^/]+\.(png|jpe?g|webp|gif|svg|avif|mp4|webm|json)(\?|$)/i.test(u)) add(u);
  fs.writeFileSync("capture/asset-urls.txt", [...urls].sort((a, b) => a[0].localeCompare(b[0])).map(([u, h]) => `${u}\t${h}`).join("\n") + "\n");
  console.log(urls.size, "asset urls");
  process.exit(0);
}

const assets = loadAssets();
const report = { warnings: {}, textDiffs: [], headings: [] };

for (const p of pages) {
  const route = p.attributes.path;
  if (ONLY && route !== ONLY) continue;
  const isTemplate = route.includes(":");
  const coll = isTemplate ? (route.startsWith("/blog") ? "Posts" : "Products") : null;
  const r = resolvePage(p, { opaque: OPAQUE });
  const bps = usableBps(r.bps);
  const index = (t) => { const m = new Map(); walk(t, (n) => n.key && m.set(n.key, n)); return m; };
  const em = new Emitter({ assets, icons: iconLib, registry, page: route, bps });
  em.demoteExtraH1 = true;
  if (isTemplate) { em.cmsStack.push({ collection: coll, v: "entry" }); em.collections.add(coll); }
  const maps = bps.map((b, i) => (i === 0 ? null : index(b.tree)));
  const markup = em.emit(bps[0].tree, { nodes: bps.map((b) => b.tree), maps, root: true });
  const name = route === "/" ? "index" : isTemplate ? route.replace(/:.*$/, "[slug]").slice(1) : route.slice(1);
  const depth = name.split("/").length;
  const rel = "../".repeat(depth);
  const imports = [`import Base from "${rel}layouts/Base.astro";`, ...[...em.imports].map((i) => i.replace("@/", rel))];
  const data = [];
  if (em.collections.size) {
    imports.push(`import { getPosts, getProducts } from "${rel}lib/cms";`);
    if (em.collections.has("Posts")) data.push("const posts = await getPosts();");
    if (em.collections.has("Products")) data.push("const products = await getProducts();");
  }
  if (markup.includes("searchTerm")) data.push('const searchTerm = ""; // filtering happens client-side (SearchFilter)');
  let finalMarkup = unifySpecPanels(markup, imports, rel);
  if (route === "/search") { imports.push(`import SearchFilter from "${rel}components/SearchFilter.astro";`); finalMarkup += "\n<SearchFilter />"; }
  // only blog posts and products are indexed for /search
  if (isTemplate) finalMarkup = finalMarkup.replace(/^<div class="/, '<div data-pagefind-body class="');
  imports.push(`import "${rel}styles/pages/${name.replace("[slug]", "_slug")}.css";`);
  let base = `<Base path="${route}">`;
  if (isTemplate) {
    const list = coll === "Posts" ? "getPosts" : "getProducts";
    const dir = coll === "Posts" ? "/blog/" : "/products/";
    if (!imports.some((i) => i.includes("lib/cms"))) imports.push(`import { getPosts, getProducts } from "${rel}lib/cms";`);
    data.unshift(
      `export async function getStaticPaths() {\n  return (await ${list}()).map((entry) => ({ params: { slug: entry.id }, props: { entry } }));\n}`,
      `const { entry } = Astro.props;`,
      `const path = "${dir}" + entry.id;`,
      coll === "Posts" ? `const seo = blogSeo(path, entry);` : `const seo = productSeo(path, entry);`,
    );
    imports.push(`import { blogSeo, productSeo } from "${rel}lib/seo";`);
    base = `<Base path={path} seo={seo}>`;
  }
  const astro = `---\n// Converted from Framer by scripts/framer/compile.mjs, then maintained by hand.\n${imports.join("\n")}\n${data.join("\n")}\n---\n${base}\n${finalMarkup}\n</Base>\n`;
  fs.mkdirSync(path.dirname(`src/pages/${name}.astro`), { recursive: true });
  fs.writeFileSync(`src/pages/${name}.astro`, astro);
  const cssName = name.replace("[slug]", "_slug");
  fs.mkdirSync(path.dirname(`src/styles/pages/${cssName}.css`), { recursive: true });
  fs.writeFileSync(`src/styles/pages/${cssName}.css`, `/* Converted from Framer. Breakpoints: desktop >=1200, tablet 810-1199, phone <810. */\n` + em.css());
  report.warnings[route] = em.warnings;
  report.textDiffs.push(...em.textDiffs.map((d) => ({ route, ...d })));
  report.headings.push(...em.headingLog.map((h) => ({ route, ...h })));
  console.log(route, "rules", em.rules.size, "warnings", em.warnings.length);
}
fs.mkdirSync("capture/compile", { recursive: true });
fs.writeFileSync(`capture/compile/report${ONLY ? "-" + ONLY.replace(/\W/g, "_") : ""}.json`, JSON.stringify(report, null, 1));

// Fiber pages: replace each hero spec box with the shared SpecPanel component so every page
// shows an identical box (Tom, 2026-10-22). Text is taken from the page unchanged.
function unifySpecPanels(markup, imports, rel) {
  const open = '<div class="technical-summary-panel ';
  let out = markup, i;
  while ((i = out.indexOf(open)) !== -1) {
    let depth = 0, j = i;
    const re = /<(\/?)div\b[^>]*>/g;
    re.lastIndex = i;
    let m;
    while ((m = re.exec(out))) { depth += m[1] ? -1 : 1; if (depth === 0) { j = re.lastIndex; break; } }
    const block = out.slice(i, j);
    const text = (h) => h.replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").trim();
    const title = text((block.match(/<h2[^>]*>([\s\S]*?)<\/h2>/) || [])[1] || "");
    const chipsHtml = (block.match(/<div class="cable-chips[^"]*">([\s\S]*)<\/div><div class="x[a-z0-9]+"><p/) || [])[1] || "";
    const chips = [...chipsHtml.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/g)].map((x) => text(x[1]));
    const ps = [...block.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/g)].map((x) => text(x[1]));
    const note = ps[ps.length - 1] || "";
    const q = (v) => JSON.stringify(v);
    out = out.slice(0, i) + `<SpecPanel title={${q(title)}} chips={${q(chips)}} note={${q(note)}} />` + out.slice(j);
    const imp = `import SpecPanel from "${rel}components/SpecPanel.astro";`;
    if (!imports.includes(imp)) imports.push(imp);
  }
  return out;
}
