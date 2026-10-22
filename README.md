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
- `node scripts/faq-schema.mjs [--write]`: rebuilds each page's FAQPage JSON-LD from the FAQs on the built page (run after `npm run build`, then build again).
- `node scripts/nav-check.mjs [base URL]`: hovers every header dropdown on every page at 1280/1440/1920 and moves down onto a link, as a person would. Should print "all dropdowns OK".
- `node scripts/layout-audit.mjs [--base URL] [--only /path] [--widths 390]`: flags sideways scrolling, text cut off at the screen edge, cards overlapping and broken images on every page. Should report 0 issues.
- `node scripts/check-links.mjs`: broken-link check on `dist/`.
- `node scripts/check-redirects.mjs <base-url>`: verifies every rule in `public/_redirects` returns a 301 to the right target.

## Deploy (Cloudflare Pages)

1. Push this repo to GitHub.
2. Cloudflare dashboard → Workers & Pages → Create → Pages → Connect to Git → pick the repo.
3. Build settings:
   - Framework preset: Astro
   - Build command: `npm run build`
   - Build output: `dist`
   - Environment variable: `NODE_VERSION=22`
4. Every push to `main` deploys to production. Other branches get preview URLs on `*.pages.dev`, which `public/_headers` marks `noindex`.
5. Custom domains:
   - Add `www.vocom.ai` as the production domain.
   - Add a redirect rule from `vocom.ai/*` to `https://www.vocom.ai/$1` (301).

   The full cut-over plan is in `notes/launch.md`.

**File size limit:** Cloudflare Pages rejects files over 25 MiB. Keep videos under that: re-encode with `node_modules/ffmpeg-static/ffmpeg -i in.mp4 -an -c:v libx264 -preset slow -crf 23 -movflags +faststart out.mp4`.

## Forms (quote form + newsletter popup)

Both forms post to one Google Apps Script web app (`apps-script/Code.gs`). It writes to one Google Sheet: quote requests go to a **Quotes** tab, newsletter sign-ups to a **Newsletter** tab. Each tab is created automatically on first use.

1. Create a Google Sheet (e.g. "vocom.ai website leads"). Copy its ID from the URL: the long string between `/d/` and `/edit`.
2. In the sheet: Extensions → Apps Script. Delete the sample code, paste `apps-script/Code.gs`, and set:
   - `SHEET_ID`: the ID from step 1;
   - `NOTIFY_EMAIL`: where quote requests are emailed;
   - `NOTIFY_ON_NEWSLETTER`: `true` if you also want an email per sign-up.
3. Deploy → New deployment → type **Web app**:
   - Execute as: **Me**
   - Who has access: **Anyone**
4. Authorise. The "unverified app" warning is expected for your own script: Advanced → Go to project → Allow.
5. Copy the `/exec` URL into `FORMS_URL` in `src/config.ts`, then deploy the site.
6. Test end to end:
   - Quote form: the green "Thank you", a row in **Quotes**, and the email.
   - Newsletter: the success message and a row in **Newsletter**.
7. When you edit `Code.gs` later: Deploy → Manage deployments → edit the existing deployment → Version: New version. That keeps the same URL; a brand new deployment changes it.

**Newsletter popup settings** are in `NEWSLETTER` in `src/config.ts`: on/off, copy, delay, scroll depth, snooze days and excluded pages.
- It's a bottom-left card on desktop and a bottom sheet on phones. It isn't a full-screen interstitial, which Google penalises on mobile.
- It never appears on top of the cookie banner.
- Closing it hides it for 30 days; subscribing hides it for good.
- Sign-ups push a `newsletter_signup` dataLayer event.
- Each row stores the consent wording the person agreed to.
- To send newsletters, export the Newsletter tab to your email tool, or connect the sheet with Zapier/Make. Honour unsubscribes by setting Status to "Unsubscribed".

Both forms have a hidden honeypot field, browser validation and server-side validation. Successful quote submissions push a `form-submission` event, the same tracking ID the Framer form used.

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
