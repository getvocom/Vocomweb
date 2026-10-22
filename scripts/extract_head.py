#!/usr/bin/env python3
"""Extract per-page SEO head data from the raw Framer HTML into src/data/head/<slug>.json.

Values are copied verbatim (HTML entities decoded once). Framer-internal tags
(generator, search index, preconnects, stylesheets) are dropped.
Usage: python3 -I scripts/extract_head.py <repo_root>
"""
import html, json, re, sys
from pathlib import Path

ROOT = Path(sys.argv[1])
RAW = ROOT / "capture/html/raw"
OUT = ROOT / "src/data/head"
OUT.mkdir(parents=True, exist_ok=True)

ATTR = re.compile(r'([a-zA-Z:-]+)="([^"]*)"')
SKIP_META = {"generator", "framer-search-index", "framer-search-index-fallback", "viewport"}

for f in sorted(RAW.glob("*.html")):
    s = f.read_text()
    head = s[: s.find("</head>")]
    title = html.unescape(re.search(r"<title>(.*?)</title>", head, re.S).group(1)).strip()
    meta, links = [], []
    for tag in re.findall(r"<meta [^>]*>", head):
        a = {k: html.unescape(v) for k, v in ATTR.findall(tag)}
        key = a.get("name") or a.get("property")
        if not key or key in SKIP_META or "content" not in a:
            continue
        meta.append({"name" if "name" in a else "property": key, "content": a["content"]})
    for tag in re.findall(r"<link [^>]*>", head):
        a = {k: html.unescape(v) for k, v in ATTR.findall(tag)}
        if a.get("rel") in ("canonical", "icon", "apple-touch-icon", "alternate"):
            links.append(a)
    jsonld = [m.strip() for m in re.findall(r'<script type="application/ld\+json">(.*?)</script>', s, re.S)]
    lang = re.search(r'<html[^>]*lang="([^"]+)"', s)
    data = {"title": title, "lang": lang.group(1) if lang else "en", "meta": meta, "links": links, "jsonld": jsonld}
    (OUT / (f.stem + ".json")).write_text(json.dumps(data, ensure_ascii=False, indent=1))
print("wrote", len(list(OUT.glob("*.json"))))
