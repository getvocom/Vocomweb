# Animations and interactions

This catalogues everything that moves or responds on the live Framer site, and how the rebuild handles each one. All content renders as static HTML. JavaScript is only used for the interactions listed here.

| Interaction | Where | Live (Framer) | Rebuild |
|---|---|---|---|
| Sticky header | Every page | Nav pinned 10px from top | CSS `position: sticky` (per-page wrapper keeps Framer's widths) |
| Nav dropdowns | Header: Fiber Optic, Vocom AI, Vocom International, About | Overlay opens on hover, 10px below the trigger | CSS `:hover` / `:focus-within`, so it also works from the keyboard. The links are now in the static HTML (Framer only rendered them on hover) |
| Mobile menu | Header, phone | ☰ / ✕ switch between the "Phone" and "Phone Open" variants | `data-set-variant` toggle (tiny inline script in `Base.astro`). The CSS is the exact difference between the two Framer variants |
| Mobile dropdowns | Header, phone | Dropdown Phone ↔ Phone Open | Same toggle mechanism |
| Button hovers | All buttons (Request a Quote, Contact Now, CTAs) | Component hover variant: fill colour and shadow change | Generated `:hover` rules from Framer's hover variants, 0.3s ease |
| Card and tile hover | 446 layers (product tiles, case cards, etc.) | `hoverEffect`, mostly scale 1.1 on images | `:hover { transform }` with transition |
| Tap feedback | 33 layers | `tapEffect` scale 0.9 | `:active { transform }` |
| FAQ accordion | 13 pages + product template | "faq/accordian_item" (+ rotates 45° to ×, background turns grey) | Native `<details>`/`<summary>` (`FaqItem.astro`); answers are in the HTML |
| Tabs / steps | /vocom-ai, /vocom-ai-servers, /vocom-ai-agents, /vocomai-coach-hub, /vocomai-vocam | Tapping a step switches the container variant: it opens the step and swaps the image | `StepItem.astro` + variant toggle; the image swap uses generated show/hide rules. As on live, collapsed steps show "−" and the open one "+" |
| Stat counters | Homepage trust bar and others | "Counter" component counting up from 0 | **Static final values** (1998, 100+, 99.9%, 25K+, 24/7). No count-up, so crawlers never read 0 |
| Logo bar | Homepage "Working with renowned…" | Static row of logos (no marquee on the live site) | Static row |
| Background videos | Homepage hero, /about, /fiber-optic-cables, /vocom-ai, /vocomai-supply-chain | Autoplay, muted, loop, cover | `<video autoplay muted loop playsinline>` (self-hosted; see flags for the two files over 25 MB) |
| Masonry grids | 14 grids (case/blog layouts) | Framer masonry | CSS masonry where supported; otherwise a small script sets row spans. Without JS it falls back to a normal grid |
| Blog headline slide-in | /blog | `textEffect` (line slides in from 50px on load) | Not reproduced (decorative); text is static |
| Word reveal | /vocom-ai-agents (one heading) | `textEffect` (words fade/blur in on scroll) | Not reproduced (decorative); text is static |
| Image zoom on scroll | Blog post template images | `styleTransformEffect` scale 1.3 → 1 on scroll into view | Not reproduced (decorative) |
| Spinner | Button 2 "Conic" layer | `loopEffect` rotate 360°, 1s | CSS `animation: loop-spin` |
| Quote form | /contact-vocomai | Framer form: Submit stays disabled until required fields are valid; Loading spinner; "Thank you" / "Something went wrong" | `SubmitButton.astro`: same states and colours, posts to Google Apps Script |
| Search | /search | Lists every product and post; typing filters by name | Same list. Typing filters it via the Pagefind index (`SearchFilter.astro`); `?q=` is supported |
| Cookie banner | Every page, EU visitors only | Framer Cookie Banner (bottom-right card: Accept all / Reject all / Customize) | `CookieBanner.astro`, shown when Cloudflare reports an EU/EEA/UK/CH country (`/cdn-cgi/trace`) |
| Calendly | /resources | Inline Calendly embed (kevin-getvocom) | Calendly iframe, lazy-loaded |
| Reduced motion | All | Not handled | Transitions and animations are switched off when `prefers-reduced-motion` is set |
