// Data center section (Tom, 2026-11-17). Facts come only from Kevin's "Global Data Center Site Overview"
// deck (v4, Nov 2026). Kept off the public pages on purpose: asking prices, colocation and per-site power
// rates, seller, developer and partner names, exact coordinates. Those go to qualified buyers under NDA.
// Capacity and power figures are seller-represented and are said so on every page.
import photos from "./dc-stock-photos.json";

export type Site = { country: string; location: string; capacity: string; notes: string };
export const SITES: { region: string; sites: Site[] }[] = [
  { region: "United States", sites: [
    { country: "US", location: "North Dakota campus", capacity: "Up to 230MW", notes: "100MW feed line ready, power expected 2027 subject to a signed utility contract; a further 100MW in study for 2030. MISO grid. For sale" },
    { country: "US", location: "Hickory, North Carolina", capacity: "15MW", notes: "Existing ~50,000 sq ft building on 10 acres, 3MW live, upside to 50MW. Sale, lease or colocation" },
    { country: "US", location: "North Carolina", capacity: "12MW to 300MW", notes: "Fund-backed development" },
    { country: "US", location: "Boston, Massachusetts", capacity: "30MW", notes: "" },
    { country: "US", location: "Texas", capacity: "50MW", notes: "Pairs with the prefab AI data center design" },
    { country: "US", location: "Las Vegas, Nevada", capacity: "50MW", notes: "Solar power" },
    { country: "US", location: "New Mexico", capacity: "25MW", notes: "Solar power, the lowest power cost in the portfolio" },
  ] },
  { region: "Japan", sites: [
    { country: "JP", location: "Hokkaido", capacity: "1.2GW", notes: "" },
    { country: "JP", location: "Kyushu", capacity: "1GW", notes: "Nuclear and thermal power, phased 100MW, 250MW, 650MW" },
    { country: "JP", location: "Kanto", capacity: "500MW", notes: "" },
    { country: "JP", location: "Kansai", capacity: "200MW", notes: "" },
  ] },
  { region: "Taiwan", sites: [
    { country: "TW", location: "Nangang, Taipei", capacity: "10MW", notes: "5MW grid plus 5MW solar" },
    { country: "TW", location: "Keelung", capacity: "5MW", notes: "" },
    { country: "TW", location: "Hsinchu", capacity: "3MW", notes: "" },
  ] },
  { region: "Southeast Asia and Australia", sites: [
    { country: "TH", location: "Rayong, Thailand", capacity: "800MW", notes: "100MW available now, containerized IDC in 5MW units" },
    { country: "TH", location: "Rayong, Thailand", capacity: "20MW", notes: "Standalone site for edge or regional deployments" },
    { country: "ID", location: "Batam, Indonesia", capacity: "500MW", notes: "Full 500MW available, near Singapore, subsea fiber to Singapore and Jakarta" },
    { country: "MY", location: "Johor Bahru, Malaysia", capacity: "300MW", notes: "Full 300MW available" },
    { country: "AU", location: "Sydney, Australia", capacity: "25MW", notes: "25MW remaining of a 100MW campus" },
  ] },
  { region: "Middle East", sites: [
    { country: "AE", location: "Dubai, UAE", capacity: "40MW", notes: "Colocation. 30MW IT load operational, further 10MW blocks in April, June and July 2027" },
  ] },
];

export const STATS: [string, string][] = [
  ["8", "Countries with sites"],
  ["3MW to 1.2GW", "Range of site sizes"],
  ["$0.02 to $0.19", "Indicative power cost per kWh"],
  ["3", "Paths: buy, lease, build"],
];

export const PATHS = [
  { href: "/buy-a-data-center", title: "Buy", time: "4 to 9 months to close", body: "Take over a powered site or campus. Fastest route to owning capacity, with diligence in place of construction." },
  { href: "/data-center-colocation", title: "Lease", time: "1 to 6 months for ready space", body: "Colocation, wholesale suites, powered shell or containerized units. Lowest upfront capital." },
  { href: "/build-ai-data-center", title: "Build", time: "15 months with prefab", body: "A prefab AI data center design on a site with secured power, against 24 to 48 months for a conventional build." },
];

// "From fiber to rack": the Vocom ecosystem, from the go-to-market strategy (Kevin, 2026-11-12).
export const LADDER = [
  { step: "01", title: "Fiber and transceivers", body: "Cable, MPO and MTP trunks and 400G, 800G and 1.6T optics, with firm lead times.", href: "/fiber-optic-cables", link: "Fiber products" },
  { step: "02", title: "AI servers", body: "Supermicro AI and GPU servers for the cluster the optics connect.", href: "/vocom-ai-servers", link: "AI servers" },
  { step: "03", title: "Data center space", body: "Powered sites to buy, space to lease, or a prefab build on secured power.", href: "/data-centers", link: "Data center sites" },
  { step: "04", title: "GPU capacity", body: "Compute while your own build is finished.", href: "/vocomai-gpu-solutions", link: "GPU solutions" },
  { step: "05", title: "Software", body: "RenOS runs AI agents across models under your rules, with an audit trail.", href: "/vocom-ai-agents", link: "RenOS" },
];

export type Photo = { name: keyof typeof photos; alt: string; caption: string };
// Stock photos already licensed for the site (Tom, 2026-11-17: no site-visit photos).
export const PHOTO = (name: keyof typeof photos) => ({ base: `/assets/img/dc-stock/${name}`, ...photos[name] });
export const GALLERY: Photo[] = [
  { name: "dc-server-aisle", alt: "Rows of server racks in a data center aisle", caption: "Server rows in a data hall" },
  { name: "dc-fiber-patch-panel", alt: "Fiber patch cords at a high-density patch panel", caption: "High-density fiber patching" },
  { name: "dc-rack-cabling", alt: "Server racks with structured fiber and copper cabling", caption: "Racks cabled and ready" },
  { name: "dc-engineer-aisle", alt: "Engineer with a laptop walking a data center server aisle", caption: "Operations on the floor" },
  { name: "dc-renewable-power", alt: "Wind turbines generating power for the grid", caption: "Power comes first" },
  { name: "dc-rack-patching", alt: "Technician patching network cables in a rack", caption: "Patching and turn-up" },
];

export const CAVEAT = "Capacity, power and timing figures are provided by the site owners and are verified in diligence. Documents, pricing and exact locations go to qualified buyers under NDA.";
