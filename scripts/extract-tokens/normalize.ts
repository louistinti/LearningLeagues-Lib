// Stage 2 — normalize: raw Figma export -> tokens.json (interchange format).
// Usage: node scripts/extract-tokens/normalize.ts [--check]
// --check regenerates in memory and fails on drift with the committed file.
import { readFileSync, writeFileSync, existsSync } from "node:fs";

const RAW = "packages/ui/src/tokens/raw/figma-variables.json";
const OUT = "packages/ui/src/tokens/tokens.json";

interface RawVariable {
  id: string;
  name: string;
  variableCollectionId: string;
  resolvedType: "COLOR" | "FLOAT" | "STRING" | "BOOLEAN";
  scopes: string[];
  codeSyntax: { WEB?: string };
  valuesByMode: Record<string, unknown>;
}
interface RawTextStyle {
  id: string;
  name: string;
  fontName: { family: string; style: string };
  fontSize: number;
  lineHeight: { unit: "PERCENT" | "AUTO" | "PIXELS"; value?: number };
  letterSpacing: { unit: "PERCENT" | "PIXELS"; value: number };
  textCase: string;
  textDecoration: string;
  description: string;
}
interface RawExport {
  collections: { id: string; name: string }[];
  variables: RawVariable[];
  textStyles?: RawTextStyle[];
}

const raw: RawExport = JSON.parse(readFileSync(RAW, "utf8"));
const collectionName = new Map(raw.collections.map((c) => [c.id, c.name]));
const byId = new Map(raw.variables.map((v) => [v.id, v]));

const errors: string[] = [];
const cssOf = (v: RawVariable): string => {
  const web = v.codeSyntax?.WEB ?? "";
  const m = web.match(/^var\((--ll-[a-z0-9-]+)\)$/);
  if (!m) {
    errors.push(`${v.name}: WEB code syntax ${JSON.stringify(web)} does not match var(--ll-*)`);
    return "";
  }
  return m[1];
};
const toColor = (c: { r: number; g: number; b: number; a: number }): string => {
  const ch = (x: number) => Math.round(x * 255);
  const hex = "#" + [c.r, c.g, c.b].map((x) => ch(x).toString(16).padStart(2, "0")).join("");
  if (Math.abs(c.a - 1) < 1e-6) return hex;
  return `rgba(${ch(c.r)}, ${ch(c.g)}, ${ch(c.b)}, ${Math.round(c.a * 100) / 100})`;
};

type TokenValue = string | number | { alias: string };
const tokens: Record<string, { type: string; css: string; scopes: string[]; value: TokenValue }> =
  {};

const keyOf = (v: RawVariable) => `${collectionName.get(v.variableCollectionId)}/${v.name}`;

for (const v of raw.variables) {
  const modeValues = Object.values(v.valuesByMode);
  if (modeValues.length !== 1) {
    errors.push(`${v.name}: expected exactly 1 mode value, got ${modeValues.length}`);
    continue;
  }
  const rawValue = modeValues[0] as Record<string, unknown>;
  let value: TokenValue;
  if (rawValue && typeof rawValue === "object" && rawValue.type === "VARIABLE_ALIAS") {
    const target = byId.get(rawValue.id as string);
    if (!target) {
      errors.push(`${v.name}: dangling alias ${rawValue.id}`);
      continue;
    }
    value = { alias: keyOf(target) };
  } else if (v.resolvedType === "COLOR") {
    value = toColor(rawValue as unknown as { r: number; g: number; b: number; a: number });
  } else {
    value = rawValue as unknown as string | number;
  }
  tokens[keyOf(v)] = { type: v.resolvedType.toLowerCase(), css: cssOf(v), scopes: v.scopes, value };
}

// ── Text styles -> per-property tokens (collection "Type") ──────────────────
// Every conversion here is MECHANICAL (unit arithmetic, standard enum maps).
// The one arbitrated judgement on text styles — type/button renders at
// weight 600, not the Figma face's 700 — lives in the transform stage
// (WEIGHT_OVERRIDES), like every other documented override.
const STANDARD_WEIGHTS: Record<string, number> = {
  Thin: 100,
  "Extra Light": 200,
  Light: 300,
  Regular: 400,
  Medium: 500,
  "Semi Bold": 600,
  Bold: 700,
  "Extra Bold": 800,
  Black: 900,
};
const CASE_MAP: Record<string, string> = {
  ORIGINAL: "none",
  UPPER: "uppercase",
  LOWER: "lowercase",
  TITLE: "capitalize",
};
const round4 = (n: number) => Math.round(n * 10000) / 10000;
for (const s of raw.textStyles ?? []) {
  const m = s.name.match(/^type\/([a-z0-9]+(?:-[a-z0-9]+)*)$/);
  if (!m) {
    errors.push(`${s.name}: text style name must be type/<kebab-slug>`);
    continue;
  }
  const slug = m[1];
  const key = (prop: string) => `Type/${slug}/${prop}`;
  const css = (prop: string) => `--ll-type-${slug}-${prop}`;
  const emit = (prop: string, type: string, value: TokenValue) => {
    tokens[key(prop)] = { type, css: css(prop), scopes: [], value };
  };
  // family: alias onto the Typography variable holding the same family name.
  const familyVars = raw.variables.filter(
    (v) => v.resolvedType === "STRING" && Object.values(v.valuesByMode)[0] === s.fontName.family,
  );
  if (familyVars.length !== 1)
    errors.push(
      `${s.name}: family ${JSON.stringify(s.fontName.family)} matches ${familyVars.length} Typography variables (expected exactly 1)`,
    );
  else emit("family", "string", { alias: keyOf(familyVars[0]) });
  emit("size", "float", s.fontSize);
  const face = s.fontName.style.replace(/\s*Italic$/, "") || "Regular";
  if (STANDARD_WEIGHTS[face] === undefined)
    errors.push(`${s.name}: font face ${JSON.stringify(s.fontName.style)} has no standard weight`);
  else emit("weight", "float", STANDARD_WEIGHTS[face]);
  emit("style", "string", /Italic$/.test(s.fontName.style) ? "italic" : "normal");
  if (s.lineHeight.unit === "AUTO") emit("line-height", "string", "normal");
  else if (s.lineHeight.unit === "PERCENT")
    emit("line-height", "float", round4(Math.round(s.lineHeight.value!) / 100));
  else errors.push(`${s.name}: unsupported lineHeight unit ${s.lineHeight.unit}`);
  if (s.letterSpacing.unit === "PERCENT")
    emit("tracking", "string", `${round4(s.letterSpacing.value / 100)}em`);
  else errors.push(`${s.name}: unsupported letterSpacing unit ${s.letterSpacing.unit}`);
  if (CASE_MAP[s.textCase] === undefined)
    errors.push(`${s.name}: unsupported textCase ${s.textCase}`);
  else emit("case", "string", CASE_MAP[s.textCase]);
}

if (errors.length) {
  console.error("normalize: FAILED\n" + errors.map((e) => `  - ${e}`).join("\n"));
  process.exit(1);
}

const output =
  JSON.stringify(
    {
      $comment: "GENERATED by `pnpm tokens:normalize` from raw/figma-variables.json — do not edit.",
      tokens,
    },
    null,
    2,
  ) + "\n";

if (process.argv.includes("--check")) {
  const current = existsSync(OUT) ? readFileSync(OUT, "utf8") : "";
  if (current !== output) {
    console.error(
      `normalize --check: DRIFT — ${OUT} does not match its source. Run: pnpm tokens:build`,
    );
    process.exit(1);
  }
  console.log("normalize --check: OK");
} else {
  writeFileSync(OUT, output);
  console.log(`normalize: wrote ${OUT} (${Object.keys(tokens).length} tokens)`);
}
