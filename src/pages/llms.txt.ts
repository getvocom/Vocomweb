// /llms.txt (https://llmstxt.org): a plain-text map of the site for AI assistants and
// AI search. Built only from each page's existing <title> and meta description (no new
// copy), so it stays in sync automatically, including new blog posts and products.
import { headFor } from "../lib/head";
import { blogSeo, productSeo } from "../lib/seo";
import { getPosts, getProducts } from "../lib/cms";

const SITE = "https://www.vocom.ai";
const SECTIONS: [string, string[]][] = [
  ["Fiber optic cable", ["/fiber-optic-cables", "/fiber-optic-cable-catalog", "/loose-tube-fiber-optic-cable", "/ribbon-fiber-optic-cable", "/data-center-fiber-cabling", "/air-blown-micro-fiber-cable", "/ftth-drop-cable", "/adss-aerial-fiber-cable", "/fiber-optic-cable-for-distributors", "/indoor-fiber-optic-cable", "/fiber-optic-cable-referral-partners", "/fiber-optic-connectors-and-hardware"]],
  ["Telecom services (Vocom International)", ["/vocom-international", "/vocom-services", "/iepl-iplc-private-leased-circuits", "/wholesale-voice-termination"]],
  ["Vocom AI", ["/vocom-ai", "/vocom-ai-agents", "/vocom-ai-servers", "/vocomai-gpu-solutions", "/vocomai-supply-chain", "/vocomai-coach-hub", "/vocomai-vocam", "/vocomai-manufacturing", "/vocomai-consultancy", "/pricing-vocomai"]],
  ["Company", ["/about", "/case-studies", "/contact-vocomai", "/marketing-alliance", "/resources", "/blog", "/vocom-privacy-policy"]],
];

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
  out.push("## Blog", "", ...(await getPosts()).map((e) => { const p = "/blog/" + e.id; return line(p, meta(p, blogSeo(p, e))); }), "");
  out.push("## Products", "", ...(await getProducts()).map((e) => { const p = "/products/" + e.id; return line(p, meta(p, productSeo(p, e))); }), "");
  out.push("## Optional", "", `- [Full product specifications and articles](${SITE}/llms-full.txt): every product and blog post in full`, `- [Sitemap](${SITE}/sitemap.xml)`, "");
  return new Response(out.join("\n"), { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
