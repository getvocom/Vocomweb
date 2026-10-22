# Tracking (please confirm)

These are the scripts found on all 114 live pages. They're carried over with the same IDs in `src/layouts/Base.astro`, and nothing else adds tags.

| Tool | ID | Live placement | Rebuild |
|---|---|---|---|
| Google Analytics 4 | G-YYWN6PCL75 | `<head>` (gtag.js + config) | Same, in `<head>` |
| Google Tag Manager | GTM-MWPWLP7Z | `<head>` custom code | Same, in `<head>` |
| LinkedIn Insight Tag | partner 8874748 | `<head>`, **installed twice** | Installed **once** (the second copy only re-registered the same partner ID) |
| LinkedIn conversion pixel | pid 8874748, conversionId 24546316 | `<img>` at end of `<body>` on every page | Same |
| Metricool | hash a510ea6b2f7a6b3e8cf12a619c234f76 | `<img>` at end of `<body>` | Same (1×1, invisible) |
| Framer Analytics | events.framer.com | Framer runtime | **Removed.** It only works on Framer hosting; Framer's analytics dashboard stops at cut-over |
| Quote form event | dataLayer `form-submission` | Framer form tracking ID | Pushed on successful submit |

## Questions for Tom

1. **The LinkedIn conversion pixel fires on every page view.** Conversion 24546316 is counted on every page, not just after a quote request, so LinkedIn conversion numbers are inflated.
   - I've kept it as-is for parity.
   - Should it fire only after a successful form submission? That's a one-line move into `SubmitButton.astro`.
2. **Does GTM load anything extra?** It may fire additional tags (Ads, Meta, etc.) that can't be seen from outside. They'll keep working, but please check the GTM container for any trigger that relies on Framer-specific DOM or URL patterns.
3. **Cookie consent:** the Framer banner has no GTM ID set, so on the live site analytics and LinkedIn fire before and regardless of the visitor's choice. The rebuild behaves the same way and pushes a `cookie_consent` dataLayer event with the choice. If you want consent to actually gate the tags (advisable for EU visitors), I can wire up Google Consent Mode.
4. **GA4 is loaded twice:** directly (gtag) and possibly again via GTM if GTM has a GA4 tag. Please check GTM, otherwise page views are double-counted.
