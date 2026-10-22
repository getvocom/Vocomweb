// Dev helper: inspect a component on the live site.
// node scripts/probe.mjs <path> "<text inside the component>" [width] [--click]
// Prints the nearest Framer code-component container's HTML (trimmed) with computed
// styles for each element, and saves a screenshot to capture/probe/<slug>.png.
import fs from "node:fs";
import { chromium } from "playwright";

const [route, needle, w = "1440"] = process.argv.slice(2);
const click = process.argv.includes("--click");
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: Number(w), height: 900 } });
await p.goto("https://www.vocom.ai" + encodeURI(route), { waitUntil: "networkidle" });
const handle = await p.evaluateHandle((needle) => {
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const el = walker.currentNode.parentElement;
    if (walker.currentNode.textContent.includes(needle) && el.getClientRects().length && getComputedStyle(el).visibility !== "hidden") {
      let e = el;
      while (e && !(e.className && String(e.className).includes("-container"))) e = e.parentElement;
      return e || el;
    }
  }
  return null;
}, needle);
const el = handle.asElement();
if (!el) { console.log("not found"); process.exit(1); }
await el.scrollIntoViewIfNeeded();
fs.mkdirSync("capture/probe", { recursive: true });
const slug = (route + "-" + needle).replace(/\W+/g, "-").slice(0, 60);
await el.screenshot({ path: `capture/probe/${slug}.png` });
const dump = async () => p.evaluate((root) => {
  const keys = ["display", "flexDirection", "gap", "padding", "margin", "width", "height", "background", "backgroundColor", "border", "borderRadius", "boxShadow", "color", "fontFamily", "fontSize", "fontWeight", "lineHeight", "letterSpacing", "textAlign", "opacity", "transform", "transition", "justifyContent", "alignItems", "cursor", "overflow"];
  const def = document.createElement("div"); document.body.appendChild(def);
  const base = getComputedStyle(def);
  const out = [];
  const walk = (e, d) => {
    if (d > 12) return;
    const s = getComputedStyle(e), r = e.getBoundingClientRect();
    if (s.display === "none") return;
    const props = keys.filter((k) => s[k] && s[k] !== base[k] && !(k === "width" || k === "height")).map((k) => `${k}:${s[k]}`).join("; ");
    const own = [...e.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent.trim()).join(" ").slice(0, 80);
    out.push(`${"  ".repeat(d)}<${e.tagName.toLowerCase()}${e.getAttribute("data-framer-name") ? ` name="${e.getAttribute("data-framer-name")}"` : ""}> ${Math.round(r.width)}x${Math.round(r.height)} ${own ? JSON.stringify(own) : ""} {${props}}`);
    if (e.tagName === "svg") { out.push("  ".repeat(d + 1) + e.outerHTML.slice(0, 300)); return; }
    for (const c of e.children) walk(c, d + 1);
  };
  walk(root, 0);
  def.remove();
  return out.join("\n");
}, el);
console.log(await dump());
if (click) {
  await el.click({ position: { x: 20, y: 20 } });
  await p.waitForTimeout(900);
  await el.screenshot({ path: `capture/probe/${slug}-open.png` });
  console.log("\n===== AFTER CLICK =====\n" + (await dump()));
}
console.log("screenshot capture/probe/" + slug + ".png");
await b.close();
