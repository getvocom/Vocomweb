// sitemap.xml with the same URL set (and order) as the live Framer sitemap.
// Static pages are listed in src/lib/static-pages.ts; blog posts and products come from the content
// collections, so new entries are added automatically. /search and /404 are excluded.
// Product pages and the pages with category renders also list their main image
// (Google image sitemap extension), so the renders can be found in image search.
import { getPosts, getProducts } from "../lib/cms";
import renders from "../../data/render-images.json";
import { STATIC } from "../lib/static-pages";
import { SITES } from "../data/data-centers";

const SITE = "https://www.vocom.ai";
// Category pages that show a hero render (see src/pages/<page>.astro)
const hero = (id: keyof typeof renders.hero) => `/assets/img/hero/${renders.hero[id]}-1920.jpg`;
const PAGE_IMAGES: Record<string, string[]> = {
  "/data-center-fiber-cabling": [hero("VC-104")],
  "/mtp-trunk-cable": [hero("VC-104")],
  "/enterprise-fiber-optic-cable": ["/assets/img/rollable-ribbon-fiber-optic-cable-beb7db.png"],
  "/6912-fiber-optic-cable": ["/assets/img/products/high-fiber-count-ribbon-cable-1200.jpg", "/assets/img/rollable-ribbon-fiber-optic-cable-beb7db.png"],
  "/1728-fiber-optic-cable": ["/assets/img/products/high-fiber-count-ribbon-cable-1200.jpg", "/assets/img/rollable-ribbon-fiber-optic-cable-beb7db.png"],
  "/optical-transceivers": ["/assets/img/products/optical-transceivers-lineup-1200.jpg", "/assets/img/optical-transceivers-in-switch-1680.jpg", "/assets/img/ai-cluster-reference-topology-2400.jpg"],
  "/air-blown-micro-fiber-cable": [hero("VC-109")],
  "/ftth-drop-cable": [hero("VC-108")],
  "/fiber-optic-cables": [hero("VC-105")],
  "/about": ["/assets/img/photos/kevin-huang-ise-expo-2026-wasin-fujikura-stand-1600.jpg"],
  "/case-studies": ["/assets/img/photos/kevin-huang-ise-expo-2026-wasin-fujikura-stand-1600.jpg"],
};

const esc = (s: string) => s.replace(/&/g, "&amp;");

export async function GET() {
  const products = await getProducts();
  for (const p of products) if (p.data.image?.src) PAGE_IMAGES["/products/" + p.id] = [p.data.image.src];
  const paths = [
    ...STATIC,
    ...SITES.flatMap((r) => [r.slug, ...r.sites.map((x) => x.slug)]).map((slug) => "/data-centers/" + slug),
    ...(await getPosts()).map((p) => "/blog/" + p.id),
    ...products.map((p) => "/products/" + p.id),
  ];
  const url = (p: string) => {
    const images = (PAGE_IMAGES[p] ?? []).map((i) => `<image:image><image:loc>${esc(SITE + i)}</image:loc></image:image>`).join("");
    return `<url><loc>${esc(SITE + encodeURI(p))}</loc>${images}</url>`;
  };
  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n${paths.map(url).join("\n")}\n</urlset>`;
  return new Response(body, { headers: { "Content-Type": "application/xml" } });
}
