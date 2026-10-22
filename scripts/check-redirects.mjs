// Verifies every rule in public/_redirects on a deployed site (preview or production),
// plus host/trailing-slash behaviour.
// Usage: node scripts/check-redirects.mjs https://<preview>.pages.dev   (or https://www.vocom.ai)
const base = process.argv[2];
if (!base) { console.error("usage: node scripts/check-redirects.mjs <base-url>"); process.exit(2); }
import fs from "node:fs";
const rules = fs.readFileSync("public/_redirects", "utf8").split("\n").filter((l) => l.trim() && !l.startsWith("#")).map((l) => l.trim().split(/\s+/));
let fail = 0;
for (const [from, to, code = "302"] of rules) {
  const r = await fetch(base + from, { redirect: "manual" });
  const loc = r.headers.get("location") || "";
  const ok = String(r.status) === code && (loc === to || loc === base + to || new URL(loc, base).pathname === to);
  if (!ok) fail++;
  console.log(ok ? "OK  " : "FAIL", from, "->", r.status, loc);
}
// trailing slash should 301/308 to the slashless URL
const t = await fetch(base + "/about/", { redirect: "manual" });
console.log([301, 308].includes(t.status) ? "OK  " : "FAIL", "/about/ ->", t.status, t.headers.get("location"));
process.exit(fail ? 1 : 0);
