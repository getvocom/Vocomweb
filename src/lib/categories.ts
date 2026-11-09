// Product category (as used in the content collection) -> its fiber category page.
export const CATEGORY_PAGES: Record<string, [string, string]> = {
  "Outside Plant Loose Tube Cable": ["Loose Tube Cable", "/loose-tube-fiber-optic-cable"],
  "Ribbon and High Fiber Count Cable": ["Ribbon and High Fiber Count Cable", "/ribbon-fiber-optic-cable"],
  "Air Blown Micro Cable, Microduct and Vaults": ["Air Blown Micro Cable and Microduct", "/air-blown-micro-fiber-cable"],
  "Aerial and Self-Supporting Cable": ["ADSS and Aerial Cable", "/adss-aerial-fiber-cable"],
  "Drop Cable and FTTH": ["FTTH Drop Cable", "/ftth-drop-cable"],
  "Data Center and Indoor Connectivity": ["Data Center Fiber Cabling", "/data-center-fiber-cabling"],
  "Connectors, Terminal Boxes and Hardware": ["Connectors and Hardware", "/fiber-optic-connectors-and-hardware"],
  "Optical Transceivers": ["Optical Transceivers", "/optical-transceivers"],
};

// Product page wording. Cable products keep the original Framer labels; transceivers (active modules,
// not cable) reuse the same fields: codes = form factor, fiberCounts = data rate, construction = build.
export const TRANSCEIVERS = "Optical Transceivers";
export function productLabels(category: string) {
  const trx = category === TRANSCEIVERS;
  return {
    trx,
    codes: trx ? "Form Factor" : "Codes",
    counts: trx ? "Data Rate" : "Fiber Counts",
    construction: trx ? "Build and Compatibility" : "Construction and Rating",
    thing: trx ? "module" : "cable",
    faq: trx
      ? ["What data rate does this module run at?", "How is it built?", "Where is this module used in a cluster?", "What form factor is it?"]
      : ["What fiber counts does this cable come in?", "What is it built and rated to?", "Where is this cable typically used?", "What product codes does it ship under?"],
  };
}
