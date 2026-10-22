// Resolves a Framer page/component tree (as dumped by the Framer API into capture/framer)
// into a concrete tree per breakpoint: component instances are inlined with their
// variables substituted, CMS bindings are turned into {cms} markers, and every node
// gets a `key` that is identical across breakpoints so styles can be diffed.
import fs from "node:fs";
import path from "node:path";

const F = "capture/framer";
export const comps = Object.fromEntries(
  fs.readdirSync(path.join(F, "components")).filter((f) => f.includes("__")).map((f) => {
    const c = JSON.parse(fs.readFileSync(path.join(F, "components", f), "utf8"));
    return [c.id, c];
  }),
);
export const cms = Object.fromEntries(
  fs.readdirSync(path.join(F, "cms")).map((f) => {
    const c = JSON.parse(fs.readFileSync(path.join(F, "cms", f), "utf8"));
    return [c.name, c];
  }),
);
export const fieldIndex = {}; // fieldId -> {collection, field}
for (const c of Object.values(cms)) for (const f of c.fields) fieldIndex[f.id] = { collection: c.name, field: f };

const VAR_RE = /^var\(--variable-([\w-]+)\)$/;

// Look up a value in the scope chain. Returns undefined when unbound.
function lookup(scope, id) {
  for (let s = scope; s; s = s.parent) if (Object.prototype.hasOwnProperty.call(s.vars, id)) return s.vars[id];
  return undefined;
}

export function rv(v, scope) {
  if (v === "false") return false;
  if (v === "true") return true;
  if (typeof v === "string") {
    const m = v.match(VAR_RE);
    if (m) {
      const x = lookup(scope, m[1]);
      if (x !== undefined) return x;
      if (fieldIndex[m[1]]) return { cms: m[1] };
      return undefined;
    }
    return v;
  }
  if (Array.isArray(v)) return v.map((x) => rv(x, scope));
  if (v && typeof v === "object" && typeof v.prop === "string" && Object.keys(v).length === 1) return v;
  if (v && typeof v === "object") {
    if ("from" in v && "transforms" in v) {
      const x = rv(v.from, scope);
      const tname = v.transforms?.[0]?.name;
      // value transforms (enum display name): keep the bound value
      if (tname && tname !== "isSet" && tname !== "isNotSet") return x;
      // conditional visibility e.g. {from: var, transforms:[{name:"isSet"}]}
      if (x && typeof x === "object" && x.cms) return { cmsIsSet: x.cms, transforms: v.transforms };
      if (x && typeof x === "object" && typeof x.prop === "string") return { propIsSet: x.prop };
      const set = x !== undefined && x !== null && x !== "" && x !== false;
      const t = v.transforms?.[0]?.name;
      return t === "isNotSet" ? !set : set;
    }
    const o = {};
    for (const [k, x] of Object.entries(v)) o[k] = rv(x, scope);
    return o;
  }
  return v;
}

// Original (primary) id of a node inside a replica rooted at replicaRootId.
function origOf(node, replicaPrefix) {
  if (node.$originalId) return node.$originalId;
  if (replicaPrefix && node.id?.startsWith(replicaPrefix)) return node.id.slice(replicaPrefix.length);
  return node.id;
}

function controls(attrs) {
  const c = {};
  for (const [k, v] of Object.entries(attrs || {})) if (k.startsWith("$control__")) c[k.slice(10)] = v;
  return c;
}
function plainAttrs(attrs) {
  const c = {};
  for (const [k, v] of Object.entries(attrs || {})) if (!k.startsWith("$control__")) c[k] = v;
  return c;
}

function pickVariant(comp, name) {
  const kids = comp.children || [];
  const plain = kids.filter((k) => !k.$gesture);
  if (name) {
    const hit = plain.find((k) => k.name === name);
    if (hit) return hit;
  }
  return plain.find((k) => k.$isPrimary) || plain[0];
}
function hoverOf(comp, variant) {
  return (comp.children || []).find((k) => k.$gesture === "hover" && (k.$inheritsFrom === variant.id || (variant.$isPrimary && k.$inheritsFrom === k.$originalId && k.$originalId === variant.id)));
}

// Resolve one node. `pre` = replica id prefix to strip for key building.
export function resolve(node, scope, keyBase, pre, ctx) {
  const ok = origOf(node, pre);
  const key = keyBase + "/" + ok;
  const t = node.type;
  const attrs = rv(plainAttrs(node.attributes), scope);
  const base = { key, type: t, name: node.name, id: node.id, rect: node.$rect, attrs };

  if (t === "ComponentInstanceNode") {
    const ctrl = rv(controls(node.attributes), scope);
    const comp = comps[node.component];
    const display = node.$componentDisplayName || comp?.name;
    if (!comp || ctx.opaque?.has(display)) {
      return { ...base, type: "Code", component: display, componentId: node.component, controls: ctrl };
    }
    const variant = pickVariant(comp, ctrl.variant);
    const vars = {};
    for (const v of comp.variables || []) {
      const val = ctrl[v.key.replace("$control__", "")];
      vars[v.id] = val !== undefined ? val : v.initialValue;
    }
    const inner = { vars, parent: scope };
    // children of a variant replica are prefixed by the variant id
    const vpre = variant.$isPrimary ? null : variant.id;
    const primaryVariant = pickVariant(comp, null);
    const rootKey = key; // root of instance shares the instance key
    const root = {
      key: rootKey, type: "FrameNode", name: display, id: node.id, rect: node.$rect,
      component: display, componentId: comp.id, variant: variant.name,
      attrs: { ...rv(plainAttrs(variant.attributes), inner), ...attrs },
      children: (variant.children || []).map((c) => resolve(c, inner, rootKey, vpre, ctx)),
    };
    // overlays (dropdown menus) are attached to the instance, not the component
    for (const c of node.children || []) if (c.type === "RelativeOverlayNode") root.children.push({ ...resolve(c, scope, rootKey, pre, ctx), overlay: true });
    // variants reachable by tapping (accordions, menus, tabs): resolve them for CSS diffs
    const targets = new Set();
    JSON.stringify(variant).replace(/"SET_VARIANT","controls":\{"variant":"([\w-]+)"/g, (_, id) => targets.add(id));
    root.alts = [];
    for (const id of targets) {
      const alt = (comp.children || []).find((k) => k.id === id && !k.$gesture);
      if (!alt || alt === variant) continue;
      const apre = alt.$isPrimary ? null : alt.id;
      root.alts.push({ id, name: alt.name, attrs: { ...rv(plainAttrs(alt.attributes), inner), ...attrs }, children: (alt.children || []).map((c) => resolve(c, inner, rootKey, apre, ctx)) });
    }
    root.variantIds = Object.fromEntries((comp.children || []).filter((k) => !k.$gesture).map((k) => [k.id, k.name]));
    const hv = hoverOf(comp, variant);
    if (hv) {
      root.hover = {
        attrs: rv(plainAttrs(hv.attributes), inner),
        children: (hv.children || []).map((c) => resolve(c, inner, rootKey, hv.id, ctx)),
      };
    }
    // events that switch variants (accordions, tabs, menus) are flagged for custom handling
    if (JSON.stringify(variant).includes("SET_VARIANT") || JSON.stringify(variant).includes("SHOW_OVERLAY")) root.interactive = true;
    void primaryVariant;
    return root;
  }

  if (t === "RichTextNode") {
    const blocks = [];
    const bound = attrs.text;
    for (const b of node.children || []) {
      const tag = b.attributes?.tag || "p";
      const runs = [];
      for (const r of b.children || []) {
        if (r.type === "TextLineBreak") runs.push({ br: true });
        else if (r.type === "TextRun") runs.push({ ...rv(r.attributes, scope) });
      }
      blocks.push({ tag, runs });
    }
    if (bound !== undefined && String(node.attributes?.text ?? "").startsWith("var(")) {
      const tag = blocks[0]?.tag || "p";
      blocks.length = 0;
      blocks.push({ tag, runs: [{ text: bound }] });
    }
    return { ...base, blocks };
  }

  const out = { ...base };
  if (node.type === "IconNode") {
    out.icon = { set: node.set, name: node.$control__icon };
  }
  if (node.children?.length) out.children = node.children.map((c) => resolve(c, scope, key, pre, ctx));
  return out;
}

// Resolve every breakpoint of a page. Returns {bps:[{name, range, tree}], meta}
export function resolvePage(page, ctx) {
  const bps = (page.children || []).filter((c) => c.$mediaQuery);
  const primary = bps.find((b) => b.$isPrimary) || bps[0];
  const scope = { vars: {}, parent: null };
  const out = bps.map((b) => {
    const pre = b === primary ? null : b.id;
    // the breakpoint frame itself gets the primary id as key so all bps align
    const tree = resolve({ ...b, $originalId: primary.id }, scope, "", pre, ctx);
    return { name: b.$mediaQuery.name, range: b.$mediaQuery.range, primary: b === primary, tree };
  });
  // non-breakpoint top level instances (cookie banner etc.)
  const extras = (page.children || []).filter((c) => !c.$mediaQuery).map((c) => resolve(c, scope, "", null, ctx));
  return { bps: out, extras, meta: page.attributes?.metadata, path: page.attributes?.path };
}
