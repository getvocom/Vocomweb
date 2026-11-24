// /llms.txt (https://llmstxt.org): a plain-text map of the site for AI assistants and
// AI search. Built only from each page's existing <title> and meta description (no new
// copy), so it stays in sync automatically, including new blog posts and products.
import { headFor } from "../lib/head";
import { blogSeo, productSeo } from "../lib/seo";
import { getPosts, getProducts } from "../lib/cms";
import { SECTIONS } from "../lib/static-pages";
import { SITES } from "../data/data-centers";

const SITE = "https://www.vocom.ai";
const meta = (path: string, seo?: Parameters<typeof headFor>[1]) => {
  const h = headFor(path, seo);
  const desc = h.meta.find((m) => m.name === "description")?.content ?? "";
  return { title: h.title.replace(/\s*\|\s*Vocom.*$/, ""), desc };
};
const line = (path: string, m: { title: string; desc: string }) => `- [${m.title}](${SITE}${encodeURI(path)})${m.desc ? `: ${m.desc}` : ""}`;

export async function GET() {
  const home = meta("/");
  const out = [`# Vocom`, "", `> ${home.desc}`, ""];
  for (const [name, paths] of SECTIONS) {
    out.push(`## ${name}`, "", ...paths.map((p) => line(p, meta(p))), "");
  }
  // one page per region and per site (src/pages/data-centers/[slug].astro): headline specs only
  out.push("## Data center sites by region", "", ...SITES.flatMap((r) => [
    `- [Data center sites: ${r.region}](${SITE}/data-centers/${r.slug}): ${r.sites.map((x) => `${x.location.replace(/ campus$/, "")} (${x.capacity})`).join(", ")}`,
    ...r.sites.map((x) => `- [${x.location.replace(/ campus$/, "")} data center site, ${x.capacity}](${SITE}/data-centers/${x.slug})${x.notes ? `: ${x.notes}` : ""}`),
  ]), "");
  out.push("## Blog", "", ...(await getPosts()).map((e) => { const p = "/blog/" + e.id; return line(p, meta(p, blogSeo(p, e))); }), "");
  out.push("## Products", "", ...(await getProducts()).map((e) => { const p = "/products/" + e.id; return line(p, meta(p, productSeo(p, e))); }), "");
  out.push("## Optional", "", `- [Full product specifications and articles](${SITE}/llms-full.txt): every product and blog post in full`, `- [Sitemap](${SITE}/sitemap.xml)`, "");
  return new Response(out.join("\n"), { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
