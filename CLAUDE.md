# vocom.ai: working rules for this repo

This is the code-based rebuild of www.vocom.ai, which used to be on Framer. It's a static Astro site deployed to Cloudflare Pages. Every live URL, word of copy and SEO tag was carried over 1:1. The job of this file is to keep it that way.

## Non-negotiables

1. **Copy is never edited without Tom's approval.**
   - That includes typos, title case, truncated headings and "fiber"/"fibre" spelling.
   - Log anything odd in `notes/flags.md` and ask.
2. **URLs never change.**
   - Keep the www host, no trailing slash, and exact slugs, including the ones with `’`, `—`, `“”` or a trailing `.`.
   - A content entry's `slug` is its URL and is frozen once published.
   - Removed or renamed URLs need a 301 in `public/_redirects`.
3. **SEO fields are copied, not invented.**
   - Every page needs a title, meta description, absolute canonical (`https://www.vocom.ai/...`), OG + Twitter tags, robots and favicon.
   - It also keeps any JSON-LD it already has.
   - Exactly one `<h1>` per page.
4. **No invented stats, logos, images or claims.**
   - Stats are static HTML with their final values (1998, 100+, 99.9%, 25K+, 24/7). Never count up from 0.
5. **Tokens only.**
   - Colours, fonts, radii and shadows come from `src/styles/tokens.css`.
   - If a new value repeats, add a token rather than another raw value.

## Folder structure

```
src/
  pages/            one .astro file per live URL (converted from Framer, now maintained by hand)
    blog/[slug].astro       blog post template (content: src/content/blog)
    products/[slug].astro   product template (content: src/content/products)
    sitemap.xml.ts  same URL set/order as the old Framer sitemap; new posts/products are appended
    404.astro
  content/blog/*.md        blog posts (all fields in front-matter, see "Blog post fields")
  content/products/*.md    products
  components/       Header, Footer (converted), FaqItem, StepItem, SubmitButton, CookieBanner, SearchFilter
  layouts/Base.astro  <head> (SEO + tracking), cookie banner, small interaction script
  lib/head.ts       loads src/data/head/<key>.json (the SEO head captured from the live site)
  lib/seo.ts        SEO for new CMS entries that have no captured head yet
  data/head/*.json  per-page title/meta/canonical/JSON-LD; key: "/" -> index, "/blog/x" -> blog__x
  data/icons.json   icon artwork copied from the live site
  styles/tokens.css design tokens; styles/global.css base styles; styles/pages/*.css per-page CSS
public/
  assets/           self-hosted images and videos (map: data/asset-map.csv)
  fonts/            self-hosted Inter, Inter Display, Manrope, Lexend, DM Sans (OFL)
  _redirects        Cloudflare 301s
  _headers          cache headers (HTML charset rules are appended at build by scripts/html-headers.mjs)
  robots.txt        byte-identical copy of the live robots.txt
apps-script/Code.gs Google Apps Script backend for the quote form
scripts/            capture, conversion and QA tools (see README)
data/               url-inventory.csv, seo-baseline.csv, asset-map.csv, GSC/Semrush exports
notes/              flags, interactions, tracking, parity report, launch plan, monitoring
```

## Breakpoints

These match Framer: desktop ≥ 1200px, tablet 810–1199.98px, phone ≤ 809.98px. Three pages (/fiber-optic-cables, /marketing-alliance, /vocom-privacy-policy) also have a ≥ 1439px rule.

## How the pages were made (and the generated CSS)

`scripts/framer/compile.mjs` converted the Framer design tree into `src/pages/*.astro` plus `src/styles/pages/*.css`:
- Class names are `<layer-name> x<hash>`. The hash class holds the style; identical styles share a class.
- Breakpoint differences are media-query overrides.

**Do not re-run the converter after hand edits.** It overwrites the pages. Edit the `.astro` and `.css` files directly from now on.

## Edit copy on an existing page

1. Find the text in `src/pages/<page>.astro`.
2. Change only what Tom approved.
3. If the text is also in the page's `src/data/head/<key>.json` (title, description), update it too so they agree.
4. If you changed, added or removed a FAQ: `npm run build && node scripts/faq-schema.mjs --write && npm run build`. That rebuilds the page's FAQPage JSON-LD from the visible FAQs.

## Add a static page

1. Create `src/pages/<slug>.astro` using `Base`, `Header` and `Footer` (see `src/pages/404.astro` for a minimal example). Style it with tokens.
2. Create `src/data/head/<slug>.json` with:
   - `title`
   - `meta`: description, og:*, twitter:*, robots `max-image-preview:large`
   - `links`: canonical + the two favicon links
   - `jsonld`: copy the site-wide graph from another page
3. Add the path to `STATIC` in `src/pages/sitemap.xml.ts`.
4. Add it to the header or footer only if Tom asks.

## Add a blog post

1. Copy an existing file in `src/content/blog/` to `src/content/blog/<slug>.md`.
2. Set `slug`, the next `order` number, and the fields.
3. Put the main image in `public/assets/img/` and set `image: { src, alt }`. Alt text is required.
4. The page, the sitemap entry, the /blog card and BlogPosting JSON-LD are generated automatically. The `<title>` is `metaTitle` and the description is `description`.

### Blog post fields

| Field | Use |
|---|---|
| `cardTitle` | Card and H1 title |
| `title` | Full title, shown as H2 |
| `metaTitle`, `description` | SEO title and description |
| `industry`, `product` | Labels |
| `intro` | Intro paragraph |
| `buttonText`, `buttonLink` | CTA |
| `section1Title`…`section5Title`, `section1Body`…`section5Body` | Sections |
| `gallery1`…`gallery4`, `gallerySide1`/`gallerySide2` | Optional images |
| `bottomHeading`/`bottomBody`, `finalHeading`/`finalBody` | Optional closing sections |
| `showOnHomepage` | Homepage listing |

Bodies are plain text; a blank line starts a new paragraph.

## Add a product

1. Copy a file in `src/content/products/`.
2. Fields: `name`, `category`, `codes`, `fiberCounts`, `construction`, `typicalUse`, `description`, `image`.
   - Optional `metaTitle` / `metaDescription` set that page's own SEO title and description (they override the captured ones).
3. `category` must be one of the existing category names exactly, because catalog sections filter on it.

## Shared components (keep pages consistent)

- **Header:** every page uses `.site-header-slot` (`src/styles/global.css`): 1000px on desktop, full width minus margins on tablet/phone, sticky 10px from the top. Don't give a page its own header width.
- **Fiber hero spec box:** `src/components/SpecPanel.astro`, used on all eight fiber pages. Change its look in one place only.
- **llms.txt:** generated by `src/pages/llms.txt.ts` from page titles and descriptions. New posts and products appear automatically.

## Forms, search, tracking

- **Quote form** (`/contact-vocomai`) and **newsletter popup**: both post to the Apps Script URL (`FORMS_URL`) in `src/config.ts`; rows go to the Quotes / Newsletter tabs and quote alerts to kevin@getvocom.com. After a successful quote the visitor is sent to `/resources`. Setup is in the README.
- **Search** (`/search`): Pagefind. The index is built by `npm run build`. Only blog and product pages are indexed (`data-pagefind-body`).
- **Tracking** (GA4, GTM, LinkedIn Insight + conversion pixel, Metricool): lives only in `src/layouts/Base.astro`. Don't add tags elsewhere. See `notes/tracking.md`.

## Before every deploy

1. `npm run build` must pass.
2. `npm run parity` must show no new issues against `notes/parity-report.md`.
3. Spot-check with `node scripts/visual-diff.mjs --only /changed-page`.
