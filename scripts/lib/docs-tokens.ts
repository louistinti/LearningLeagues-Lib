// Token model for the docs tokens page (blueprint §9): structure and aliases
// come from tokens.json, emitted values and the role axis from tokens.css —
// both GENERATED artefacts, so nothing here is ever hand-listed. The model
// builder fails loudly on anything it does not recognise: a token silently
// missing from the page is the blueprint's "blank page, green gates" failure.

export interface TokenEntry {
  key: string; // full path, e.g. "Primitives/neutral/bg"
  path: string; // path inside its collection, e.g. "neutral/bg"
  group: string; // first path segment inside the collection ("" when none)
  type: string; // color | float | string
  css: string; // custom property name, e.g. --ll-neutral-bg
  emitted: string; // the value tokens.css emits for this custom property
  aliasOf?: string; // target token key when the value is an alias
}

export interface TokenModel {
  collections: { collection: string; entries: TokenEntry[] }[]; // tokens.json order
  roles: { role: string; accent: string }[]; // parsed from the [data-role] blocks
  densities: { name: string; css: string; emitted: string }[]; // from [data-density]
  accents: string[]; // accent axis values, tokens.json order
}

// The collections this page knows how to present. A new Figma collection must
// be taught to the template, not silently dropped. "Type" holds the tokens
// derived from the type/* text styles by the normalize stage.
export const KNOWN_COLLECTIONS = [
  "Primitives",
  "Semantic",
  "Spacing",
  "Layout",
  "Typography",
  "Type",
];

interface RawToken {
  type: string;
  css: string;
  scopes: string[];
  value: string | number | { alias: string };
}

export function buildTokenModel(
  tokensJson: { tokens: Record<string, RawToken> },
  tokensCss: string,
): { model: TokenModel; errors: string[] } {
  const errors: string[] = [];
  const tokens = tokensJson.tokens;

  // ── Emitted values: the :root block of the generated stylesheet ───────────
  const rootBlock = tokensCss.match(/^:root \{\n([\s\S]*?)\n\}/m);
  if (!rootBlock) errors.push("tokens.css: no :root block found");
  const emitted = new Map<string, string>();
  for (const m of (rootBlock?.[1] ?? "").matchAll(/^ {2}(--[a-zA-Z0-9-]+): (.+);$/gm))
    emitted.set(m[1], m[2]);

  // ── Role axis: [data-role] blocks (the mapping's only machine-readable home)
  const roles = [
    ...tokensCss.matchAll(
      /\[data-role="([a-z]+)"\] \{\n {2}--ll-accent: var\(--ll-accent-([a-z]+)\);\n\}/g,
    ),
  ].map((m) => ({ role: m[1], accent: m[2] }));
  if (roles.length === 0) errors.push("tokens.css: no [data-role] blocks found");

  // ── Density axis: [data-density] blocks ───────────────────────────────────
  const densities = [
    ...tokensCss.matchAll(/\[data-density="([a-z]+)"\] \{\n {2}(--[a-zA-Z0-9-]+): (.+);\n\}/g),
  ].map((m) => ({ name: m[1], css: m[2], emitted: m[3] }));
  if (densities.length === 0) errors.push("tokens.css: no [data-density] blocks found");

  // ── Collections, in tokens.json order ─────────────────────────────────────
  const collections: TokenModel["collections"] = [];
  for (const [key, t] of Object.entries(tokens)) {
    const [collection, ...rest] = key.split("/");
    if (rest.length === 0) {
      errors.push(`${key}: token key has no path inside its collection`);
      continue;
    }
    if (!KNOWN_COLLECTIONS.includes(collection)) {
      errors.push(
        `${key}: unknown collection "${collection}" — teach the tokens page template to present it`,
      );
      continue;
    }
    const isDensity = key.includes("/density/");
    const value = emitted.get(t.css);
    // The density pair shares one custom property; its per-value emission lives
    // in the [data-density] blocks, presented via model.densities instead.
    if (value === undefined && !isDensity) {
      errors.push(`${key}: custom property ${t.css} not found in tokens.css :root`);
      continue;
    }
    if (isDensity) continue;
    let coll = collections.find((c) => c.collection === collection);
    if (!coll) collections.push((coll = { collection, entries: [] }));
    const aliasOf =
      typeof t.value === "object" && t.value !== null && "alias" in t.value
        ? t.value.alias
        : undefined;
    if (aliasOf && !tokens[aliasOf]) errors.push(`${key}: alias target ${aliasOf} does not exist`);
    coll.entries.push({
      key,
      path: rest.join("/"),
      group: rest.length > 1 ? rest[0] : "",
      type: t.type,
      css: t.css,
      emitted: value ?? "",
      aliasOf,
    });
  }
  if (collections.length === 0) errors.push("tokens.json: no tokens found");

  const accents = (collections.find((c) => c.collection === "Primitives")?.entries ?? [])
    .filter((e) => e.group === "accent")
    .map((e) => e.path.split("/").pop() as string);
  if (accents.length === 0) errors.push("tokens.json: no Primitives/accent/* tokens found");

  return { model: { collections, roles, densities, accents }, errors };
}

// Docs-only visualisation classes appended to the generated lib.css — derived
// from the model (single source), never hand-written, and excluded from the
// token lint like the rest of lib.css. Swatches for every colour token, bars
// for the spacing ladder and the density base, one class per font family.
export function docsTokenCss(model: TokenModel): string {
  const rules: string[] = [];
  const seen = new Set<string>();
  const rule = (cls: string, decl: string) => {
    if (seen.has(cls)) return;
    seen.add(cls);
    rules.push(`.${cls} {\n  ${decl}\n}`);
  };
  for (const { collection, entries } of model.collections) {
    for (const e of entries) {
      const slug = e.css.replace(/^--ll-/, "");
      if (e.type === "color") rule(`ll-docs-swatch--${slug}`, `background: var(${e.css});`);
      if (e.type === "float" && collection === "Spacing")
        rule(`ll-docs-bar--${slug}`, `width: var(${e.css});`);
      if (e.type === "string" && collection === "Typography")
        rule(`ll-docs-font--${slug}`, `font-family: var(${e.css});`);
    }
  }
  // One specimen class per type/* style, applying every extracted property.
  const TYPE_PROP_CSS: Record<string, string> = {
    family: "font-family",
    size: "font-size",
    weight: "font-weight",
    style: "font-style",
    leading: "line-height",
    tracking: "letter-spacing",
    case: "text-transform",
  };
  const typeEntries = model.collections.find((c) => c.collection === "Type")?.entries ?? [];
  const styleSlugs = [...new Set(typeEntries.map((e) => e.group))];
  for (const slug of styleSlugs) {
    const decls = typeEntries
      .filter((e) => e.group === slug && TYPE_PROP_CSS[e.path.split("/").pop() as string])
      .map((e) => `  ${TYPE_PROP_CSS[e.path.split("/").pop() as string]}: var(${e.css});`)
      .join("\n");
    const cls = `ll-docs-type--${slug}`;
    if (!seen.has(cls)) {
      seen.add(cls);
      rules.push(`.${cls} {\n${decls}\n}`);
    }
  }
  // The density base bar reads the live --ll-s, so it follows the switcher.
  for (const d of model.densities)
    rule(`ll-docs-bar--${d.css.replace(/^--ll-/, "")}`, `width: var(${d.css});`);
  return (
    "\n/* Docs-only token visualisation classes — derived by `pnpm docs:build` from\n" +
    " * the token artefacts; never hand-written. */\n" +
    rules.join("\n") +
    "\n"
  );
}
