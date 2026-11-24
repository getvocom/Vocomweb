// Site navigation: one list used by the header (mega menus), the phone menu and the footer.
// Every public page should be reachable from here. Fiber Products is organised by product family
// (Tom, 2026-11-16): each family links its category page and its main product pages.

export interface NavLink { label: string; href: string; desc?: string }
// A group with `href` is a product family: its title links to the family page. A section with `grid`
// (Fiber Products) lays its groups out four across and shows compact links without descriptions.
export interface NavGroup { title: string; href?: string; links: NavLink[] }
export interface NavSection { label: string; href: string; groups: NavGroup[]; wide?: boolean; grid?: boolean }

export const NAV: NavSection[] = [
  {
    label: "Fiber Products",
    href: "/fiber-optic-cables",
    wide: true,
    grid: true,
    groups: [
      {
        title: "Outside Plant Fiber",
        href: "/loose-tube-fiber-optic-cable",
        links: [
          { label: "Loose Tube Cable", href: "/loose-tube-fiber-optic-cable", desc: "GCYFTY and GYFS, 12F to 864F" },
          { label: "Dielectric Loose Tube Cable", href: "/products/loose-tube-stranded-dielectric" },
          { label: "Armored Loose Tube Cable", href: "/products/loose-tube-stranded-armored" },
          { label: "Central Tube Cable", href: "/products/central-tube" },
          { label: "Dry and Half-Dry Loose Tube", href: "/products/dry-and-half-dry-loose-tube" },
          { label: "Armored Direct Burial Cable", href: "/products/armored-direct-burial" },
        ],
      },
      {
        title: "Ribbon and High Count",
        href: "/ribbon-fiber-optic-cable",
        links: [
          { label: "Ribbon and High Fiber Count", href: "/ribbon-fiber-optic-cable", desc: "Rollable and flat ribbon to 6912F" },
          { label: "6912F Fiber Cable", href: "/6912-fiber-optic-cable", desc: "Rollable ribbon, 38.0mm OD, hyperscale" },
          { label: "1728F Fiber Cable", href: "/1728-fiber-optic-cable", desc: "Dielectric ribbon, 28.4mm OD, backbone" },
          { label: "Rollable Ribbon Cable", href: "/products/rollable-ribbon-outside-plant" },
          { label: "Flat Ribbon Cable", href: "/products/flat-ribbon" },
          { label: "High-Count Dielectric Ribbon", href: "/products/high-count-dielectric-ribbon" },
          { label: "Central Tube Ribbon", href: "/products/central-tube-ribbon" },
        ],
      },
      {
        title: "Air Blown and Microduct",
        href: "/air-blown-micro-fiber-cable",
        links: [
          { label: "Air Blown Micro Cable", href: "/air-blown-micro-fiber-cable", desc: "Micro cable, microduct and vaults" },
          { label: "Air Blown Micro Cable Specs", href: "/products/air-blown-micro-cable" },
          { label: "HDPE Microduct", href: "/products/hdpe-microduct-single-way" },
          { label: "HDPE Microduct Bundle", href: "/products/hdpe-microduct-bundle" },
          { label: "Composite Underground Vault", href: "/products/composite-vault-heavy" },
          { label: "Composite Surface Box", href: "/products/composite-surface-box" },
        ],
      },
      {
        title: "Aerial and Self-Supporting",
        href: "/adss-aerial-fiber-cable",
        links: [
          { label: "ADSS and Aerial Cable", href: "/adss-aerial-fiber-cable", desc: "ADSS, figure 8 and direct burial" },
          { label: "ADSS All-Dielectric Cable", href: "/products/adss-all-dielectric" },
          { label: "Figure 8 Fiber Cable", href: "/products/figure-8" },
          { label: "Hybrid Fiber and Copper Cable", href: "/products/hybrid-fiber-and-copper" },
        ],
      },
      {
        title: "FTTH and Drop Cable",
        href: "/ftth-drop-cable",
        links: [
          { label: "FTTH Drop Cable", href: "/ftth-drop-cable", desc: "Flat and armored drop, OptiTap compatible" },
          { label: "Flat Drop Cable", href: "/products/flat-drop" },
          { label: "Flat Drop with Tracing Wire", href: "/products/flat-drop-with-tracing-wire" },
          { label: "Armored Indoor Drop Cable", href: "/products/armored-indoor-drop" },
          { label: "Mini Cable Plenum", href: "/products/mini-cable-plenum" },
          { label: "Low-Visibility FTTR Cable", href: "/products/low-visibility-fttr" },
        ],
      },
      {
        title: "Data Center and Indoor",
        href: "/data-center-fiber-cabling",
        links: [
          { label: "Data Center Fiber Cabling", href: "/data-center-fiber-cabling", desc: "MPO and MTP trunks, cassettes, harnesses" },
          { label: "Indoor Fiber Cable", href: "/indoor-fiber-optic-cable", desc: "OFNP plenum and OFNR riser" },
          { label: "Enterprise Fiber Cable", href: "/enterprise-fiber-optic-cable", desc: "Buildings, campus and server room" },
          { label: "MTP Trunk Cable Guide", href: "/mtp-trunk-cable", desc: "8F to 864F, polarity A, B or C" },
          { label: "MTP/MPO Trunk Cable", href: "/products/mtp-mpo-trunk-cable" },
          { label: "MPO Patch Cord", href: "/products/mpo-patch-cord" },
          { label: "LC Fiber Patch Cord", href: "/products/lc-fiber-patch-cord" },
          { label: "SC Fiber Patch Cord", href: "/products/sc-fiber-patch-cord" },
          { label: "Armored Fiber Patch Cord", href: "/products/armored-fiber-patch-cord" },
          { label: "Harness Breakout Cable", href: "/products/harness-breakout" },
          { label: "Modular Cassette", href: "/products/modular-cassette" },
          { label: "Indoor Rollable Ribbon", href: "/products/rollable-ribbon-indoor" },
        ],
      },
      {
        title: "Connectors and Hardware",
        href: "/fiber-optic-connectors-and-hardware",
        links: [
          { label: "Connectors and Hardware", href: "/fiber-optic-connectors-and-hardware", desc: "Patch cords, adapters, terminal boxes" },
          { label: "OptiTap Compatible Connector", href: "/products/optitap-compatible-connector" },
          { label: "SC Shutter Connector", href: "/products/sc-shutter-connector" },
          { label: "Cassette Adapters", href: "/products/cassette-adapters" },
          { label: "In-House Terminal Box", href: "/products/in-house-terminal-box" },
          { label: "Waterproof Terminal Box", href: "/products/waterproof-terminal-box" },
        ],
      },
      {
        title: "Catalog and Buying",
        href: "/fiber-optic-cable-catalog",
        links: [
          { label: "All Fiber Optic Cable", href: "/fiber-optic-cables", desc: "Every cable we supply, build-to-order" },
          { label: "Full Product Catalog", href: "/fiber-optic-cable-catalog", desc: "Every product with codes and fiber counts" },
          { label: "Optical Transceivers", href: "/optical-transceivers", desc: "400G, 800G and 1.6T for AI clusters" },
          { label: "Catalog Downloads", href: "/resources", desc: "Catalogs and downloads" },
          { label: "Supplier Comparison", href: "/fiber-optic-cable-supplier-comparison", desc: "Lead times and geographies side by side" },
          { label: "Case Studies", href: "/case-studies", desc: "Builds we have supplied in the US and Canada" },
          { label: "For Distributors", href: "/fiber-optic-cable-for-distributors", desc: "Second-source supply" },
          { label: "Referral Partners", href: "/fiber-optic-cable-referral-partners", desc: "Refer an inquiry" },
          { label: "Request a Quote", href: "/contact-vocomai", desc: "Send your spec, get a sized quote" },
        ],
      },
    ],
  },
  {
    label: "Data Centers",
    href: "/data-centers",
    groups: [
      {
        title: "Sites and space",
        links: [
          { label: "Data Center Sites", href: "/data-centers", desc: "Powered sites in 8 countries" },
          { label: "Buy a Data Center", href: "/buy-a-data-center", desc: "Campuses and buildings for sale" },
          { label: "Lease and Colocation", href: "/data-center-colocation", desc: "Colocation, powered shell, containerized" },
          { label: "Build an AI Data Center", href: "/build-ai-data-center", desc: "Prefab design, about 15 months" },
          { label: "Owners and Introducers", href: "/data-center-partners", desc: "List a site or introduce a buyer" },
        ],
      },
      {
        title: "Servers and compute",
        links: [
          { label: "AI Servers", href: "/vocom-ai-servers", desc: "Buy Supermicro AI and GPU servers" },
          { label: "GPU Solutions", href: "/vocomai-gpu-solutions", desc: "GPU compute for AI teams" },
          { label: "Optical Transceivers", href: "/optical-transceivers", desc: "400G, 800G and 1.6T" },
          { label: "Data Center Fiber Cabling", href: "/data-center-fiber-cabling", desc: "MPO and MTP trunks, cassettes" },
        ],
      },
    ],
  },
  {
    label: "Vocom AI",
    href: "/vocom-ai",
    wide: true,
    groups: [
      {
        title: "Platform",
        links: [
          { label: "Vocom AI", href: "/vocom-ai", desc: "Proven AI tools matched to the job" },
          { label: "RenOS AI Agents", href: "/vocom-ai-agents", desc: "Governed AI agents across any model" },
          { label: "Pricing", href: "/pricing-vocomai", desc: "Free demo, AI audit or enterprise quote" },
        ],
      },
      {
        title: "Solutions",
        links: [
          { label: "Supply Chain", href: "/vocomai-supply-chain" },
          { label: "AI Coach", href: "/vocomai-coach-hub" },
          { label: "Network Security", href: "/vocomai-vocam" },
          { label: "Manufacturing", href: "/vocomai-manufacturing" },
          { label: "Consulting", href: "/vocomai-consultancy" },
        ],
      },
    ],
  },
  {
    label: "Vocom International",
    href: "/vocom-international",
    groups: [
      {
        title: "Carrier services",
        links: [
          { label: "Vocom International", href: "/vocom-international", desc: "FCC 214 licensed carrier since 1998" },
          { label: "Telecom Services", href: "/vocom-services", desc: "IP transit, MPLS-VPN, Anti-DDoS and more" },
          { label: "IEPL and IPLC Private Circuits", href: "/iepl-iplc-private-leased-circuits", desc: "Dedicated capacity across the Pacific" },
          { label: "Wholesale Voice Termination", href: "/wholesale-voice-termination", desc: "IDD and SMS on direct NNI routes" },
        ],
      },
    ],
  },
  {
    label: "About",
    href: "/about",
    groups: [
      {
        title: "Company",
        links: [
          { label: "About Us", href: "/about", desc: "Founded in 1993, El Monte and Taipei" },
          { label: "Case Studies", href: "/case-studies", desc: "Builds we have supplied" },
          { label: "Blog", href: "/blog", desc: "Fiber specs, lead times and guides" },
          { label: "Fiber Optic Glossary", href: "/fiber-optic-glossary", desc: "OS2, G.657, OFNP, MPO and more, explained" },
          { label: "Resources", href: "/resources", desc: "Catalogs and downloads" },
          { label: "Marketing Alliance", href: "/marketing-alliance", desc: "For AI companies" },
          { label: "Contact Us", href: "/contact-vocomai", desc: "Request a quote" },
        ],
      },
    ],
  },
];

// Footer "Popular Products": the products buyers search for most (Search Console, Oct 2026).
export const POPULAR: NavLink[] = [
  { label: "1.6T OSFP Transceiver", href: "/products/1-6t-osfp-transceiver" },
  { label: "800G Transceiver", href: "/products/800g-optical-transceiver" },
  { label: "MTP/MPO Trunk Cable", href: "/products/mtp-mpo-trunk-cable" },
  { label: "LC Fiber Patch Cord", href: "/products/lc-fiber-patch-cord" },
  { label: "Armored Fiber Patch Cord", href: "/products/armored-fiber-patch-cord" },
  { label: "OptiTap Compatible Connector", href: "/products/optitap-compatible-connector" },
  { label: "HDPE Microduct Bundle", href: "/products/hdpe-microduct-bundle" },
  { label: "Hybrid Fiber and Copper Cable", href: "/products/hybrid-fiber-and-copper" },
  { label: "Rollable Ribbon Cable", href: "/products/rollable-ribbon-outside-plant" },
  { label: "Flat Drop Cable", href: "/products/flat-drop" },
];
