// sitemap.xml with the same URL set (and order) as the live Framer sitemap.
// Static pages are listed explicitly; blog posts and products come from the content
// collections, so new entries are added automatically. /search and /404 are excluded.
import { getPosts, getProducts } from "../lib/cms";

const SITE = "https://www.vocom.ai";
const STATIC = [
  "/", "/vocomai-supply-chain", "/vocomai-coach-hub", "/vocomai-vocam", "/contact-vocomai", "/resources", "/pricing-vocomai",
  "/vocom-ai", "/vocom-ai-servers", "/vocomai-gpu-solutions", "/vocomai-manufacturing", "/vocom-international", "/vocom-ai-agents",
  "/vocom-services", "/about", "/vocom-privacy-policy", "/blog", "/vocomai-consultancy", "/marketing-alliance", "/fiber-optic-cables",
  "/loose-tube-fiber-optic-cable", "/ribbon-fiber-optic-cable", "/data-center-fiber-cabling", "/air-blown-micro-fiber-cable",
  "/ftth-drop-cable", "/adss-aerial-fiber-cable", "/fiber-optic-cable-catalog",
];

export async function GET() {
  const paths = [
    ...STATIC,
    ...(await getPosts()).map((p) => "/blog/" + p.id),
    ...(await getProducts()).map((p) => "/products/" + p.id),
  ];
  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${paths.map((p) => `<url><loc>${SITE}${encodeURI(p).replace(/&/g, "&amp;")}</loc></url>`).join("\n")}\n</urlset>`;
  return new Response(body, { headers: { "Content-Type": "application/xml" } });
}
