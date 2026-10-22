import { defineConfig } from "astro/config";

// URLs must match the live Framer site exactly: www host, no trailing slash,
// /about served from about.html (no redirect to /about/).
export default defineConfig({
  site: "https://www.vocom.ai",
  trailingSlash: "never",
  build: { format: "file", inlineStylesheets: "auto" },
  compressHTML: true,
});
