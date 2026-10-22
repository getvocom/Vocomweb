// Site-wide settings.

// FORMS_URL: the Google Apps Script web app (apps-script/Code.gs) that receives both the
// quote form (/contact-vocomai) and the newsletter popup. See README "Forms".
// Leave empty until the script is deployed: the forms then show their error state.
export const FORMS_URL = "";
export const QUOTE_FORM_URL = FORMS_URL;
export const QUOTE_FORM_FALLBACK_EMAIL = "";

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
