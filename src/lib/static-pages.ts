// Every static page, in the order of the old Framer sitemap (new pages appended).
// Used by sitemap.xml and the HTML /sitemap page. /search and /404 are excluded.
export const STATIC = [
  "/", "/vocomai-supply-chain", "/vocomai-coach-hub", "/vocomai-vocam", "/contact-vocomai", "/resources", "/pricing-vocomai",
  "/vocom-ai", "/vocom-ai-servers", "/vocomai-gpu-solutions", "/vocomai-manufacturing", "/vocom-international", "/vocom-ai-agents",
  "/vocom-services", "/about", "/vocom-privacy-policy", "/blog", "/vocomai-consultancy", "/marketing-alliance", "/fiber-optic-cables",
  "/loose-tube-fiber-optic-cable", "/ribbon-fiber-optic-cable", "/data-center-fiber-cabling", "/air-blown-micro-fiber-cable",
  "/ftth-drop-cable", "/adss-aerial-fiber-cable", "/fiber-optic-cable-catalog",
  // added 2026-10-22 (blocked on Framer by the plan's page limit)
  "/fiber-optic-cable-for-distributors", "/indoor-fiber-optic-cable", "/fiber-optic-cable-referral-partners", "/fiber-optic-connectors-and-hardware", "/iepl-iplc-private-leased-circuits", "/wholesale-voice-termination",
  // added 2026-10-24
  "/case-studies",
  // added 2026-11-06
  "/fiber-optic-cable-supplier-comparison",
  // added 2026-11-09
  "/optical-transceivers",
  // added 2026-11-10
  "/6912-fiber-optic-cable",
  "/1728-fiber-optic-cable",
  "/fiber-optic-glossary",
  "/data-centers", "/buy-a-data-center", "/data-center-colocation", "/build-ai-data-center",
  // added 2026-11-23
  "/mtp-trunk-cable", "/enterprise-fiber-optic-cable",
  // added 2026-11-24
  "/sitemap", "/data-center-partners",
];

// The same pages grouped by topic, for /llms.txt and the HTML /sitemap page.
export const SECTIONS: [string, string[]][] = [
  ["Data centers", ["/data-centers", "/buy-a-data-center", "/data-center-colocation", "/build-ai-data-center", "/data-center-partners", "/vocom-ai-servers"]],
  ["Fiber optic cable", ["/fiber-optic-cables", "/fiber-optic-cable-catalog", "/fiber-optic-cable-supplier-comparison", "/loose-tube-fiber-optic-cable", "/ribbon-fiber-optic-cable", "/6912-fiber-optic-cable", "/1728-fiber-optic-cable", "/data-center-fiber-cabling", "/mtp-trunk-cable", "/enterprise-fiber-optic-cable", "/optical-transceivers", "/air-blown-micro-fiber-cable", "/ftth-drop-cable", "/adss-aerial-fiber-cable", "/fiber-optic-cable-for-distributors", "/indoor-fiber-optic-cable", "/fiber-optic-cable-referral-partners", "/fiber-optic-connectors-and-hardware", "/fiber-optic-glossary"]],
  ["Telecom services (Vocom International)", ["/vocom-international", "/vocom-services", "/iepl-iplc-private-leased-circuits", "/wholesale-voice-termination"]],
  ["Vocom AI", ["/vocom-ai", "/vocom-ai-agents", "/vocom-ai-servers", "/vocomai-gpu-solutions", "/vocomai-supply-chain", "/vocomai-coach-hub", "/vocomai-vocam", "/vocomai-manufacturing", "/vocomai-consultancy", "/pricing-vocomai"]],
  ["Company", ["/about", "/case-studies", "/contact-vocomai", "/marketing-alliance", "/resources", "/blog", "/vocom-privacy-policy", "/sitemap"]],
];
