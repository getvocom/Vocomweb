# Heading changes (approved: "use SEO best practice" for multiple H1s)

Each page keeps its **first** H1. Extra H1s are changed to H2 when they are section headings, or to a `<p>` (same styling) when they read like a subtitle or sentence. **The words are unchanged.** Only the tag differs.

| Page | Text | Live tag | New tag |
|---|---|---|---|
| /blog | We publish what we would want to read ourselves: specific, technical, and grounded in real deployments, not ge | h1 | p |
| /blog/:Posts |  | h1 | h2 |
| /contact-vocomai | We’re happy to answer any questions  | h1 | h2 |
| /marketing-alliance | A network of AI companies working together to accelerate adoption, share opportunities, and grow faster. | h1 | p |
| /marketing-alliance | Key Principles  | h1 | h2 |
| /marketing-alliance | Built for AI Companies | h1 | h2 |
| /vocom-privacy-policy | Privacy Policy | h1 | h2 |
| /vocomai-consultancy | Trusted by forward-thinking teams | h1 | h2 |
| /vocomai-consultancy | Pricing | h1 | h2 |
| /vocomai-vocam | Up and running in about 10 minutes. | h1 | p |

The blog post template applies the same rule to every post: the post's card title stays the H1, and the "Fifth Section Title" (a second H1 on the live site) becomes an H2.

## Heading count trim (2026-10-22, after an SEO audit flagged 40 headings on the homepage)

Small card labels became paragraphs. The words, class and look are unchanged, and the page outline is now section titles, case studies and FAQ questions only.

| Page | Text | Live tag | New tag |
|---|---|---|---|
| / | Outdoor Fiber Cable, Ribbon Fiber Cable, Stranded & Central Tube, Single Mode & Multimode, Patch Cords & Connectors, Custom Specifications ("What we supply" tiles) | h3 | p |
| / | Send requirements, Quote & lead time, Production & QC, Global delivery, Quote-to-shipment route (process steps) | h3 | p |
| / | IEPL / IPLC, IP Transit, Local Loop & Voice Termination, IDC / Data Center Services (service tiles) | h3 | p |
| /blog | Product label on each card (e.g. "MPO and MTP Trunks") | h4 | p |

Homepage: 40 → 25 headings. /blog: 84 → 43. Done in `scripts/framer/compile.mjs` (`DEMOTE`) and `capture/cms-field-tags.json`, so a re-run keeps it.

## /search H1 (2026-10-22)

| Page | Text | Live tag | New tag |
|---|---|---|---|
| /search | Search Vocom | p (the page had no H1) | h1 |

Tom asked for an H1 on /search. It uses the page's existing title text, so no copy changed.

## Homepage title (2026-10-24, Tom approved)

"Fiber Optic Cable Supplier & Telecom Solutions | Vocom" became "Vocom | Fiber Optic Cable Supplier, Carrier Services & AI" (title, og:title, twitter:title). The brand goes first so searches for "Vocom" show vocom.ai labelled as Vocom across fiber, carrier services and AI.
