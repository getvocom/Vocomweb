// Every case study on the site, in one place, for the case study map (Tom, 2026-11-17). Wording is copied
// from the pages that already carry it: the fiber studies from /case-studies (homepage cards and the
// loose-tube page say the same), the AI cluster deployments from /optical-transceivers (cleared for
// city and year by Tom, 2026-11-10). Client names are never shown. Map points are city or state centers.
export type Pin = { name: string; lon: number; lat: number; label?: [number, number, ("start" | "middle" | "end")?] }; // label: text offset from the pin (map units) and anchor
export type Study = { id: string; kind: "fiber" | "optics"; place: string; title: string; body: string; pins: Pin[]; href: string };

export const STUDIES: Study[] = [
  { id: "f1", kind: "fiber", place: "California, Colorado and Minnesota", title: "Open-access fiber operator",
    body: "GCYFTY-144 loose-tube and toneable flat-drop cable, supplied build-to-order for multi-state open-access FTTH builds.",
    pins: [{ name: "California", lon: -119.6, lat: 37.2, label: [-60, -24] }, { name: "Colorado", lon: -106.6, lat: 38.7, label: [0, 44, "middle"] }, { name: "Minnesota", lon: -94.3, lat: 46.3 }], href: "/case-studies" },
  { id: "f2", kind: "fiber", place: "Arizona and California", title: "Regional ISP",
    body: "Pre-connectorised G657A1 single-fiber drops in 100 to 600ft lengths, plus GCYFTY-144/432 loose-tube and SCA field connectors.",
    pins: [{ name: "Arizona", lon: -111.7, lat: 34.3, label: [0, 44, "middle"] }, { name: "California", lon: -119.6, lat: 37.2, label: [-60, -24] }], href: "/case-studies" },
  { id: "f3", kind: "fiber", place: "Ontario, California", title: "Municipal broadband",
    body: "GCYXTY-24 loose-tube cable sourced for a city-owned fiber network rollout.",
    pins: [{ name: "Ontario, CA", lon: -117.65, lat: 34.06, label: [-90, -20] }], href: "/case-studies" },
  { id: "f4", kind: "fiber", place: "23+ US states", title: "National broadband footprint",
    body: "High-count loose-tube from GYFS-864 down to 24F, standardised across regions.",
    pins: [], href: "/case-studies" },
  { id: "o1", kind: "optics", place: "Denver, USA · 2025", title: "H100 data hall",
    body: "High-volume 400G and 800G modules with low-loss patch cords. 100% of links passed on-site link and interoperability tests.",
    pins: [{ name: "Denver", lon: -104.99, lat: 39.74, label: [14, -16] }], href: "/optical-transceivers" },
  { id: "o2", kind: "optics", place: "Denver, USA · 2025", title: "H200 data hall",
    body: "800G and 400G modules, InfiniBand switches for a non-blocking fabric, low-loss patch cords, and test and inspection equipment.",
    pins: [{ name: "Denver", lon: -104.99, lat: 39.74, label: [14, -16] }], href: "/optical-transceivers" },
  { id: "o3", kind: "optics", place: "Chonburi, Thailand · 2026", title: "B300 data hall",
    body: "Every module from 1.6T to 1G, all site-wide InfiniBand and Ethernet switches, and low-loss patch cords, delivered with cabling and system partners.",
    pins: [{ name: "Chonburi", lon: 100.98, lat: 13.36, label: [16, 30] }], href: "/optical-transceivers" },
  { id: "o4", kind: "optics", place: "Don Mueang, Thailand · 2026", title: "B300 data hall",
    body: "Every module from 1.6T to 1G, all site-wide InfiniBand and Ethernet switches, and low-loss patch cords for error-free long links.",
    pins: [{ name: "Don Mueang", lon: 100.6, lat: 13.91, label: [16, -12] }], href: "/optical-transceivers" },
  { id: "o5", kind: "optics", place: "Guishan, Taiwan · 2026", title: "GB300 data hall",
    body: "1.6T and 800G modules for QM3400 switches and ConnectX-8 network cards, with low-latency cabling.",
    pins: [{ name: "Guishan", lon: 121.36, lat: 25.03, label: [-16, 7, "end"] }], href: "/optical-transceivers" },
];
