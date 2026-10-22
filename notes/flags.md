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

## Draft pages awaiting Tom's copy approval (built 2026-10-22)

| URL | Layout | Status |
|---|---|---|
| /fiber-optic-connectors-and-hardware | ribbon page layout, product grid filtered to "Connectors, Terminal Boxes and Hardware" | draft |
| /iepl-iplc-private-leased-circuits | /vocom-international layout | draft |
| /wholesale-voice-termination | /vocom-international layout | draft |

All copy uses facts already on the site (product data, /vocom-services, the PLC vs IEPL post). The drafts are noindex, not in the sitemap or llms.txt, and not linked from the nav. To publish one:
1. In `src/data/head/<page>.json` set the robots meta back to `max-image-preview:large`.
2. Add the path to `STATIC` in `src/pages/sitemap.xml.ts` and to a section in `src/pages/llms.txt.ts`.
3. Link it from the nav or hub pages, if Tom wants.
Page text lives in `scripts/framer/extra-pages.json`, except the carrier pages' FAQs, which are in the `.astro` files. MTP/MPO is only described as listed products until sales confirms supply vs resale.

## Quote form: conditional fiber questions (2026-10-22)

When Use Case is "Fiber Optic", the form asks for Fiber count, Fiber type, Rating, Footage and Needed by. `apps-script/Code.gs` stores them in new columns after "Page" and adds them to the alert email. **Tom: paste the updated Code.gs into Apps Script and redeploy (Manage deployments → edit → New version) so the new answers are saved.** Until then they are sent but ignored.

- Company Size options jump from "1-50" to "250-500" (no 51-249), as on live. Add a "51-249" option?
