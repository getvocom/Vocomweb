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

type Seo = Partial<HeadData> & { description?: string; image?: string; canonical?: string; blogPosting?: boolean };

export function headFor(path: string, seo?: Seo): HeadData {
  const base = byKey[headKey(path)];
  if (base && !seo) return base;
  const head = build(path, base, seo);
  if (seo?.blogPosting) head.jsonld = [...head.jsonld, blogPosting(head)];
  return head;
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
