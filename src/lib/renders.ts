// Vocom product and hero renders (built by scripts/render-images.mjs from the 4K originals).
// Resolve a render id (VC-005, NEW-1, VC-105...) or a product image path to the files and
// sizes needed for a <picture> with WebP + JPG srcsets.
import renders from "../../data/render-images.json";

export interface Render { base: string; widths: number[]; width: number; height: number }

export function render(id: string): Render | undefined {
  const p = (renders.products as Record<string, { name: string; w: number; h: number }>)[id];
  if (p) return { base: `/assets/img/products/${p.name}`, widths: [480, 800, 1200], width: p.w, height: p.h };
  const h = (renders.hero as Record<string, string>)[id];
  if (h) return { base: `/assets/img/hero/${h}`, widths: [1280, 1920], width: 3840, height: 2158 };
  return undefined;
}

// A product's image.src is its 1200px JPG; find the render it belongs to.
export function renderForSrc(src?: string): Render | undefined {
  const id = Object.entries(renders.products).find(([, r]) => src === `/assets/img/products/${r.name}-1200.jpg`)?.[0];
  return id ? render(id) : undefined;
}

export const srcset = (r: Render, ext: "webp" | "jpg") => r.widths.map((w) => `${r.base}-${w}.${ext} ${w}w`).join(", ");
export const fallback = (r: Render) => `${r.base}-${r.widths[r.widths.length - 1]}.jpg`;
