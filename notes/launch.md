# Launch checklist (Tom executes)

**Goal:** move www.vocom.ai from Framer to the Cloudflare Worker `vocomweb` with no SEO loss and a fast rollback.

**Why DNS has to move:** a Worker can only serve a custom domain whose DNS is managed by Cloudflare, so vocom.ai's nameservers move from GoDaddy to Cloudflare. The domain stays registered at GoDaddy.

**Current DNS (checked 2026-10-23, nameservers ns11/ns12.domaincontrol.com = GoDaddy):**

| Record | Value | Note |
|---|---|---|
| `A` vocom.ai | 31.43.160.6, 31.43.161.6 | Framer |
| `CNAME` www | sites.framer.app | Framer |
| `TXT` vocom.ai | google-site-verification=O6Cjceanw9kbaBEq_gQz-Vc9X6ck0TAutAEEf8mfLtA | **Keep.** Search Console access |
| `MX` | none | No email on vocom.ai, so nothing mail-related can break |

Already checked on the test site (vocomweb.kevin-9ff.workers.dev, 2026-10-23):
- the 3 redirects return 301;
- `/xyz` returns 404 with the Vocom 404 page;
- the sitemap has 119 URLs and robots.txt is byte-identical to live;
- pages send `charset=utf-8`;
- nav check, layout audit and link check all pass.

`/about/` gives a 307. Step 4 makes it a 301.

## Step 1. Add vocom.ai to Cloudflare (no visible change yet)

1. Cloudflare dashboard (the account that owns `vocomweb`) → **Add a domain** → `vocom.ai` → Free plan.
2. Cloudflare scans and imports the records. Compare them with the table above:
   - the two `A` records, the `www` CNAME and the Google `TXT` must all be there;
   - add any that are missing.
3. Set the `A` and `www` records to **DNS only (grey cloud)** for now. They still point at Framer, and Framer serves them as before.
4. Cloudflare shows two nameservers (e.g. `xxx.ns.cloudflare.com`). Copy them.

## Step 2. Change nameservers at GoDaddy

1. GoDaddy → My Products → vocom.ai → DNS → **Nameservers** → Change → "I'll use my own nameservers".
2. Enter the two Cloudflare nameservers and save.
3. Wait for Cloudflare to email that vocom.ai is **Active**. This usually takes under an hour and can take up to 24.
   - The site stays on Framer the whole time, because both DNS providers point at Framer.
   - Visitors notice nothing.

## Step 3. Point the domain at the Worker (the actual switch)

Do this when Step 2 shows Active, at a quiet hour.

1. Cloudflare → Workers & Pages → `vocomweb` → Settings → **Domains & Routes** → Add → **Custom domain** → `www.vocom.ai`.
   - Cloudflare replaces the `www` CNAME with the Worker and issues the certificate (usually a few minutes).
2. Same screen → Add → Custom domain → `vocom.ai`.
   - This gives the bare domain a certificate. Step 4 redirects it to www.
3. SSL/TLS → Edge Certificates → turn on **Always Use HTTPS**. This also fixes the SEO tool's "redirect to HTTPS" warning.

## Step 4. Redirect rules (Rules → Redirect Rules → Create rule → Custom filter expression)

**Rule 1: bare domain to www**
- Filter: `(http.host eq "vocom.ai")`
- Then: Dynamic redirect, expression `concat("https://www.vocom.ai", http.request.uri.path)`, **301**, preserve query string: on.

**Rule 2: drop the trailing slash** (live does this with a permanent redirect)
- Filter: `(http.host eq "www.vocom.ai" and ends_with(http.request.uri.path, "/") and http.request.uri.path ne "/")`
- Then: Dynamic redirect, expression `concat("https://www.vocom.ai", substring(http.request.uri.path, 0, -1))`, **301**, preserve query string: on.

## Step 5. Verify (within 15 minutes of Step 3)

- [ ] `https://www.vocom.ai/` shows the new site. Check the footer: it has both office addresses.
- [ ] `node scripts/check-redirects.mjs https://www.vocom.ai`: all OK. That includes:
  - `http://vocom.ai/about`, `https://vocom.ai/about` and `https://www.vocom.ai/about/` each **301** to `https://www.vocom.ai/about`.
- [ ] `node scripts/nav-check.mjs https://www.vocom.ai`: "all dropdowns OK".
- [ ] `node scripts/layout-audit.mjs --base https://www.vocom.ai --widths 390`: 0 issues.
- [ ] `curl -s https://www.vocom.ai/sitemap.xml | grep -c "<loc>"`: 119. `curl -s https://www.vocom.ai/robots.txt` is unchanged.
- [ ] Send one test quote from `/contact-vocomai` (Use Case: Fiber Optic). Check:
  - the sheet row, with the fiber columns;
  - the email to kevin@getvocom.com;
  - the redirect to `/resources`.
  Then delete the test row.

## Step 6. Google Search Console (same day)

The domain doesn't change, so no "change of address" is needed. The verification TXT record moved with the zone.
- [ ] Sitemaps → resubmit `https://www.vocom.ai/sitemap.xml`.
- [ ] URL Inspection → "Request indexing" for the top pages by impressions (`data/seo-baseline.csv`) and the 6 new pages:
  - top pages:
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
  - new pages:
    1. `/fiber-optic-cable-for-distributors`
    2. `/indoor-fiber-optic-cable`
    3. `/fiber-optic-cable-referral-partners`
    4. `/fiber-optic-connectors-and-hardware`
    5. `/iepl-iplc-private-leased-circuits`
    6. `/wholesale-voice-termination`

## Step 7. Analytics check (same day)

- [ ] GA4 → Realtime shows your own visit.
- [ ] LinkedIn Campaign Manager → Insight Tag shows "Active" (may take a day).
- [ ] GTM preview mode connects to www.vocom.ai.

## Rollback (keep possible for 30 days)

- **Don't delete or unpublish the Framer site.** Leave www.vocom.ai connected in Framer, even if Framer says the domain is misconfigured.
- To roll back:
  1. Workers & Pages → `vocomweb` → Domains & Routes → remove the two custom domains.
  2. DNS → re-add `www` CNAME → `sites.framer.app` and the two `A` records (31.43.160.6, 31.43.161.6), all **DNS only (grey)**.
  3. This takes effect within minutes, since Cloudflare's DNS updates almost instantly.
- Cancel the Framer plan only after 30 days of stable traffic (see `notes/monitoring.md`).

## Optional: block email spoofing

vocom.ai sends no email, so it is safe to tell other mail servers to reject any mail claiming to be from it. This also clears the SEO tool's SPF/DMARC warnings. Only do this if nobody sends mail as @vocom.ai.
- `TXT` vocom.ai: `v=spf1 -all`
- `TXT` _dmarc.vocom.ai: `v=DMARC1; p=reject;`
