# Moving vocom.com to vocom.ai (SEO)

**Goal:** Google, AI Overviews and AI assistants treat vocom.ai as Vocom's site, and the old pages' ranking passes to it.

**Current state (checked 2026-10-24):**
- `vocom.com` is a newer static site on its own host (208.90.122.86), with 7 pages.
- `www.vocom.com` is the 2020 Google Sites site, with 17 pages.
- DNS is at Network Solutions (worldnic).
- Email (@vocom.com) runs on Microsoft 365. **The MX, autodiscover, SPF/DKIM/DMARC and other TXT records must be kept exactly.**

## Already done on vocom.ai
- Every page's Organization schema has:
  - `alternateName`: VOCOM, Vocom International, VOCOM International Telecommunications, Vocom International Telecommunication, Inc., Vocom AI;
  - `sameAs`: both LinkedIn pages and vocom.com.

## Steps (after the vocom.ai launch in notes/launch.md)
1. **Search Console:** add and verify a Domain property for vocom.com (DNS TXT record), if it isn't there already.
2. **Cloudflare:** add vocom.com as a second zone in the same account.
   - Check that every imported record matches Network Solutions, **especially MX and all TXT**.
   - Switch the nameservers at Network Solutions.
   - The web records for `@` and `www` must be proxied (orange) for redirects to work.
   - **Leave the mail records grey.**
3. **Redirects:** in Cloudflare (account) → Bulk Redirects, create a list from `data/vocom-com-redirects.csv` (26 URLs, all 301), then a Bulk Redirect rule that uses it. Add a catch-all Single Redirect for anything else: host is vocom.com or www.vocom.com → `https://www.vocom.ai/` (301).
4. **Change of Address:** in Search Console, open the vocom.com property → Settings → Change of address → choose www.vocom.ai. This needs the homepage 301 to be live.
5. **Elsewhere online, update the website to https://www.vocom.ai:**
   - both LinkedIn pages;
   - Google Business Profile;
   - email signatures;
   - PeeringDB;
   - Crunchbase;
   - FCC filings and directory listings.
6. **Keep the redirects for at least a year,** and ideally permanently.

**What to expect:**
- Google usually swaps the search results to vocom.ai within 2 to 8 weeks.
- AI Overviews follow once the old pages redirect and drop out of the index.
