# vocom.ai vs vocom.com (SEO)

**Situation (2026-10-24):**
- vocom.com (both `vocom.com` and `www.vocom.com`) belongs to another team, and we have no access to it.
- No redirects are possible, so the plan is to make www.vocom.ai the site Google, AI Overviews and AI assistants pick for "Vocom".
- All traffic goes to vocom.ai and the Vocom AI LinkedIn page (linkedin.com/company/vocomai).

**What the site does:**
- **Schema:** the Organization schema names the company "Vocom" (legal name Vocom International) and lists the other names people search (VOCOM, Vocom International, VOCOM International Telecommunications, the full legal name, Vocom AI).
- **sameAs:** only the Vocom AI LinkedIn page. There is deliberately **no** sameAs to vocom.com or the Vocom International LinkedIn page, because linking them would tell Google the two sites are one entity and could lead it to treat vocom.ai as the duplicate.
- **Links:** no page links to vocom.com.

**Plan:**
1. **Launch** www.vocom.ai (notes/launch.md), then submit the sitemap in Google Search Console.
2. **Bing Webmaster Tools:** add www.vocom.ai and submit the sitemap. Bing's index feeds ChatGPT search and Microsoft Copilot. After each deploy, run `node scripts/indexnow.mjs`.
3. **Google Business Profile:** set the website to https://www.vocom.ai. It's the strongest signal for brand searches and the knowledge panel. If a knowledge panel shows for "Vocom", use "Suggest an edit" to set the website.
4. **Vocom AI LinkedIn page:** set its website field to https://www.vocom.ai, and link to vocom.ai pages from posts (product and blog URLs, not just the homepage).
5. **Links from elsewhere, each one pointing to vocom.ai:**
   - NWF and other partner sites;
   - trade show exhibitor listings (ISE EXPO);
   - PeeringDB;
   - Crunchbase;
   - industry directories;
   - press releases.
6. **Content cadence:** the weekly blog posts (with internal links to product pages) and the product catalog keep vocom.ai fresher and deeper than the old sites. That's what search and AI tools reward.
