// Converts the shared Framer components (navigation and footer) into Astro components.
// Component variables that differ between pages become props; the page passes them in.
// Usage: node scripts/framer/compile-chrome.mjs
import fs from "node:fs";
import { resolve, comps } from "./resolve.mjs";
import { Emitter, usableBps } from "./emit.mjs";
import { registry, OPAQUE } from "./registry.mjs";
import { loadAssets } from "./assets-map.mjs";
import { iconLib } from "./icons.mjs";

const assets = loadAssets();
const home = JSON.parse(fs.readFileSync("capture/framer/pages/index.json", "utf8"));

const TARGETS = [
  { display: "Navigation Bar 2", out: "Header", props: [] },
  { display: "Simple Footer 2", out: "Footer", props: ["footerTagline", "title", "menu1", "menu2", "menu3", "link1", "link2", "link3"] },
];

function findInstance(bp, display) {
  return (bp.children || []).find((c) => c.$componentDisplayName === display);
}

for (const T of TARGETS) {
  const opaque = new Set([...OPAQUE].filter((x) => x !== T.display));
  const rawBps = home.children.filter((c) => c.$mediaQuery);
  const primary = rawBps.find((b) => b.$isPrimary);
  const bps = [];
  for (const b of rawBps) {
    const inst = findInstance(b, T.display);
    if (!inst) continue;
    const attrs = { ...inst.attributes, width: "100%", position: "relative" };
    delete attrs.positionStickyTop; delete attrs.zIndex;
    for (const p of T.props) attrs["$control__" + p] = { prop: p };
    const synth = { ...inst, id: "root", $originalId: "root", attributes: attrs, children: [] };
    const tree = resolve(synth, { vars: {}, parent: null }, "", null, { opaque });
    bps.push({ name: b.$mediaQuery.name, range: b.$mediaQuery.range, primary: b === primary, tree });
  }
  const use = usableBps(bps);
  const em = new Emitter({ assets, icons: iconLib, registry, page: T.out, bps: use });
  const walk = (t, fn) => { fn(t); (t.children || []).forEach((c) => walk(c, fn)); };
  const maps = use.map((b, i) => { if (!i) return null; const m = new Map(); walk(b.tree, (n) => m.set(n.key, n)); return m; });
  const pageRoot = { layout: "stack", stackDirection: "vertical", stackAlignment: "center" };
  const markup = em.emit(use[0].tree, { nodes: use.map((b) => b.tree), maps, parents: use.map(() => pageRoot) });
  // defaults = the homepage instance's values
  const inst = findInstance(primary, T.display);
  const defaults = Object.fromEntries(T.props.map((p) => [p, inst.attributes["$control__" + p] ?? ""]));
  const name = T.out.toLowerCase();
  const fm = [
    `// Converted from the Framer "${T.display}" component by scripts/framer/compile-chrome.mjs.`,
    `import "../styles/components/${name}.css";`,
    T.props.length ? `interface Props { ${T.props.map((p) => `${p}?: string;`).join(" ")} }` : "",
    T.props.length ? `const { ${T.props.map((p) => `${p} = ${JSON.stringify(defaults[p])}`).join(", ")} } = Astro.props;` : "",
  ].filter(Boolean).join("\n");
  fs.mkdirSync("src/styles/components", { recursive: true });
  fs.writeFileSync(`src/components/${T.out}.astro`, `---\n${fm}\n---\n${markup}\n`);
  fs.writeFileSync(`src/styles/components/${name}.css`, `/* Converted from Framer "${T.display}". */\n` + em.css());
  console.log(T.out, "rules", em.rules.size, "warnings", em.warnings.length, em.warnings.slice(0, 10));
}
