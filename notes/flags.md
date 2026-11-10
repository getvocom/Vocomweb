# Flags for Tom

This lists everything odd found while rebuilding vocom.ai. **No copy was changed.** Items marked **Decision needed** wait on you; everything else is recorded for awareness.

## Decisions already made (Tom, 2026-10-22)

- **Redirects:** Framer has no redirects configured (checked through the Framer API). Live, `/vocomai`, `/vocomai-home` and `/vocomai-security` return 404. Following SEO best practice they now 301 (`public/_redirects`):
  - `/vocomai` → `/vocom-ai`
  - `/vocomai-home` → `/vocom-ai`
  - `/vocomai-security` → `/vocomai-vocam`
- **`/pricing-vocomai`:** stays a page (it's live and in the sitemap).
- **Multiple H1s:** handled by SEO best practice. The first H1 stays and extras become H2 or `<p>`, with the words unchanged. The full list is in `notes/heading-changes.md`.
- **Quote form:** built on the Hash Brown pattern (Google Apps Script → Sheet + email). Setup is in the README.
- **Data:** GSC (7 days to 2026-10-20) and the Semrush site audit (2026-10-14) are in `data/`.

## Decision needed before launch

1. **Done (2026-10-22):** both videos were re-encoded to about 9.5 MB each, at the same resolution with no audio (they always play muted).
   Original note: **Two videos are over Cloudflare Pages' 25 MB file limit.** Pages refuses to deploy them:
   - `public/assets/video/fiber-optic-cables-b335b5.mp4` (48 MB, /fiber-optic-cables)
   - `public/assets/video/vocomai-supply-chain-bcbafd.mp4` (33 MB, /vocomai-supply-chain)

   Options:
   - **(a)** Re-encode to under 25 MB (H.264, CRF 23–26, usually indistinguishable at these display sizes). I can do this once ffmpeg is installed (`brew install ffmpeg`).
   - **(b)** Host them on Cloudflare R2 with a custom domain such as `media.vocom.ai`.
   - **(c)** Keep loading them from Framer's CDN. Not recommended: it breaks if the Framer project is ever deleted.

   I recommend (a).
2. **Quote form endpoint.** I need the Google Sheet and notification email to deploy `apps-script/Code.gs`. Until then the form shows an error state.
   - The live Framer form currently sends submissions wherever Framer is set to deliver them; check that this isn't also wired into a CRM you rely on.
3. **Done (Tom, 2026-10-22):** blog body paragraphs are now `<p>` instead of `<h3>`, so the parity report will show fewer H3s on blog posts. That's expected.
   Original note: **Blog body text is marked up as H3 on the live site.** Every paragraph of every blog post (intro and section bodies) is an `<h3>`. That gives each post 6–12 H3s made of whole paragraphs, which is poor SEO.
   - It's kept for parity, so H2/H3 lists match.
   - Recommendation: change the bodies to `<p>`. It's a one-line change in `src/pages/blog/[slug].astro`. OK to change?
4. **Tracking questions** (see `notes/tracking.md`):
   - the LinkedIn conversion fires on every page view;
   - consent doesn't gate tags;
   - GA4 may be double-loaded via GTM.
5. ~~**The cookie banner's policy link points to Framer's legal page**~~ **Done:** it now points to `/vocom-privacy-policy` (Tom, 2026-10-22).
   Original note: (`framer.com/legal/policy`), not a Vocom policy. Keep it, or point it to `/vocom-privacy-policy`?
6. **Desktop nav on tablet/phone.** On `/marketing-alliance` and `/vocom-privacy-policy` the live site keeps the full desktop navigation at tablet and phone widths, where it overflows off-screen. The rebuild shows the normal responsive (hamburger) header there instead. Say if you want the live behaviour kept.

7a. **Newsletter popup (new, not on the live site).** Copy **approved by Tom (2026-10-22)**. It switches on automatically once `FORMS_URL` is set.
   - Approved copy, in `src/config.ts` → `NEWSLETTER`:
     - heading "Get Vocom Insights in Your Inbox";
     - body "Fiber optic cable lead times, specification guides and AI infrastructure news for network builders.";
     - consent "I agree to receive emails from Vocom. I can unsubscribe at any time."
   - Your privacy policy should mention newsletter emails and how people unsubscribe.

## Content oddities (copied exactly; not changed)

7. **Truncated blog H1s / card titles:**
   - "How Enterprise AI Logistics Software Cuts..."
   - "Why AI Document Scanning Is Becoming Core.." (two dots)
   - "Why AI Servers Are Fundamentally Different from" (unfinished)
   - "Why Companies Like Apple Are Building..."
   - Some meta titles also end in "..." (e.g. /blog/plc-vs-iepl).
8. **Contact form "Company Size" options skip a range:** 1-50, 250-500, 500-1000, 1000+ (there's no 50-250).
9. **The contact form's "Company Name" field is a multi-line textarea**, named "Company " with a trailing space. Submissions store it as "Company".
10. **Tab steps on the Vocom AI pages:** collapsed steps show "−" and the open step shows "+", the reverse of convention. Kept as live.
11. **Copy that differs by screen size:**
    - /fiber-optic-cables adds "Standard:" / "Expedited:" prefixes on phones.
    - /vocomai-supply-chain drops a sentence on tablet and phone.
    - /fiber-optic-cable-catalog shows a different link label on phones, plus one empty label.

    These are reproduced per breakpoint, as on the live site.
12. **Mixed spelling "fiber"/"fibre"** across posts and slugs.
13. **Slugs with special characters:**
    - `’` in `ai’s-…`, `nvidia’s-…`, `what-openai’s-…`
    - `—` in `…-limits-—-and-…`
    - `“…”` in `why-the-“accidental-hacker”-…`
    - a trailing `.` in `…-is-the-fibre.`

    They're kept byte-identical and the canonicals are percent-encoded exactly as live. Verify these specifically on the Cloudflare preview.
14. **Live 404 page** is Framer's generic "Page Not Found | Framer". The rebuild has a Vocom-styled 404 with the same message, titled "Page Not Found | Vocom" and marked noindex.
15. **Hidden content not rendered.** Layers hidden at every screen size on the live site aren't output. Framer doesn't output them either. They include:
    - testimonial carousels on /about, /vocom-services and /vocom-international;
    - an email-signup field with no form ID on 12 pages.

## Technical notes

16. **Host and slash redirects on the live site are 308; Cloudflare uses 301.** Google treats them the same.
17. **The Organization JSON-LD is repeated** (4 Organization + 2 LocalBusiness on every page). It's reproduced identically. The JSON-LD logo URLs now point at the self-hosted copy.
18. **BlogPosting JSON-LD** was injected by JavaScript on the live site; it's now in the HTML. Same values.
19. **og:image, favicon and JSON-LD image URLs** moved from `framerusercontent.com` to `https://www.vocom.ai/assets/…`. This is required so nothing depends on Framer after cut-over.
20. **Nav dropdown links are now in the static HTML.** Framer only rendered them on hover, so the parity report lists them as "extra internal links". This is good for crawlability.
21. **Decorative entrance animations not reproduced:**
    - the /blog headline slide-in;
    - a word-by-word reveal on /vocom-ai-agents;
    - the image zoom-on-scroll in blog posts.

    The content is identical; see `notes/interactions.md`.
22. **Fonts are open-licensed** (Inter, Inter Display, Manrope, Lexend and DM Sans, all OFL) and self-hosted from the exact files the live site used. Framer's text presets also reference Garet and Proxima Nova (commercial), but no live page uses them.
23. **The mobile menu uses `95vh` max height** as in Framer. Framer's viewport handling makes the live menu slightly shorter on some phones.

## Resolved 2026-10-22

- Schema wording updated to the current facts (founded 1998; 6 to 8 weeks standard, up to 10 weeks custom). See notes/tracking.md.
- New FAQs added to the FAQPage schema on every page.
- Founder bio keeps "1993" and "three decades": Tom's decision.
- Still open: the blog posts "fiber-optic-cable-lead-times-in-2026" and "high-count-fiber-is-where-data-centers-are-headed" say "roughly 6 to 10 weeks" in their visible text. Not changed (copy).

- /pricing-vocomai intro shortened at Tom's request (2026-10-22, "too long and out of place"). Removed text: "Most engagements start with the free demo: a no-cost session to see Vocom AI tools against your own workflows before committing to anything. The AI audit suits teams that already know they want to move and need a concrete plan, mapping current systems, flagging practical automation opportunities, and pricing out implementation before any contract is signed. Enterprise engagements are quoted individually once scope, data residency, and integration requirements are clear, which is also where multi-tool packages get negotiated."

## New pages (built 2026-10-22, published at Tom's request the same day)

| URL | Layout | Status |
|---|---|---|
| /fiber-optic-connectors-and-hardware | ribbon page layout, product grid filtered to "Connectors, Terminal Boxes and Hardware" | live |
| /iepl-iplc-private-leased-circuits | /vocom-international layout | live |
| /wholesale-voice-termination | /vocom-international layout | live |

All copy uses facts already on the site (product data, /vocom-services, the PLC vs IEPL post). The drafts are noindex, not in the sitemap or llms.txt, and not linked from the nav. To publish one:
1. In `src/data/head/<page>.json` set the robots meta back to `max-image-preview:large`.
2. Add the path to `STATIC` in `src/pages/sitemap.xml.ts` and to a section in `src/pages/llms.txt.ts`.
3. Link it from the nav or hub pages, if Tom wants.
Page text lives in `scripts/framer/extra-pages.json`, except the carrier pages' FAQs, which are in the `.astro` files. MTP/MPO is only described as listed products until sales confirms supply vs resale.

## Quote form: conditional fiber questions (2026-10-22)

When Use Case is "Fiber Optic", the form asks for Fiber count, Fiber type, Rating, Footage and Needed by. `apps-script/Code.gs` stores them in new columns after "Page" and adds them to the alert email. **Tom: paste the updated Code.gs into Apps Script and redeploy (Manage deployments → edit → New version) so the new answers are saved.** Until then they are sent but ignored.

- Company Size options jump from "1-50" to "250-500" (no 51-249), as on live. Add a "51-249" option?

## Contact details (2026-10-23)

Tom: website leads go only to kevin@getvocom.com (the one inbox he manages). The schema on every page (LocalBusiness email) and the /vocom-international FAQ were changed from sales@vocom.com / kevin@vocom.com to kevin@getvocom.com. The footer now shows both offices (El Monte and Taipei, with phone numbers) and kevin@getvocom.com, matching the LocalBusiness schema. Keep these identical to the Google Business Profile.

## Product renders (2026-10-23)

Product and category images are Vocom renders, not photos of supplied stock. Each carries a visible "Illustrative render" label and "(illustrative render)" in its alt text (Tom asked for this). Product renders are 406px, cut from the Canva board export; for sharper images on high-resolution screens, swap in the 1264px Canva originals (same file names, `public/assets/img/products/`). Hero renders (1680px) are on /data-center-fiber-cabling (VC-104), /air-blown-micro-fiber-cable (VC-109), /ftth-drop-cable (VC-108, new frame) and the /fiber-optic-cables card (VC-105). VC-110 is saved but unused.
- 2026-10-23: 4K renders (Vocom-Renders-4K.zip) replaced the board crops. `node scripts/render-images.mjs <unzipped folder>` rebuilds every size from the 4K files (products: 480/800/1200 WebP+JPG; heroes: 1280/1920/2560). Product pages use a <picture> with srcset, explicit size, priority loading, a per-product alt, the render as og:image/twitter:image (with og:image:alt and size), and an image entry in sitemap.xml. NEW-1 (indoor rollable ribbon) and NEW-2 (waterproof terminal box) are in use.

## Two-step quote form on /contact-vocomai (2026-11-01): copy approved by Tom 2026-11-01; Apps Script Version 9

Step 1 (the Ads conversion) is five fields: Name, Email, Company Name, Use case, What do you need? Step 2 (optional, after step 1 is saved) holds I am a, Company Size, the fiber questions, delivery, needed-by and the spreadsheet upload, and adds them to the same Quotes row ("Lead ID" / "Details Added" columns) with a "Spec added" email to Kevin. New or changed wording:
- Email placeholder: "Your work email" (was "Your Email")
- "Message" label is now "What do you need?" (required), placeholder "e.g. 144F single-mode outdoor cable, about 24,000 ft, delivered to Texas"
- Under the Submit button: "Have a full spec or bill of materials? You can add it on the next screen."
- Step 2 heading: "Thanks, we have your request." Body: "Add your full spec now for a faster, more accurate quote. Everything here is optional."
- Step 2 buttons: "Add details" and "Skip" (both end on /resources, as before); error: "Something went wrong. Please try again, or email your spec to us."
- 2026-11-01: step 2 also shows the catalog and booking links, using the /resources wording and links (Tom). The only new words are the "Book a call" link label.

## 2026-11-04: founding year 1993
- Tom: founded 1993 (two entities, Taiwan and USA); use 1993. All "founded in", foundingDate (schema) and "since" claims now say 1993, and the "1998 / Founded, FCC 214 Licensed" stats now read "1993 / Founded".
- Left at 1998 because they are licence or US-incorporation facts, not the founding date: "FCC 214 licensed (carrier) since 1998", "run its own equipment and interconnects since 1998", "earliest business line, run since 1998 on an FCC 214 licensed network", "from wholesale IDD termination in 1998", "In 1998, Victor incorporated Vocom in the U.S.", and the /vocom-services "1998 / FCC 214 Licensed" stat.

## 2026-11-06: /fiber-optic-cable-supplier-comparison (draft, not pushed)
- Tom asked for a Slack-style comparison table against Corning, Prysmian, Sumitomo and YOFC, no pricing, CTA "Get a customized quote within 24hrs".
- "Within 24 hours" is a new Vocom promise, not previously on the site. Kevin to confirm the team can meet it.
- No competitor publishes a lead time we could find, so those cells say "Not published". We don't quote the 52-week Corning figure: it's one ISP's story relayed on a rival vendor's blog.
- No "where it's made" or BABA row: Vocom's own origin and BABA position aren't public copy (see notes/drafts-2026-11-04.md item 5).
- Competitor cells are a desk check on 2026-11-06. Corning's site blocked direct fetching, so its cells rest on search results. Re-check before pushing and whenever CHECKED changes.

## 2026-11-06: comparison page, bigger table (not pushed)
- Tom: replace "Not published" with sales-gated wording, add fiber types, AI, telecom, support, years in business. Cells first said "Contact sales" or "Not listed". Tom, same day: "Contact sales" sounded like we want them to contact the competitors, so every gap now says "Not listed".
- Years in business sits in a stats band and the Vocom column head, not a row: Vocom (1993) is the youngest of the five (Corning 1851, Prysmian 1879, Sumitomo Electric 1897, YOFC 1988).
- New line, Tom to approve: "Already holding a quote? Send it over and put ours next to it."
- Mixes fiber, telecom and AI on one page at Tom's request; the content guide normally keeps them apart.

## 2026-11-09 Optical transceivers
- Tom: add a transceivers page (higher margin than fiber) and factor it into the homepage. Built /optical-transceivers from Kevin's AI Factory deck and topology PDF. Homepage: product card, "AI Cluster Optics" band, one FAQ. Open questions in notes/transceivers-2026-11-09.md.
- Tom's graphics (same day): switch faceplate shot in "What it is", new range lineup in the hero spec box and share image, single OSFP module on the homepage card. Six product pages under the new "Optical Transceivers" category (1.6T, 800G, 400G, 100G, 25G, 10G and 1G), a catalog table, and 1.6T and 800G at the top of the nav's "Popular products". Product template wording switches to module labels for this category only; cable product pages are unchanged.
- Kevin to confirm: the form factors named for the lower speeds (QSFP28 at 100G, SFP28 at 25G, SFP+ and SFP at 10G and 1G) are the industry standard ones, not taken from the deck. No lead time is stated on any transceiver page.

## 2026-11-09: fiber spelling, videos, comparison rows
- Tom: "always fiber not fibre". Every visible "fibre/fibres" (blog bodies, titles, SEO heads, alt text) is now "fiber/fibers". URLs, slugs and image file names keep "fibre" because URLs never change. "centre" (data centre) is still British in 18 places: ask Tom.
- Videos: every video now has a poster frame (public/assets/video/*-poster.jpg). Muted background loops show the poster only on phones (<= 809.98px) and with reduced motion, so nothing downloads and nothing is blank when autoplay is blocked. Narrated videos (fiber-optic-cables, supply chain) keep their source and play on tap.
- Comparison page: the seven product range rows now say "Broad catalog" for all four competitors, and Glass says "Makes its own fiber", instead of "Not listed". Checked date moved to November 9, 2026.

## 2026-11-09: Tom's answers
- US spelling always: "center/centers/centered" now in all visible text, as with "fiber". Slugs and URLs keep "centre" and "fibre" (URLs never change).
- Approved and live: the UL wording (fiber-optic-cables bullet "UL-Listed Cable Available"; homepage badge alt "UL-listed cable available on request") and the two Ads FAQs (cost per foot on /fiber-optic-cables, direct burial on /loose-tube-fiber-optic-cable). FAQ schema regenerated.
- Transceiver form factors (QSFP28, SFP28, SFP+, SFP) confirmed. The origin question is not an issue; nothing to add on the site.
- Lead emails: quote requests, "spec added" and newsletter sign-ups now email kevin@getvocom.com and kevin@vocom.com (apps-script/Code.gs). Live only after the Apps Script is redeployed.
- FAQs: every page now uses the same dropdown (<FaqItem>) in a single-column .faq-list. The 12 pages that had static question boxes (homepage, fiber category and partner pages, /optical-transceivers) were converted; questions and answers unchanged.

## 2026-11-10: Tom's answers, 6912F page, data-driven changes
- Transceivers: the five deployments can stay public with city and year. Lead time and warranty: "contact sales, should be the same as fiber". New FAQ on /optical-transceivers says both are confirmed with the quote and lead times are typically in line with fiber orders.
- Comparison page competitor cells: confirmed by Tom.
- /6912-fiber-optic-cable: built from the specs already on the site (38.0mm OD, 1064 kg/km LSZH, 432 x 16F ribbons, G.657A1/A2, Fujikura preform, up to 10 weeks; 1728F alternative). Outdoor jacket, duct size, bend radius, pulling tension and reel are "confirmed with your quote" until Kevin supplies them. Linked in the nav under Fiber Optic > By cable type.
- Search titles changed on six pages and the phone header now shows "Request a Quote": see notes/data-review-2026-11-10.md.

## 2026-11-10: CommScope added to the supplier comparison
- Tom asked to add CommScope. Its cable business (CCS) has been part of Amphenol since January 9, 2026; commscope.com says "Now part of the Amphenol family of brands", so Ownership reads "Part of Amphenol, publicly listed".
- From commscope.com: buy through CommScope Sales or a partner; contact address Claremont, North Carolina; partners worldwide. No lead time, minimum order, stock, delivery terms or 24/7 support published, so those cells say "Not listed".
- Highest ribbon count and Glass are "Not listed": CommScope publishes rollable ribbon, but I found no 6912F part and no statement that it draws its own fiber.
- The check date is now November 10, 2026 (Tom confirmed the other four columns the same day).

## 2026-11-10: 1728F page, glossary, catalog ribbon count
- New /1728-fiber-optic-cable (Search Console count searches: "1728 fiber cable"). Built only from the published 1728F spec (GYFDXPH, 144 x 12F, 28.4mm OD, 482 kg/km, G.652D or G.657A1) and the ribbon page lead times (6 to 8 weeks, up to 10 custom, 2 to 3 week air). Jacket, duct, bend radius, tension and reel are "confirmed with your quote".
- New /fiber-optic-glossary: 30 standard industry definitions (ITU-T, IEEE, NEC), each linked to the matching page. No Vocom claims. MTP and OptiTap trademark line at the bottom.
- Possible typo, not changed (needs Tom): the 1728F row on /fiber-optic-cable-catalog and /fiber-optic-cables says "12 ribbons of 12F". The product page says "144 ribbons of 12F", and 144 x 12 = 1728. Suggest changing the two tables to "144 ribbons of 12F".
- Product schema on product pages: not added. Without prices or reviews Google flags Product markup as invalid in Search Console and shows no rich result.
