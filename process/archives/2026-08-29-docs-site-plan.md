# Documentation Site v1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the blueprint §9 documentation site — a generated static site (index + Button page, six scoped accents) fed exclusively by the component contracts — in two PRs: element-scoped theme axes, then the site.

**Architecture:** PR 1 changes the token transform so `[data-accent]` / `[data-role]` / `[data-density]` selectors are element-scoped (subtree theming), updating the schema gate that pins the selector shape. PR 2 adds `scripts/generate-docs.ts` (+ two `scripts/lib/` helpers): it discovers components by contract, SSRs the real components via esbuild + `react-dom/server`, and emits deterministic GENERATED HTML into `docs/` plus a concatenated `docs/assets/lib.css`, alongside a hand-written shell (`site.css`, `site.js`).

**Tech Stack:** Node 24 (runs `.ts` directly), esbuild + react + react-dom as root devDependencies (build-time only), vanilla JS in the site shell. No test framework: this repository verifies gates by injection proofs (`process/PROOF-OF-BLOCKING.md`) — that convention overrides generic TDD, per AGENTS.md instruction priority.

**Spec:** `process/archives/2026-08-29-docs-site-design.md` (approved 2026-08-29).

Conventions that apply to every task: run `git branch --show-current` before every commit (axiom 5); regenerate any artefact whose source you touched in the same commit (axiom 2); everything committed is English.

---

## PR 1 — element-scoped theme axes (branch `feat/scoped-theme-axes`, already carries the spec commit)

### Task 1: Scope the axis selectors in the transform

**Files:**
- Modify: `scripts/extract-tokens/transform.ts:92-114`

- [ ] **Step 1: Edit the three axis emitters** — drop the `:root` prefix and update the comments:

```ts
lines.push('/* Accent axis — the host sets [data-accent] on the root element or any subtree. */');
for (const a of accents) {
  lines.push(`[data-accent="${a}"] {`);
  lines.push(`  --ll-accent: var(--ll-accent-${a});`);
  lines.push("}");
}
lines.push("");
lines.push("/* Role axis — placed AFTER [data-accent] so a role accent wins the cascade. */");
for (const [role, accent] of Object.entries(ROLE_ACCENT)) {
  if (!accents.includes(accent))
    errors.push(`ROLE_ACCENT: role ${role} points at unknown accent ${accent}`);
  lines.push(`[data-role="${role}"] {`);
  lines.push(`  --ll-accent: var(--ll-accent-${accent});`);
  lines.push("}");
}
lines.push("");
lines.push("/* Density axis — the host sets [data-density] on the root element or any subtree. */");
for (const [key, t] of densityPair) {
  const name = key.split("/").pop()!.replace("base-", "");
  lines.push(`[data-density="${name}"] {`);
  lines.push(`  ${t.css}: ${px(Number(t.value))};`);
  lines.push("}");
}
```

The `:root` defaults block (lines 81-90) is untouched.

### Task 2: Update the schema gate to the new selector shape

**Files:**
- Modify: `scripts/validate-theme.ts:97,101-106`

- [ ] **Step 1: Widen the block regex** (line 97) so element-scoped blocks parse:

```ts
const blocks = [...css.matchAll(/^(:root|\[[^\]]+\])\s*\{([^}]*)\}/gms)].map((m) => ({
```

- [ ] **Step 2: Update `expectedSelectors`** (lines 101-106):

```ts
const expectedSelectors = [
  ":root",
  ...["or", "ambre", "bleu", "rouge", "violet", "jade"].map((a) => `[data-accent="${a}"]`),
  ...["support", "adc", "top", "mid", "jungle"].map((r) => `[data-role="${r}"]`),
  ...["compact", "aere"].map((d) => `[data-density="${d}"]`),
];
```

### Task 3: Regenerate, re-prove the schema gate, update the proofs

- [ ] **Step 1: Regenerate and verify**

```bash
pnpm tokens:build && pnpm validate:theme && pnpm gate:contrast && pnpm conformity
```

Expected: all PASS (token values unchanged; contrast re-run per the ORCHESTRATION trigger for token-file changes). `git diff packages/ui/src/tokens/tokens.css` shows only selector-prefix changes.

- [ ] **Step 2: Re-prove the schema gate red/green** (its scan surface changed — ORCHESTRATION obligation). Three injections, each: hand-edit `tokens.css`, verify the edit landed (`grep`), run `pnpm validate:theme` expecting exit 1 with the named failure, restore with `pnpm tokens:build`, re-run expecting exit 0:
  1. delete the `[data-role="mid"]` block → "missing block";
  2. append an `[data-accent="pink"] { --ll-accent: var(--ll-accent-or); }` block → "unexpected block";
  3. change one `var(--ll-accent-or)` to `var(--ll-does-not-exist)` → "dangling var".

- [ ] **Step 3: Update `process/PROOF-OF-BLOCKING.md`** — rewrite the three "Stylesheet schema" rows with the new selector spellings and add below the header: `Schema-gate re-proof: 2026-08-29 (selector scoping change), locally, Node 24.` Keep every other row verbatim.

- [ ] **Step 4: Update AGENTS.md** — in "Token rules", the accent-axis bullet gains subtree scoping; replace the sentence `**Accent axis** — \`[data-accent]\` / \`[data-role]\` swap which accent token is live` so the bullet reads:

```markdown
- **Accent axis** — `[data-accent]` / `[data-role]` swap which accent token is
  live (`or`, `ambre`, `bleu`, `rouge`, `violet`, `jade`), on the root element
  or any subtree element (element-scoped since 2026-08-29). Every
  accent-dependent semantic token must resolve under every axis value.
```

Mirror the same "or any subtree element" phrase in the density-axis bullet.

- [ ] **Step 5: Commit** (one commit: transform + gate + regenerated css + docs — same-commit rule):

```bash
git branch --show-current   # must print feat/scoped-theme-axes
git add scripts/extract-tokens/transform.ts scripts/validate-theme.ts packages/ui/src/tokens/tokens.css process/PROOF-OF-BLOCKING.md AGENTS.md
git commit -m "feat(tokens): element-scoped theme axes — [data-accent|role|density] on any subtree"
```

### Task 4: Open PR 1

- [ ] **Step 1:** `pnpm conformity` — quote the one-line verdict in the PR body.
- [ ] **Step 2:** `gh pr view 6 --json body -q .body` to copy the five-section body template used by past PRs; fill it for this change.
- [ ] **Step 3:** `git push -u origin feat/scoped-theme-axes` then `gh pr create` with that body. Note in the body: token *values* unchanged (diff gate expected green); CODEOWNERS routes the stylesheet to Louis.

---

## PR 2 — the documentation site (branch `feat/docs-site`, based on `feat/scoped-theme-axes`)

### Task 5: Branch + claim ownership (manifest rule 1: first commit, pushed immediately)

**Files:**
- Modify: `packages/ui/src/STATE-MANIFEST.md` (button registry row)

- [ ] **Step 1:** `git checkout -b feat/docs-site`
- [ ] **Step 2:** Update the button row (this PR edits `Button.meta.ts`): owner → `docs-site session (Claude)`, branch → `feat/docs-site`, PR → `—` (fill after Task 12), notes → `First component through the circuit (M5). Docs-site session adds contract examples.`
- [ ] **Step 3: Commit and push immediately**

```bash
git branch --show-current   # must print feat/docs-site
git add packages/ui/src/STATE-MANIFEST.md
git commit -m "docs(manifest): claim button for the docs-site session"
git push -u origin feat/docs-site
```

### Task 6: Dependencies

**Files:**
- Modify: `package.json`, `pnpm-lock.yaml`

- [ ] **Step 1:** `pnpm add -D -w react react-dom esbuild` then pin the resolved versions exactly (repo precedent: prettier is pinned) — edit `package.json` devDependencies to the exact versions the lockfile resolved (no `^`).
- [ ] **Step 2:** pnpm ≥10 blocks postinstall scripts by default and esbuild needs its binary — add to `package.json`:

```json
"pnpm": { "onlyBuiltDependencies": ["esbuild"] }
```

then re-run `pnpm install` and verify: `node -e "require('esbuild').buildSync"` exits 0.
- [ ] **Step 3: Commit** — message `chore(deps): react, react-dom, esbuild (docs generator, build-time only)`. PR body must flag the bump policy question (ORCHESTRATION dependency trigger).

### Task 7: `examples` in the Button contract

**Files:**
- Modify: `packages/ui/src/components/button/Button.meta.ts`

- [ ] **Step 1:** Append to the `meta` object (content lives in the contract — blueprint §9.1):

```ts
examples: [
  { label: "Primary action", props: { variant: "primary" }, children: "Start a league" },
  { label: "Ghost action", props: { variant: "ghost" }, children: "View the rules" },
  {
    label: "Link rendering (href set)",
    props: { variant: "primary", href: "#" },
    children: "Open the guide",
  },
],
```

- [ ] **Step 2: Commit** — `feat(button): contract examples for the docs generator`.

### Task 8: SSR helper — `scripts/lib/docs-render.ts`

**Files:**
- Create: `scripts/lib/docs-render.ts`

- [ ] **Step 1: Write the module.** esbuild bundles a stdin entry (react/react-dom external so the evaluated bundle shares node_modules' React), evaluated as CJS. The export identifier comes from the contract, never the folder name (blueprint §2.3):

```ts
// SSR of real library components for the docs generator (blueprint §9.2):
// esbuild bundles the component entry (react/react-dom external), the bundle
// is evaluated as CJS, and react-dom/server renders every contract example.
// Never a local approximation of a component (axiom 4).
import { buildSync } from "esbuild";
import { createRequire } from "node:module";
import { resolve } from "node:path";

const requireFromRoot = createRequire(resolve("package.json"));

export interface Example {
  label: string;
  props: Record<string, unknown>;
  children?: string;
}

export function renderExamples(componentDir: string, exportName: string, examples: Example[]): string[] {
  const entry = `
const { renderToStaticMarkup } = require("react-dom/server");
const React = require("react");
const mod = require("./index.ts");
module.exports = (examples, exportName) =>
  examples.map((e) => renderToStaticMarkup(React.createElement(mod[exportName], e.props, e.children)));
`;
  const bundle = buildSync({
    stdin: { contents: entry, resolveDir: resolve(componentDir), loader: "ts" },
    bundle: true,
    format: "cjs",
    platform: "node",
    external: ["react", "react-dom"],
    write: false,
    logLevel: "silent",
  });
  const mod = { exports: {} as unknown };
  new Function("module", "exports", "require", bundle.outputFiles[0].text)(mod, mod.exports, requireFromRoot);
  return (mod.exports as (e: Example[], n: string) => string[])(examples, exportName);
}
```

- [ ] **Step 2: Smoke-run** (throwaway, not committed):

```bash
node -e "import('./scripts/lib/docs-render.ts').then(m => console.log(m.renderExamples('packages/ui/src/components/button', 'Button', [{ label: 'x', props: { variant: 'primary' }, children: 'Hi' }])))"
```

Expected: `[ '<button class="ll-button ll-button--primary" type="button">Hi</button>' ]`.
- [ ] **Step 3: Commit** — `feat(docs): SSR helper — real components rendered from their contracts`.

### Task 9: Page templates — `scripts/lib/docs-html.ts`

**Files:**
- Create: `scripts/lib/docs-html.ts`

- [ ] **Step 1: Write the module.** All pages share one layout: `lang="en"`, unique `<title>`, skip link as first focusable, `header`/`nav`/`main`/`footer` landmarks, `scope="col"` on every table header (blueprint §9.2). Switcher buttons carry `data-set-accent` / `data-set-density` for `site.js`; defaults pressed = `ambre` / `compact` (the documented bare-root semantics). No inline styles anywhere (token-lint detector). Accent names are passed in from tokens.json — never hand-listed:

```ts
// HTML templates for the docs generator. Hand-written SHELL semantics live in
// docs/assets/site.css + site.js; everything data-driven here comes from the
// contracts and tokens.json, never hand-added (blueprint §2.3).
export interface ComponentDoc {
  slug: string; // folder name, kebab-case
  meta: {
    name: string;
    description: string;
    variants: { variant: string }[];
    notes?: string;
    examples: { label: string; props: Record<string, unknown>; children?: string }[];
  };
  contract: {
    status: string;
    rfc?: string;
    designNode?: string;
    props?: Record<string, { type: string; default?: string; optional?: boolean; note?: string }>;
    a11y: { status: string; semanticStructure?: string; keyboard?: string; decisions?: string; notes?: string };
  };
  renderedExamples: string[]; // same order as meta.examples
}

export const esc = (s: unknown): string =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const GENERATED = "<!-- GENERATED by `pnpm docs:build` (scripts/generate-docs.ts). Do not edit; edit the component contracts and regenerate. -->";

export function layout(opts: {
  title: string;
  relRoot: string; // "." for index, ".." for component pages
  accents: string[];
  content: string;
}): string {
  const { title, relRoot, accents, content } = opts;
  return `<!doctype html>
${GENERATED}
<html lang="en" data-accent="ambre" data-density="compact">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<link rel="stylesheet" href="${relRoot}/assets/lib.css">
<link rel="stylesheet" href="${relRoot}/assets/site.css">
</head>
<body>
<a class="skip-link" href="#main">Skip to content</a>
<header class="site-header">
  <nav aria-label="Site">
    <a class="site-title" href="${relRoot}/index.html">LearningLeagues Lib</a>
  </nav>
  <div class="switchers">
    <fieldset class="switcher" aria-label="Accent">
      <legend>Accent</legend>
${accents.map((a) => `      <button type="button" data-set-accent="${esc(a)}" aria-pressed="${a === "ambre"}">${esc(a)}</button>`).join("\n")}
    </fieldset>
    <fieldset class="switcher" aria-label="Density">
      <legend>Density</legend>
      <button type="button" data-set-density="compact" aria-pressed="true">compact</button>
      <button type="button" data-set-density="aere" aria-pressed="false">aere</button>
    </fieldset>
  </div>
</header>
<main id="main">
${content}
</main>
<footer class="site-footer">
  <p>Generated from the component contracts by <code>pnpm docs:build</code>. Content lives in the contracts, never here.</p>
</footer>
<script src="${relRoot}/assets/site.js"></script>
</body>
</html>
`;
}

export function indexPage(components: ComponentDoc[], accents: string[]): string {
  const rows = components
    .map(
      (c) => `      <tr>
        <th scope="row"><a href="./components/${esc(c.slug)}.html">${esc(c.meta.name)}</a></th>
        <td><span class="badge badge--${esc(c.contract.status)}">${esc(c.contract.status)}</span></td>
        <td>${c.meta.variants.map((v) => esc(v.variant)).join(", ") || "—"}</td>
        <td><span class="badge badge--${esc(c.contract.a11y.status)}">${esc(c.contract.a11y.status)}</span></td>
        <td>${esc(c.meta.description)}</td>
      </tr>`,
    )
    .join("\n");
  return layout({
    title: "Component registry — LearningLeagues Lib",
    relRoot: ".",
    accents,
    content: `<h1>Component registry</h1>
<p>Every row is generated from the component's own contract (<code>meta.ts</code> + <code>contract.json</code>).</p>
<table>
  <thead>
    <tr><th scope="col">Component</th><th scope="col">Status</th><th scope="col">Variants</th><th scope="col">A11y</th><th scope="col">Description</th></tr>
  </thead>
  <tbody>
${rows}
  </tbody>
</table>`,
  });
}

export function componentPage(c: ComponentDoc, accents: string[]): string {
  const examples = c.meta.examples
    .map(
      (e, i) => `  <figure class="demo">
    <figcaption>${esc(e.label)}</figcaption>
    <div class="demo-stage">${c.renderedExamples[i]}</div>
  </figure>`,
    )
    .join("\n");
  const firstExample = c.renderedExamples[0] ?? "";
  const accentTiles = accents
    .map(
      (a) => `    <div class="accent-tile" data-accent="${esc(a)}">
      <span class="accent-name">${esc(a)}</span>
      ${firstExample}
    </div>`,
    )
    .join("\n");
  const propsRows = Object.entries(c.contract.props ?? {})
    .map(
      ([name, p]) => `      <tr>
        <th scope="row"><code>${esc(name)}</code></th>
        <td><code>${esc(p.type)}</code></td>
        <td>${p.default !== undefined ? `<code>${esc(p.default)}</code>` : "—"}</td>
        <td>${p.optional ? "yes" : "no"}</td>
        <td>${p.note ? esc(p.note) : ""}</td>
      </tr>`,
    )
    .join("\n");
  const a = c.contract.a11y;
  const a11yItems = (
    [
      ["Semantic structure", a.semanticStructure],
      ["Keyboard", a.keyboard],
      ["Decisions", a.decisions],
      ["Notes", a.notes],
    ] as const
  )
    .filter(([, v]) => v)
    .map(([k, v]) => `    <div><dt>${k}</dt><dd>${esc(v)}</dd></div>`)
    .join("\n");
  return layout({
    title: `${c.meta.name} — LearningLeagues Lib`,
    relRoot: "..",
    accents,
    content: `<nav aria-label="Breadcrumb"><a href="../index.html">Registry</a> / ${esc(c.meta.name)}</nav>
<h1>${esc(c.meta.name)} <span class="badge badge--${esc(c.contract.status)}">${esc(c.contract.status)}</span></h1>
<p>${esc(c.meta.description)}</p>
${c.meta.notes ? `<p class="notes">${esc(c.meta.notes)}</p>` : ""}
<p class="meta-links">${c.contract.rfc ? `RFC: <code>${esc(c.contract.rfc)}</code>` : ""}${c.contract.designNode ? ` · Figma node: <code>${esc(c.contract.designNode)}</code>` : ""}</p>
<h2>Examples</h2>
<div class="demos">
${examples}
</div>
<h2>The ${accents.length} accents</h2>
<p>Each tile scopes the accent axis with <code>data-accent</code> on the tile itself — the element-scoped theme contract.</p>
<div class="accent-grid">
${accentTiles}
</div>
<h2>States</h2>
<p>Hover and focus-visible are CSS states, never props (RFC §3). Hover the examples above, or Tab to them to see the 2px accent focus ring.</p>
<h2>Props</h2>
<table>
  <thead>
    <tr><th scope="col">Prop</th><th scope="col">Type</th><th scope="col">Default</th><th scope="col">Optional</th><th scope="col">Note</th></tr>
  </thead>
  <tbody>
${propsRows}
  </tbody>
</table>
<h2>Accessibility <span class="badge badge--${esc(a.status)}">${esc(a.status)}</span></h2>
<dl class="a11y">
${a11yItems}
</dl>`,
  });
}
```

- [ ] **Step 2: Commit** — `feat(docs): page templates — layout, registry, component page`.

### Task 10: The generator — `scripts/generate-docs.ts` + all same-commit wiring

**Files:**
- Create: `scripts/generate-docs.ts`
- Modify: `package.json` (script), `scripts/check-drift.ts:11-14` (GENERATORS), `scripts/check-token-lint.ts:17` (EXCLUDED), `.prettierignore`, `process/PLAYBOOK.md`

- [ ] **Step 1: Write the generator.** Deterministic (sorted discovery, no timestamps); loud validation (a blank page with green gates is a blueprint-documented failure); `--check` mirrors `transform.ts` and never writes:

```ts
// Docs-site generator (blueprint §9): builds docs/ from the component
// contracts. Content lives in meta.ts + contract.json and regenerates —
// never hand-add an entry to the generated pages.
// Emits: docs/index.html, docs/components/<slug>.html, docs/assets/lib.css.
// Usage: node scripts/generate-docs.ts [--check]
import { readFileSync, writeFileSync, mkdirSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { renderExamples, type Example } from "./lib/docs-render.ts";
import { indexPage, componentPage, type ComponentDoc } from "./lib/docs-html.ts";

const COMPONENTS_DIR = "packages/ui/src/components";
const TOKENS_JSON = "packages/ui/src/tokens/tokens.json";
const TOKENS_CSS = "packages/ui/src/tokens/tokens.css";
const OUT = "docs";

const errors: string[] = [];
const fail = (msg: string) => errors.push(msg);

// ── Discovery: every component folder carrying a contract, sorted ───────────
const slugs = readdirSync(COMPONENTS_DIR)
  .filter((n) => statSync(join(COMPONENTS_DIR, n)).isDirectory())
  .filter((n) => existsSync(join(COMPONENTS_DIR, n, "contract.json")))
  .sort();

// ── Accent axis names from tokens.json (never hand-listed) ──────────────────
const tokens: Record<string, { css: string }> = JSON.parse(readFileSync(TOKENS_JSON, "utf8")).tokens;
const accents = Object.keys(tokens)
  .filter((k) => k.startsWith("Primitives/accent/"))
  .map((k) => k.split("/").pop() as string);

const components: ComponentDoc[] = [];
for (const slug of slugs) {
  const dir = join(COMPONENTS_DIR, slug);
  const metaFile = readdirSync(dir).find((n) => n.endsWith(".meta.ts"));
  if (!metaFile) {
    fail(`${slug}: no *.meta.ts contract`);
    continue;
  }
  const { meta } = await import(pathToFileURL(resolve(dir, metaFile)).href);
  const contract = JSON.parse(readFileSync(join(dir, "contract.json"), "utf8"));
  // Loud completeness validation — the precursor of the blueprint §9.1 gate.
  if (typeof meta?.name !== "string" || !meta.name) fail(`${slug}: meta.name missing`);
  if (typeof meta?.description !== "string" || meta.description.startsWith("TODO"))
    fail(`${slug}: meta.description missing or TODO`);
  if (!Array.isArray(meta?.variants)) fail(`${slug}: meta.variants missing`);
  if (!Array.isArray(meta?.examples) || meta.examples.length === 0)
    fail(`${slug}: meta.examples must hold at least one example (blueprint §9.1)`);
  if (typeof contract?.status !== "string") fail(`${slug}: contract.status missing`);
  if (typeof contract?.a11y?.status !== "string") fail(`${slug}: contract.a11y.status missing`);
  if (errors.length) continue;
  const renderedExamples = renderExamples(dir, meta.name, meta.examples as Example[]);
  components.push({ slug, meta, contract, renderedExamples });
}
if (errors.length) {
  console.error("generate-docs: FAILED\n" + errors.map((e) => `  - ${e}`).join("\n"));
  process.exit(1);
}

// ── Outputs (all built in memory first — determinism, then --check or write) ─
const CSS_BANNER = `/* GENERATED by \`pnpm docs:build\` (scripts/generate-docs.ts): tokens.css +
 * every component stylesheet, concatenated so docs/ is self-contained.
 * Do not edit; the sources are the library stylesheets. */\n\n`;
const componentCss = components
  .flatMap((c) => readdirSync(join(COMPONENTS_DIR, c.slug)).filter((n) => n.endsWith(".css")).sort()
    .map((n) => readFileSync(join(COMPONENTS_DIR, c.slug, n), "utf8")))
  .join("\n");
const outputs: Record<string, string> = {
  [join(OUT, "assets", "lib.css")]: CSS_BANNER + readFileSync(TOKENS_CSS, "utf8") + "\n" + componentCss,
  [join(OUT, "index.html")]: indexPage(components, accents),
};
for (const c of components) outputs[join(OUT, "components", `${c.slug}.html`)] = componentPage(c, accents);

if (process.argv.includes("--check")) {
  const stale = Object.entries(outputs).filter(
    ([path, content]) => !existsSync(path) || readFileSync(path, "utf8") !== content,
  );
  if (stale.length) {
    console.error(
      `generate-docs --check: DRIFT — stale docs. Run: pnpm docs:build\n` +
        stale.map(([p]) => `  - ${p}`).join("\n"),
    );
    process.exit(1);
  }
  console.log("generate-docs --check: OK");
} else {
  for (const [path, content] of Object.entries(outputs)) {
    mkdirSync(join(path, ".."), { recursive: true });
    writeFileSync(path, content);
    console.log(`generate-docs: wrote ${path}`);
  }
}
```

- [ ] **Step 2: Same-commit wiring** (each is a doctrine obligation):
  - `package.json` scripts: `"docs:build": "node scripts/generate-docs.ts"`.
  - `scripts/check-drift.ts` GENERATORS gains: `{ name: "docs site (generate-docs)", args: ["scripts/generate-docs.ts", "--check"] },`.
  - `scripts/check-token-lint.ts` EXCLUDED becomes: `const EXCLUDED = [join("src", "tokens"), join("docs", "assets", "lib.css")];` (lib.css is the generated token copy — raw values are its job; `site.css` and the generated HTML stay scanned).
  - `.prettierignore` gains (generated bytes are owned by their generator — L03):

    ```
    docs/index.html
    docs/components/
    docs/assets/lib.css
    ```

  - `process/PLAYBOOK.md` gains a row: `| Regenerate the documentation site | \`pnpm docs:build\` | \`node scripts/generate-docs.ts --check\` exits 0 |` (satisfies the playbook gate: `generate-docs.ts` referenced via the alias).
- [ ] **Step 3: Run** `pnpm docs:build` — expected: three+ `wrote` lines. Then `pnpm docs:build` again and `git status` — no changes on the second run (determinism).
- [ ] **Step 4: Commit** (generator + wiring + generated output, same commit) — `feat(docs): site generator — contracts in, static pages out`.

### Task 11: The hand-written shell — `site.css` + `site.js`

**Files:**
- Create: `docs/assets/site.css`, `docs/assets/site.js`

- [ ] **Step 1: `site.css`.** Colors ONLY via `--ll-*` tokens (token lint scans this file). Font sizes are restated px values — the type/* text styles have no extracted variables yet (same treatment as button.css; the text-style extraction mission will retire both). The site owns its reset (the library ships none):

```css
/* Docs-site chrome — hand-written SHELL (blueprint §2.3): renders generated
   data, never holds an entry of it. Colors are tokens only. Font sizes are
   restated until the text-style extraction stage exists (cf. button.css). */

*,
*::before,
*::after {
  box-sizing: border-box;
}
body {
  margin: 0;
  background: var(--ll-bg);
  color: var(--ll-fg);
  font-family: var(--ll-font-body);
  font-size: 16px;
  line-height: 1.6;
}
code {
  font-family: var(--ll-font-mono);
  font-size: 13px;
  color: var(--ll-fg-dim);
}

.skip-link {
  position: absolute;
  left: -9999px;
  top: 0;
  z-index: var(--ll-z-overlay);
  background: var(--ll-accent);
  color: var(--ll-bg);
  padding: var(--ll-s-1) var(--ll-s-2);
  font-family: var(--ll-font-mono);
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.14em;
}
.skip-link:focus {
  left: 0;
}

.site-header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--ll-s-2);
  padding: var(--ll-s-2) var(--ll-s-4);
  border-bottom: 1px solid var(--ll-rule);
}
.site-title {
  font-family: var(--ll-font-display);
  font-size: 20px;
  color: var(--ll-fg);
  text-decoration: none;
}
.switchers {
  display: flex;
  gap: var(--ll-s-3);
}
.switcher {
  display: flex;
  gap: var(--ll-s-05);
  align-items: center;
  border: 1px solid var(--ll-border-soft);
  padding: var(--ll-s-05) var(--ll-s-1);
  margin: 0;
}
.switcher legend {
  font-family: var(--ll-font-mono);
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  color: var(--ll-fg-mute);
  padding: 0 var(--ll-s-05);
}
.switcher button {
  background: transparent;
  border: 1px solid transparent;
  color: var(--ll-fg-dim);
  font-family: var(--ll-font-mono);
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  padding: var(--ll-s-05) var(--ll-s-1);
  cursor: pointer;
}
.switcher button[aria-pressed="true"] {
  border-color: var(--ll-accent);
  color: var(--ll-accent);
}
.switcher button:focus-visible {
  outline: 2px solid var(--ll-accent);
  outline-offset: 2px;
}

main {
  max-width: 960px;
  margin: 0 auto;
  padding: var(--ll-s-5) var(--ll-s-4) var(--ll-s-8);
}
h1 {
  font-family: var(--ll-font-display);
  font-size: 34px;
  font-weight: 500;
  margin: 0 0 var(--ll-s-2);
}
h2 {
  font-family: var(--ll-font-display);
  font-size: 24px;
  font-weight: 500;
  margin: var(--ll-s-6) 0 var(--ll-s-2);
  padding-top: var(--ll-s-3);
  border-top: 1px solid var(--ll-rule);
}
.notes,
.meta-links {
  color: var(--ll-fg-dim);
  font-size: 14px;
}

table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}
th,
td {
  text-align: left;
  padding: var(--ll-s-1) var(--ll-s-2);
  border-bottom: 1px solid var(--ll-border-soft);
  vertical-align: top;
}
thead th {
  font-family: var(--ll-font-mono);
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  color: var(--ll-fg-mute);
  border-bottom: 1px solid var(--ll-border);
}
tbody th {
  font-weight: 600;
}
a {
  color: var(--ll-accent);
}

.badge {
  display: inline-block;
  font-family: var(--ll-font-mono);
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  padding: 0 var(--ll-s-1);
  border: 1px solid var(--ll-border);
  color: var(--ll-fg-dim);
  vertical-align: middle;
}
.badge--pass {
  border-color: var(--ll-success);
  color: var(--ll-success);
}
.badge--fail {
  border-color: var(--ll-danger);
  color: var(--ll-danger);
}

.demos {
  display: flex;
  flex-wrap: wrap;
  gap: var(--ll-s-3);
}
.demo {
  margin: 0;
  flex: 1 1 240px;
  border: 1px solid var(--ll-border-soft);
}
.demo figcaption {
  font-family: var(--ll-font-mono);
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  color: var(--ll-fg-mute);
  padding: var(--ll-s-1) var(--ll-s-2);
  border-bottom: 1px solid var(--ll-border-soft);
}
.demo-stage,
.accent-tile {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--ll-s-4);
  background: var(--ll-surface);
}
.accent-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: var(--ll-s-3);
}
.accent-tile {
  position: relative;
  border: 1px solid var(--ll-border-soft);
  padding-top: var(--ll-s-6);
}
.accent-name {
  position: absolute;
  top: var(--ll-s-1);
  left: var(--ll-s-2);
  font-family: var(--ll-font-mono);
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  color: var(--ll-fg-mute);
}

.a11y div {
  margin-bottom: var(--ll-s-2);
}
.a11y dt {
  font-family: var(--ll-font-mono);
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  color: var(--ll-fg-mute);
}
.a11y dd {
  margin: var(--ll-s-05) 0 0;
}

.site-footer {
  border-top: 1px solid var(--ll-rule);
  padding: var(--ll-s-2) var(--ll-s-4);
  color: var(--ll-fg-mute);
  font-size: 13px;
}
```

- [ ] **Step 2: `site.js`** — wires the switchers to the root attributes (the host-application gesture); persists per-viewer choice, tolerating blocked storage:

```js
// Docs-site switchers — hand-written SHELL. Sets the theme-axis attributes on
// the root element, exactly as a consuming product would (AGENTS.md, token
// rules). Persistence is a viewer convenience, never library state.
(function () {
  var root = document.documentElement;
  function restore(axis) {
    try {
      var v = localStorage.getItem("ll-docs-" + axis);
      if (v) root.setAttribute("data-" + axis, v);
    } catch (e) {
      /* storage blocked: defaults stand */
    }
  }
  function wire(axis) {
    var buttons = document.querySelectorAll("[data-set-" + axis + "]");
    function sync() {
      var current = root.getAttribute("data-" + axis);
      buttons.forEach(function (b) {
        b.setAttribute("aria-pressed", String(b.getAttribute("data-set-" + axis) === current));
      });
    }
    buttons.forEach(function (b) {
      b.addEventListener("click", function () {
        var v = b.getAttribute("data-set-" + axis);
        root.setAttribute("data-" + axis, v);
        try {
          localStorage.setItem("ll-docs-" + axis, v);
        } catch (e) {
          /* storage blocked: still works for this page */
        }
        sync();
      });
    });
    sync();
  }
  restore("accent");
  restore("density");
  wire("accent");
  wire("density");
})();
```

- [ ] **Step 3: Verify** `pnpm gate:lint-tokens` — PASS with `docs/assets/site.css` in the scanned count and zero violations.
- [ ] **Step 4: Commit** — `feat(docs): site shell — chrome css + axis switchers`.

### Task 12: Full verification, proofs, visual checkpoint, PR

- [ ] **Step 1:** `pnpm format && pnpm conformity` — expected PASS on all gates (format now covers the new scripts; drift includes generate-docs).
- [ ] **Step 2: Re-prove the changed gates** (ORCHESTRATION), each injection verified landed before trusting the verdict (L04), then reverted and re-verified green:
  1. **Drift / stale docs:** edit one word of `Button.meta.ts` description → `pnpm tokens:check` (runs `check-drift.ts`) exits 1 naming "docs site (generate-docs)"; revert (`git checkout -- packages/ui/src/components/button/Button.meta.ts` — tracked file, restore is legitimate), re-run, exit 0. Note: `--check` also catches the missing-`docs/` case (fresh clone) via `existsSync`.
  2. **Generator completeness red:** temporarily set `examples: []` in `Button.meta.ts` → `pnpm docs:build` exits 1 with `meta.examples must hold at least one example`; revert, exit 0.
  3. **Token lint docs surface:** append `.tmp-proof { color: #ff0000; }` to `docs/assets/site.css`, verify with grep → `pnpm gate:lint-tokens` exits 1 at that line; remove, exit 0. Also confirm the report's scanned-file count shows `lib.css` is NOT scanned.
- [ ] **Step 3:** Add the three rows to `process/PROOF-OF-BLOCKING.md` (Generated-artefact drift / docs; Docs generator — contract completeness; Token lint — docs shell surface) and commit with the proof updates: `docs(proof): docs-site gate proofs`.
- [ ] **Step 4: Visual checkpoint (human lock).** Serve `docs/` locally and hand the URL to Louis — he validates the rendering, and decides whether new Figma mockups are needed. Do not self-declare this passed.
- [ ] **Step 5:** Update the button registry row's PR number, commit `docs(manifest): record docs-site PR number` — then `pnpm conformity`, quote the verdict, `git push`, and `gh pr create` (base: `feat/scoped-theme-axes` until PR 1 merges, then retarget `main`), body per the five-section template, including the dependency bump-policy flag and the three-block session report.

---

## Deferred (recorded so nothing improvises them)

- **Tokens/foundations page** — the agreed next mission, not this plan.
- **Scaffold-vs-docs interaction** — a freshly scaffolded component (no examples, TODO description) turns the drift gate red via `generate-docs --check`. That is consistent with "the scaffold is intentionally red", but it blocks docs regeneration for every other component while it exists. Flag for arbitration when the second component is scaffolded: all-or-nothing (current) vs skip-with-visible-warning.
- **Structural a11y gate for the site** (skip link, landmarks, scopes, titles) — structure is implemented; the executable gate is planned, not invented ahead of its milestone.
- **Interactive component states in SSR** — `renderToStaticMarkup` shows default state; fine until a component has scripted open/close states.

## Self-review notes (performed at write time)

Spec coverage: two PRs ✓, scoped axes incl. density ✓, generator + `--check` + determinism ✓, `examples` contract field ✓, self-contained `docs/` via `lib.css` ✓, prettier exemptions ✓, token-lint surface ✓, GENERATORS/PLAYBOOK/PROOF wiring ✓, structural a11y ✓, English ✓, visual checkpoint ✓, ownership claim ✓. Type consistency: `ComponentDoc`, `Example`, `renderExamples(dir, exportName, examples)` used identically in Tasks 8-10. No placeholders remain.
