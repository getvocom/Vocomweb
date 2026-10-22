# Launch checklist (Tom executes)

**Goal:** move www.vocom.ai from Framer to Cloudflare Pages with no SEO loss and an instant rollback path.

## Before launch (one-off)

- [ ] **Blockers from `notes/flags.md` resolved:**
  - videos over 25 MB;
  - quote form Apps Script deployed, with its URL in `src/config.ts`;
  - tracking questions answered.
- [ ] Repo pushed to GitHub and connected to Cloudflare Pages (see README). The production branch is `main`.
- [ ] On the Cloudflare preview URL (`https://<hash>.<project>.pages.dev`):
  - [ ] `node scripts/check-redirects.mjs https://<preview-url>`: all OK.
  - [ ] `curl -sI https://<preview-url>/ | grep -i x-robots-tag`: shows `noindex`.
  - [ ] `npm run parity -- --base https://<preview-url>`: no unexpected issues.
  - [ ] Submit the quote form once on the preview, then confirm the sheet row, the email and "Thank you".
  - [ ] Click through the header menus on desktop and phone, the FAQ, tabs and search.

## T−48h: lower DNS TTL (GoDaddy)

- [ ] GoDaddy → My Products → vocom.ai → DNS. Set TTL to **600 seconds (10 min)**, or the lowest allowed, on the records that point the site at Framer:
  - the `A` record(s) for `@`;
  - the `CNAME` for `www`.
- [ ] Screenshot or export the full DNS zone first. **Do not touch MX, TXT (SPF/DKIM/DMARC), or any mail or verification records.**

## Launch day

### 1. Connect the domains in Cloudflare Pages

1. Pages project → Custom domains → add `www.vocom.ai`.
2. Choose the DNS route.
   - **Option A (recommended): move DNS to Cloudflare.**
     1. Add `vocom.ai` as a zone in Cloudflare (free plan). Cloudflare imports the existing records.
     2. **Check that every MX/TXT record was imported exactly** against your GoDaddy screenshot.
     3. Change nameservers at GoDaddy to the two Cloudflare ones.
     4. Then add `www.vocom.ai` to the Pages project; Cloudflare creates the record.
     5. Apex: add a proxied `A` record for `vocom.ai` → `192.0.2.1`.
     6. Add a Redirect Rule: `vocom.ai/*` → `https://www.vocom.ai/${1}`, 301, preserve query string.
   - **Option B: keep DNS at GoDaddy.**
     1. Change the `www` CNAME to `<project>.pages.dev`.
     2. Apex: GoDaddy Forwarding `vocom.ai` → `https://www.vocom.ai`, Permanent (301), forward only. Check that HTTPS on the apex still redirects.
3. **HTTPS:** Cloudflare issues the certificate automatically. In SSL/TLS → Edge Certificates, turn on "Always Use HTTPS".

### 2. Switch and verify (within 15 minutes of the switch)

- [ ] `https://www.vocom.ai/` and these 10 sample URLs return **200** with the correct canonical (`curl -s URL | grep canonical`):
  1. `/fiber-optic-cables`
  2. `/ribbon-fiber-optic-cable`
  3. `/about`
  4. `/vocom-international`
  5. `/vocom-ai`
  6. `/contact-vocomai`
  7. `/blog`
  8. `/blog/rollable-ribbon-vs-flat-ribbon-fiber`
  9. `/products/mtp-mpo-trunk-cable`
  10. `/blog/ai%E2%80%99s-real-impact-on-work`
- [ ] `http://vocom.ai/about`, `https://vocom.ai/about` and `https://www.vocom.ai/about/` each **301** to `https://www.vocom.ai/about`.
- [ ] A random path such as `/xyz` returns **404** with the Vocom 404 page.
- [ ] `https://www.vocom.ai/sitemap.xml` returns 113 URLs, and `robots.txt` is unchanged.

### 3. Redirect test on production

- [ ] `node scripts/check-redirects.mjs https://www.vocom.ai`: all OK.

### 4. Google Search Console

- [ ] Sitemaps → resubmit `https://www.vocom.ai/sitemap.xml`.
- [ ] URL Inspection → "Request indexing" for the top 10 pages by impressions in `data/seo-baseline.csv`:
  1. `/fiber-optic-cables`
  2. `/`
  3. `/ribbon-fiber-optic-cable`
  4. `/about`
  5. `/air-blown-micro-fiber-cable`
  6. `/products/mtp-mpo-trunk-cable`
  7. `/loose-tube-fiber-optic-cable`
  8. `/vocom-international`
  9. `/fiber-optic-cable-catalog`
  10. `/ftth-drop-cable`

### 5. Analytics sanity check (same day)

- [ ] GA4 Realtime shows your own visit.
- [ ] LinkedIn Insight Tag status is "Active" (Campaign Manager → Insight Tag).
- [ ] The GTM preview mode connects.

## Rollback (keep for 30 days)

- In Framer, **unpublish the custom domain but do not delete the project or the site.** The `*.framer.app` URL stays live.
- To roll back:
  1. Point DNS back to the Framer records (from your screenshot).
  2. Re-add the domain in Framer → Site Settings → Domains.
  3. Expect about 10 minutes with the lowered TTL.
- Delete the Framer site only after 30 days of stable monitoring (see `notes/monitoring.md`).

## After 1 week

- [ ] Raise DNS TTL back to the default (1 hour).
