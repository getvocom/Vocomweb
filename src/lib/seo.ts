// SEO for CMS entries. Existing URLs use the head captured from the live site
// (src/data/head); these values are the fallback for new posts/products and follow
// the Framer templates: blog title = Meta Title, product title = "<Name> | Fiber Optic Cable | Vocom".
import renders from "../../data/render-images.json";

const SITE = "https://www.vocom.ai";
const abs = (src?: string) => (src ? (src.startsWith("http") ? src : SITE + src) : undefined);

export function blogSeo(path: string, entry: { data: any }) {
  const d = entry.data;
  return { title: d.metaTitle ?? d.title, description: d.description ?? "", image: abs(d.image?.src), canonical: SITE + encodeURI(path), blogPosting: true };
}

export function productSeo(path: string, entry: { data: any }) {
  const d = entry.data;
  return { title: d.metaTitle ?? `${d.name} | Fiber Optic Cable | Vocom`, description: d.metaDescription ?? d.description ?? "", image: abs(d.image?.src), canonical: SITE + encodeURI(path), override: { title: d.metaTitle, description: d.metaDescription, ...productImage(d) } };
}

// Product render as the page's link-preview image (1200px JPG; see scripts/render-images.mjs).
function productImage(d: any) {
  const src: string | undefined = d.image?.src;
  const r = src ? Object.values(renders.products).find((x: any) => src === `/assets/img/products/${x.name}-1200.jpg`) as any : undefined;
  if (!r) return {};
  return { image: abs(src), imageAlt: d.image.alt, imageWidth: r.w, imageHeight: r.h };
}
