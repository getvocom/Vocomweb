// Exports the Framer CMS (capture/framer/cms) to Astro content collections:
//   src/content/blog/<slug>.md      (Posts)
//   src/content/products/<slug>.md  (Products)
// Text is copied verbatim. `order` keeps Framer's manual ordering.
// Usage: node scripts/cms-export.mjs
import fs from "node:fs";
import { FIELD_KEYS } from "./framer/emit.mjs";
import { loadAssets } from "./framer/assets-map.mjs";

const assets = loadAssets();
const yamlStr = (s) => JSON.stringify(String(s)); // JSON strings are valid YAML scalars

function fm(obj) {
  const out = [];
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined) continue;
    if (v && typeof v === "object") {
      out.push(`${k}:`);
      for (const [kk, vv] of Object.entries(v)) out.push(`  ${kk}: ${yamlStr(vv)}`);
    } else if (typeof v === "string") out.push(`${k}: ${yamlStr(v)}`);
    else out.push(`${k}: ${v}`);
  }
  return out.join("\n");
}

for (const [coll, dir] of [["Posts", "blog"], ["Products", "products"]]) {
  const c = JSON.parse(fs.readFileSync(`capture/framer/cms/${coll}.json`, "utf8"));
  const fields = Object.fromEntries(c.fields.map((f) => [f.id, f]));
  fs.mkdirSync(`src/content/${dir}`, { recursive: true });
  c.items.forEach((it, i) => {
    const data = { slug: it.slug, order: i + 1 };
    if (it.draft) data.draft = true;
    for (const [fid, v] of Object.entries(it.fieldData)) {
      const f = fields[fid];
      if (!f) continue;
      const key = FIELD_KEYS[f.name] || f.name;
      if (v.type === "image") {
        if (!v.value?.url) continue;
        const a = assets.get(v.value.url.split("?")[0]);
        data[key] = { src: a ? a.path : v.value.url, alt: v.value.altText ?? "" };
      } else if (v.type === "boolean") data[key] = !!v.value;
      else if (v.value !== undefined && v.value !== "") data[key] = v.value;
    }
    // filenames: keep the slug, but make it safe for every filesystem
    const file = it.slug.replace(/[^\w.-]+/g, (m) => encodeURIComponent(m)).replace(/\.$/, "%2E");
    fs.writeFileSync(`src/content/${dir}/${file}.md`, `---\n${fm(data)}\n---\n`);
  });
  console.log(coll, c.items.length);
}
