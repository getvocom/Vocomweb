// Lists a page's text slots in the order scripts/framer/extra-pages.json replaces them.
// Usage: node scripts/framer/list-slots.mjs /vocom-services
import fs from "node:fs";
import path from "node:path";
const DIR = "capture/framer/pages";
const route = process.argv[2];
const page = fs.readdirSync(DIR).filter((f) => f.endsWith(".json")).map((f) => JSON.parse(fs.readFileSync(path.join(DIR, f), "utf8"))).find((p) => p.attributes.path === route);
if (!page) throw new Error(`no page ${route}`);
const prim = page.children.find((c) => c.$isPrimary);
const textOf = (n) => (function t(x) { return x.type === "TextRun" ? x.attributes?.text ?? "" : (x.children || []).map(t).join(""); })(n);
let i = 0;
(function w(n) {
  if (n.type === "ComponentInstanceNode") return;
  if (n.type === "RichTextNode") { if (!String(n.attributes?.text ?? "").startsWith("var(")) console.log(i++, "|", n.name || "", "|", textOf(n).replace(/\s+/g, " ").slice(0, 140)); return; }
  (n.children || []).forEach(w);
})(prim);
