# Docs-Site Accessibility Gate Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the executable docs-site structural accessibility gate (blueprint §9.2) — axe page-level rules plus four explicit structural checks over every generated page — and fix the sidebar `nested-interactive` defect it reveals.

**Architecture:** `scripts/lib/a11y-dom.ts` gains a page mode for `runAxe`; `scripts/lib/docs-a11y-checks.ts` holds the pure structural checks (locked in gate 10); `scripts/check-docs-a11y.ts` loads each `docs/**/*.html` into jsdom as shipped, runs both, writes `reports/docs-a11y.md`, exits 1 on any violation/finding. The sidebar template in `scripts/lib/docs-html.ts` and `docs/assets/site.css` change first so the gate lands green (option A: link + separate named `<summary>` chevron).

**Tech Stack:** Node 24 native `.ts`, jsdom 30.0.1, axe-core 4.13.0 (both already installed), `node:test`.

**Design record:** `process/archives/2026-09-10-docs-a11y-gate-design.md`. Branch: `feat/docs-a11y-gate`.

**Binding rules** (`AGENTS.md`, `ORCHESTRATION.md`): `git branch --show-current` before every commit (`feat/docs-a11y-gate`); English; `pnpm format` before committing hand-written files; generated files (`docs/**`, `dist/**`, tokens) are only ever regenerated (`pnpm docs:build`) and committed with their source in the same commit; a new gate ships with its `GATES` entry, PLAYBOOK row and PROOF rows (Tasks 4 + 5, same PR, squash-merged); injections verified before the verdict (L04), restores via `git checkout --` only on tracked files with no other uncommitted work (L08); commits end with `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`. A visual change to the site needs Louis's checkpoint before the PR (human lock) — Task 1 ends with that checkpoint.

---

## File structure

| File | Responsibility |
| --- | --- |
| `scripts/lib/docs-html.ts` (modify, `sidebar()`) | Sidebar entries: link + `<details><summary aria-label>` chevron + sub-list. |
| `docs/assets/site.css` (modify) | Chevron summary rules replacing `.sidebar summary a`. Hand-written shell. |
| `docs/**` (regenerate) | `pnpm docs:build` output, committed with Task 1. |
| `scripts/lib/a11y-dom.ts` (modify) | `runAxe(window, opts?)` with `{ page?: boolean }`. |
| `scripts/lib/a11y-dom.test.ts` (modify) | Page-mode test. |
| `scripts/lib/docs-a11y-checks.ts` (create) | Pure structural checks: `checkSkipLinkFirst`, `checkLandmarks`, `checkTableScopes`, `checkPageTitle`, `checkPage`; `titleSubject`. |
| `scripts/lib/docs-a11y-checks.test.ts` (create) | Their suite (gate 10). |
| `scripts/check-detectors.ts` (modify) | Add the suite. |
| `scripts/check-docs-a11y.ts` (create) | The gate. |
| `scripts/check-conformity.ts`, `package.json`, `process/PLAYBOOK.md` (modify) | Wiring. |
| `process/PROOF-OF-BLOCKING.md`, `README.md` (modify) | Proof rows; 9 → 10 gates. |

---

### Task 1: Sidebar fix (option A) + regenerated site + visual checkpoint

**Files:** modify `scripts/lib/docs-html.ts`, `docs/assets/site.css`; regenerate `docs/`.

- [ ] **Step 1: Template.** In `scripts/lib/docs-html.ts` `sidebar()`, replace both `<details>` blocks (Tokens and each component) with the option-A shape. Component entry:

```ts
      return `    <li class="nav-item">
      <a href="${href}"${isCurrent ? ' aria-current="page"' : ""}>${esc(c.meta.name)}</a>
      <details${isCurrent ? " open" : ""}>
        <summary aria-label="${esc(c.meta.name)} sections"></summary>
        <ul class="sub">
${sub}
        </ul>
      </details>
    </li>`;
```

Tokens entry:

```ts
    <li class="nav-item">
      <a href="${tokensHref}"${tokensCurrent ? ' aria-current="page"' : ""}>Tokens</a>
      <details${tokensCurrent ? " open" : ""}>
        <summary aria-label="Tokens sections"></summary>
        <ul class="sub">
${tokensSub}
        </ul>
      </details>
    </li>
```

- [ ] **Step 2: CSS.** In `docs/assets/site.css` replace the `.sidebar summary { … }` and `.sidebar summary a { … }` rules with:

```css
/* Sidebar entry: the name is a plain link; a separate, named <summary>
   chevron toggles the sections (WCAG nested-interactive, fixed 2026-09-10).
   The summary sits on the link's row by absolute positioning; the section
   list still flows below the link. */
.nav-item {
  position: relative;
}
.nav-item > a {
  padding-right: var(--ll-s-3);
}
.nav-item > details > summary {
  position: absolute;
  top: 0;
  right: 0;
  width: var(--ll-s-3);
  height: var(--ll-s-3);
  display: flex;
  align-items: center;
  justify-content: center;
  list-style: none;
  cursor: pointer;
  color: var(--ll-fg-mute);
}
.nav-item > details > summary::-webkit-details-marker {
  display: none;
}
.nav-item > details > summary::before {
  content: "";
  width: 6px;
  height: 6px;
  border-right: 1px solid currentColor;
  border-bottom: 1px solid currentColor;
  transform: rotate(-45deg);
  transition: transform 0.18s;
}
.nav-item > details[open] > summary::before {
  transform: rotate(45deg);
}
.nav-item > details > summary:hover,
.nav-item > details > summary:focus-visible {
  color: var(--ll-accent);
}
.nav-item > details > summary:focus-visible {
  outline: 2px solid var(--ll-accent);
  outline-offset: 2px;
}
```

(The `6px`/`1px` chevron geometry is fixed ornament geometry like the Button's brackets; check `.sidebar a` already sets `display: block` — if not, add it to `.nav-item > a`.) Run `pnpm gate:lint-tokens` after editing: the lint scans `docs/assets/site.css`; `6px`/`1px` outside bracket syntax are not flagged (documented detector limitation), colours must be tokens.

- [ ] **Step 3: Regenerate and check.**

```bash
pnpm docs:build
node scripts/generate-docs.ts --check
pnpm conformity
```

Expected: docs rewritten (index, tokens, button), `--check: OK`, `conformity: PASS (9 gates)`. Then grep: `grep -c "<summary><a" docs/index.html docs/tokens.html docs/components/button.html` → `0` each; `grep -c 'aria-label="Button sections"' docs/index.html` → `1`.

- [ ] **Step 4: Visual checkpoint (human lock).** Serve `docs/` locally (a one-file static server in the scratchpad, or `npx serve` is NOT available offline — write a 15-line `node:http` server in the scratchpad that maps `/` to `docs/index.html`) and show Louis the three pages: sidebar rows unchanged in look, chevron at the right of Tokens/Button, Tab order link → chevron, Enter on the chevron toggles. Wait for his go. Nothing commits before it.

- [ ] **Step 5: Commit** (after the go).

```bash
pnpm format && pnpm format:check
git branch --show-current
git add scripts/lib/docs-html.ts docs/assets/site.css docs/index.html docs/tokens.html docs/components/button.html docs/assets/lib.css
git commit -m "fix(docs): sidebar — name stays a link, a named summary chevron toggles the sections

Fixes the WCAG nested-interactive defect found by the docs a11y spike
(2026-09-10): the entry name was a link inside the <summary>. Option A per the
design record; visual checkpoint validated by Louis in session.

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

(`lib.css` only if `docs:build` rewrote it; check `git status --short`.)

---

### Task 2: `runAxe` page mode

**Files:** modify `scripts/lib/a11y-dom.ts`, `scripts/lib/a11y-dom.test.ts`.

- [ ] **Step 1: Failing test** — append to `a11y-dom.test.ts`:

```ts
test("page mode: page-level rules stay on and best-practice joins the tags", async () => {
  // A bare fragment audited AS A PAGE must fail `region` (content outside landmarks).
  const window = createWindow({ html: `<button type="button">Go</button>`, css: "", accent: "ambre" });
  const r = await runAxe(window, { page: true });
  window.close();
  assert.ok(r.violations.some((v) => v.id === "region"), "region should fire in page mode");
});

test("fragment mode is the default: the same fragment stays green", async () => {
  const window = createWindow({ html: `<button type="button">Go</button>`, css: "", accent: "ambre" });
  const r = await runAxe(window);
  window.close();
  assert.deepEqual(r.violations, []);
});
```

- [ ] **Step 2: Run** `node --test scripts/lib/a11y-dom.test.ts` → the page-mode test fails (`runAxe` ignores the option).

- [ ] **Step 3: Implement** in `a11y-dom.ts`:

```ts
export interface RunAxeOptions {
  // Page mode (docs gate): the audited unit IS a page, so the page-level
  // rules stay on and the best-practice tag joins the WCAG tags.
  page?: boolean;
}

export async function runAxe(window: Window, opts: RunAxeOptions = {}): Promise<AxeOutcome> {
  if (!("axe" in window)) window.eval(axe.source);
  const inWindow = (window as unknown as { axe: typeof axe }).axe;
  const result = await inWindow.run(window.document, {
    runOnly: { type: "tag", values: opts.page ? [...WCAG_TAGS, "best-practice"] : WCAG_TAGS },
    rules: opts.page
      ? {}
      : Object.fromEntries(FRAGMENT_DISABLED_RULES.map((id) => [id, { enabled: false }])),
  });
  …unchanged…
}
```

Keep the existing header comment accurate (mention the two modes).

- [ ] **Step 4: Run** → 9 pass. `pnpm gate:a11y-engine` still `PASS (1 component(s), 15 render(s), 1 warning(s))`.

- [ ] **Step 5: Commit**

```bash
pnpm format && pnpm format:check
git branch --show-current
git add scripts/lib/a11y-dom.ts scripts/lib/a11y-dom.test.ts
git commit -m "feat(a11y): runAxe page mode — page-level rules on, best-practice tag joined

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 3: Structural checks (pure) + gate-10 wiring

**Files:** create `scripts/lib/docs-a11y-checks.ts`, `scripts/lib/docs-a11y-checks.test.ts`; modify `scripts/check-detectors.ts`.

- [ ] **Step 1: Failing tests** — create `scripts/lib/docs-a11y-checks.test.ts`:

```ts
// Unit suite for the docs-site structural checks (blueprint §9.2), run inside
// gate 10. Every case is a behaviour the docs gate relies on.
// Run: node --test scripts/lib/docs-a11y-checks.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";
import { checkPage, titleSubject } from "./docs-a11y-checks.ts";

const SITE = "LearningLeagues Lib";
const page = (body: string, head = `<title>Button — ${SITE}</title>`) =>
  new JSDOM(`<!doctype html><html lang="en"><head>${head}</head><body>${body}</body></html>`).window.document;
const GOOD = `<a class="skip-link" href="#main">Skip to content</a>
<header><a class="site-title" href="./index.html">${SITE}</a></header>
<nav aria-label="Documentation"><a href="./index.html">Registry</a></nav>
<main id="main"><h1>Button</h1>
<table><tr><th scope="col">Prop</th><th scope="col">Type</th></tr><tr><th scope="row">variant</th><td>string</td></tr></table>
</main><footer>f</footer>`;
const rules = (body: string, head?: string) => checkPage(page(body, head)).map((f) => f.rule);

test("a well-formed page has no findings", () => assert.deepEqual(rules(GOOD), []));

test("skip-link-first: the first focusable must be the skip link", () => {
  assert.ok(rules(`<a href="./x.html">Elsewhere</a>` + GOOD).includes("skip-link-first"));
});
test("skip-link-first: a skip link whose target is missing is red", () => {
  assert.ok(rules(GOOD.replace('href="#main"', 'href="#nowhere"')).includes("skip-link-first"));
});
test("skip-link-first: a skip link targeting something other than <main> is red", () => {
  assert.ok(rules(GOOD.replace('<nav aria-label="Documentation">', '<nav id="nav" aria-label="Documentation">').replace('href="#main"', 'href="#nav"')).includes("skip-link-first"));
});
test("landmarks: two <main> elements are red", () => {
  assert.ok(rules(GOOD + `<main>again</main>`).includes("landmarks"));
});
test("landmarks: a <nav> without an accessible name is red", () => {
  assert.ok(rules(GOOD.replace(' aria-label="Documentation"', "")).includes("landmarks"));
});
test("landmarks: aria-labelledby counts as a name", () => {
  const body = GOOD.replace(' aria-label="Documentation"', ' aria-labelledby="navh"').replace("<nav", '<p id="navh">Docs</p><nav');
  assert.ok(!rules(body).includes("landmarks"));
});
test("landmarks: missing <header> is red", () => {
  assert.ok(rules(GOOD.replace(/<header>.*?<\/header>/, "")).includes("landmarks"));
});
test("table-scopes: a <th> without scope is red", () => {
  assert.ok(rules(GOOD.replace('<th scope="col">Prop</th>', "<th>Prop</th>")).includes("table-scopes"));
});
test("table-scopes: a table without any <th> is red", () => {
  assert.ok(rules(GOOD + `<table><tr><td>a</td></tr></table>`).includes("table-scopes"));
});
test("page-title: an empty title is red", () => {
  assert.ok(rules(GOOD, "<title></title>").includes("page-title"));
});
test("page-title: a title that is only the site name is red", () => {
  assert.ok(rules(GOOD, `<title>${SITE}</title>`).includes("page-title"));
});
test("page-title: two <h1> are red; zero <h1> is red", () => {
  assert.ok(rules(GOOD.replace("<h1>Button</h1>", "<h1>A</h1><h1>B</h1>")).includes("page-title"));
  assert.ok(rules(GOOD.replace("<h1>Button</h1>", "")).includes("page-title"));
});
test("page-title: missing html lang is red", () => {
  const doc = new JSDOM(`<!doctype html><html><head><title>Button — ${SITE}</title></head><body>${GOOD}</body></html>`).window.document;
  assert.ok(checkPage(doc).map((f) => f.rule).includes("page-title"));
});
test("titleSubject strips the site suffix read from the page", () => {
  assert.equal(titleSubject(page(GOOD)), "Button");
  assert.equal(titleSubject(page(GOOD, `<title>${SITE}</title>`)), "");
});
test("never short-circuits: several defects report every rule", () => {
  const body = GOOD.replace('href="#main"', 'href="#nowhere"').replace('<th scope="col">Prop</th>', "<th>Prop</th>") + `<main>again</main>`;
  const r = rules(body);
  for (const rule of ["skip-link-first", "table-scopes", "landmarks"]) assert.ok(r.includes(rule), rule);
});
```

- [ ] **Step 2: Run** → cannot find module.

- [ ] **Step 3: Implement** `scripts/lib/docs-a11y-checks.ts`:

```ts
// Structural accessibility checks for the generated documentation site
// (blueprint §9.2): skip link first, landmarks, table header scopes, a
// descriptive title. Pure functions over a Document — no I/O — so gate 10
// locks them. They cover the two page rules axe leaves *incomplete* without
// layout (landmark-one-main, page-has-heading-one) and the three requirements
// axe does not express at all (skip link FIRST, scope on every th, a
// page-specific title). Types are the DOM's; Node strips them.

export interface Finding {
  rule: string;
  message: string;
  html: string;
}

const FOCUSABLE =
  'a[href], button, input:not([type=hidden]), select, textarea, summary, [tabindex]:not([tabindex="-1"])';
const outer = (el: Element | null): string => (el ? el.outerHTML.slice(0, 120) : "");
const SITE_SUFFIX_SEP = " — ";

// The page-specific part of <title>: everything before " — <site title>",
// the site title being read from the page's own `.site-title` link (never
// hand-listed). A title equal to the site name has no subject.
export function titleSubject(doc: Document): string {
  const title = (doc.querySelector("title")?.textContent ?? "").trim();
  const site = (doc.querySelector(".site-title")?.textContent ?? "").trim();
  if (site && title.endsWith(site)) {
    const head = title.slice(0, title.length - site.length);
    return head.endsWith(SITE_SUFFIX_SEP) ? head.slice(0, -SITE_SUFFIX_SEP.length).trim() : head.trim();
  }
  return title;
}

export function checkSkipLinkFirst(doc: Document): Finding[] {
  const first = doc.querySelector(FOCUSABLE);
  const href = first?.getAttribute("href") ?? "";
  if (!first || first.tagName !== "A" || !href.startsWith("#"))
    return [{ rule: "skip-link-first", message: "the first focusable element is not a same-page skip link", html: outer(first) }];
  const target = doc.getElementById(decodeURIComponent(href.slice(1)));
  if (!target)
    return [{ rule: "skip-link-first", message: `skip link target "${href}" does not exist`, html: outer(first) }];
  if (target.tagName !== "MAIN")
    return [{ rule: "skip-link-first", message: `skip link targets <${target.tagName.toLowerCase()}>, not <main>`, html: outer(first) }];
  return [];
}

export function checkLandmarks(doc: Document): Finding[] {
  const out: Finding[] = [];
  const mains = doc.querySelectorAll("main");
  if (mains.length !== 1)
    out.push({ rule: "landmarks", message: `expected exactly one <main>, found ${mains.length}`, html: outer(mains[1] ?? null) });
  if (!doc.querySelector("header")) out.push({ rule: "landmarks", message: "no <header> landmark", html: "" });
  const navs = [...doc.querySelectorAll("nav")];
  if (navs.length === 0) out.push({ rule: "landmarks", message: "no <nav> landmark", html: "" });
  for (const nav of navs)
    if (!nav.getAttribute("aria-label")?.trim() && !nav.getAttribute("aria-labelledby")?.trim())
      out.push({ rule: "landmarks", message: "<nav> without an accessible name (aria-label / aria-labelledby)", html: outer(nav) });
  return out;
}

const SCOPES = new Set(["col", "row", "colgroup", "rowgroup"]);
export function checkTableScopes(doc: Document): Finding[] {
  const out: Finding[] = [];
  for (const table of doc.querySelectorAll("table")) {
    const ths = [...table.querySelectorAll("th")];
    if (ths.length === 0) out.push({ rule: "table-scopes", message: "table without any <th>", html: outer(table) });
    for (const th of ths)
      if (!SCOPES.has(th.getAttribute("scope") ?? ""))
        out.push({ rule: "table-scopes", message: "<th> without a valid scope (col/row/colgroup/rowgroup)", html: outer(th) });
  }
  return out;
}

export function checkPageTitle(doc: Document): Finding[] {
  const out: Finding[] = [];
  const title = (doc.querySelector("title")?.textContent ?? "").trim();
  if (!title) out.push({ rule: "page-title", message: "empty <title>", html: "" });
  else if (!titleSubject(doc))
    out.push({ rule: "page-title", message: `<title> "${title}" carries no page-specific part before the site name`, html: "" });
  const h1s = doc.querySelectorAll("h1");
  if (h1s.length !== 1)
    out.push({ rule: "page-title", message: `expected exactly one <h1>, found ${h1s.length}`, html: outer(h1s[1] ?? h1s[0] ?? null) });
  if (!doc.documentElement.getAttribute("lang")?.trim())
    out.push({ rule: "page-title", message: "<html> has no lang attribute", html: "" });
  return out;
}

// Every check on the page — never short-circuits.
export function checkPage(doc: Document): Finding[] {
  return [...checkSkipLinkFirst(doc), ...checkLandmarks(doc), ...checkTableScopes(doc), ...checkPageTitle(doc)];
}
```

- [ ] **Step 4: Run** `node --test scripts/lib/docs-a11y-checks.test.ts` → 16 pass. If `summary` in `FOCUSABLE` makes jsdom pick a `<summary>` before the skip link in the real site: it cannot — the skip link is the first element in `<body>`.

- [ ] **Step 5: Wire gate 10** — add `"scripts/lib/docs-a11y-checks.test.ts", // docs a11y — structural checks` to `SUITES` in `scripts/check-detectors.ts`. `pnpm gate:detectors` → `tests 60, pass 60, fail 0` (42 + 2 from Task 2 + 16).

- [ ] **Step 6: Commit**

```bash
pnpm format && pnpm format:check
git branch --show-current
git add scripts/lib/docs-a11y-checks.ts scripts/lib/docs-a11y-checks.test.ts scripts/check-detectors.ts
git commit -m "feat(docs-a11y): structural page checks, locked by the detector suite

Skip link first (target exists and is <main>), exactly one <main>, <header>
and named <nav>, scope on every <th>, a descriptive title (page-specific part
before the site name, one <h1>, html lang). Pure, in gate 10.

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 4: The gate + wiring

**Files:** create `scripts/check-docs-a11y.ts`; modify `scripts/check-conformity.ts`, `package.json`, `process/PLAYBOOK.md`.

- [ ] **Step 1: Write the gate**

```ts
// Docs-site accessibility gate (blueprint §9.2): every generated page, as
// shipped (no script executed — the no-JS baseline), audited by axe-core in
// page mode (page-level rules ON, WCAG 2.1 AA + best-practice) plus the four
// structural requirements as explicit checks (lib/docs-a11y-checks.ts). Any
// violation or finding is red; axe incompletes are visible warnings; titles
// must be unique across pages. No allowlist. Report: reports/docs-a11y.md.
// Usage: node scripts/check-docs-a11y.ts  (pnpm gate:docs-a11y)
import { readdirSync, statSync, existsSync, writeFileSync, mkdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { JSDOM, VirtualConsole } from "jsdom";
import { runAxe } from "./lib/a11y-dom.ts";
import { checkPage, titleSubject } from "./lib/docs-a11y-checks.ts";

const DOCS = "docs";
const REPORT = "reports/docs-a11y.md";

function htmlFiles(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir).sort()) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...htmlFiles(p));
    else if (name.endsWith(".html")) out.push(p);
  }
  return out;
}

const failures: string[] = [];
const warnings: string[] = [];
const rows: string[] = [];
const incompleteById = new Map<string, Set<string>>();
const titles = new Map<string, string[]>(); // title → pages

const pages = existsSync(DOCS) ? htmlFiles(DOCS) : [];
if (pages.length === 0) failures.push(`no page under ${DOCS}/ — the site always has at least the registry`);

for (const page of pages) {
  const problems: string[] = [];
  let axeViolations = 0;
  let findings = 0;
  try {
    const dom = await JSDOM.fromFile(resolve(page), {
      runScripts: "outside-only",
      virtualConsole: new VirtualConsole(),
    });
    const { window } = dom;
    try {
      const axe = await runAxe(window, { page: true });
      if (axe.passes === 0) problems.push("axe ran zero rules — engine misconfigured");
      axeViolations = axe.violations.length;
      for (const v of axe.violations)
        problems.push(
          `axe ${v.id} (${v.impact}) — ${v.help} — \`${v.nodes[0] ?? ""}\`${v.nodes.length > 1 ? ` (+${v.nodes.length - 1} more node(s))` : ""}`,
        );
      for (const inc of axe.incomplete) {
        if (!incompleteById.has(inc.id)) incompleteById.set(inc.id, new Set());
        incompleteById.get(inc.id)!.add(page);
      }
      const f = checkPage(window.document);
      findings = f.length;
      for (const x of f) problems.push(`${x.rule} — ${x.message}${x.html ? ` — \`${x.html}\`` : ""}`);
      const title = (window.document.querySelector("title")?.textContent ?? "").trim();
      const subject = titleSubject(window.document) || title;
      if (!titles.has(subject)) titles.set(subject, []);
      titles.get(subject)!.push(page);
    } finally {
      window.close();
    }
  } catch (e) {
    problems.push(`load/engine failed: ${(e as Error).message}`);
  }
  rows.push(`| ${page.replace(/\\/g, "/")} | ${axeViolations} | ${findings} | ${problems.length ? "**FAIL**" : "PASS"} |`);
  failures.push(...problems.map((p) => `${page.replace(/\\/g, "/")}: ${p}`));
}

for (const [subject, where] of titles)
  if (where.length > 1)
    failures.push(`unique-title — "${subject}" is the title subject of ${where.length} pages: ${where.map((p) => p.replace(/\\/g, "/")).join(", ")}`);

for (const [id, where] of incompleteById)
  warnings.push(
    `axe "${id}" came back incomplete for ${where.size} page(s) — axe cannot decide it without layout` +
      (id === "color-contrast"
        ? " (contrast is proved by the contrast gate from resolved tokens)"
        : id === "landmark-one-main" || id === "page-has-heading-one"
          ? " (covered by the structural checks)"
          : " — read the rule and decide"),
  );

mkdirSync("reports", { recursive: true });
const verdict = failures.length === 0 ? "PASS" : "FAIL";
writeFileSync(
  REPORT,
  `# check-docs-a11y — ${verdict}\n\n${pages.length} page(s) under ${DOCS}/; axe page mode (WCAG 2.1 AA + best-practice, page-level rules on) + structural checks.\n` +
    (pages.length
      ? `\n| Page | axe violations | Structural findings | Verdict |\n| --- | --- | --- | --- |\n${rows.join("\n")}\n`
      : "") +
    (warnings.length ? `\n## Warnings (axe incomplete — visible, never silent)\n\n${warnings.map((w) => `- ${w}`).join("\n")}\n` : "") +
    (failures.length ? `\n## Failures\n\n${failures.map((f) => `- ${f}`).join("\n")}\n` : ""),
);
if (failures.length) {
  console.error(`check-docs-a11y: FAIL (${failures.length}) — see ${REPORT}\n` + failures.map((f) => `  - ${f}`).join("\n"));
  process.exit(1);
}
console.log(`check-docs-a11y: PASS (${pages.length} page(s), ${warnings.length} warning(s)) — see ${REPORT}`);
```

- [ ] **Step 2: Run** `node scripts/check-docs-a11y.ts` → `check-docs-a11y: PASS (3 page(s), 3 warning(s))` (color-contrast, landmark-one-main, page-has-heading-one incomplete). If `nested-interactive` is still red, Task 1 did not land — stop.

- [ ] **Step 3: Wiring.** `package.json`: `"gate:docs-a11y": "node scripts/check-docs-a11y.ts",` after `gate:a11y-engine`. `check-conformity.ts`: `{ name: "Docs accessibility", command: process.execPath, args: ["scripts/check-docs-a11y.ts"] }` after "Accessibility engine". PLAYBOOK row after the engine rows: `| Audit the docs site's accessibility (CI gate) | \`pnpm gate:docs-a11y\` (part of conformity) | exit 0 + \`reports/docs-a11y.md\` |`.

- [ ] **Step 4:** `pnpm format && pnpm format:check && pnpm conformity` → `PASS (10 gates)`; `reports/playbook-drift.md` lists `check-docs-a11y.ts`.

- [ ] **Step 5: Commit**

```bash
git branch --show-current
git add scripts/check-docs-a11y.ts scripts/check-conformity.ts package.json process/PLAYBOOK.md
git commit -m "feat(gates): docs-site accessibility — axe page mode + structural checks

Every generated page as shipped: axe with page-level rules on (WCAG 2.1 AA +
best-practice), skip link first, landmarks, table scopes, descriptive unique
titles. Violations and findings red, incompletes visible. Conformity: 10 gates.

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 5: Proofs and documents

**Files:** modify `process/PROOF-OF-BLOCKING.md`, `README.md`.

Injections go into `docs/index.html` (tracked; `git status --short` first; restore with `git checkout -- docs/index.html`). Verify each with the grep shown, run `pnpm gate:docs-a11y`, read, restore, green.

- [ ] **A — skip link removed**: delete the `<a class="skip-link" …>` line; `grep -c skip-link docs/index.html` → 0. Expect `skip-link-first` (first focusable is now the site-title link) and axe `bypass` (possibly incomplete instead — record what you see).
- [ ] **B — th scope removed**: change one `<th scope="col">Component</th>` to `<th>Component</th>`; grep `<th>Component` → 1. Expect `table-scopes` (+ axe `scope-attr-valid`/`th-has-data-cells` if they fire — record).
- [ ] **C — second main**: append `<main>again</main>` before `</body>`; grep `<main>again` → 1. Expect `landmarks` (+ axe `landmark-no-duplicate-main` / `landmark-one-main`).
- [ ] **D — duplicate title**: set `docs/tokens.html` `<title>` to `Component registry — LearningLeagues Lib`; grep. Expect `unique-title`. Restore `docs/tokens.html`.
- [ ] **E — nested interactive restored**: in `docs/index.html` replace one `<summary aria-label="Tokens sections"></summary>` by `<summary><a href="./tokens.html">Tokens</a></summary>`; grep `<summary><a` → 1. Expect axe `nested-interactive`.
- [ ] **F — aggregator**: with A applied, `pnpm conformity` → `FAIL  Docs accessibility` (+ `Generated-artefact drift` co-red, honest), listed in `reports/conformity.md`; restore → `PASS (10 gates)`.
- [ ] **Green evidence**: the real site — 3 pages PASS, warnings list the three incomplete ids.

- [ ] **Record**: rows `Docs a11y — skip link removed / th scope removed / duplicate main / duplicate title / nested interactive / aggregator / incomplete never silent`; a paragraph `Docs-a11y proofs: 2026-09-10 (gate landed), locally, Node 24.16.0 — axe-core 4.13.0 / jsdom 30.0.1.` under the a11y-engine proofs paragraph; a `Detector unit tests — docs-a11y suite` row (inject: `SCOPES` set in `docs-a11y-checks.ts` emptied → gate 10 red naming the test; restore → 60/60). `README.md`: "9 executable gates" → "10 executable gates".

- [ ] **Commit**

```bash
pnpm format && pnpm format:check && pnpm conformity
git branch --show-current
git status --short   # only the two documents
git add process/PROOF-OF-BLOCKING.md README.md
git commit -m "docs(proof): docs-site accessibility gate proved red/green; gate count 10

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 6: PR

- [ ] `git push -u origin feat/docs-a11y-gate`; `gh pr create --base main` with the five-section body (Summary: gate + sidebar fix validated visually by Louis; Changes; Verification: `conformity: PASS (10 gates)` executed; Flags: the three incomplete ids and what covers them, the sidebar visual change, no new dependency; Session report with autonomous decisions). CI green. Merge is Louis's.

---

## Self-review

- Spec coverage: design §2 (discovery, page mode, structural table, report, wiring) → Tasks 2–4; §3 sidebar → Task 1 with the human checkpoint; §4 proofs → Task 5; out-of-scope untouched.
- Placeholders: none.
- Type consistency: `runAxe(window, { page: true })` (Task 2) used in Task 4; `checkPage(doc)`, `titleSubject(doc)` (Task 3) used in Task 4 and its tests; `Finding` shape shared; gate-10 count 42 + 2 + 16 = 60.
