// SEO head data. Every live URL has a JSON file in src/data/head, keyed by its path
// ("/" -> index, "/blog/x" -> blog__x). Values were copied verbatim from the live
// Framer site; asset URLs were rewritten to the self-hosted copies.
export interface MetaTag { name?: string; property?: string; content: string }
export interface LinkTag { rel: string; href: string; media?: string }
export interface HeadData {
  title: string;
  lang: string;
  meta: MetaTag[];
  links: LinkTag[];
  jsonld: string[];
}

const files = import.meta.glob<HeadData>("../data/head/*.json", { eager: true, import: "default" });
const byKey: Record<string, HeadData> = {};
for (const [file, data] of Object.entries(files)) byKey[file.split("/").pop()!.replace(/\.json$/, "")] = data;

export const headKey = (path: string) => (path === "/" ? "index" : decodeURIComponent(path).replace(/^\//, "").replace(/\//g, "__"));

const SITE = "https://www.vocom.ai";

// `override` replaces the captured title/description (and their OG/Twitter copies) when a
// content entry sets metaTitle/metaDescription, e.g. a product page needing its own title.
type Seo = Partial<HeadData> & { description?: string; image?: string; canonical?: string; blogPosting?: boolean; override?: { title?: string; description?: string; image?: string; imageAlt?: string; imageWidth?: number; imageHeight?: number } };

export function headFor(path: string, seo?: Seo): HeadData {
  const base = byKey[headKey(path)];
  if (base && !seo) return base;
  const head = applyOverride(build(path, base, seo), seo?.override);
  if (seo?.blogPosting) head.jsonld = [...head.jsonld, blogPosting(head)];
  return head;
}

function applyOverride(h: HeadData, o?: { title?: string; description?: string; image?: string; imageAlt?: string; imageWidth?: number; imageHeight?: number }): HeadData {
  if (!o?.title && !o?.description && !o?.image) return h;
  const meta = h.meta.map((m) => {
    const k = "name" in m ? m.name : m.property;
    if (o.title && (k === "og:title" || k === "twitter:title")) return { ...m, content: o.title };
    if (o.description && (k === "description" || k === "og:description" || k === "twitter:description")) return { ...m, content: o.description };
    if (o.image && (k === "og:image" || k === "twitter:image")) return { ...m, content: o.image };
    return m;
  });
  // image details for link previews (added once, next to the image tags)
  if (o.image) {
    const extra: MetaTag[] = [];
    if (o.imageWidth && o.imageHeight) extra.push({ property: "og:image:width", content: String(o.imageWidth) }, { property: "og:image:height", content: String(o.imageHeight) });
    if (o.imageAlt) extra.push({ property: "og:image:alt", content: o.imageAlt }, { name: "twitter:image:alt", content: o.imageAlt });
    for (const e of extra) if (!meta.some((m) => ("name" in m ? m.name : m.property) === ("name" in e ? e.name : e.property))) meta.push(e);
  }
  return { ...h, title: o.title ?? h.title, meta };
}

// Same object the live site injects with JavaScript on /blog/* pages, rendered statically.
function blogPosting(h: HeadData) {
  const meta = (k: string) => h.meta.find((m) => m.name === k || m.property === k)?.content ?? "";
  const canonical = h.links.find((l) => l.rel === "canonical")?.href ?? "";
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: h.title || meta("og:title"),
    description: meta("description"),
    image: meta("og:image"),
    url: canonical,
    mainEntityOfPage: { "@type": "WebPage", "@id": canonical },
    publisher: { "@id": "https://www.vocom.ai/#organization" },
    isPartOf: { "@id": "https://www.vocom.ai/#website" },
  });
}

function build(path: string, base: HeadData | undefined, seo?: Seo): HeadData {
  // Built from CMS fields (new posts/products) when there is no captured head.
  const fallback = base ?? byKey["index"];
  const canonical = seo?.canonical ?? SITE + encodeURI(path);
  const meta: MetaTag[] = base?.meta ?? [
    { property: "og:url", content: canonical },
    { name: "description", content: seo?.description ?? "" },
    { property: "og:type", content: "website" },
    { property: "og:title", content: seo?.title ?? "" },
    { property: "og:description", content: seo?.description ?? "" },
    { property: "og:image", content: seo?.image ?? "" },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: seo?.title ?? "" },
    { name: "twitter:description", content: seo?.description ?? "" },
    { name: "twitter:image", content: seo?.image ?? "" },
    { name: "robots", content: "max-image-preview:large" },
  ];
  return {
    title: base?.title ?? seo?.title ?? "",
    lang: "en",
    meta,
    links: base?.links ?? [{ rel: "canonical", href: canonical }, ...fallback.links.filter((l) => l.rel !== "canonical")],
    jsonld: [...(base?.jsonld ?? fallback.jsonld.filter(isSiteWide))],
  };
}

const isSiteWide = (j: string) => j.includes('"@graph"') && j.includes("#organization");

export function splitJsonLd(list: string[]) {
  return { page: list.filter((j) => !isSiteWide(j)), site: list.filter(isSiteWide) };
}
