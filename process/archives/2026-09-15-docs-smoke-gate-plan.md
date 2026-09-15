# Docs-Site Real-Browser Smoke Gate Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship blueprint gate 17 — every generated docs page rendered by Playwright's pinned Chromium and checked for content present (no error, painted body, non-empty main/h1, non-blank demo stages and accent tiles, rendered active tab panel) — inside the required conformity job.

**Architecture:** `scripts/lib/docs-files.ts` holds the page discovery shared by both docs gates; `scripts/lib/docs-smoke.ts` holds the in-page fact collector (`collectFacts`, self-contained, evaluated in the browser) and the pure judgement (`judgePage`, locked by gate 10); `scripts/check-docs-smoke.ts` launches Chromium, visits every `docs/**/*.html` under `file://` in a fresh context, collects events + facts, judges, writes `reports/docs-smoke.md`, exits 1 on any finding. CI installs the pinned Chromium (cached) before the aggregator.

**Tech Stack:** Node 24 native `.ts` (type stripping — no enums, no parameter properties), `playwright` 1.63.0 (already pinned on the branch, Chromium build 1243 installed locally), `node:test`, prettier.

**Design record:** `process/archives/2026-09-15-docs-smoke-gate-design.md`. Branch: `feat/docs-smoke-gate` (exists; first commit 05f8ac8 = design record + dependency).

**Binding rules** (`AGENTS.md`, `ORCHESTRATION.md`): `git branch --show-current` before every commit (`feat/docs-smoke-gate`); English everywhere; `pnpm format` before committing hand-written files (generated files are never touched in this plan); a new gate ships with its `GATES` entry, PLAYBOOK row and PROOF rows in the same PR (Tasks 3 + 5, squash-merged); injections are verified to have landed before the verdict is trusted (L04); restores via `git checkout --` only on tracked files carrying no other uncommitted work (L08); commits end with `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`. Never `git push | grep` inside a `&&` chain; never a `;` before `gh pr create`.

---

## File structure

| File                                                  | Responsibility                                                                                                                 |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `scripts/lib/docs-files.ts` (create)                  | `htmlFiles(dir)`: every `.html` under a directory, recursive, sorted. Shared by gates 10 and 17.                                |
| `scripts/check-docs-a11y.ts` (modify)                 | Import `htmlFiles` instead of its local copy. Behaviour unchanged.                                                             |
| `scripts/lib/docs-smoke.ts` (create)                  | `Facts`, `Finding` types; `collectFacts()` (runs inside the page); `judgePage(facts, events)` (pure).                          |
| `scripts/lib/docs-smoke.test.ts` (create)             | `judgePage` suite — one behaviour per rule (gate 10).                                                                          |
| `scripts/check-detectors.ts` (modify)                 | Add the suite to `SUITES`.                                                                                                     |
| `scripts/check-docs-smoke.ts` (create)                | The gate: launch, visit, collect, judge, report.                                                                               |
| `scripts/check-conformity.ts`, `package.json`, `process/PLAYBOOK.md`, `README.md` (modify) | Wiring; 10 → 11 gates.                                                                                    |
| `.github/workflows/ci.yml` (modify)                   | Cached Chromium install before the aggregator.                                                                                 |
| `process/PROOF-OF-BLOCKING.md`, `AGENTS.md` (modify)  | Proof rows; the Distribution-contract heading and phase-1 bullet reworded (hygiene item).                                      |

---

### Task 1: Shared page discovery (`docs-files.ts`)

**Files:**

- Create: `scripts/lib/docs-files.ts`
- Modify: `scripts/check-docs-a11y.ts` (the local `htmlFiles` function, lines 10–22, and its imports)

- [ ] **Step 1: Create the helper**

```ts
// Page discovery for the docs-site gates (10: accessibility, 17: real-browser
// smoke): every `.html` under a directory, recursively, sorted so reports are
// stable. I/O only — no judgement lives here.
import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";

export function htmlFiles(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir).sort()) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...htmlFiles(p));
    else if (name.endsWith(".html")) out.push(p);
  }
  return out;
}
```

- [ ] **Step 2: Use it in gate 10**

In `scripts/check-docs-a11y.ts`: delete the local `htmlFiles` function; change the fs import to `import { existsSync, writeFileSync, mkdirSync } from "node:fs";` and the path import to `import { resolve } from "node:path";`; add `import { htmlFiles } from "./lib/docs-files.ts";` after the jsdom import. Nothing else changes.

- [ ] **Step 3: Verify gate 10 is unchanged**

Run: `pnpm gate:docs-a11y`
Expected: `check-docs-a11y: PASS (4 page(s), 3 warning(s)) — see reports/docs-a11y.md` (the same line as before the change).

- [ ] **Step 4: Format and commit**

```bash
pnpm format
git branch --show-current
git add scripts/lib/docs-files.ts scripts/check-docs-a11y.ts
git commit -m "refactor(docs-gates): lift page discovery into lib/docs-files.ts, shared by the docs gates

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 2: Pure judgement (`docs-smoke.ts` + suite)

**Files:**

- Create: `scripts/lib/docs-smoke.ts`
- Create: `scripts/lib/docs-smoke.test.ts`
- Modify: `scripts/check-detectors.ts` (`SUITES`)

- [ ] **Step 1: Write the failing suite**

```ts
// Unit suite for the docs-site real-browser smoke judgement (blueprint
// §5.2.10), run inside gate 10. Every case is a behaviour the smoke gate
// relies on: a healthy page has no findings, and each rule reds exactly on
// its own symptom. Facts are synthetic here — the real ones come from
// collectFacts inside Chromium, proved by the gate's injection rows.
// Run: node --test scripts/lib/docs-smoke.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { judgePage, type Facts } from "./docs-smoke.ts";

const good = (): Facts => ({
  title: "Button — LearningLeagues Lib",
  bodyPainted: true,
  main: { box: { w: 1040, h: 3401 }, text: 3755 },
  h1: { box: { w: 976, h: 54 }, text: 13 },
  stages: [{ visibleChildren: 3 }],
  tiles: [{ name: "ambre", visibleChildren: 1 }],
  hasPanels: false,
  activePanel: null,
});
const rules = (f: Facts, events: string[] = []) => judgePage(f, events).map((x) => x.rule);

test("a healthy page has no findings", () => assert.deepEqual(rules(good()), []));

test("page-events: every collected event is a finding of its own", () => {
  const out = judgePage(good(), ["page error: boom", "request failed: x.css"]);
  assert.deepEqual(
    out.map((f) => f.rule),
    ["page-events", "page-events"],
  );
  assert.ok(out[1].message.includes("x.css"));
});

test("stylesheet: an unpainted body is red", () => {
  assert.deepEqual(rules({ ...good(), bodyPainted: false }), ["stylesheet"]);
});

test("main-content: no <main>, an empty box, or no text — each is red", () => {
  assert.deepEqual(rules({ ...good(), main: null }), ["main-content"]);
  assert.deepEqual(rules({ ...good(), main: { box: { w: 0, h: 0 }, text: 5 } }), ["main-content"]);
  assert.deepEqual(rules({ ...good(), main: { box: { w: 10, h: 10 }, text: 0 } }), ["main-content"]);
});

test("heading: no <h1>, an empty box, or no text — each is red", () => {
  assert.deepEqual(rules({ ...good(), h1: null }), ["heading"]);
  assert.deepEqual(rules({ ...good(), h1: { box: { w: 0, h: 54 }, text: 5 } }), ["heading"]);
  assert.deepEqual(rules({ ...good(), h1: { box: { w: 10, h: 10 }, text: 0 } }), ["heading"]);
});

test("demo-stage: a stage with nothing visible is red, and names its position", () => {
  const out = judgePage({ ...good(), stages: [{ visibleChildren: 2 }, { visibleChildren: 0 }] }, []);
  assert.deepEqual(
    out.map((f) => f.rule),
    ["demo-stage"],
  );
  assert.ok(out[0].message.includes("#2"));
});

test("demo-stage: a page without stages (registry, tokens) is not red", () => {
  assert.deepEqual(rules({ ...good(), stages: [] }), []);
});

test("accent-tile: a tile with nothing beyond its name is red, naming the accent", () => {
  const out = judgePage({ ...good(), tiles: [{ name: "jade", visibleChildren: 0 }] }, []);
  assert.deepEqual(
    out.map((f) => f.rule),
    ["accent-tile"],
  );
  assert.ok(out[0].message.includes("jade"));
});

test("tab-panel: panels present but none active, an empty active box, or no table — each is red", () => {
  assert.deepEqual(rules({ ...good(), hasPanels: true, activePanel: null }), ["tab-panel"]);
  assert.deepEqual(
    rules({ ...good(), hasPanels: true, activePanel: { id: "primitives", box: { w: 0, h: 0 }, tables: 3 } }),
    ["tab-panel"],
  );
  assert.deepEqual(
    rules({ ...good(), hasPanels: true, activePanel: { id: "primitives", box: { w: 976, h: 1756 }, tables: 0 } }),
    ["tab-panel"],
  );
});

test("tab-panel: a healthy tokens page passes", () => {
  assert.deepEqual(
    rules({ ...good(), hasPanels: true, activePanel: { id: "primitives", box: { w: 976, h: 1756 }, tables: 5 } }),
    [],
  );
});

test("page-title: an empty or blank title is red", () => {
  assert.deepEqual(rules({ ...good(), title: "" }), ["page-title"]);
  assert.deepEqual(rules({ ...good(), title: "   " }), ["page-title"]);
});

test("never short-circuits: several symptoms are all listed", () => {
  const out = rules({ ...good(), bodyPainted: false, h1: null, stages: [{ visibleChildren: 0 }] }, ["page error: x"]);
  assert.deepEqual(out, ["page-events", "stylesheet", "heading", "demo-stage"]);
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `node --test scripts/lib/docs-smoke.test.ts`
Expected: fails at import — `Cannot find module` for `./docs-smoke.ts`.

- [ ] **Step 3: Write the module**

```ts
// Facts + judgement for the docs-site real-browser smoke gate (blueprint
// §5.1 row 17, §5.2.10): "content is present, never how it looks". Two
// halves, kept apart on purpose:
//   - collectFacts() runs INSIDE the page (Playwright page.evaluate) and must
//     stay self-contained — no imports, no outer-scope references, plain
//     data out. Layout facts are getBoundingClientRect boxes and innerText
//     lengths, the two things a simulated DOM can never give (spike
//     2026-09-15: an emptied demo stage keeps a padded box but no text;
//     inactive tab panels are 0×0 by design).
//   - judgePage() is pure over those facts plus the browser events the gate
//     collected, so gate 10 locks every rule.
// Types are the DOM's; Node strips them.

export interface Box {
  w: number;
  h: number;
}
export interface Facts {
  title: string;
  bodyPainted: boolean; // computed background-color of <body> is not fully transparent
  main: { box: Box; text: number } | null;
  h1: { box: Box; text: number } | null;
  stages: { visibleChildren: number }[]; // every .stage — descendants with a non-zero box
  tiles: { name: string; visibleChildren: number }[]; // every .accent-tile — beyond its .accent-name
  hasPanels: boolean; // the page carries [role=tabpanel] elements
  activePanel: { id: string; box: Box; tables: number } | null; // the one not hidden
}
export interface Finding {
  rule: string;
  message: string;
}

// Evaluated in the browser: every helper is declared inside, nothing from
// this module's scope is referenced (Playwright serialises the function's
// source text). Chromium reports a transparent background as
// "rgba(0, 0, 0, 0)".
export function collectFacts(): Facts {
  const box = (el: Element): Box => {
    const r = el.getBoundingClientRect();
    return { w: Math.round(r.width), h: Math.round(r.height) };
  };
  const visible = (el: Element): boolean => {
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  };
  const visibleChildren = (root: Element, skip?: string): number =>
    Array.from(root.querySelectorAll("*")).filter((el) => !(skip && el.matches(skip)) && visible(el))
      .length;
  const text = (el: Element): number => ((el as HTMLElement).innerText || "").trim().length;
  const main = document.querySelector("main");
  const h1 = document.querySelector("main h1");
  const panels = Array.from(document.querySelectorAll<HTMLElement>("[role=tabpanel]"));
  const active = panels.find((p) => !p.hidden) ?? null;
  return {
    title: document.title,
    bodyPainted: getComputedStyle(document.body).backgroundColor !== "rgba(0, 0, 0, 0)",
    main: main ? { box: box(main), text: text(main) } : null,
    h1: h1 ? { box: box(h1), text: text(h1) } : null,
    stages: Array.from(document.querySelectorAll(".stage")).map((s) => ({
      visibleChildren: visibleChildren(s),
    })),
    tiles: Array.from(document.querySelectorAll(".accent-tile")).map((t) => ({
      name: (t.querySelector(".accent-name")?.textContent ?? "").trim(),
      visibleChildren: visibleChildren(t, ".accent-name"),
    })),
    hasPanels: panels.length > 0,
    activePanel: active
      ? { id: active.id, box: box(active), tables: active.querySelectorAll("table").length }
      : null,
  };
}

const empty = (b: Box): boolean => b.w === 0 || b.h === 0;

export function judgePage(facts: Facts, events: string[]): Finding[] {
  const out: Finding[] = [];
  for (const e of events) out.push({ rule: "page-events", message: e });
  if (!facts.bodyPainted)
    out.push({
      rule: "stylesheet",
      message: "<body> has no painted background — the site stylesheet did not take effect",
    });
  if (!facts.main) out.push({ rule: "main-content", message: "no <main> element" });
  else if (empty(facts.main.box)) out.push({ rule: "main-content", message: "<main> has an empty box" });
  else if (facts.main.text === 0) out.push({ rule: "main-content", message: "<main> renders no text" });
  if (!facts.h1) out.push({ rule: "heading", message: "no <h1> inside <main>" });
  else if (empty(facts.h1.box)) out.push({ rule: "heading", message: "<h1> has an empty box" });
  else if (facts.h1.text === 0) out.push({ rule: "heading", message: "<h1> renders no text" });
  facts.stages.forEach((s, i) => {
    if (s.visibleChildren === 0)
      out.push({
        rule: "demo-stage",
        message: `demo stage #${i + 1} renders nothing visible — the blank-demo incident (blueprint §5.2.10)`,
      });
  });
  for (const t of facts.tiles)
    if (t.visibleChildren === 0)
      out.push({
        rule: "accent-tile",
        message: `accent tile "${t.name}" renders nothing beyond its name`,
      });
  if (facts.hasPanels) {
    if (!facts.activePanel)
      out.push({ rule: "tab-panel", message: "tab panels present but none is visible" });
    else if (empty(facts.activePanel.box))
      out.push({
        rule: "tab-panel",
        message: `active tab panel "${facts.activePanel.id}" has an empty box`,
      });
    else if (facts.activePanel.tables === 0)
      out.push({
        rule: "tab-panel",
        message: `active tab panel "${facts.activePanel.id}" renders no table`,
      });
  }
  if (!facts.title.trim()) out.push({ rule: "page-title", message: "empty <title>" });
  return out;
}
```

- [ ] **Step 4: Run the suite to verify it passes**

Run: `node --test scripts/lib/docs-smoke.test.ts`
Expected: `tests 12`, `pass 12`, `fail 0`.

- [ ] **Step 5: Add the suite to gate 10**

In `scripts/check-detectors.ts`, append to `SUITES`:

```ts
  "scripts/lib/docs-smoke.test.ts", // docs smoke — pure judgement over browser facts
```

Run: `pnpm gate:detectors`
Expected: `check-detectors: PASS (tests 78, pass 78, fail 0) — see reports/detectors.md`.

- [ ] **Step 6: Format and commit**

```bash
pnpm format
git branch --show-current
git add scripts/lib/docs-smoke.ts scripts/lib/docs-smoke.test.ts scripts/check-detectors.ts
git commit -m "feat(smoke): pure judgement + in-page fact collector for the docs smoke gate, locked by gate 10

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 3: The gate + wiring

**Files:**

- Create: `scripts/check-docs-smoke.ts`
- Modify: `scripts/check-conformity.ts` (`GATES`, after "Docs accessibility"), `package.json` (scripts), `process/PLAYBOOK.md` (row after the docs-a11y row), `README.md` (line 16–17)

- [ ] **Step 1: Write the gate**

```ts
// Docs-site real-browser smoke gate (blueprint §5.1 row 17, §5.2.10): every
// generated page is rendered by Playwright's PINNED Chromium (headless,
// file://, one fresh context per page) and checked for CONTENT PRESENT —
// never how it looks: no console/page error, no failed asset, a painted
// body, a non-empty <main> and <h1>, every demo stage and accent tile
// visibly non-empty, the active tab panel rendered. Facts are collected
// inside the page and judged by lib/docs-smoke.ts (pure, locked by gate 10).
// No allowlist. A missing browser binary is RED with the install command —
// never green by absence. Never short-circuits. Report: reports/docs-smoke.md.
// Usage: node scripts/check-docs-smoke.ts  (pnpm gate:docs-smoke)
import { existsSync, writeFileSync, mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { chromium, type Browser } from "playwright";
import { htmlFiles } from "./lib/docs-files.ts";
import { collectFacts, judgePage, type Finding } from "./lib/docs-smoke.ts";

const DOCS = "docs";
const REPORT = "reports/docs-smoke.md";
const VIEWPORT = { width: 1280, height: 800 };
const INSTALL = "pnpm exec playwright install chromium";
const PW_VERSION: string = createRequire(import.meta.url)("playwright/package.json").version;
const posix = (p: string) => p.replace(/\\/g, "/");
const firstLine = (e: unknown) => String((e as Error)?.message ?? e).split("\n")[0];

const failures: string[] = [];
const rows: string[] = [];
let engine = "not launched";

const pages = existsSync(DOCS) ? htmlFiles(DOCS) : [];
if (pages.length === 0)
  failures.push(`no page under ${DOCS}/ — the site always has at least the registry`);

let browser: Browser | null = null;
try {
  browser = await chromium.launch();
  engine = `Playwright ${PW_VERSION} / Chromium ${browser.version()}`;
} catch (e) {
  const msg = firstLine(e);
  failures.push(
    /Executable doesn't exist/i.test(msg)
      ? `browser binary missing — run: ${INSTALL}`
      : `browser launch failed: ${msg}`,
  );
}

if (browser)
  for (const page of pages) {
    const name = posix(page);
    const events: string[] = [];
    let findings: Finding[] = [];
    const context = await browser.newContext({ viewport: VIEWPORT });
    try {
      const tab = await context.newPage();
      tab.on("console", (m) => {
        if (m.type() === "error") events.push(`console error: ${m.text()}`);
      });
      tab.on("pageerror", (e) => events.push(`page error: ${e.message}`));
      tab.on("requestfailed", (r) =>
        events.push(`request failed: ${r.url()} (${r.failure()?.errorText ?? "unknown"})`),
      );
      tab.on("response", (r) => {
        if (r.status() >= 400) events.push(`http ${r.status()}: ${r.url()}`);
      });
      await tab.goto(pathToFileURL(resolve(page)).href, { waitUntil: "load" });
      const facts = await tab.evaluate(collectFacts);
      findings = judgePage(facts, events);
    } catch (e) {
      findings = [{ rule: "load", message: `load/engine failed: ${firstLine(e)}` }];
    } finally {
      await context.close();
    }
    rows.push(
      `| ${name} | ${events.length} | ${findings.length} | ${findings.length ? "**FAIL**" : "PASS"} |`,
    );
    failures.push(...findings.map((f) => `${name}: ${f.rule} — ${f.message}`));
  }
await browser?.close();

mkdirSync("reports", { recursive: true });
const verdict = failures.length === 0 ? "PASS" : "FAIL";
writeFileSync(
  REPORT,
  `# check-docs-smoke — ${verdict}\n\n${pages.length} page(s) under ${DOCS}/ rendered by ${engine} (headless, file://, ${VIEWPORT.width}×${VIEWPORT.height}); content present — browser events, painted body, <main> and <h1>, demo stages, accent tiles, active tab panel.\n` +
    (rows.length
      ? `\n| Page | Browser events | Findings | Verdict |\n| --- | --- | --- | --- |\n${rows.join("\n")}\n`
      : "") +
    (failures.length ? `\n## Failures\n\n${failures.map((f) => `- ${f}`).join("\n")}\n` : ""),
);
if (failures.length) {
  console.error(
    `check-docs-smoke: FAIL (${failures.length}) — see ${REPORT}\n` +
      failures.map((f) => `  - ${f}`).join("\n"),
  );
  process.exit(1);
}
console.log(`check-docs-smoke: PASS (${pages.length} page(s), ${engine}) — see ${REPORT}`);
```

- [ ] **Step 2: Run the gate on the committed site**

Run: `node scripts/check-docs-smoke.ts`
Expected: `check-docs-smoke: PASS (4 page(s), Playwright 1.63.0 / Chromium 153.0.8010.12) — see reports/docs-smoke.md`; the report's table shows four PASS rows with 0 events and 0 findings.

- [ ] **Step 3: Wire it**

`package.json`, scripts, after `"gate:docs-a11y"`:

```json
    "gate:docs-smoke": "node scripts/check-docs-smoke.ts",
```

`scripts/check-conformity.ts`, `GATES`, after the "Docs accessibility" entry:

```ts
  {
    name: "Docs smoke",
    command: process.execPath,
    args: ["scripts/check-docs-smoke.ts"],
  },
```

`process/PLAYBOOK.md`, a row right after the "Audit the docs site's accessibility (CI gate)" row (prettier realigns the table):

```markdown
| Smoke-test the docs site in a real browser (CI gate) | `pnpm gate:docs-smoke` (part of conformity) | exit 0 + `reports/docs-smoke.md`; once per machine: `pnpm exec playwright install chromium` |
```

`README.md`, the Status paragraph: replace

```
the conformity CI job blocks on 10 executable gates
(including the accessibility engine and the docs-site structural audit), two
```

with

```
the conformity CI job blocks on 11 executable gates
(including the accessibility engine, the docs-site structural audit and the
real-browser smoke of every docs page), two
```

Then `grep -n "10 gates\|10 executable\|ten gates" README.md AGENTS.md process/*.md` — expected: no other count to bump (the PROOF file's historical rows keep their "10 gates" wording: they are dated records).

- [ ] **Step 4: Run the aggregator**

Run: `pnpm conformity`
Expected: eleven `PASS` lines including `PASS  Docs smoke`, then `conformity: PASS (11 gates) — see reports/conformity.md`. `pnpm gate:playbook` inside it must stay green (the new script has its row).

- [ ] **Step 5: Format and commit**

```bash
pnpm format
git branch --show-current
git add scripts/check-docs-smoke.ts scripts/check-conformity.ts package.json process/PLAYBOOK.md README.md
git commit -m "feat(smoke): gate 17 — every docs page rendered by pinned Chromium, content present or red (11 gates)

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 4: CI — cached Chromium before the aggregator

**Files:**

- Modify: `.github/workflows/ci.yml` (between `pnpm install --frozen-lockfile` and the aggregator step)

- [ ] **Step 1: Add the steps**

```yaml
      # Gate 17 renders the docs pages in Playwright's PINNED Chromium — the
      # browser build follows the playwright version in package.json, so the
      # cache key does too. `--with-deps` installs the OS libraries every run
      # (they are not cached); the browser download itself is skipped on a hit.
      - name: Playwright version
        id: playwright
        run: echo "version=$(node -p "require('./package.json').devDependencies.playwright")" >> "$GITHUB_OUTPUT"
      - uses: actions/cache@v4
        with:
          path: ~/.cache/ms-playwright
          key: playwright-${{ runner.os }}-${{ steps.playwright.outputs.version }}
      - run: pnpm exec playwright install --with-deps chromium
```

- [ ] **Step 2: Sanity-check the version expression locally**

Run: `node -p "require('./package.json').devDependencies.playwright"`
Expected: `1.63.0`.

- [ ] **Step 3: Format and commit**

```bash
pnpm format
git branch --show-current
git add .github/workflows/ci.yml
git commit -m "ci(smoke): install the pinned Chromium (cached on the playwright version) before the aggregator

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 5: Proofs + hygiene reword

**Files:**

- Modify: `process/PROOF-OF-BLOCKING.md` (header paragraph list + rows appended at the end of the table)
- Modify: `AGENTS.md` (the "Distribution contract" heading and its phase-1 bullet)

Every injection below is applied to a TRACKED generated page, verified with the given `grep -c` BEFORE running the gate, and restored with `git checkout -- <file>` after confirming (`git status --short`) that the file carries no other change (L08). The drift gate reds the hand-edited page too — record it honestly as the co-red in the aggregator row. Commit Tasks 1–4 first: proofs run against the committed gate (gotcha: stashing to get a clean tree would run the old script).

- [ ] **Step 1: Injection A — emptied demo stage**

In `docs/components/button.html`, replace the FIRST `<div class="stage">…</div>` block (the three-button example under "Examples") with `<div class="stage"></div>`. Verify: `grep -c '<div class="stage"></div>' docs/components/button.html` → `1`.
Run: `node scripts/check-docs-smoke.ts`
Expected: exit 1, `FAIL (1)`: `docs/components/button.html: demo-stage — demo stage #1 renders nothing visible …`. Restore: `git checkout -- docs/components/button.html`; re-run → PASS.

- [ ] **Step 2: Injection B — misspelled stylesheet**

In `docs/components/button.html`, change `href="../assets/lib.css"` to `href="../assets/lib-missing.css"`. Verify: `grep -c 'lib-missing.css' docs/components/button.html` → `1`.
Run: `node scripts/check-docs-smoke.ts`
Expected: exit 1, findings on the Button page: `page-events — request failed: file:///…/assets/lib-missing.css (net::ERR_FILE_NOT_FOUND)` AND `stylesheet — <body> has no painted background …` (both, or record which of the two fired if the engine reports the miss differently — the rule is what the report says). Restore, re-run → PASS.

- [ ] **Step 3: Injection C — throwing script**

In `docs/index.html`, insert `<script>throw new Error("smoke");</script>` on the line before `</body>`. Verify: `grep -c 'throw new Error("smoke")' docs/index.html` → `1`.
Run: `node scripts/check-docs-smoke.ts`
Expected: exit 1, `docs/index.html: page-events — page error: smoke`. Restore, re-run → PASS.

- [ ] **Step 4: Injection D — emptied main**

In `docs/index.html`, replace everything between `<main id="main">` and `</main>` with nothing. Verify: `grep -c '<main id="main"></main>' docs/index.html` → `1` (join the lines if needed).
Run: `node scripts/check-docs-smoke.ts`
Expected: exit 1, two findings on the index: `main-content — <main> …` and `heading — no <h1> inside <main>`. Restore, re-run → PASS.

- [ ] **Step 5: Injection E — never short-circuits**

Apply A and C together (both verified), delete `reports/docs-smoke.md` first.
Run: `node scripts/check-docs-smoke.ts`
Expected: exit 1, `FAIL (2)`, both findings listed on two different pages, report rewritten with both rows `**FAIL**`. Restore both files, re-run → PASS.

- [ ] **Step 6: Injection F — missing browser binary**

Run (Git Bash): `mkdir -p /tmp/no-browsers && PLAYWRIGHT_BROWSERS_PATH=/tmp/no-browsers node scripts/check-docs-smoke.ts`
Expected: exit 1, `FAIL (1)`: `browser binary missing — run: pnpm exec playwright install chromium`; the report's engine line reads `not launched`, no page rows. Re-run without the variable → PASS.

- [ ] **Step 7: Injection G — aggregator**

Apply A (verified). Run: `pnpm conformity`
Expected: `FAIL  Docs smoke` and `FAIL  Generated-artefact drift` (the hand-edited page), `conformity: FAIL (2/11 gate(s) red)`, the smoke failure quoted in `reports/conformity.md`. Restore, re-run → `conformity: PASS (11 gates)`.

- [ ] **Step 8: Injection H — the suite locks the judgement**

In `scripts/lib/docs-smoke.ts`, change `if (s.visibleChildren === 0)` (the demo-stage rule) to `if (false && s.visibleChildren === 0)`. Verify: `grep -c 'if (false && s.visibleChildren' scripts/lib/docs-smoke.ts` → `1`.
Run: `pnpm gate:detectors`
Expected: exit 1, `fail 2`, naming `demo-stage: a stage with nothing visible is red, and names its position` and `never short-circuits: several symptoms are all listed`. Restore (`git checkout -- scripts/lib/docs-smoke.ts`), re-run → `pass 78`.

- [ ] **Step 9: Record the proofs**

In `process/PROOF-OF-BLOCKING.md`, after the "Docs-a11y proofs: …" paragraph, add:

```markdown
Docs-smoke proofs: 2026-09-15 (gate 17 landed), locally, Node 24.16.0 —
Playwright 1.63.0 / Chromium 153.0.8010.12 (build 1243), Windows 11.
```

At the END of the table, append one row per injection (A–H), same four columns, with the exact observed lines — `Gate` column values: `Docs smoke — blank demo stage`, `Docs smoke — missing stylesheet`, `Docs smoke — throwing script`, `Docs smoke — emptied main`, `Docs smoke — never short-circuits`, `Docs smoke — missing browser binary`, `Docs smoke — aggregator`, `Detector unit tests — docs-smoke suite`. Quote what the report said, never what was expected.

- [ ] **Step 10: Reword the Distribution-contract heading in `AGENTS.md`**

First, the date of phase 1: `git log --format='%as %s' --diff-filter=A -- scripts/vendor-dist.ts dist/ll-lib.jsx | tail -2` — use the earliest date shown as the delivery date below.

Replace the heading

```markdown
## Distribution contract (planned — recorded now so no decision contradicts it)
```

with

```markdown
## Distribution contract (phase 1 delivered <date>; phase 2 planned — recorded so no decision contradicts it)
```

and the second bullet

```markdown
- Consumption phase 1 is a git dependency pinned to a **commit** (never a
  branch), with this root manifest maintained as the install proxy for
  `packages/ui`. Phase 2 is a registry; consumer import specifiers never change.
```

with

```markdown
- Consumption phase 1 (delivered <date>, `scripts/vendor-dist.ts`): the
  consumer vendors `dist/ll-lib.{css,jsx}` at a **commit** pin (never a
  branch) — the buildless site cannot install a package — and this root
  manifest stays the install proxy for `packages/ui` for the day a building
  consumer arrives. Phase 2 is a registry; consumer import specifiers never
  change.
```

- [ ] **Step 11: Format, full conformity, commit**

```bash
pnpm format
pnpm conformity
git status --short
git branch --show-current
git add process/PROOF-OF-BLOCKING.md AGENTS.md
git commit -m "docs(smoke): red/green proofs for gate 17; AGENTS.md distribution contract reworded — phase 1 delivered

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

Expected before the commit: `conformity: PASS (11 gates)`; `git status --short` shows only the two files.

---

### Task 6: PR (main session)

- [ ] Push the branch (`git push -u origin feat/docs-smoke-gate`, on its own line).
- [ ] `pnpm conformity` once more on the pushed tree; quote the executed verdict in the body.
- [ ] `gh pr create` with the five-section body (What / Why / How verified / Decisions for the human / Follow-ups), the dependency-bump policy flagged, ending with `🤖 Generated with [Claude Code](https://claude.com/claude-code)`.
- [ ] Louis merges (human lock).

---

## Self-review

- **Spec coverage:** discovery shared (T1); facts + rules + suite (T2); gate, report, launch failure, wiring, README count (T3); CI cache + install (T4); proofs A–H incl. binary missing and aggregator, AGENTS.md reword (T5); PR (T6). Out-of-scope items untouched.
- **Placeholders:** none — `<date>` in Task 5 is resolved by the given git command, not left open.
- **Type consistency:** `Facts`/`Finding`/`Box` defined in T2 and used verbatim in T3; `htmlFiles` signature identical to the original; `collectFacts` returns `Facts`, `judgePage(facts, events: string[])` everywhere.
