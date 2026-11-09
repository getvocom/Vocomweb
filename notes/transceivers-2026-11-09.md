# Optical transceivers page (2026-11-09)

Page: `/optical-transceivers` (src/pages/optical-transceivers.astro). Sources: Kevin's "AI Factory Optical Connectivity: Reference Deployments" deck and "AI Cluster Network Architecture" topology (WhatsApp, 2026-11-09).

Also changed: homepage (product card, "AI Cluster Optics" band, one FAQ), nav (Fiber Optic > By application), quote form "Use case" option "Optical Transceivers", sitemap, llms.txt.

## Graphics for Tom

**Delivered 2026-11-09.** In use: `public/assets/img/optical-transceivers-in-switch-*` (What it is), `products/optical-transceivers-lineup-*` (hero spec box, lower-speed product pages, render id TRX-LINEUP), `products/osfp-optical-transceiver-*` (homepage card, 1.6T, 800G and 400G product pages, TRX-OSFP), `og-optical-transceivers-lineup.jpg`. Originals were 1264 to 1776px, so they ship at up to 1200px (products) and 1680px (What it is). The prompts below are kept for reference.

Match the existing render (`public/assets/img/hero/optical-transceivers-range-*`): studio product shot, soft light-grey gradient background, dark charcoal plinth with a thin red edge light, VOCOM wordmark in red on the largest module, no other logos or brand names.

1. **"What it is" image** (the slot is empty until this exists). 3840 x 2160 (16:9), subject centred so it survives a crop to 4:3.
   > Photorealistic close-up of a 1U network switch faceplate in a dark data center rack, a row of silver OSFP optical transceivers plugged into its ports with beige pull tabs, yellow single-mode MPO fiber patch cords running from each module and curving neatly into a cable manager, shallow depth of field, cool white aisle lighting with a subtle red accent light, clean and modern, no visible brand names or logos except a small red VOCOM wordmark on one module, 16:9.

2. **Homepage card image** (the card now crops the wide render). 1200 x 1200 square.
   > Studio product render of a single 1.6T OSFP optical transceiver at a three-quarter angle on a dark charcoal plinth with a thin red edge light, heat-dissipating fins on top, beige pull tab, light-grey gradient background, small red VOCOM wordmark on the housing, soft reflections, square composition, no other text.

3. **Share image (optional)**, 1200 x 630. Today it's a crop of the existing render (`public/assets/img/og-optical-transceivers.jpg`).
   > Wide studio render of five optical transceivers in ascending size, SFP to OSFP, on a dark plinth with a red edge light, light-grey gradient background, generous empty space on the left third for a headline, small red VOCOM wordmark on the largest module, 1200x630.

4. **Topology diagram:** already Vocom's own (Kevin's PDF), used as is. If Tom redraws it, keep the same content and export at 2400px wide.

Send the files and I'll run them through the render pipeline (WebP + JPG sizes, "Illustrative render" label).

## Product pages

/products/1-6t-osfp-transceiver, /products/800g-optical-transceiver, /products/400g-optical-transceiver, /products/100g-qsfp28-transceiver, /products/25g-sfp28-transceiver, /products/10g-and-1g-sfp-transceivers. Category "Optical Transceivers" (src/lib/categories.ts): the template shows Form Factor, Data Rate and Build and Compatibility instead of the cable labels.

## Open questions

1. **Reference deployments:** can the five clusters (Denver H100 and H200, Chonburi and Don Mueang B300, Guishan GB300) be shown publicly with city and year? No customer names are used. The two "pending delivery" projects (Ayutthaya, Taichung) are left off.
2. **Lead time** for modules: not in the deck, so the page doesn't state one. Kevin to give a figure.
3. **"Top-tier optical module maker"** and "qualified by leading cloud providers" come from the deck's manufacturer page (rankings as reported by the manufacturer). The maker is not named.
4. **Warranty:** the deck says "full warranty service". Is there a term (for example 3 or 5 years) we can state?
5. **Origin:** transceivers are active devices, the category US security policy looks at. Nothing on the page says where modules are made. Kevin should be ready for the question on calls.
6. Deck contact is kevin@vocom.com and (650) 619-5048; the site uses kevin@getvocom.com and +1-213-627-8999. Page uses the site details only.
7. Lower-speed form factors (QSFP28 100G, SFP28 25G, SFP+ 10G, SFP 1G) are the industry-standard ones; Kevin to confirm these are what we supply.

**Answered 2026-11-09 (Tom):** form factors in item 7 confirmed; item 5 (origin question) is not an issue. Still open: items 1, 2, 4, 6.
