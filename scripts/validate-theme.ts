// Schema gate: rejects a malformed tokens.json / tokens.css before anything
// else happens. Non-short-circuiting: reports EVERY failure, then exits.
// Usage: node scripts/validate-theme.ts
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";

const TOKENS = "packages/ui/src/tokens/tokens.json";
const CSS = "packages/ui/src/tokens/tokens.css";
const REPORT = "reports/validate-theme.md";

interface Token {
  type: string;
  css: string;
  scopes: string[];
  value: string | number | { alias: string };
}
const errors: string[] = [];
const checks: string[] = [];
const check = (label: string, fail: string[]) => {
  checks.push(
    `- ${fail.length === 0 ? "PASS" : "FAIL"} — ${label}${fail.length ? ` (${fail.length})` : ""}`,
  );
  errors.push(...fail.map((f) => `${label}: ${f}`));
};

const data: { tokens: Record<string, Token> } = JSON.parse(readFileSync(TOKENS, "utf8"));
const tokens = data.tokens;
const entries = Object.entries(tokens);

// 1. Naming schema — closed namespace `ll`, kebab-case.
check(
  "css naming schema (--ll-*, kebab-case)",
  entries
    .filter(([, t]) => !/^--ll-[a-z0-9]+(-[a-z0-9]+)*$/.test(t.css))
    .map(([k, t]) => `${k} -> ${t.css}`),
);

// 2. Duplicate css names — every token owns exactly one custom property.
{
  const seen = new Map<string, string[]>();
  for (const [k, t] of entries) seen.set(t.css, [...(seen.get(t.css) ?? []), k]);
  const dupes = [...seen.entries()].filter(([, keys]) => keys.length > 1);
  check(
    "no duplicate css names",
    dupes.map(([css, keys]) => `${css}: ${keys.join(", ")}`),
  );
}

// 3. Alias integrity — no dangling reference, no cycle, aliases point at concrete values.
{
  const fail: string[] = [];
  const resolve = (key: string, seen: string[]): void => {
    const t = tokens[key];
    if (!t) return void fail.push(`${seen.join(" -> ")} -> ${key} (dangling)`);
    const v = t.value;
    if (typeof v === "object" && v !== null && "alias" in v) {
      if (seen.includes(key)) return void fail.push(`cycle: ${[...seen, key].join(" -> ")}`);
      resolve(v.alias, [...seen, key]);
    }
  };
  for (const [k] of entries) resolve(k, []);
  check("alias integrity (dangling / cycles)", fail);
}

// 4. Color resolvability — every color literal is #rrggbb or rgba(r, g, b, a).
check(
  "color literal format",
  entries
    .filter(([, t]) => t.type === "color" && typeof t.value === "string")
    .filter(
      ([, t]) =>
        !/^#[0-9a-f]{6}$/.test(t.value as string) &&
        !/^rgba\(\d+, \d+, \d+, 0?\.\d+\)$/.test(t.value as string),
    )
    .map(([k, t]) => `${k} -> ${t.value}`),
);

// 5. Axis parity — accent set complete.
{
  const fail: string[] = [];
  for (const a of ["ambre", "bleu", "rouge", "violet", "jade"])
    if (!tokens[`Primitives/accent/${a}`]) fail.push(`missing Primitives/accent/${a}`);
  check("axis parity (5 accents)", fail);
}

// 6. Stylesheet structural coverage — enumerate EVERY block the target can
//    contain (blueprint §3.5.4: a gate that scans a structured file must name
//    every structural area, and be tested against each).
const css = readFileSync(CSS, "utf8");
{
  const fail: string[] = [];
  const blocks = [...css.matchAll(/^(:root|\[[^\]]+\])\s*\{([^}]*)\}/gms)].map((m) => ({
    selector: m[1],
    body: m[2],
  }));
  const expectedSelectors = [
    ":root",
    ...["ambre", "bleu", "rouge", "violet", "jade"].map((a) => `[data-accent="${a}"]`),
    ...["support", "adc", "top", "mid", "jungle"].map((r) => `[data-role="${r}"]`),
  ];
  const found = blocks.map((b) => b.selector);
  for (const s of expectedSelectors) if (!found.includes(s)) fail.push(`missing block ${s}`);
  for (const s of found) if (!expectedSelectors.includes(s)) fail.push(`unexpected block ${s}`);

  // Every token's custom property is declared in :root exactly once.
  const root = blocks.find((b) => b.selector === ":root");
  const rootDecls = root ? [...root.body.matchAll(/(--ll-[a-z0-9-]+):/g)].map((m) => m[1]) : [];
  for (const [, t] of entries) {
    const n = rootDecls.filter((d) => d === t.css).length;
    if (n !== 1) fail.push(`${t.css} declared ${n}x in :root (expected 1)`);
  }

  // Every var() reference in the whole stylesheet resolves to a declared property.
  const declared = new Set([...css.matchAll(/(--ll-[a-z0-9-]+):/g)].map((m) => m[1]));
  for (const m of css.matchAll(/var\((--[a-z0-9-]+)\)/g))
    if (!declared.has(m[1])) fail.push(`dangling var(${m[1]})`);
  check("stylesheet structure (blocks, declarations, references)", fail);
}

mkdirSync("reports", { recursive: true });
const verdict = errors.length === 0 ? "PASS" : "FAIL";
writeFileSync(
  REPORT,
  `# validate-theme — ${verdict}\n\n${checks.join("\n")}\n${errors.length ? "\n## Failures\n\n" + errors.map((e) => `- ${e}`).join("\n") + "\n" : ""}`,
);
if (errors.length) {
  console.error(
    `validate-theme: FAIL (${errors.length}) — see ${REPORT}\n` +
      errors.map((e) => `  - ${e}`).join("\n"),
  );
  process.exit(1);
}
console.log(`validate-theme: PASS — see ${REPORT}`);
