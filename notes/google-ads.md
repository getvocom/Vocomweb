# Google Ads lead conversion (set up 2026-10-27)

- Google tag: `AW-18539470653`
- Conversion ("Submit lead forms"): `AW-18539470653/RST8CJmhkasdEL2-p4hF`
- GA4 (existing, reused): `G-YYWN6PCL75`
- GTM `GTM-MWPWLP7Z`: untouched. Nothing was added to it.
- Enhanced conversions: off. No form values (name, email, company, phone) are sent to Google.

## Rebuild (this repo)

| What | Where |
|---|---|
| `gtag('config', 'AW-18539470653')` on every page, reusing the one GA4 gtag.js | `src/layouts/Base.astro` (IDs in `src/config.ts`) |
| Conversion + GA4 `generate_lead`, quote form only | `src/components/SubmitButton.astro` |
| Script replies `{ result: "success", saved: true }` only when the quote was saved | `apps-script/Code.gs` (deployed as version 7, same URL) |

The conversion fires once, only when the Apps Script confirms the save.
- **Carries:** a `transaction_id` from `crypto.randomUUID()`.
- **Redirect:** goes to /resources when Google confirms (`event_callback`) or after 1 second, whichever comes first.
- **Never fires for:**
  - the newsletter popup;
  - bots (honeypot, decoys, time trap);
  - submissions the script rejects;
  - network errors;
  - a second click on "Thank you".

Tested locally on 2026-10-27, with gtag stubbed so the tests didn't count in Ads:

| Case | Result |
|---|---|
| Empty form | Blocked, nothing sent |
| Fiber selected, fiber fields empty | Blocked (Fiber Count, Fiber Type, Footage, Delivery state / country, Needed By are required for fiber only) |
| Non-fiber use case | Valid without the fiber fields |
| Bot (honeypot filled) | Fake "Thank you", no request, no conversion |
| Rejected by the script | "Something went wrong", no conversion, no redirect |
| Real fiber quote | Saved (`saved: true`), `generate_lead` + 1 conversion, redirect to /resources; second click sent nothing |

## Live site while it's still on Framer

The rebuild code only goes live at the DNS switch. Until then, use these three Framer steps.

### 1. Google tag (site-wide)

Go to Framer → **Site Settings** → **General** → **Custom Code** → **End of `<head>` tag**, and paste:

```html
<!-- Google Ads AW-18539470653: reuses gtag.js if GA4 already loaded it -->
<script>
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () { dataLayer.push(arguments); };
  if (!document.querySelector('script[src*="googletagmanager.com/gtag/js"]')) {
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=AW-18539470653';
    document.head.appendChild(s);
    gtag('js', new Date());
  }
  gtag('config', 'AW-18539470653');
</script>
```

### 2. Thank-you page

1. In the Framer **Pages** panel, click **+** to add a new page with the slug `thank-you-spec-request`.
   - Give it a short thank-you message and a link to /resources (copy to approve).
2. Open the page's settings (the gear icon next to the page). Under **SEO**, turn off **Show in search engines** (noindex).
3. Open the page's settings → **Custom Code** → **End of `<body>` tag**, and paste:

```html
<script>
  (function () {
    // only after the quote form, once per browser session
    if (document.referrer.indexOf('/contact-vocomai') === -1) return;
    try { if (sessionStorage.getItem('vocom_lead_sent')) return; sessionStorage.setItem('vocom_lead_sent', '1'); } catch (e) {}
    if (typeof window.gtag !== 'function') return;
    var id = (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : Date.now() + '-' + Math.random().toString(36).slice(2);
    gtag('event', 'conversion', { send_to: 'AW-18539470653/RST8CJmhkasdEL2-p4hF', transaction_id: id });
    gtag('event', 'generate_lead', { send_to: 'G-YYWN6PCL75', form_id: 'quote_request', page_path: '/contact-vocomai' });
  })();
</script>
```

### 3. Point the form at the thank-you page

1. On `/contact-vocomai`, select the **form**.
2. In the right panel, under **Success** (or **Redirect**), choose **Link** and enter the full URL `https://www.vocom.ai/thank-you-spec-request`.
   - Use the full URL, not a page picker. A full URL forces a real page load, so the page's custom code and referrer check run.
3. Publish.

## Remove at DNS switchover (Framer → rebuild)

1. Confirm the rebuild is on `main` and deployed with this conversion code.
2. In Framer:
   - delete the Site Settings head snippet;
   - delete the `thank-you-spec-request` page code;
   - unpublish the page.
   - Framer stops serving www.vocom.ai after the switch, but this keeps the framer.app copy from counting anything.
3. Add `/thank-you-spec-request /resources 301` to `public/_redirects`. Ads clicks and bookmarks then land somewhere instead of a 404.
4. Run Tag Assistant on the live site (below). Make sure exactly one conversion fires per submission.
5. For the first week, compare Google Ads conversions with new rows in the Quotes sheet. They should match, apart from visitors who block Google tags.

## Verify on the live site with Tag Assistant (after deploy)

1. Open https://tagassistant.google.com → **Add domain** → `https://www.vocom.ai/contact-vocomai` → **Connect**.
2. In the connected tab, check the Tag Assistant summary. It should list **AW-18539470653** and **G-YYWN6PCL75**, each once.
3. Submit a real test quote (fiber, all fields; name it "TEST").
4. In Tag Assistant, open the AW-18539470653 tag.
   - There should be exactly **one** `conversion` event, with `send_to` `AW-18539470653/RST8CJmhkasdEL2-p4hF` and a `transaction_id`.
   - It should come after the form submit, not on page load or button click.
5. Repeat with a missing required field. There should be no `conversion` event.
6. In Google Ads → **Goals** → **Conversions** → "Submit lead forms", the status should change to "Recording conversions" within a few hours.
7. Delete the TEST row from the Quotes sheet and the test email from Kevin's inbox.
