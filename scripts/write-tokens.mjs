// Writes src/styles/tokens.css from the Framer colour styles and the brand palette.
// Usage: node scripts/write-tokens.mjs
import fs from "node:fs";
import { tokenNames, BRAND, BRAND_GRADIENT } from "./framer/css.mjs";

const fromHex8 = (h) => {
  const [r, g, b, a] = [1, 3, 5, 7].map((i) => parseInt(h.slice(i, i + 2), 16));
  return a === 255 ? `#${h.slice(1, 7)}` : `rgba(${r}, ${g}, ${b}, ${+(a / 255).toFixed(3)})`;
};
const framer = Object.values(tokenNames).map((t) => `  --${t.name}: ${t.value};`);
const brand = Object.entries(BRAND).filter(([, n]) => !n.startsWith("color-")).map(([h, n]) => `  --${n}: ${fromHex8(h)};`);

const css = `/* Design tokens for vocom.ai.
 * Colours come from the Framer project's colour styles (--color-*) and from raw values the
 * design repeats (--brand-*, --ink-*, --gray-*). scripts/framer/css.mjs maps exact matches
 * to these variables, so changing a token here changes every use.
 * Breakpoints (match Framer): desktop >= 1200px, tablet 810px-1199.98px, phone <= 809.98px.
 */
:root {
  /* Brand */
${brand.join("\n")}
  --brand-gradient: ${BRAND_GRADIENT};

  /* Framer colour styles */
${framer.join("\n")}

  /* Type */
  --font-sans: "Inter", "Inter Placeholder", sans-serif;
  --font-display: "Inter Display", "Inter Display Placeholder", sans-serif;
  --font-variable: "Inter Variable", "Inter", sans-serif;
  --font-manrope: "Manrope", sans-serif;
  --font-lexend: "Lexend", sans-serif;

  /* Radii */
  --radius-pill: 999px;
  --radius-sm: 8px;
  --radius-md: 16px;
  --radius-lg: 20px;
  --radius-xl: 24px;

  /* Shadows */
  --shadow-card: 0px 12px 30px 0px rgba(122, 18, 48, 0.06);
  --shadow-button-hover: 0px 6px 16px 0px rgba(20, 10, 15, 0.18);

  /* Layout */
  --container: 1180px;
  --header-height: 66px;
}
`;
fs.writeFileSync("src/styles/tokens.css", css);
console.log("tokens.css written");
