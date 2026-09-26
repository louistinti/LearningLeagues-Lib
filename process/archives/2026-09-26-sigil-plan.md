# Sigil Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the `Sigil` component from its approved RFC (`packages/ui/src/components/sigil/Sigil.rfc.md`, §7 Q1–Q13): the framed decorative square with two inset rings and an art slot inside the accent ring, with its token, contract, keyboard suite, docs and dist, conformity green.

**Architecture:** One new float token (`Primitives/opacity/ornament` = 25 in Figma → `--ll-opacity-ornament: 0.25`) flows through the existing pipeline; the transform gains a pure, tested unit rule (`opacity/*` is a percentage). The docs/a11y example machinery learns element children (`{ snippet, node }`) through one pure helper so the Sigil can show an SVG. The component itself is one `<div class="ll-sigil" aria-hidden="true">` with a `.ll-sigil-art` slot; rings are pseudo-elements; every value a token.

**Tech Stack:** Node 24 native `.ts` (type stripping), React 19 (SSR via esbuild in the generators), `node:test` + jsdom (a11y suites), Playwright (gate 17), Figma Plugin API via `use_figma` (main session only).

**Design record:** `process/archives/2026-09-26-sigil-design.md`. **Branch:** `feat/sigil` (exists; first commit b145b71 claimed the manifest row — pushed).

**Binding rules** (`AGENTS.md`, `ORCHESTRATION.md`): `git branch --show-current` before every commit; English in every file; `pnpm format` (or `pnpm exec prettier --write <files>`) before committing hand-written files; regenerate `packages/ui/src/tokens/{tokens.json,tokens.css}`, `docs/**` and `dist/**` (`pnpm tokens:build`, `pnpm docs:build`, `pnpm dist:build`) in the SAME commit as any source they derive from — never hand-edit them; a touched detector or scan surface gets its red/green proof row in `process/PROOF-OF-BLOCKING.md` in the same commit; `pnpm conformity` executed and quoted before the PR; commits end with the exact trailer `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`. Never add an allowlist entry. Never `;` before an outward-facing command; push on its own line. The token-diff check (`pnpm diff:tokens`) is **expected-red** until Louis applies `token-approved` — report it as such, never work around it.

---

## File structure

| File                                                         | Responsibility                                                                                                             |
| ------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------- |
| `scripts/lib/token-units.ts` (create)                        | Pure: `emitFloat(key, n)` — the unit rule for FLOAT tokens (px by default; unitless for `Layout/z/*`, type weight / line-height; `value / 100` for `*/opacity/*`). |
| `scripts/lib/token-units.test.ts` (create)                   | Its unit suite (gate 10).                                                                                                  |
| `scripts/extract-tokens/transform.ts` (modify)               | Calls `emitFloat` instead of its inline rule.                                                                              |
| `scripts/check-detectors.ts` (modify)                        | `SUITES` gains the two new suites.                                                                                         |
| `packages/ui/src/tokens/raw/figma-variables.json` (patch by script) | The new variable, checksum-verified against the live Figma export.                                                   |
| `packages/ui/src/tokens/tokens.json`, `tokens.css` (regen)   | `pnpm tokens:build`.                                                                                                       |
| `packages/ui/src/tokens/PROVENANCE.md` (modify)              | Dated entry for the variable.                                                                                              |
| `scripts/lib/example-children.ts` (create)                   | Pure: `ExampleChildren` type, `childSnippet(c)`, `childNode(c)`, `validateExampleChildren(c)`.                             |
| `scripts/lib/example-children.test.ts` (create)              | Its unit suite (gate 10).                                                                                                  |
| `scripts/lib/docs-render.ts`, `scripts/lib/a11y-mount.ts`, `scripts/lib/docs-html.ts`, `scripts/generate-docs.ts` (modify) | Use the helper: render `node`, print `snippet`, validate the shape.                                    |
| `packages/ui/src/components/sigil/Sigil.tsx` (create via scaffold, then rewrite) | The component.                                                                                        |
| `packages/ui/src/components/sigil/sigil.css` (create)        | The stylesheet.                                                                                                            |
| `packages/ui/src/components/sigil/index.ts` (create via scaffold) | Exports.                                                                                                              |
| `packages/ui/src/components/sigil/Sigil.a11y.test.ts` (create) | Keyboard / structure suite, discovered by gate 9.                                                                        |
| `packages/ui/src/components/sigil/Sigil.meta.ts` (create via scaffold, then rewrite) | Examples (SVG art), guidelines, notes.                                                             |
| `packages/ui/src/components/sigil/contract.json` (modify)    | Full machine contract (status stays `draft`, a11y `pending`).                                                              |
| `docs/assets/site.css` (modify)                              | Docs shell: a stage slot width for the Sigil (the stage is a flex row; a `width: 100%` square needs a slot).               |
| `docs/**`, `dist/**` (regen)                                 | `pnpm docs:build`, `pnpm dist:build`.                                                                                      |
| `process/PROOF-OF-BLOCKING.md` (modify)                      | Proof rows for the two new suites and the a11y engine on the Sigil.                                                        |
| `packages/ui/src/STATE-MANIFEST.md` (modify, last commit)    | PR number, notes.                                                                                                          |

---

### Task 1: The float unit rule as a pure, tested function

**Files:**

- Create: `scripts/lib/token-units.ts`
- Create: `scripts/lib/token-units.test.ts`
- Modify: `scripts/extract-tokens/transform.ts` (lines 46–47 and 71–75: the `px` helper and the number branch of `resolveValue`)
- Modify: `scripts/check-detectors.ts` (the `SUITES` array)

- [ ] **Step 1: Write the failing test**

```ts
// scripts/lib/token-units.test.ts
// Unit suite for the FLOAT unit rule (gate 10). Locks: px by default,
// unitless by name (z/*, type weight and line-height), and the opacity
// family emitted as a percentage divided by 100 (Figma reads a float bound
// to a layer's opacity as %, verified 2026-09-26 — Sigil design record §3).
import { test } from "node:test";
import assert from "node:assert/strict";
import { emitFloat } from "./token-units.ts";

test("a Spacing float is emitted in px", () => {
  assert.equal(emitFloat("Spacing/s-15", 12), "12px");
});

test("a Layout float other than z/* is emitted in px", () => {
  assert.equal(emitFloat("Layout/nav-h", 64), "64px");
});

test("Layout/z/* is unitless", () => {
  assert.equal(emitFloat("Layout/z/base", 1), "1");
});

test("Type weight and line-height are unitless; size and tracking are not", () => {
  assert.equal(emitFloat("Type/body/weight", 400), "400");
  assert.equal(emitFloat("Type/body/line-height", 1.5), "1.5");
  assert.equal(emitFloat("Type/body/size", 16), "16px");
});

test("an opacity token is a percentage: value / 100, unitless", () => {
  assert.equal(emitFloat("Primitives/opacity/ornament", 25), "0.25");
  assert.equal(emitFloat("Primitives/opacity/ornament", 100), "1");
  assert.equal(emitFloat("Primitives/opacity/ornament", 12.5), "0.125");
});

test("the opacity rule keys on the family segment, not on a name prefix", () => {
  assert.equal(emitFloat("Primitives/opacityx/foo", 25), "25px");
  assert.equal(emitFloat("Spacing/opacity", 25), "25px");
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `node --test scripts/lib/token-units.test.ts`
Expected: FAIL — `Cannot find module` for `./token-units.ts`.

- [ ] **Step 3: Write the helper**

```ts
// scripts/lib/token-units.ts
// The unit rule for FLOAT tokens, in one pure function so it is unit-tested
// (gate 10) and the transform stage carries no inline arithmetic.
//   - Layout/z/*, Type/*/weight and Type/*/line-height are unitless by nature.
//   - */opacity/* is a PERCENTAGE in Figma (a float bound to a layer's
//     opacity reads as %, verified 2026-09-26): emitted as value / 100,
//     unitless — the same mechanical arithmetic the normalise stage applies
//     to a PERCENT line-height.
//   - Everything else is px.
export function emitFloat(key: string, n: number): string {
  if (key.startsWith("Layout/z/")) return String(n);
  if (/^Type\/[a-z0-9-]+\/(weight|line-height)$/.test(key)) return String(n);
  if (/^[^/]+\/opacity\/[^/]+$/.test(key)) return String(Math.round((n / 100) * 1e6) / 1e6);
  return `${n}px`;
}
```

- [ ] **Step 4: Run the suite to verify it passes**

Run: `node --test scripts/lib/token-units.test.ts`
Expected: `tests 6`, `pass 6`, `fail 0`.

- [ ] **Step 5: Wire the transform to the helper**

In `scripts/extract-tokens/transform.ts`: add `import { emitFloat } from "../lib/token-units.ts";` next to the other imports; delete the line `const px = (n: number) => \`${n}px\`;` and the comment above it; replace the number branch of `resolveValue`:

```ts
  // number — unit rule in scripts/lib/token-units.ts (gate 10 locks it).
  const n = WEIGHT_OVERRIDES[key] ?? Number(v);
  return emitFloat(key, n);
```

(remove the three lines `if (key.startsWith("Layout/z/")) …`, `if (/^Type\/…/.test(key)) …`, `return px(n);`).

- [ ] **Step 6: Prove the transform still emits the same stylesheet**

Run: `pnpm tokens:build` then `git status --short packages/ui/src/tokens`
Expected: no change to `tokens.json` / `tokens.css` (the rule is identical for every existing token). Then `pnpm tokens:check` → `exit 0`.

- [ ] **Step 7: Register the suite in gate 10**

In `scripts/check-detectors.ts`, `SUITES` gains, after the contrast-axis line:

```ts
  "scripts/lib/token-units.test.ts", // transform — FLOAT unit rule (px / unitless / opacity percent)
```

Run: `pnpm gate:detectors` → `PASS`, the summary counts 6 more tests than before.

- [ ] **Step 8: Red/green proof row**

Injection: in `scripts/lib/token-units.ts`, change `n / 100` to `n / 10`, verify landed (`grep -c "n / 10)" scripts/lib/token-units.ts` = 1), run `pnpm gate:detectors` → `exit 1`, `fail 1`, naming `an opacity token is a percentage: value / 100, unitless`. Restore by editing back (`grep -c "n / 100" …` = 1), re-run → `PASS`. Append the row to the table at the end of `process/PROOF-OF-BLOCKING.md` (same four columns: Gate / Injection / Red observed / Restored green), and a one-line dated note in the file's preamble list ("Token-units proof: 2026-09-26 (the transform's FLOAT unit rule became a tested helper), locally, Node 24.16.0.").

- [ ] **Step 9: Format and commit**

```bash
pnpm exec prettier --write scripts/lib/token-units.ts scripts/lib/token-units.test.ts scripts/extract-tokens/transform.ts scripts/check-detectors.ts process/PROOF-OF-BLOCKING.md
git branch --show-current   # feat/sigil
git add scripts/lib/token-units.ts scripts/lib/token-units.test.ts scripts/extract-tokens/transform.ts scripts/check-detectors.ts process/PROOF-OF-BLOCKING.md
git commit -m "feat(tokens): FLOAT unit rule as a tested helper - opacity/* emitted as a percentage (value / 100)

Prepares the Sigil's opacity/ornament token (RFC section 7 Q4, Q9): Figma
reads a float bound to opacity as %, so the transform divides by 100,
unitless. Six tests in gate 10; transform output unchanged for every
existing token (pnpm tokens:check green).

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 2: Extract the variable (main session — Figma MCP) and regenerate

**Files:**

- Patch by script: `packages/ui/src/tokens/raw/figma-variables.json`
- Regenerate: `packages/ui/src/tokens/tokens.json`, `packages/ui/src/tokens/tokens.css`, `docs/**`, `dist/**`
- Modify: `packages/ui/src/tokens/PROVENANCE.md`

- [ ] **Step 1: Read the variable and the export checksum from Figma** (read-only `use_figma`, file `6zp7CvEjdiFXzwh6ZGGwB8`)

```js
// Same export as .github/prompts/extract-tokens.prompt.md, plus a djb2
// checksum over JSON.stringify(out) so the committed raw file is patched
// programmatically and verified — never re-typed.
const collections = await figma.variables.getLocalVariableCollectionsAsync();
const out = { collections: [], variables: [], textStyles: [] };
for (const c of collections) {
  out.collections.push({ id: c.id, name: c.name, defaultModeId: c.defaultModeId, modes: c.modes.map((m) => ({ modeId: m.modeId, name: m.name })) });
  for (const id of c.variableIds) {
    const v = await figma.variables.getVariableByIdAsync(id);
    out.variables.push({ id: v.id, name: v.name, variableCollectionId: v.variableCollectionId, resolvedType: v.resolvedType, scopes: v.scopes, codeSyntax: v.codeSyntax || {}, valuesByMode: v.valuesByMode });
  }
}
for (const s of await figma.getLocalTextStylesAsync()) {
  out.textStyles.push({ id: s.id, name: s.name, fontName: s.fontName, fontSize: s.fontSize, lineHeight: s.lineHeight, letterSpacing: s.letterSpacing, textCase: s.textCase, textDecoration: s.textDecoration, description: s.description });
}
const djb2 = (str) => { let h = 5381; for (let i = 0; i < str.length; i++) h = ((h * 33) ^ str.charCodeAt(i)) >>> 0; return h.toString(16); };
const idx = out.variables.findIndex((v) => v.name === "opacity/ornament");
return { checksum: djb2(JSON.stringify(out)), variables: out.variables.length, textStyles: out.textStyles.length, index: idx, prevName: out.variables[idx - 1]?.name, nextName: out.variables[idx + 1]?.name, variable: out.variables[idx] };
```

Expected: `variable` = `{ id: "VariableID:89:2", name: "opacity/ornament", variableCollectionId: "VariableCollectionId:3:2", resolvedType: "FLOAT", scopes: ["OPACITY"], codeSyntax: { WEB: "var(--ll-opacity-ornament)" }, valuesByMode: { "3:0": 25 } }`, `prevName` = `tier/challenger`, `nextName` = the first Semantic variable (`bg/default`), `variables` = 74 (73 committed + 1). If the Figma value is not 25 or the scopes differ: STOP and report (never improvise).

- [ ] **Step 2: Patch the raw export by script and verify the checksum**

Write `C:\…\scratchpad\patch-raw.mjs` (Node, not Python — float serialisation must match JS `JSON.stringify`):

```js
import { readFileSync, writeFileSync } from "node:fs";
const RAW = "packages/ui/src/tokens/raw/figma-variables.json";
const EXPECTED = process.argv[2]; // the checksum from Figma
const raw = JSON.parse(readFileSync(RAW, "utf8"));
const vars = raw.variables;
if (vars.some((v) => v.name === "opacity/ornament")) throw new Error("already patched");
const i = vars.findIndex((v) => v.name === "tier/challenger");
if (i < 0) throw new Error("anchor tier/challenger not found");
vars.splice(i + 1, 0, {
  id: "VariableID:89:2",
  name: "opacity/ornament",
  variableCollectionId: "VariableCollectionId:3:2",
  resolvedType: "FLOAT",
  scopes: ["OPACITY"],
  codeSyntax: { WEB: "var(--ll-opacity-ornament)" },
  valuesByMode: { "3:0": 25 },
});
const djb2 = (str) => { let h = 5381; for (let k = 0; k < str.length; k++) h = ((h * 33) ^ str.charCodeAt(k)) >>> 0; return h.toString(16); };
const sum = djb2(JSON.stringify({ collections: raw.collections, variables: raw.variables, textStyles: raw.textStyles }));
if (sum !== EXPECTED) throw new Error(`checksum mismatch: local ${sum} vs figma ${EXPECTED} — nothing written`);
raw.exportedAt = "2026-09-26";
writeFileSync(RAW, JSON.stringify(raw, null, 2) + "\n");
console.log("raw patched, checksum", sum);
```

Run: `node <scratchpad>/patch-raw.mjs <checksum>` from the repo root.
Expected: `raw patched, checksum …`. On mismatch nothing is written: re-run the Figma script returning per-variable `djb2(JSON.stringify(v))` and compare against the local per-variable hashes to find the divergent entry — then decide (the raw file is never edited by hand).

- [ ] **Step 3: Regenerate and validate**

```bash
pnpm tokens:build
pnpm tokens:check
pnpm validate:theme
pnpm diff:tokens
grep -n "opacity-ornament" packages/ui/src/tokens/tokens.css
```

Expected: `tokens:check` exit 0; `validate:theme` exit 0; `diff:tokens` **expected-red**: `token-diff: 1 token change(s) awaiting HUMAN approval` listing `Primitives/opacity/ornament | — | --ll-opacity-ornament = 0.25`; the grep shows `--ll-opacity-ornament: 0.25;` inside `:root`.

- [ ] **Step 4: Provenance entry** — prepend to the entries of `packages/ui/src/tokens/PROVENANCE.md` (newest first, same shape as the 2026-08-14 `s-275` entry):

```markdown
- **2026-09-26** — Sigil RFC arbitration (§7 Q4, Q9): one Primitives variable
  added in Figma through the MCP then re-extracted — `opacity/ornament` = 25
  (`--ll-opacity-ornament` = `0.25`, the accent ring's opacity inside the
  Sigil frame). Stored as a percentage because Figma reads a float bound to a
  layer's opacity as % (a first write of 0.25 rendered the ring at 0.25 %);
  the transform's unit rule (`scripts/lib/token-units.ts`) divides `opacity/*`
  by 100. Raw export patched by script and checksum-verified against the live
  export (djb2 over the full export). Decided by: Louis Tinthilier. Delivered
  by: Sigil implementation session (sup. Louis Tinthilier).
```

- [ ] **Step 5: Regenerate the docs and the dist (they embed tokens.css) and commit everything together**

```bash
pnpm docs:build
pnpm dist:build
pnpm exec prettier --write packages/ui/src/tokens/PROVENANCE.md
pnpm gate:contrast
git branch --show-current   # feat/sigil
git add packages/ui/src/tokens/raw/figma-variables.json packages/ui/src/tokens/tokens.json packages/ui/src/tokens/tokens.css packages/ui/src/tokens/PROVENANCE.md docs dist
git commit -m "feat(tokens): Primitives/opacity/ornament = 25 % from Figma - --ll-opacity-ornament 0.25 (Sigil RFC section 7 Q4, Q9)

Raw export patched by script, checksum-verified against the live export;
tokens.json / tokens.css / docs / dist regenerated in this commit. Token
diff: 1 addition, expected-red until the design lead applies
token-approved.

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

Expected before commit: `gate:contrast` `PASS (37 pairs)` (no colour changed).

---

### Task 3: Examples with element children (docs + a11y engine)

**Files:**

- Create: `scripts/lib/example-children.ts`
- Create: `scripts/lib/example-children.test.ts`
- Modify: `scripts/lib/docs-render.ts` (the `Example` interface, lines 11–15; the bundled entry, line 27)
- Modify: `scripts/lib/a11y-mount.ts` (the `children?: string` parameter, line 23; the entry and the call, lines 54–83)
- Modify: `scripts/lib/docs-html.ts` (the `examples` type, line 19; `jsxSource`, lines 58–67)
- Modify: `scripts/generate-docs.ts` (the examples validation after line 67)
- Modify: `scripts/check-detectors.ts` (`SUITES`)

- [ ] **Step 1: Write the failing test**

```ts
// scripts/lib/example-children.test.ts
// Unit suite (gate 10) for the example-children helper: a contract example's
// children are either a string (rendered as text, printed as-is) or an
// element form { snippet, node } (node rendered, snippet printed) — the
// Sigil's examples need an SVG child (design record 2026-09-26 §6).
import { test } from "node:test";
import assert from "node:assert/strict";
import { childSnippet, childNode, validateExampleChildren } from "./example-children.ts";

test("a string child is its own snippet and its own node", () => {
  assert.equal(childSnippet("Rift · Compass"), "Rift · Compass");
  assert.equal(childNode("Rift · Compass"), "Rift · Compass");
});

test("undefined children stay undefined on both sides", () => {
  assert.equal(childSnippet(undefined), undefined);
  assert.equal(childNode(undefined), undefined);
});

test("the element form prints its snippet and renders its node", () => {
  const node = { $$typeof: Symbol.for("react.element"), type: "svg" };
  const c = { snippet: "<svg …>…</svg>", node };
  assert.equal(childSnippet(c), "<svg …>…</svg>");
  assert.equal(childNode(c), node);
});

test("validateExampleChildren accepts undefined, a string and a well-formed element form", () => {
  assert.equal(validateExampleChildren(undefined), null);
  assert.equal(validateExampleChildren("text"), null);
  assert.equal(validateExampleChildren({ snippet: "<b>3</b>", node: { type: "b" } }), null);
});

test("validateExampleChildren names the defect of a malformed element form", () => {
  assert.match(validateExampleChildren({ snippet: "", node: {} }) ?? "", /snippet/);
  assert.match(validateExampleChildren({ snippet: "<b/>" }) ?? "", /node/);
  assert.match(validateExampleChildren(42) ?? "", /string or \{ snippet, node \}/);
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `node --test scripts/lib/example-children.test.ts`
Expected: FAIL — `Cannot find module` for `./example-children.ts`.

- [ ] **Step 3: Write the helper**

```ts
// scripts/lib/example-children.ts
// A contract example's children: a string (text, printed as-is in the docs
// code block) or the element form { snippet, node } — `node` is a real
// ReactNode built in the meta file (React.createElement, never JSX in a .ts
// file), rendered by the docs generator and mounted by the a11y engine;
// `snippet` is the JSX source printed under the demo stage. One pure helper
// so the three consumers (docs-render, a11y-mount, docs-html) cannot drift.
export interface ElementChildren {
  snippet: string;
  node: unknown; // React.ReactNode — typed loosely here: this file never imports React
}
export type ExampleChildren = string | ElementChildren | undefined;

const isElementForm = (c: unknown): c is ElementChildren =>
  typeof c === "object" && c !== null && "snippet" in c;

export function childSnippet(c: ExampleChildren): string | undefined {
  return isElementForm(c) ? c.snippet : c;
}

export function childNode(c: ExampleChildren): unknown {
  return isElementForm(c) ? c.node : c;
}

/** null when well-formed, otherwise the defect to report. */
export function validateExampleChildren(c: unknown): string | null {
  if (c === undefined || typeof c === "string") return null;
  if (isElementForm(c)) {
    if (typeof c.snippet !== "string" || !c.snippet) return "element children need a non-empty snippet";
    if (!("node" in c) || c.node === undefined || c.node === null)
      return "element children need a node (React.createElement(...))";
    return null;
  }
  return "children must be a string or { snippet, node }";
}
```

- [ ] **Step 4: Run the suite to verify it passes**

Run: `node --test scripts/lib/example-children.test.ts` → `tests 5`, `pass 5`.

- [ ] **Step 5: Wire the three consumers and the validation**

`scripts/lib/docs-render.ts`: import `{ childNode, type ExampleChildren }`; `Example.children?: ExampleChildren`; the bundled entry cannot import the helper (it runs inside the esbuild bundle), so pass already-resolved nodes: replace the call at the end of `renderExamples` by

```ts
  return (mod.exports as (e: { props: Record<string, unknown>; children?: unknown }[], n: string) => string[])(
    examples.map((e) => ({ props: e.props, children: childNode(e.children) })),
    exportName,
  );
```

`scripts/lib/a11y-mount.ts`: `children?: ExampleChildren` on `mountComponent`; pass `childNode(children)` to the bundled function (its parameter type becomes `ch?: unknown`). The Eyebrow suite's cast (`as unknown as string`) keeps working.

`scripts/lib/docs-html.ts`: the `examples` type becomes `{ label: string; props: Record<string, unknown>; children?: ExampleChildren }[]`; `jsxSource` uses `const snippet = childSnippet(e.children);` and prints `snippet !== undefined ? \`<${name}${attrs}>${snippet}</${name}>\` : \`<${name}${attrs} />\``.

`scripts/generate-docs.ts`: after the examples-length check, add

```ts
  for (const e of meta?.examples ?? []) {
    const defect = validateExampleChildren(e?.children);
    if (defect) fail(`${slug}: example "${e?.label}": ${defect}`);
  }
```

(import `validateExampleChildren` from `./lib/example-children.ts`). The a11y engine renders through `renderExamples`, so it needs no change beyond the type.

- [ ] **Step 6: Prove nothing regressed**

```bash
pnpm docs:build
pnpm dist:build
git status --short docs dist        # expected: no change — string children render as before
pnpm gate:a11y-engine               # expected: PASS, same counts as before
```

- [ ] **Step 7: Register the suite and prove it red/green**

`scripts/check-detectors.ts` `SUITES` gains `"scripts/lib/example-children.test.ts", // docs + a11y engine — example children (string | { snippet, node })`. Injection: in `example-children.ts` make `childNode` return `c` unchanged for the element form (`return c;`), verify landed (`grep -c "return c;" …` = 1); `pnpm gate:detectors` → `exit 1`, `fail 1`, naming `the element form prints its snippet and renders its node`. Restore, re-run → `PASS`. Append the row to `process/PROOF-OF-BLOCKING.md` and the preamble note ("Example-children proof: 2026-09-26 (contract examples may carry an element child), locally, Node 24.16.0.").

- [ ] **Step 8: Format and commit**

```bash
pnpm exec prettier --write scripts/lib/example-children.ts scripts/lib/example-children.test.ts scripts/lib/docs-render.ts scripts/lib/a11y-mount.ts scripts/lib/docs-html.ts scripts/generate-docs.ts scripts/check-detectors.ts process/PROOF-OF-BLOCKING.md
git branch --show-current   # feat/sigil
git add scripts/lib/example-children.ts scripts/lib/example-children.test.ts scripts/lib/docs-render.ts scripts/lib/a11y-mount.ts scripts/lib/docs-html.ts scripts/generate-docs.ts scripts/check-detectors.ts process/PROOF-OF-BLOCKING.md
git commit -m "feat(docs): contract examples may carry an element child ({ snippet, node }) - the deferred children string -> ReactNode follow-up

One pure helper (scripts/lib/example-children.ts, five tests in gate 10)
feeds the docs renderer, the a11y mount and the JSX snippet; the docs
generator validates the shape. Needed by the Sigil's SVG examples.
Rendered docs and dist unchanged.

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 4: The component, test-first

**Files:**

- Create via `node scripts/scaffold.ts Sigil`: `packages/ui/src/components/sigil/index.ts`, `Sigil.tsx`, `Sigil.meta.ts` (the RFC and `contract.json` already exist and are skipped)
- Create: `packages/ui/src/components/sigil/Sigil.a11y.test.ts`, `packages/ui/src/components/sigil/sigil.css`

- [ ] **Step 1: Scaffold**

Run: `node scripts/scaffold.ts Sigil`
Expected: `skipped (exists)` for `contract.json` and `Sigil.rfc.md`; `index.ts`, `Sigil.tsx`, `Sigil.meta.ts` created, intentionally red. Do NOT run conformity yet.

- [ ] **Step 2: Write the failing suite**

```ts
// packages/ui/src/components/sigil/Sigil.a11y.test.ts
// Sigil — local behaviour suite (RFC §3.4 / §4, arbitrations §7 Q2, Q11).
// Discovered and run by scripts/check-a11y-engine.ts. Proves what the
// generic checks cannot: the one-root shape with aria-hidden always on, the
// single art slot holding exactly the children, that nothing interactive is
// rendered, and that a real element child passes through untouched.
// Run: node --test packages/ui/src/components/sigil/Sigil.a11y.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { mountComponent } from "../../../../../scripts/lib/a11y-mount.ts";

const DIR = "packages/ui/src/components/sigil";
const art = () =>
  React.createElement(
    "svg",
    { viewBox: "0 0 200 200", fill: "none", stroke: "currentColor" },
    React.createElement("polygon", { points: "100,10 180,55 180,145 100,190 20,145 20,55" }),
  );

test("renders one <div class='ll-sigil' aria-hidden='true'> holding one .ll-sigil-art (§3.4, §4.1)", async () => {
  const { root, unmount } = await mountComponent(DIR, "Sigil", {}, { snippet: "<svg />", node: art() });
  assert.equal(root.tagName, "DIV");
  assert.equal(root.className, "ll-sigil");
  assert.equal(root.getAttribute("aria-hidden"), "true"); // unconditional (§4.3)
  assert.deepEqual(root.getAttributeNames().sort(), ["aria-hidden", "class"]); // no role, no other aria-*
  assert.equal(root.children.length, 1);
  assert.equal(root.children[0].className, "ll-sigil-art");
  assert.equal(root.parentElement?.children.length, 1); // the div is the only thing rendered
  await unmount();
});

test("the art slot holds exactly the children — an element child passes through untouched (§3.2)", async () => {
  const { root, unmount } = await mountComponent(DIR, "Sigil", {}, { snippet: "<svg />", node: art() });
  const slot = root.children[0];
  assert.equal(slot.children.length, 1);
  assert.equal(slot.children[0].tagName.toLowerCase(), "svg");
  assert.equal(slot.children[0].getAttribute("viewBox"), "0 0 200 200");
  assert.equal(slot.querySelector("polygon")?.getAttribute("points"), "100,10 180,55 180,145 100,190 20,145 20,55");
  await unmount();
});

test("nothing interactive is rendered by the component itself (§3.3, §4.2)", async () => {
  const { root, unmount } = await mountComponent(DIR, "Sigil", {}, { snippet: "<svg />", node: art() });
  assert.equal(root.querySelector("a, button, input, select, textarea, [tabindex]"), null);
  assert.equal(root.getAttribute("tabindex"), null);
  await unmount();
});

test("no text of its own: the frame carries no label (§7 Q11)", async () => {
  const { root, unmount } = await mountComponent(DIR, "Sigil", {}, { snippet: "<svg />", node: art() });
  assert.equal(root.textContent, "");
  await unmount();
});
```

- [ ] **Step 3: Run it to verify it fails**

Run: `node --test packages/ui/src/components/sigil/Sigil.a11y.test.ts`
Expected: FAIL on the first test (`className` is `component-sigil`, no `aria-hidden`).

- [ ] **Step 4: Write the component**

```tsx
// packages/ui/src/components/sigil/Sigil.tsx
import React from "react";

// API is RFC §3 exactly (Sigil.rfc.md, approved 2026-09-26). One slot and
// nothing else: no label (§7 Q11), no size, no tone, no ornament, no `as`,
// no className — the parent grid sizes the square. Decorative by
// construction: aria-hidden is unconditional (§4.1, §4.3); the art is the
// page's, rendered inside the slot square (§3.2); nothing interactive (§4.2).
export interface SigilProps {
  children: React.ReactNode;
}

export function Sigil({ children }: SigilProps) {
  return (
    <div className="ll-sigil" aria-hidden="true">
      <div className="ll-sigil-art">{children}</div>
    </div>
  );
}
```

```css
/* Sigil — Sigil.rfc.md §3–§4, design node 89:4 (component `Sigil`, page
   `Sigil` 89:3: rings 89:5 / 89:6, art slot 92:7 inside the accent ring).
   The framed decorative square: 1px border, surface fill, colour = the live
   accent so the art inherits it (currentColor). Two rings as
   pseudo-elements (§7 Q2): the soft ring at s-15, the accent ring at s-3 at
   opacity/ornament (§7 Q4, Q9 — Figma stores 25 %, the transform emits 0.25).
   The art slot is the square inside the accent ring (§7 Q11): a child, so it
   paints above ::before and below ::after — the Figma layer order. No
   layout ships beyond width: 100% and aspect-ratio: 1 — the parent grid
   sizes and places the square (§3.4). Every value is a token (axiom 1). */

.ll-sigil {
  position: relative;
  aspect-ratio: 1;
  width: 100%;
  border: 1px solid var(--ll-border);
  background: var(--ll-surface);
  color: var(--ll-accent);
}

.ll-sigil::before,
.ll-sigil::after {
  content: "";
  position: absolute;
  inset: var(--ll-s-15);
  border: 1px solid var(--ll-border-soft);
  pointer-events: none;
}
.ll-sigil::after {
  inset: var(--ll-s-3);
  border-color: var(--ll-accent);
  opacity: var(--ll-opacity-ornament);
}

/* The art slot — the square inside the accent ring (§3.2). */
.ll-sigil-art {
  position: absolute;
  inset: var(--ll-s-3);
}
.ll-sigil-art > svg {
  display: block;
  width: 100%;
  height: 100%;
}
```

`index.ts` from the scaffold already exports `Sigil` and `SigilProps` — leave it.

- [ ] **Step 5: Run the suite to verify it passes**

Run: `node --test packages/ui/src/components/sigil/Sigil.a11y.test.ts` → `tests 4`, `pass 4`.

- [ ] **Step 6: The meta (real examples, guidelines) and the contract**

```ts
// packages/ui/src/components/sigil/Sigil.meta.ts
import React from "react";

// Examples carry an element child ({ snippet, node } — scripts/lib/example-
// children.ts): the art is an SVG, built with createElement (a .ts file).
const hexFrame = () =>
  React.createElement(
    "svg",
    { viewBox: "0 0 200 200", fill: "none", stroke: "currentColor", strokeWidth: 0.8 },
    React.createElement("polygon", { points: "100,10 180,55 180,145 100,190 20,145 20,55", strokeWidth: 1, opacity: 0.55 }),
    React.createElement("polygon", { points: "100,40 155,72 155,128 100,160 45,128 45,72", opacity: 0.4 }),
    React.createElement("path", { d: "M100 10 L100 40 M180 55 L155 72 M180 145 L155 128 M100 190 L100 160 M20 145 L45 128 M20 55 L45 72", opacity: 0.5 }),
  );
const compass = () =>
  React.createElement(
    "svg",
    { viewBox: "0 0 200 200", fill: "none", stroke: "currentColor", strokeWidth: 0.8 },
    React.createElement("circle", { cx: 100, cy: 100, r: 36, strokeWidth: 1, opacity: 0.7 }),
    React.createElement("path", { d: "M100 64 L106 100 L100 136 L94 100 Z", fill: "currentColor", opacity: 0.85, stroke: "none" }),
    React.createElement("path", { d: "M64 100 L100 94 L136 100 L100 106 Z", fill: "currentColor", opacity: 0.4, stroke: "none" }),
    React.createElement("circle", { cx: 100, cy: 100, r: 3, fill: "currentColor", stroke: "none" }),
  );

export const meta = {
  name: "Sigil",
  description:
    "The framed decorative square beside a hero title: a bordered surface square, two inset rings, and the page's art inside the accent ring, drawn in the live accent. Decorative (aria-hidden), no label, no states — the parent grid sizes it.",
  variants: [],
  examples: [
    {
      label: "Hex frame",
      props: {},
      children: {
        snippet: '<svg viewBox="0 0 200 200" fill="none" stroke="currentColor">…</svg>',
        node: hexFrame(),
      },
    },
    {
      label: "Compass",
      props: {},
      children: {
        snippet: '<svg viewBox="0 0 200 200" fill="none" stroke="currentColor">…</svg>',
        node: compass(),
      },
    },
  ],
  guidelines: {
    golden: [
      {
        rule: "Decorative, always",
        detail:
          "The frame is aria-hidden unconditionally: the page's meaning lives in the heading beside it, never in the sigil (RFC §4.1, §4.3). A meaningful image is an <img alt> or a figure, not a Sigil.",
      },
      {
        rule: "The art is the page's",
        detail:
          "Pass an inline SVG drawn with currentColor — it inherits the accent — or your own positioned element; it renders inside the square within the accent ring (RFC §3.2, §7 Q11).",
      },
      {
        rule: "The parent sizes the square",
        detail:
          "width: 100% and aspect-ratio: 1 — the grid column decides the size and the placement; no size prop (RFC §3.4).",
      },
      {
        rule: "One ornament, no label",
        detail:
          "Two inset rings, nothing else (§7 Q2); the corner caption left the design (§7 Q11) — a product that wants one places its own element beside the Sigil.",
      },
    ],
    do: [
      "Draw the art with stroke=\"currentColor\" / fill=\"currentColor\" so it follows data-accent (§3.1).",
      "Give the Sigil a sized grid column or wrapper; it fills the width it is given (§3.4).",
      "Set data-accent / data-role on an ancestor to change the accent: the frame, the accent ring and the art follow (§3.4).",
    ],
    dont: [
      "Don't put anything focusable inside — an aria-hidden subtree must not hold interactive content (§4.2).",
      "Don't put text in the slot expecting it to be read: it is hidden with the art (§4.1).",
      "Don't override the rings or the inset product-side — one ornament (§7 Q2).",
    ],
  },
  notes:
    "No states: nothing hovers, nothing focuses (RFC §3.3). The stylesheet ships no layout beyond width: 100% and aspect-ratio: 1 (§3.4). The site's role icon (a masked PNG span with inset: 0) renders inside the art slot, product-side.",
};
```

```json
{
  "status": "draft",
  "exported": false,
  "component": "Sigil",
  "rfc": "Sigil.rfc.md",
  "designNode": "89:4",
  "variants": [],
  "props": {
    "children": {
      "type": "ReactNode",
      "note": "the art: an inline <svg> drawn with currentColor, or any product element positioned inside the slot; fills the square inside the accent ring (RFC §3.1, §3.2, §7 Q11). The only prop — no label, size, tone, ornament, as or className."
    }
  },
  "a11y": {
    "status": "pending",
    "semanticStructure": "Exactly one <div class=\"ll-sigil\" aria-hidden=\"true\"> holding one <div class=\"ll-sigil-art\"> whose only content is children (RFC §3.4, §4.1). No ARIA role, no accessible name, no live region, no text of its own: decorative by construction, hidden from assistive technology unconditionally — the six site mounts already ship aria-hidden.",
    "keyboard": "Nothing to do: no interactive element, nothing focusable — no a, button, input or tabindex is rendered by the component (RFC §3.3, §4.2). Interactive children are not expected: an aria-hidden subtree must not contain focusable content (WCAG 4.1.2, axe aria-hidden-focus) — a dont guideline; the local suite asserts the component itself renders nothing focusable.",
    "decisions": "No contrast pair is declared — the first component with an empty pair set: pure decoration is exempt from WCAG 1.4.3 and the component renders no text; the contrast gate scores the token-level pairs in contrast-pairs.json, which this component adds nothing to (RFC §4.3). aria-hidden is unconditional: a product that needs a meaningful image uses an <img alt> or a figure, not a Sigil. The accent ring's opacity is the opacity/ornament token (25 % in Figma, 0.25 in CSS — §7 Q4, Q9).",
    "notes": "Implemented per RFC §4; this status moves to pass only through the accessibility engine gate, never by assertion."
  }
}
```

- [ ] **Step 7: Docs shell slot and the generators**

The docs stage is a flex row (`docs/assets/site.css` `.stage`); a `width: 100%` square would fill it. Add to `docs/assets/site.css`, after the `.accent-tile` rules:

```css
/* The Sigil fills the width it is given (its contract): the demo stage and
   the accent tiles give it a fixed slot. Docs shell, not library CSS. */
.stage > .ll-sigil,
.accent-tile > .ll-sigil {
  width: 160px;
}
```

Then:

```bash
pnpm docs:build
pnpm dist:build
grep -c "ll-sigil" docs/components/sigil.html dist/ll-lib.css dist/ll-lib.jsx
```

Expected: `docs/components/sigil.html` exists with two stages/examples; the dist CSS holds `.ll-sigil`; `window.LL` in `dist/ll-lib.jsx` now lists `Sigil`; the generators no longer print `skipped sigil (RFC stage)`.

- [ ] **Step 8: Conformity, executed**

Run: `pnpm conformity`
Expected: `conformity: PASS (11 gates)`. The a11y engine report (`reports/a11y-engine.md`) lists `sigil` with 2 examples × 5 accents, `PASS`, and the local suite `Sigil.a11y.test.ts` green. If the docs a11y gate or the smoke gate reds on the new page, fix the cause here (never an allowlist).

- [ ] **Step 9: A11y-engine proof rows (the Sigil's own surface)**

Two injections, each verified landed and restored by editing back, appended to `process/PROOF-OF-BLOCKING.md`:

1. `aria-hidden="true"` removed from the root in `Sigil.tsx` (`grep -c aria-hidden Sigil.tsx` = 0) → `pnpm gate:a11y-engine` `exit 1`, `Sigil.a11y.test.ts` red on `renders one <div class='ll-sigil' aria-hidden='true'>…`.
2. `React.createElement("a", { href: "#" }, "x")` appended inside the art in the "Hex frame" example of `Sigil.meta.ts` (verified landed) → `exit 1`: `hidden-focusable — focusable element inside aria-hidden="true"` once per accent.

- [ ] **Step 10: Format and commit**

```bash
pnpm exec prettier --write packages/ui/src/components/sigil docs/assets/site.css process/PROOF-OF-BLOCKING.md
pnpm docs:build
pnpm dist:build
git branch --show-current   # feat/sigil
git add packages/ui/src/components/sigil docs dist process/PROOF-OF-BLOCKING.md
git commit -m "feat(sigil): implement from the approved RFC - frame, two rings, art slot inside the accent ring, a11y suite, docs and dist

Sigil.tsx / sigil.css / meta / contract per RFC section 3-4 (Q2 rings,
Q11 no label, art inset s-3). Four local tests; docs page with two SVG
examples (element children); dist exports LL.Sigil. pnpm conformity:
PASS (11 gates); two a11y-engine proofs recorded.

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 5: Visual check, PR, manifest release (main session)

- [ ] **Step 1: Look at the docs page** — `preview_start` `docs-static`, open `http://localhost:8765/components/sigil.html`, read the DOM: two `.ll-sigil` in the first stage at 160px, rings and art visible, five accent tiles each carrying a Sigil that follows its accent. Screenshot for Louis (his checkpoint).

- [ ] **Step 2: Open the PR** — title `feat(sigil): implement from the approved RFC — opacity/ornament token, art slot, docs, dist`; body in five sections (Summary / Changes / Verification — the executed `pnpm conformity` line and the expected-red token diff / Flags for review / Session report with To understand · To decide · To paste — the `token-approved` label — · Decisions made autonomously). Body via `--body-file`, `gh pr create` on its own line.

- [ ] **Step 3: Release the manifest row** — `PR` column = the new number, notes: "Implemented 2026-09-26 (PR #NN): …"; commit `docs(sigil): manifest row carries PR #NN`; push.

- [ ] **Step 4: Report** — the three blocks in chat; the token-diff check is expected-red until Louis applies `token-approved`.

---

## Self-review

- Spec coverage: API (§1) → Task 4 Step 4; rendering (§2) → Task 4 Step 4; token (§3) → Tasks 1–2; a11y (§4) → Task 4 Steps 2/6/9; Figma set (§5) → done in PR #47; element children (§6) → Task 3; adoption (§7) → a later mission (site), out of this plan; PR sequence (§8) → Task 5.
- Type consistency: `ExampleChildren` / `childSnippet` / `childNode` / `validateExampleChildren` are the same names in Task 3 Steps 1, 3, 5 and in Task 4's suite calls; `emitFloat(key, n)` in Task 1 Steps 1, 3, 5.
- No placeholder text; every code step shows the code.
