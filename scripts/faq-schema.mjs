// Rebuilds each page's FAQPage JSON-LD from the FAQs visible on the built page, so the schema
// always matches the on-page questions and answers (Google requires the two to agree).
// Usage: npm run build && node scripts/faq-schema.mjs [--write]   (without --write it only reports)
// Reads dist/<page>.html, updates src/data/head/<page>.json. Rebuild afterwards.
import fs from "node:fs";

const WRITE = process.argv.includes("--write");
const decode = (s) => s.replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;|&#x27;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();

export function visibleFaqs(html) {
  const out = new Map();
  // 1. <FaqItem> accordions
  for (const m of html.matchAll(/<summary class="faq-q"[^>]*>([\s\S]*?)<\/summary>\s*<div class="faq-a"[^>]*>([\s\S]*?)<\/div>\s*<\/details>/g)) out.set(decode(m[1]), decode(m[2]));
  // 2. Framer FAQ sections: a section/div whose class names a FAQ, holding question headings each followed by an answer paragraph
  for (const sec of html.matchAll(/<(section|div) class="[^"]*\bfaq[\w-]*\b[^"]*"[^>]*>([\s\S]*?)(?=<(?:section|footer)\b|$)/g)) {
    for (const m of sec[2].matchAll(/<h[3-6] class="[^"]*">([^<]+\?)<\/h[3-6]>\s*<p class="[^"]*">([\s\S]*?)<\/p>/g)) {
      const q = decode(m[1]);
      if (/^Ready to /.test(q)) continue; // the call-to-action heading under the FAQ, not a question
      if (!out.has(q)) out.set(q, decode(m[2]));
    }
  }
  return [...out].map(([q, a]) => ({ q, a }));
}

const nodesOf = (o) => (Array.isArray(o) ? o : o["@graph"] || [o]);
let changed = 0;
for (const f of fs.readdirSync("src/data/head").filter((f) => f.endsWith(".json") && !f.includes("__"))) {
  const key = f.slice(0, -5);
  const page = `dist/${key}.html`;
  if (!fs.existsSync(page)) continue;
  const faqs = visibleFaqs(fs.readFileSync(page, "utf8"));
  if (!faqs.length) continue;
  const head = JSON.parse(fs.readFileSync(`src/data/head/${f}`, "utf8"));
  const mainEntity = faqs.map(({ q, a }) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } }));
  let placed = false;
  const before = JSON.stringify(head.jsonld);
  head.jsonld = head.jsonld.flatMap((s) => {
    const o = JSON.parse(s);
    const nodes = nodesOf(o);
    if (!nodes.some((n) => n["@type"] === "FAQPage")) return [s];
    if (o["@type"] === "FAQPage") { if (placed) return []; placed = true; return [JSON.stringify({ ...o, mainEntity }, null, 2)]; }
    o["@graph"] = nodes.filter((n) => { if (n["@type"] !== "FAQPage") return true; if (placed) return false; placed = true; n.mainEntity = mainEntity; return true; });
    return [JSON.stringify(o, null, 2)];
  });
  if (!placed) head.jsonld.push(JSON.stringify({ "@context": "https://schema.org", "@type": "FAQPage", mainEntity }, null, 2));
  if (JSON.stringify(head.jsonld) === before) continue;
  changed++;
  console.log(`${key}: ${faqs.length} FAQs${placed ? "" : " (new FAQPage)"}`);
  if (WRITE) fs.writeFileSync(`src/data/head/${f}`, JSON.stringify(head, null, 1));
}
console.log(`${changed} pages ${WRITE ? "updated" : "would change"}`);
