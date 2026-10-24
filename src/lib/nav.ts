// Site navigation: one list used by the header (mega menus), the phone menu and the footer.
// Every public page should be reachable from here. Product links are the ones buyers search
// for most (Search Console, Oct 2026): MTP/MPO trunks, patch cords, microduct, hybrid
// fiber-copper, rollable ribbon, OptiTap.

export interface NavLink { label: string; href: string; desc?: string }
export interface NavGroup { title: string; links: NavLink[] }
export interface NavSection { label: string; href: string; groups: NavGroup[]; wide?: boolean }

export const NAV: NavSection[] = [
  {
    label: "Fiber Optic",
    href: "/fiber-optic-cables",
    wide: true,
    groups: [
      {
        title: "By cable type",
        links: [
          { label: "All Fiber Optic Cable", href: "/fiber-optic-cables", desc: "Every cable we supply, build-to-order" },
          { label: "Loose Tube Cable", href: "/loose-tube-fiber-optic-cable", desc: "GCYFTY and GYFS, 12F to 864F" },
          { label: "Ribbon and High Fiber Count", href: "/ribbon-fiber-optic-cable", desc: "Rollable and flat ribbon to 6912F" },
          { label: "Air Blown Micro Cable", href: "/air-blown-micro-fiber-cable", desc: "Micro cable, microduct and vaults" },
          { label: "ADSS and Aerial Cable", href: "/adss-aerial-fiber-cable", desc: "ADSS, figure 8 and direct burial" },
          { label: "FTTH Drop Cable", href: "/ftth-drop-cable", desc: "Flat and armored drop, OptiTap compatible" },
          { label: "Indoor Fiber Cable", href: "/indoor-fiber-optic-cable", desc: "OFNP plenum and OFNR riser" },
        ],
      },
      {
        title: "By application",
        links: [
          { label: "Data Center Fiber Cabling", href: "/data-center-fiber-cabling", desc: "MPO and MTP trunks, cassettes, harnesses" },
          { label: "Connectors and Hardware", href: "/fiber-optic-connectors-and-hardware", desc: "Patch cords, adapters, terminal boxes" },
          { label: "Full Product Catalog", href: "/fiber-optic-cable-catalog", desc: "Every product with codes and fiber counts" },
          { label: "Case Studies", href: "/case-studies", desc: "Builds we have supplied in the US and Canada" },
        ],
      },
      {
        title: "Popular products",
        links: [
          { label: "MTP/MPO Trunk Cable", href: "/products/mtp-mpo-trunk-cable" },
          { label: "LC Fiber Patch Cord", href: "/products/lc-fiber-patch-cord" },
          { label: "Armored Fiber Patch Cord", href: "/products/armored-fiber-patch-cord" },
          { label: "OptiTap Compatible Connector", href: "/products/optitap-compatible-connector" },
          { label: "HDPE Microduct Bundle", href: "/products/hdpe-microduct-bundle" },
          { label: "Hybrid Fiber and Copper Cable", href: "/products/hybrid-fiber-and-copper" },
          { label: "Rollable Ribbon Cable", href: "/products/rollable-ribbon-outside-plant" },
          { label: "Flat Drop Cable", href: "/products/flat-drop" },
        ],
      },
      {
        title: "Buy with Vocom",
        links: [
          { label: "For Distributors", href: "/fiber-optic-cable-for-distributors", desc: "Second-source supply" },
          { label: "Referral Partners", href: "/fiber-optic-cable-referral-partners", desc: "Refer an inquiry" },
          { label: "Request a Quote", href: "/contact-vocomai", desc: "Send your spec, get a sized quote" },
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
          { label: "AI Servers", href: "/vocom-ai-servers" },
          { label: "GPU Solutions", href: "/vocomai-gpu-solutions" },
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
          { label: "About Us", href: "/about", desc: "Founded in 1998, El Monte and Taipei" },
          { label: "Case Studies", href: "/case-studies", desc: "Builds we have supplied" },
          { label: "Blog", href: "/blog", desc: "Fiber specs, lead times and guides" },
          { label: "Resources", href: "/resources", desc: "Catalogs and downloads" },
          { label: "Marketing Alliance", href: "/marketing-alliance", desc: "For AI companies" },
          { label: "Contact Us", href: "/contact-vocomai", desc: "Request a quote" },
        ],
      },
    ],
  },
];
