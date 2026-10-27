// Site-wide settings.

// FORMS_URL: the Google Apps Script web app (apps-script/Code.gs) that receives both the
// quote form (/contact-vocomai) and the newsletter popup. See README "Forms".
// Leave empty until the script is deployed: the forms then show their error state.
export const FORMS_URL = "https://script.google.com/macros/s/AKfycbyfh7K69zH0bQ_EOfG8rMyosU6iKPJcME7hlN1YsntPGpMTNscQ2pPzLElhJTjO3NQv/exec";
export const QUOTE_FORM_URL = FORMS_URL;
export const QUOTE_FORM_FALLBACK_EMAIL = "";

// Cloudflare Turnstile (spam protection on the quote form). Create a widget in Cloudflare:
// Turnstile -> Add widget, hostnames www.vocom.ai and vocomweb.kevin-9ff.workers.dev, mode
// "Invisible" or "Managed". Paste its Site Key here and its Secret Key into TURNSTILE_SECRET in
// apps-script/Code.gs. Empty = not shown (the honeypot and timing checks still run).
export const TURNSTILE_SITE_KEY = "0x4AAAAAAFn2h6vnUEZMTnD3";

// Requirements file on the quote form: accepted types and maximum size.
export const QUOTE_FILE = { accept: ".xlsx,.xls,.csv,.pdf", maxMB: 10 };

// Newsletter popup. Copy approved by Tom, 2026-10-22.
export const NEWSLETTER = {
  enabled: true, // the popup only renders once FORMS_URL is set
  heading: "Get Vocom Insights in Your Inbox",
  body: "Fiber optic cable lead times, specification guides and AI infrastructure news for network builders.",
  placeholder: "name@company.com",
  button: "Subscribe",
  consent: "I agree to receive emails from Vocom. I can unsubscribe at any time.",
  success: "Thanks, you are subscribed.",
  error: "Something went wrong. Please try again.",
  // when to show: whichever comes first
  delaySeconds: 25,
  scrollPercent: 50,
  // after closing, wait this many days before showing again (never again once subscribed)
  snoozeDays: 30,
  // pages where it never shows
  excludePaths: ["/contact-vocomai", "/search", "/vocom-privacy-policy", "/404"],
};
