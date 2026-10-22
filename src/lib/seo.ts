// SEO for CMS entries. Existing URLs use the head captured from the live site
// (src/data/head); these values are the fallback for new posts/products and follow
// the Framer templates: blog title = Meta Title, product title = "<Name> | Fiber Optic Cable | Vocom".
const SITE = "https://www.vocom.ai";
const abs = (src?: string) => (src ? (src.startsWith("http") ? src : SITE + src) : undefined);

export function blogSeo(path: string, entry: { data: any }) {
  const d = entry.data;
  return { title: d.metaTitle ?? d.title, description: d.description ?? "", image: abs(d.image?.src), canonical: SITE + encodeURI(path), blogPosting: true };
}

export function productSeo(path: string, entry: { data: any }) {
  const d = entry.data;
  return { title: d.metaTitle ?? `${d.name} | Fiber Optic Cable | Vocom`, description: d.metaDescription ?? d.description ?? "", image: abs(d.image?.src), canonical: SITE + encodeURI(path), override: { title: d.metaTitle, description: d.metaDescription } };
}
