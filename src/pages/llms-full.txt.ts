// /llms-full.txt: the long form of /llms.txt for AI assistants and AI search. Every product with
// its full specification, then every blog post in full, as plain Markdown. Built only from the
// content collections and page titles/descriptions, so it never says anything the site doesn't.
import { headFor } from "../lib/head";
import { getPosts, getProducts } from "../lib/cms";
import { CATEGORY_PAGES } from "../lib/categories";

const SITE = "https://www.vocom.ai";
const desc = (path: string) => headFor(path).meta.find((m) => m.name === "description")?.content ?? "";

export async function GET() {
  const out: string[] = [
    "# Vocom: full product and article text",
    "",
    `> ${desc("/")}`,
    "",
    "Vocom International (founded 1998, El Monte, California, and Taipei) supplies build-to-order fiber optic cable, connectivity and carrier services. Contact: kevin@getvocom.com, +1-213-627-8999, " + SITE + "/contact-vocomai",
    "",
    "## Products",
    "",
  ];
  const products = await getProducts();
  const byCat = new Map<string, typeof products>();
  for (const p of products) byCat.set(p.data.category, [...(byCat.get(p.data.category) ?? []), p]);
  for (const [cat, list] of byCat) {
    const page = CATEGORY_PAGES[cat];
    out.push(`### ${cat}`, "", page ? `Category page: ${SITE}${page[1]}` : "", "");
    for (const p of list) {
      const d = p.data;
      out.push(`#### ${d.name}`, `URL: ${SITE}/products/${p.id}`);
      if (d.codes) out.push(`- Codes: ${d.codes}`);
      if (d.fiberCounts) out.push(`- Fiber counts: ${d.fiberCounts}`);
      if (d.construction) out.push(`- Construction and rating: ${d.construction}`);
      if (d.typicalUse) out.push(`- Typical use: ${d.typicalUse}`);
      if (d.description) out.push("", d.description);
      out.push("");
    }
  }
  out.push("## Articles", "");
  for (const e of await getPosts()) {
    const d = e.data as Record<string, string | undefined>;
    out.push(`### ${d.title ?? d.cardTitle}`, `URL: ${SITE}/blog/${e.id}`, "");
    if (d.intro) out.push(d.intro, "");
    for (let i = 1; i <= 5; i++) {
      if (d[`section${i}Title`]) out.push(`#### ${d[`section${i}Title`]}`, "");
      if (d[`section${i}Body`]) out.push(String(d[`section${i}Body`]), "");
    }
    for (const [h, b] of [["bottomHeading", "bottomBody"], ["finalHeading", "finalBody"]]) {
      if (d[h]) out.push(`#### ${d[h]}`, "");
      if (d[b]) out.push(String(d[b]), "");
    }
  }
  return new Response(out.filter((l, i, a) => !(l === "" && a[i - 1] === "")).join("\n"), { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
