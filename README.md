# www.vocom.ai

The Vocom website as a static Astro site. It's a faithful rebuild of the former Framer site: same URLs, copy, SEO tags and design. It's hosted on Cloudflare Pages from this repository.

Read `CLAUDE.md` before changing anything.

## Requirements

Node 20+ (tested on Node 24).

## Commands

```bash
npm install
npm run dev        # local dev server at http://localhost:4321
npm run build      # static build to dist/ + Pagefind search index
npm run preview    # serve dist/ locally
npm run parity     # SEO/content parity vs the live site -> notes/parity-report.md
```

QA helpers:
- `node scripts/visual-diff.mjs [--only /path] [--widths 1440,768,390]`: screenshot comparison against `capture/screens`.
- `node scripts/check-links.mjs`: broken-link check on `dist/`.
- `node scripts/check-redirects.mjs <base-url>`: verifies every rule in `public/_redirects` returns a 301 to the right target.

## Deploy (Cloudflare Pages)

1. Push this repo to GitHub.
2. Cloudflare dashboard → Workers & Pages → Create → Pages → Connect to Git → pick the repo.
3. Build settings:
   - Framework preset: Astro
   - Build command: `npm run build`
   - Build output: `dist`
   - Environment variable: `NODE_VERSION=20`
4. Every push to `main` deploys to production. Other branches get preview URLs on `*.pages.dev`, which `public/_headers` marks `noindex`.
5. Custom domains:
   - Add `www.vocom.ai` as the production domain.
   - Add a redirect rule from `vocom.ai/*` to `https://www.vocom.ai/$1` (301).

   The full cut-over plan is in `notes/launch.md`.

**File size limit:** Cloudflare Pages rejects files over 25 MiB. Two videos are larger (see `notes/flags.md`) and must be hosted elsewhere or re-encoded before the first deploy.

## Quote form

The `/contact-vocomai` form posts to a Google Apps Script web app. The script appends a row to a Google Sheet and emails a notification, the same pattern as the Hash Brown site.

1. Create a Google Sheet. Copy its ID from the URL.
2. Extensions → Apps Script, then paste `apps-script/Code.gs`. Set `SHEET_ID` and `NOTIFY_EMAIL`.
3. Deploy → New deployment → Web app:
   - Execute as: **Me**
   - Who has access: **Anyone**
4. Authorise. The "unverified app" warning is expected: Advanced → Go to project → Allow.
5. Paste the `/exec` URL into `QUOTE_FORM_URL` in `src/config.ts` and deploy.
6. When you edit `Code.gs` later: Deploy → Manage deployments → edit the existing deployment → New version. That keeps the same URL; a brand new deployment changes it.
7. Test it end to end: the green "Thank you", a new row in the sheet and the email should all happen within a minute.

The form has a hidden honeypot field, browser validation and server-side validation. Successful submissions push a `form-submission` event to the dataLayer, the same tracking ID the Framer form used.

## How this was built

The first build was generated from the live site and the Framer project. The tools are in `scripts/` and kept for reference:

| Script | Purpose |
|---|---|
| `crawl.py` | URL inventory + raw HTML (`data/url-inventory.csv`) |
| `capture.mjs` | Rendered HTML, screenshots at 1440/768/390 and visible-content outlines |
| `extract_head.py` | Copies each page's SEO head into `src/data/head/` |
| `framer/*.mjs` | Framer design tree → Astro pages/CSS converter (one-time, see CLAUDE.md) |
| `assets.mjs` | Downloads images/videos with readable names + responsive WebP variants |
| `fonts.py` | Self-hosts the exact webfont files the live site used |
| `extract-svgs.mjs`, `grid-rows.mjs` | Details the Framer API does not expose, read from the live DOM |
| `cms-export.mjs` | Framer CMS → `src/content` |

`capture/` holds the reference screenshots and raw data from the live site. It's needed by `parity-check.mjs` and `visual-diff.mjs`.
