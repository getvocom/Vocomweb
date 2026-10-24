// sitemap.xml with the same URL set (and order) as the live Framer sitemap.
// Static pages are listed explicitly; blog posts and products come from the content
// collections, so new entries are added automatically. /search and /404 are excluded.
// Product pages and the pages with category renders also list their main image
// (Google image sitemap extension), so the renders can be found in image search.
import { getPosts, getProducts } from "../lib/cms";
import renders from "../../data/render-images.json";

const SITE = "https://www.vocom.ai";
const STATIC = [
  "/", "/vocomai-supply-chain", "/vocomai-coach-hub", "/vocomai-vocam", "/contact-vocomai", "/resources", "/pricing-vocomai",
  "/vocom-ai", "/vocom-ai-servers", "/vocomai-gpu-solutions", "/vocomai-manufacturing", "/vocom-international", "/vocom-ai-agents",
  "/vocom-services", "/about", "/vocom-privacy-policy", "/blog", "/vocomai-consultancy", "/marketing-alliance", "/fiber-optic-cables",
  "/loose-tube-fiber-optic-cable", "/ribbon-fiber-optic-cable", "/data-center-fiber-cabling", "/air-blown-micro-fiber-cable",
  "/ftth-drop-cable", "/adss-aerial-fiber-cable", "/fiber-optic-cable-catalog",
  // added 2026-10-22 (blocked on Framer by the plan's page limit)
  "/fiber-optic-cable-for-distributors", "/indoor-fiber-optic-cable", "/fiber-optic-cable-referral-partners", "/fiber-optic-connectors-and-hardware", "/iepl-iplc-private-leased-circuits", "/wholesale-voice-termination",
  // added 2026-10-24
  "/case-studies",
];

// Category pages that show a hero render (see src/pages/<page>.astro)
const hero = (id: keyof typeof renders.hero) => `/assets/img/hero/${renders.hero[id]}-1920.jpg`;
const PAGE_IMAGES: Record<string, string[]> = {
  "/data-center-fiber-cabling": [hero("VC-104")],
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
