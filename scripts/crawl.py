#!/usr/bin/env python3
"""Phase 0 crawler: walks www.vocom.ai from the sitemap + homepage, follows every
internal link, saves raw HTML and writes data/url-inventory.csv.

Usage: python3 -I scripts/crawl.py <repo_root>
"""
import csv, json, re, sys, time, urllib.parse, urllib.request
from concurrent.futures import ThreadPoolExecutor
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(sys.argv[1])
HOST = "www.vocom.ai"
BASE = f"https://{HOST}"
UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36"


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, *a, **k):
        return None


opener = urllib.request.build_opener(NoRedirect)


def fetch(url):
    url = urllib.parse.quote(url, safe=":/?#[]@!$&'()*+,;=%")
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    try:
        with opener.open(req, timeout=30) as r:
            return r.status, r.headers.get("Location"), r.read().decode("utf-8", "replace")
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", "replace") if e.fp else ""
        return e.code, e.headers.get("Location"), body


class Page(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.title = ""; self._in = []; self.meta = {}; self.links = []
        self.canonical = ""; self.headings = []; self._h = None; self._htext = ""
        self.imgs = []; self.videos = 0; self.jsonld = []; self._script = None
        self.text = []; self._skip = 0; self.html_lang = ""; self.scripts = []

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag == "html": self.html_lang = a.get("lang", "")
        if tag == "title": self._in.append("title")
        if tag == "meta":
            k = a.get("name") or a.get("property")
            if k and "content" in a: self.meta.setdefault(k.lower(), a["content"])
        if tag == "link" and "canonical" in (a.get("rel") or ""): self.canonical = a.get("href", "")
        if tag == "a" and a.get("href"): self.links.append(a["href"])
        if tag in ("h1", "h2", "h3", "h4", "h5", "h6"): self._h = tag; self._htext = ""
        if tag == "img": self.imgs.append((a.get("src", ""), a.get("alt")))
        if tag == "video": self.videos += 1
        if tag == "script":
            self._script = a.get("type", ""); self._sbuf = ""
            if a.get("src"): self.scripts.append(a["src"])
        if tag in ("script", "style", "noscript", "template"): self._skip += 1

    def handle_endtag(self, tag):
        if tag == "title" and self._in: self._in.pop()
        if tag == self._h:
            self.headings.append((self._h, re.sub(r"\s+", " ", self._htext).strip())); self._h = None
        if tag == "script":
            if self._script == "application/ld+json": self.jsonld.append(self._sbuf)
            elif self._sbuf.strip(): self.scripts.append("inline:" + self._sbuf.strip()[:300])
            self._script = None
        if tag in ("script", "style", "noscript", "template") and self._skip: self._skip -= 1

    def handle_data(self, d):
        if self._in: self.title += d
        if self._script is not None: self._sbuf += d
        if self._h: self._htext += d
        if not self._skip and d.strip(): self.text.append(d.strip())


def norm(href, base):
    if href.startswith(("mailto:", "tel:", "javascript:")): return None, None
    u = urllib.parse.urljoin(base, href)
    p = urllib.parse.urlsplit(u)
    if p.netloc not in (HOST, "vocom.ai"): return None, None
    path = p.path or "/"
    anchor = f"{path}#{p.fragment}" if p.fragment else None
    path = urllib.parse.quote(urllib.parse.unquote(path), safe="/")
    return BASE + path, anchor


def ptype(path):
    if path.startswith("/blog/"): return "blog"
    if path.startswith(("/products/", "/resources/")): return "resource"
    if "privacy" in path or "terms" in path or "legal" in path: return "legal"
    if path in ("/search", "/404"): return "utility"
    return "static"


def main():
    sm = (ROOT / "data/sitemap.live.xml").read_text()
    sitemap = [urllib.parse.unquote(u) if False else u for u in re.findall(r"<loc>(.*?)</loc>", sm)]
    sitemap_set = {urllib.parse.unquote(u).rstrip("/") or BASE for u in sitemap}
    queue = list(dict.fromkeys(sitemap + [BASE + "/"]))
    seen, results, anchors = set(), {}, set()
    htmldir = ROOT / "capture/html/raw"; htmldir.mkdir(parents=True, exist_ok=True)

    def work(url):
        return url, fetch(url)

    while queue:
        batch = [u for u in queue if u not in seen]; queue = []
        seen.update(batch)
        with ThreadPoolExecutor(8) as ex:
            for url, (status, loc, body) in ex.map(work, batch):
                pg = Page()
                if status == 200:
                    try: pg.feed(body)
                    except Exception: pass
                    path = urllib.parse.urlsplit(url).path or "/"
                    fname = (urllib.parse.unquote(path).strip("/").replace("/", "__") or "index") + ".html"
                    (htmldir / fname).write_text(body)
                results[url] = (status, loc, pg)
                for h in pg.links:
                    u, anc = norm(h, url)
                    if anc: anchors.add(anc)
                    if u and u not in seen: queue.append(u)
                if loc:
                    u, _ = norm(loc, url)
                    if u and u not in seen: queue.append(u)
        queue = list(dict.fromkeys(queue))

    rows = []
    for url, (status, loc, pg) in sorted(results.items()):
        path = urllib.parse.unquote(urllib.parse.urlsplit(url).path) or "/"
        h = pg.headings
        ld_types = []
        for j in pg.jsonld:
            try:
                d = json.loads(j); items = d if isinstance(d, list) else d.get("@graph", [d])
                ld_types += [str(i.get("@type")) for i in items if isinstance(i, dict)]
            except Exception: ld_types.append("unparseable")
        internal = {norm(l, url)[0] for l in pg.links} - {None}
        words = len(re.findall(r"\w+", " ".join(pg.text)))
        rows.append({
            "url": BASE + path if path != "/" else BASE + "/", "status": status, "redirect_to": loc or "",
            "in_sitemap": "yes" if (BASE + path).rstrip("/") in sitemap_set or (path == "/" and BASE in sitemap_set) else "no",
            "page_type": ptype(path), "html_lang": pg.html_lang,
            "title": pg.title.strip(), "meta_description": pg.meta.get("description", ""),
            "canonical": pg.canonical, "meta_robots": pg.meta.get("robots", ""),
            "og_title": pg.meta.get("og:title", ""), "og_description": pg.meta.get("og:description", ""),
            "og_image": pg.meta.get("og:image", ""), "og_type": pg.meta.get("og:type", ""), "og_url": pg.meta.get("og:url", ""),
            "twitter_card": pg.meta.get("twitter:card", ""), "twitter_title": pg.meta.get("twitter:title", ""),
            "twitter_description": pg.meta.get("twitter:description", ""), "twitter_image": pg.meta.get("twitter:image", ""),
            "h1_count": sum(1 for t, _ in h if t == "h1"),
            "h1": " | ".join(x for t, x in h if t == "h1"),
            "h2_list": " | ".join(x for t, x in h if t == "h2"),
            "h3_list": " | ".join(x for t, x in h if t == "h3"),
            "jsonld": ("yes: " + ", ".join(ld_types)) if pg.jsonld else "no",
            "word_count_raw": words, "internal_link_count": len(internal),
            "image_count": len(pg.imgs), "images_missing_alt": sum(1 for _, a in pg.imgs if a is None),
            "video_count": pg.videos,
        })
    fields = list(rows[0].keys())
    with open(ROOT / "data/url-inventory.csv", "w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=fields); w.writeheader(); w.writerows(rows)
    (ROOT / "data/anchors.txt").write_text("\n".join(sorted(anchors)) + "\n")
    scripts = set()
    for _, (_, _, pg) in results.items(): scripts.update(pg.scripts)
    (ROOT / "data/scripts-found.txt").write_text("\n\n".join(sorted(scripts)) + "\n")
    print(f"crawled {len(results)} urls; anchors {len(anchors)}")


main()
