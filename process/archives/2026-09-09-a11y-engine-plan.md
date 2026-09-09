# Accessibility Engine Gate — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship blueprint gate 9 — axe-core in jsdom over the SSR render of every contract example × accent, generic keyboard checks, an optional per-component behaviour suite — so `pnpm promote button stable --write` can flip the Button's a11y status to `pass` by execution, never by assertion.

**Architecture:** One gate script (`scripts/check-a11y-engine.ts`) auto-discovers components, renders their contract examples with the existing `docs-render.ts` SSR, mounts each render in a jsdom window with the real CSS, runs axe-core (`window.eval(axe.source)`) plus pure keyboard checks from `scripts/lib/a11y-checks.ts`, and runs any `<Name>.a11y.test.ts` found next to a component via `node --test`. It writes `reports/a11y-engine.md` + `.json`; the promotion script reads the JSON from its own run to add the engine criterion and to flip `a11y.status`.

**Tech Stack:** Node 24 (native `.ts` type stripping — no enums, no JSX in `.ts`), pnpm 11, esbuild (already present), React 19 (`react-dom/server` for SSR, `react-dom/client` + `act` for the behaviour suite), `jsdom` 30.0.1, `axe-core` 4.13.0, `node:test`.

**Design record:** `process/archives/2026-09-09-a11y-engine-design.md` (approved 2026-09-09). Branch: `feat/a11y-engine-gate` (already pushed with the design record and the manifest ownership claim).

**Repository rules that bind every task** (from `AGENTS.md` / `ORCHESTRATION.md`):

- Run `git branch --show-current` before every commit; it must print `feat/a11y-engine-gate`.
- Everything is English (files, commits).
- Run `pnpm format` before committing hand-written files (the format gate scans them). Never touch generated files by hand.
- A new gate ships in the SAME commit as: its `GATES` entry in `scripts/check-conformity.ts`, its `process/PLAYBOOK.md` row, and its red/green rows in `process/PROOF-OF-BLOCKING.md`. Task 4 and Task 6 together satisfy this for the engine gate; if you squash differently, keep those four things in one commit.
- Every proof injection is verified to have landed before the verdict is read (L04), and restored with `git checkout --` only when the file is tracked and carries no uncommitted work (L08).
- Commit messages end with `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`.

---

## File structure

| File | Responsibility |
| --- | --- |
| `scripts/lib/a11y-dom.ts` (create) | jsdom window factory for a rendered fragment + axe-core runner. Owns the WCAG tag list and the documented list of page-level rules disabled for fragments. |
| `scripts/lib/a11y-checks.ts` (create) | Pure generic keyboard checks over a document + the component CSS text. No I/O. |
| `scripts/lib/a11y-checks.test.ts` (create) | `node:test` suite locking each check and each documented limitation (joins gate 10). |
| `scripts/lib/a11y-dom.test.ts` (create) | Smoke suite: axe really runs inside jsdom and the fragment rule list works. |
| `scripts/lib/a11y-mount.ts` (create) | Mounts a real component with `react-dom/client` inside jsdom (esbuild bundle, like `docs-render.ts`) for behaviour tests. |
| `packages/ui/src/components/button/Button.a11y.test.ts` (create) | Button's local behaviour suite (both renderings, `onClick`, focus). |
| `scripts/check-a11y-engine.ts` (create) | The gate: discovery, matrix, axe + checks, local suites, reports, exit code. |
| `scripts/check-detectors.ts` (modify) | Runs a list of suites instead of one file. |
| `scripts/check-conformity.ts` (modify) | `GATES` entry "Accessibility engine". |
| `scripts/promote.ts` (modify) | Engine criterion from the fresh JSON report; `--write` flips `a11y.status` pending → pass. |
| `package.json` (modify) | devDependencies `axe-core`, `jsdom`; alias `gate:a11y-engine`. |
| `process/PLAYBOOK.md`, `process/PROOF-OF-BLOCKING.md`, `packages/ui/src/STATE-MANIFEST.md`, `README.md` (modify) | Index row, proof rows, promotion-criteria wording, gate count. |

---

### Task 1: Dependencies + jsdom/axe runner

**Files:**
- Modify: `package.json` (devDependencies, scripts)
- Create: `scripts/lib/a11y-dom.ts`
- Test: `scripts/lib/a11y-dom.test.ts`

- [ ] **Step 1: Add the two dev dependencies with exact pins**

Run:

```bash
pnpm add -D -E axe-core@4.13.0 jsdom@30.0.1
```

Expected: `package.json` devDependencies now hold `"axe-core": "4.13.0"` and `"jsdom": "30.0.1"` (exact, like esbuild); `pnpm-lock.yaml` updated; no build-script prompt (jsdom has none). Confirm with:

```bash
node -e "console.log(require('./package.json').devDependencies)"
```

- [ ] **Step 2: Write the failing smoke test**

Create `scripts/lib/a11y-dom.test.ts`:

```ts
// Smoke suite for the jsdom + axe runner (gate 9 plumbing): proves axe-core
// really executes inside a jsdom window on this Node, that the fragment
// rule list keeps a healthy fragment green, and that a real defect is red.
// Run: node --test scripts/lib/a11y-dom.test.ts (wrapped by check-detectors.ts)
import { test } from "node:test";
import assert from "node:assert/strict";
import { createWindow, runAxe, FRAGMENT_DISABLED_RULES } from "./a11y-dom.ts";

const CSS = ".ll-button:focus-visible { outline: 2px solid var(--ll-accent); }";

test("healthy button + link fragment: zero violations under the fragment rule list", async () => {
  const window = createWindow({
    html: `<button class="ll-button" type="button">Start</button><a class="ll-button" href="/x">Open</a>`,
    css: CSS,
    accent: "ambre",
  });
  const r = await runAxe(window);
  window.close();
  assert.deepEqual(r.violations, []);
});

test("empty button label is an axe violation (button-name)", async () => {
  const window = createWindow({ html: `<button type="button"></button>`, css: CSS, accent: "ambre" });
  const r = await runAxe(window);
  window.close();
  assert.deepEqual(
    r.violations.map((v) => v.id),
    ["button-name"],
  );
});

test("page-level rules are the documented four and are off for fragments", async () => {
  assert.deepEqual(FRAGMENT_DISABLED_RULES, [
    "region",
    "bypass",
    "landmark-one-main",
    "page-has-heading-one",
  ]);
  // Without the list, a bare fragment fails `region` (spike 2026-09-09).
  const window = createWindow({ html: `<button type="button">Go</button>`, css: "", accent: "bleu" });
  const r = await runAxe(window);
  window.close();
  assert.ok(!r.violations.some((v) => FRAGMENT_DISABLED_RULES.includes(v.id)));
});

test("DOCUMENTED LIMITATION — color-contrast comes back incomplete, never a violation, in jsdom", async () => {
  const window = createWindow({ html: `<button type="button">Go</button>`, css: "", accent: "jade" });
  const r = await runAxe(window);
  window.close();
  assert.ok(r.incomplete.some((v) => v.id === "color-contrast"));
  assert.ok(!r.violations.some((v) => v.id === "color-contrast"));
});
```

- [ ] **Step 3: Run it to verify it fails**

Run:

```bash
node --test scripts/lib/a11y-dom.test.ts
```

Expected: FAIL — `Cannot find module './a11y-dom.ts'`.

- [ ] **Step 4: Write the runner**

Create `scripts/lib/a11y-dom.ts`:

```ts
// jsdom window factory + axe-core runner for the accessibility engine gate
// (blueprint §5.1 row 9). The audited unit is a RENDERED FRAGMENT of a real
// component with the library's real CSS — never a page, never an
// approximation. axe runs INSIDE the window (window.eval of axe.source, the
// pattern axe documents for jsdom) so no global leaks between renders.
import { JSDOM, VirtualConsole } from "jsdom";
import axe from "axe-core";

export type Window = JSDOM["window"];

// WCAG 2.1 AA — the standard AGENTS.md axiom 3 binds the library to.
export const WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];

// Page-level rules, disabled ON PURPOSE: a fragment has no main landmark, no
// skip link, no h1 and no regions. The docs-site structural gate runs these
// on real pages. Spike 2026-09-09: every one of them fires on a bare
// <button> fragment. Add to this list only with the same rationale.
export const FRAGMENT_DISABLED_RULES = ["region", "bypass", "landmark-one-main", "page-has-heading-one"];

export interface Fragment {
  html: string; // SSR output of one contract example
  css: string; // tokens.css + the component's own stylesheets
  accent: string; // value placed on <html data-accent>
}

export function createWindow(f: Fragment): Window {
  // A silent VirtualConsole: jsdom otherwise prints "Not implemented:
  // HTMLCanvasElement.getContext" (axe probes canvas for contrast) and
  // "navigation" noise on link clicks — neither is a finding.
  const dom = new JSDOM(
    `<!doctype html><html lang="en" data-accent="${f.accent}"><head><meta charset="utf-8"><title>a11y engine — ${f.accent}</title><style>${f.css}</style></head><body>${f.html}</body></html>`,
    { runScripts: "outside-only", virtualConsole: new VirtualConsole() },
  );
  return dom.window;
}

export interface AxeIssue {
  id: string;
  impact: string;
  help: string;
  nodes: string[]; // outer HTML of each flagged node
}
export interface AxeOutcome {
  violations: AxeIssue[];
  incomplete: AxeIssue[]; // axe could not decide — reported visibly, never silently
}

type AxeResultLike = { id: string; impact?: string; help: string; nodes: { html: string }[] };
const pick = (list: AxeResultLike[]): AxeIssue[] =>
  list.map((r) => ({
    id: r.id,
    impact: r.impact ?? "n/a",
    help: r.help,
    nodes: r.nodes.map((n) => n.html),
  }));

export async function runAxe(window: Window): Promise<AxeOutcome> {
  window.eval(axe.source);
  const inWindow = (window as unknown as { axe: typeof axe }).axe;
  const result = await inWindow.run(window.document, {
    runOnly: { type: "tag", values: WCAG_TAGS },
    rules: Object.fromEntries(FRAGMENT_DISABLED_RULES.map((id) => [id, { enabled: false }])),
  });
  return {
    violations: pick(result.violations as AxeResultLike[]),
    incomplete: pick(result.incomplete as AxeResultLike[]),
  };
}
```

- [ ] **Step 5: Run the smoke suite to verify it passes**

Run:

```bash
node --test scripts/lib/a11y-dom.test.ts
```

Expected: `tests 4, pass 4, fail 0`. If `window.eval` reports `axe is not defined` afterwards, the `runScripts: "outside-only"` option was dropped — restore it.

- [ ] **Step 6: Format and commit**

```bash
pnpm format
git branch --show-current
git add package.json pnpm-lock.yaml scripts/lib/a11y-dom.ts scripts/lib/a11y-dom.test.ts
git commit -m "feat(a11y): jsdom + axe-core runner for the accessibility engine gate

Adds axe-core 4.13.0 and jsdom 30.0.1 as exact-pinned root devDependencies
(dev-only, outside the consumer path). The runner mounts a rendered fragment
with the real CSS and runs axe inside the window with the WCAG 2.1 AA tags;
four page-level rules are disabled for fragments, with the rationale in code.

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 2: Generic keyboard checks (pure) + detector suite wiring

**Files:**
- Create: `scripts/lib/a11y-checks.ts`
- Test: `scripts/lib/a11y-checks.test.ts`
- Modify: `scripts/check-detectors.ts`

- [ ] **Step 1: Write the failing tests**

Create `scripts/lib/a11y-checks.test.ts`:

```ts
// Unit suite for the generic keyboard checks of the accessibility engine gate
// (gate 9), run inside gate 10 (check-detectors.ts). Every case is a behaviour
// the gate relies on or a DOCUMENTED limitation frozen on purpose.
// Run: node --test scripts/lib/a11y-checks.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";
import { checkFragment, focusVisibleSelectors, interactiveElements } from "./a11y-checks.ts";

const CSS = ".ll-button:focus-visible { outline: 2px solid var(--ll-accent); outline-offset: 3px; }";
const doc = (body: string) =>
  new JSDOM(`<!doctype html><html lang="en"><body>${body}</body></html>`).window.document;
const rules = (body: string, css = CSS) => checkFragment(doc(body), css).map((f) => f.rule);

test("clean native button and link: no findings", () => {
  assert.deepEqual(
    rules(`<button class="ll-button" type="button">Go</button><a class="ll-button" href="/x">Open</a>`),
    [],
  );
});

test("focusable: a role=button span without tabindex is unreachable (and focus cannot land)", () => {
  const r = rules(`<span class="ll-button" role="button">Go</span>`);
  assert.ok(r.includes("focusable"));
  assert.ok(r.includes("focus-lands"));
});

test("focusable: tabindex=\"0\" makes a role=button span reachable", () => {
  assert.deepEqual(rules(`<span class="ll-button" role="button" tabindex="0">Go</span>`), []);
});

test("no-positive-tabindex: tabindex > 0 is red even on a native button", () => {
  assert.ok(rules(`<button class="ll-button" type="button" tabindex="3">Go</button>`).includes("no-positive-tabindex"));
});

test("hidden-focusable: a focusable element inside aria-hidden is red (axe leaves it incomplete in jsdom)", () => {
  assert.ok(
    rules(`<div aria-hidden="true"><button class="ll-button" type="button">Go</button></div>`).includes(
      "hidden-focusable",
    ),
  );
});

test("focus-visible-styled: no :focus-visible rule for the element's class is red", () => {
  assert.deepEqual(rules(`<button class="ll-card" type="button">Go</button>`), ["focus-visible-styled"]);
});

test("focus-visible-styled: class match is token-bound (`.ll` does not cover `.ll-button`)", () => {
  const css = ".ll:focus-visible { outline: 1px solid red; }";
  assert.deepEqual(rules(`<button class="ll-button" type="button">Go</button>`, css), ["focus-visible-styled"]);
});

test("focus-visible-styled: an element without any class cannot be styled — red", () => {
  assert.deepEqual(rules(`<button type="button">Go</button>`), ["focus-visible-styled"]);
});

test("focusVisibleSelectors: comments are stripped, only :focus-visible selectors come back", () => {
  const css = "/* .ll-fake:focus-visible in a comment */ .a:hover{} .ll-button:focus-visible, .ll-x:focus-visible {outline:0}";
  assert.deepEqual(focusVisibleSelectors(css), [".ll-button:focus-visible, .ll-x:focus-visible"]);
});

test("disabled elements are skipped entirely (WCAG excludes inactive components)", () => {
  assert.deepEqual(interactiveElements(doc(`<button type="button" disabled>Go</button>`)), []);
});

test("an anchor without href is not interactive — skipped, not red", () => {
  assert.deepEqual(rules(`<a class="ll-button">Not a link</a>`), []);
});

test("DOCUMENTED LIMITATION — a <div> acting as a button is invisible to the generic checks", () => {
  // Static markup carries no event handlers (React emits none), so a div
  // with an onClick in source looks inert here. Behaviour is proved by the
  // component's local <Name>.a11y.test.ts suite; the RFC's native-element
  // commitment is the reviewer's check. If this blind spot is ever closed,
  // update this test AND the design record.
  assert.deepEqual(rules(`<div class="ll-button">Go</div>`), []);
});
```

- [ ] **Step 2: Run to verify it fails**

Run:

```bash
node --test scripts/lib/a11y-checks.test.ts
```

Expected: FAIL — `Cannot find module './a11y-checks.ts'`.

- [ ] **Step 3: Write the checks**

Create `scripts/lib/a11y-checks.ts`:

```ts
// Generic keyboard checks for the accessibility engine gate (blueprint §5.1
// row 9, "keyboard suite"). Pure functions over a document + the component's
// CSS text — no I/O — so gate 10 can lock them. They cover what axe cannot
// decide in a simulated DOM (no layout): reachability, tab order, focus
// landing, a styled focus ring, and focusable content hidden from AT.
// Types below are the DOM's; Node strips them at run time (no typecheck).

export interface Finding {
  rule: string;
  message: string;
  html: string; // outer HTML of the element, truncated
}

// What counts as interactive in a rendered fragment. Native controls plus the
// widget roles a component may hand-roll. Disabled elements are excluded:
// WCAG excludes inactive components (blueprint §5.2.3 applies the same rule).
export const INTERACTIVE_SELECTOR = [
  "a[href]",
  "button",
  "input:not([type=hidden])",
  "select",
  "textarea",
  "[role=button]",
  "[role=link]",
  "[role=menuitem]",
  "[role=tab]",
  "[role=checkbox]",
  "[role=radio]",
  "[role=switch]",
  "[role=option]",
].join(",");

const NATIVE_FOCUSABLE = /^(A|BUTTON|INPUT|SELECT|TEXTAREA)$/;
const outer = (el: Element): string => el.outerHTML.slice(0, 120);
const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export function interactiveElements(doc: Document): Element[] {
  return [...doc.querySelectorAll(INTERACTIVE_SELECTOR)].filter((el) => !el.hasAttribute("disabled"));
}

export function checkFocusable(el: Element): Finding | null {
  const tabindex = el.getAttribute("tabindex");
  if (tabindex === "0") return null;
  if (NATIVE_FOCUSABLE.test(el.tagName) && tabindex !== "-1") return null;
  return {
    rule: "focusable",
    message: 'interactive element is neither natively focusable nor tabindex="0"',
    html: outer(el),
  };
}

export function checkNoPositiveTabindex(el: Element): Finding | null {
  const t = Number(el.getAttribute("tabindex") ?? "0");
  return t > 0
    ? { rule: "no-positive-tabindex", message: `tabindex="${t}" breaks the natural tab order`, html: outer(el) }
    : null;
}

export function checkFocusLands(el: Element, doc: Document): Finding | null {
  (el as HTMLElement).focus();
  return doc.activeElement === el
    ? null
    : { rule: "focus-lands", message: "focus() does not make the element document.activeElement", html: outer(el) };
}

export function checkHiddenFocusable(el: Element): Finding | null {
  return el.closest('[aria-hidden="true"]')
    ? {
        rule: "hidden-focusable",
        message: 'focusable element inside aria-hidden="true" (axe cannot decide this without layout)',
        html: outer(el),
      }
    : null;
}

// Selectors of every rule mentioning :focus-visible, comments stripped.
export function focusVisibleSelectors(css: string): string[] {
  const clean = css.replace(/\/\*[\s\S]*?\*\//g, "");
  return [...clean.matchAll(/([^{}]+)\{[^{}]*\}/g)]
    .map((m) => m[1].trim())
    .filter((sel) => sel.includes(":focus-visible"));
}

export function checkFocusVisibleStyled(el: Element, css: string): Finding | null {
  const classes = [...el.classList];
  const selectors = focusVisibleSelectors(css);
  const styled = classes.some((c) => {
    const token = new RegExp(`\\.${escapeRe(c)}(?![\\w-])`);
    return selectors.some((sel) => token.test(sel));
  });
  if (styled) return null;
  return {
    rule: "focus-visible-styled",
    message: classes.length
      ? `no :focus-visible rule targets ${classes.map((c) => `.${c}`).join(" ")}`
      : "element has no class, so no :focus-visible rule can target it",
    html: outer(el),
  };
}

// Every check on every interactive element — never short-circuits.
export function checkFragment(doc: Document, css: string): Finding[] {
  const findings: Finding[] = [];
  for (const el of interactiveElements(doc)) {
    for (const f of [
      checkFocusable(el),
      checkNoPositiveTabindex(el),
      checkFocusLands(el, doc),
      checkHiddenFocusable(el),
      checkFocusVisibleStyled(el, css),
    ])
      if (f) findings.push(f);
  }
  return findings;
}
```

- [ ] **Step 4: Run the suite to verify it passes**

Run:

```bash
node --test scripts/lib/a11y-checks.test.ts
```

Expected: `tests 12, pass 12, fail 0`. If the `role=button` case reports only `focusable` and not `focus-lands`, jsdom focused an unfocusable span — check that the span has no `tabindex`; the test relies on jsdom's focusability rules.

- [ ] **Step 5: Make gate 10 run every suite**

Modify `scripts/check-detectors.ts` — replace the single `SUITE` constant and its two uses:

```ts
// Gate 10 — detector unit tests (blueprint §5.2, row 10): the gates' own
// detectors behave. Wraps `node --test` over the pure detector suites and
// writes the standard per-gate report; a detector regression (or a silently
// widened blind spot) goes red in the required job.
// Usage: node scripts/check-detectors.ts  (pnpm gate:detectors)
import { spawnSync } from "node:child_process";
import { writeFileSync, mkdirSync } from "node:fs";

// Every pure detector/check suite. Adding a suite = one line here.
const SUITES = [
  "scripts/lib/detectors.test.ts", // token-lint detectors
  "scripts/lib/a11y-checks.test.ts", // a11y engine — generic keyboard checks
  "scripts/lib/a11y-dom.test.ts", // a11y engine — jsdom + axe plumbing
];
const REPORT = "reports/detectors.md";

const r = spawnSync(process.execPath, ["--test", ...SUITES], { encoding: "utf8" });
const output = ((r.stdout ?? "") + (r.stderr ?? "")).trim();
const ok = r.status === 0;
// Spec reporter summary lines look like "ℹ tests 15" / "ℹ pass 15" / "ℹ fail 0".
const summary = output
  .split("\n")
  .map((l) => l.trim())
  .filter((l) => /^[ℹ#] (tests|pass|fail) \d+$/.test(l))
  .map((l) => l.replace(/^[ℹ#] /, ""))
  .join(", ");

mkdirSync("reports", { recursive: true });
writeFileSync(
  REPORT,
  `# check-detectors — ${ok ? "PASS" : "FAIL"}\n\nSuites (via \`node --test\`):\n${SUITES.map((s) => `- \`${s}\``).join("\n")}\n${summary ? `\n${summary}\n` : ""}` +
    (ok ? "" : `\n## Output\n\n\`\`\`\n${output.slice(0, 4000)}\n\`\`\`\n`),
);
if (!ok) {
  console.error(`check-detectors: FAIL — see ${REPORT}\n${output.slice(0, 2000)}`);
  process.exit(1);
}
console.log(`check-detectors: PASS (${summary || "suites green"}) — see ${REPORT}`);
```

- [ ] **Step 6: Run gate 10**

Run:

```bash
pnpm gate:detectors
```

Expected: `check-detectors: PASS (tests 31, pass 31, fail 0)` (15 + 12 + 4).

- [ ] **Step 7: Format and commit**

```bash
pnpm format
git branch --show-current
git add scripts/lib/a11y-checks.ts scripts/lib/a11y-checks.test.ts scripts/check-detectors.ts
git commit -m "feat(a11y): generic keyboard checks, locked by the detector suite

Pure checks over a rendered fragment: reachable, no positive tabindex, focus
lands, a :focus-visible rule for the element's class, no focusable content
under aria-hidden. Documented limitation frozen as a test: static markup
carries no handlers, so a div-as-button is invisible here (the local
behaviour suite owns that). Gate 10 now runs a list of suites.

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 3: Client mount helper + Button behaviour suite

**Files:**
- Create: `scripts/lib/a11y-mount.ts`
- Test: `packages/ui/src/components/button/Button.a11y.test.ts`

- [ ] **Step 1: Write the failing Button suite**

Create `packages/ui/src/components/button/Button.a11y.test.ts`:

```ts
// Button — local keyboard/behaviour suite (RFC §4, design record 2026-09-09
// §4). Discovered and run by scripts/check-a11y-engine.ts. Proves what the
// generic checks cannot: the two renderings and the forwarded onClick.
// Run: node --test packages/ui/src/components/button/Button.a11y.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { mountComponent } from "../../../../../scripts/lib/a11y-mount.ts";

const DIR = "packages/ui/src/components/button";
const click = (window: { MouseEvent: typeof MouseEvent }, el: Element) =>
  el.dispatchEvent(new window.MouseEvent("click", { bubbles: true, cancelable: true }));

test('no href: native <button type="button">, focusable, onClick fires on click', async () => {
  let clicks = 0;
  const { window, root, unmount } = await mountComponent(DIR, "Button", { onClick: () => clicks++ }, "Start");
  assert.equal(root.tagName, "BUTTON");
  assert.equal(root.getAttribute("type"), "button");
  (root as HTMLElement).focus();
  assert.equal(window.document.activeElement, root);
  click(window, root);
  assert.equal(clicks, 1);
  await unmount();
});

test("href: native <a href>, type ignored, focusable, onClick fires on click", async () => {
  let clicks = 0;
  const { window, root, unmount } = await mountComponent(
    DIR,
    "Button",
    { href: "/rules", type: "submit", onClick: () => clicks++ },
    "View the rules",
  );
  assert.equal(root.tagName, "A");
  assert.equal(root.getAttribute("href"), "/rules");
  assert.equal(root.getAttribute("type"), null);
  (root as HTMLElement).focus();
  assert.equal(window.document.activeElement, root);
  click(window, root);
  assert.equal(clicks, 1);
  await unmount();
});

test("type is honoured on the button rendering (submit)", async () => {
  const { root, unmount } = await mountComponent(DIR, "Button", { type: "submit" }, "Send");
  assert.equal(root.getAttribute("type"), "submit");
  await unmount();
});

test("label reaches the accessible name as authored (uppercase is CSS only)", async () => {
  const { root, unmount } = await mountComponent(DIR, "Button", {}, "Start a league");
  assert.equal(root.textContent, "Start a league");
  await unmount();
});
```

- [ ] **Step 2: Run to verify it fails**

Run:

```bash
node --test packages/ui/src/components/button/Button.a11y.test.ts
```

Expected: FAIL — `Cannot find module '.../scripts/lib/a11y-mount.ts'`.

- [ ] **Step 3: Write the mount helper**

Create `scripts/lib/a11y-mount.ts`:

```ts
// Mounts a REAL library component with react-dom/client inside a jsdom
// window, for per-component behaviour suites (<Name>.a11y.test.ts). Same
// bundling trick as docs-render.ts: esbuild bundles the component entry with
// react/react-dom external, the CJS bundle is evaluated, React is required
// from the repository root. Never a local approximation (axiom 4).
import { buildSync } from "esbuild";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import { JSDOM, VirtualConsole } from "jsdom";

const requireFromRoot = createRequire(resolve("package.json"));

export interface Mounted {
  window: JSDOM["window"];
  root: Element; // the component's root element
  unmount: () => Promise<void>;
}

export async function mountComponent(
  componentDir: string,
  exportName: string,
  props: Record<string, unknown>,
  children?: string,
): Promise<Mounted> {
  const dom = new JSDOM(`<!doctype html><html lang="en"><body><div id="root"></div></body></html>`, {
    virtualConsole: new VirtualConsole(), // link clicks try to navigate; jsdom's "not implemented" is not a finding
  });
  const { window } = dom;
  // react-dom reads these at module init and on every render; act() needs the flag.
  Object.defineProperty(globalThis, "window", { value: window, configurable: true, writable: true });
  Object.defineProperty(globalThis, "document", { value: window.document, configurable: true, writable: true });
  Object.defineProperty(globalThis, "IS_REACT_ACT_ENVIRONMENT", { value: true, configurable: true, writable: true });

  const entry = `
const React = require("react");
const { act } = React;
const { createRoot } = require("react-dom/client");
const mod = require("./index.ts");
module.exports = async (container, exportName, props, children) => {
  const root = createRoot(container);
  await act(async () => { root.render(React.createElement(mod[exportName], props, children)); });
  return () => act(async () => { root.unmount(); });
};
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
  const container = window.document.getElementById("root") as Element;
  const unmount = await (
    mod.exports as (c: Element, n: string, p: Record<string, unknown>, ch?: string) => Promise<() => Promise<void>>
  )(container, exportName, props, children);
  const root = container.firstElementChild;
  if (!root) throw new Error(`mountComponent: ${exportName} rendered nothing`);
  return {
    window,
    root,
    unmount: async () => {
      await unmount();
      window.close();
    },
  };
}
```

- [ ] **Step 4: Run the Button suite to verify it passes**

Run:

```bash
node --test packages/ui/src/components/button/Button.a11y.test.ts
```

Expected: `tests 4, pass 4, fail 0`. Known traps: (a) `act` warning "not configured to support act" means the `IS_REACT_ACT_ENVIRONMENT` define did not run before `react-dom/client` was required — it is defined before the bundle is evaluated, keep that order; (b) `clicks` stays 0 means the event did not bubble — the `bubbles: true` option is required because React listens on the root container.

- [ ] **Step 5: Confirm the new file does not disturb the other gates**

Run:

```bash
pnpm conformity
```

Expected: `conformity: PASS (8 gates)`. The extra `.a11y.test.ts` file is ignored by the docs generator (it only reads `.meta.ts`, `.css`, `index.ts`) and by the dist generator; token lint finds no design value in it. If the drift gate names `dist/` or `docs/`, a generator picked the file up — inspect before regenerating.

- [ ] **Step 6: Format and commit**

```bash
pnpm format
git branch --show-current
git add scripts/lib/a11y-mount.ts packages/ui/src/components/button/Button.a11y.test.ts
git commit -m "feat(a11y): client mount helper + Button behaviour suite

mountComponent renders a real component with react-dom/client inside jsdom
(esbuild bundle, React from the root, act environment). Button's local suite
proves both renderings, the forwarded onClick, focus landing, and the type
prop's two behaviours — discovered by the engine gate in the next commit.

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 4: The gate script, aggregator entry, alias, playbook row

**Files:**
- Create: `scripts/check-a11y-engine.ts`
- Modify: `scripts/check-conformity.ts` (GATES), `package.json` (scripts), `process/PLAYBOOK.md`

- [ ] **Step 1: Write the gate**

Create `scripts/check-a11y-engine.ts`:

```ts
// Gate 9 — accessibility engine + keyboard suite (blueprint §5.1 row 9),
// auto-discovered over every component × contract example × accent value.
//   - HTML: the SSR render of every contract example (docs-render.ts) —
//     the real component, never an approximation (axiom 4)
//   - engine: axe-core inside a jsdom window carrying tokens.css + the
//     component's own CSS and <html data-accent> (lib/a11y-dom.ts)
//   - keyboard: the generic checks (lib/a11y-checks.ts)
//   - behaviour: an optional <Name>.a11y.test.ts next to the component, run
//     with `node --test`
// Every violation and finding is red; every axe "incomplete" is a visible
// warning. No allowlist (blueprint: escape hatch "none"). Reports:
// reports/a11y-engine.md (humans) and reports/a11y-engine.json (promote.ts).
// Usage: node scripts/check-a11y-engine.ts  (pnpm gate:a11y-engine)
import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { spawnSync } from "node:child_process";
import { renderExamples, type Example } from "./lib/docs-render.ts";
import { createWindow, runAxe, FRAGMENT_DISABLED_RULES, WCAG_TAGS } from "./lib/a11y-dom.ts";
import { checkFragment } from "./lib/a11y-checks.ts";

const COMPONENTS = "packages/ui/src/components";
const TOKENS_JSON = "packages/ui/src/tokens/tokens.json";
const TOKENS_CSS = "packages/ui/src/tokens/tokens.css";
const REPORT = "reports/a11y-engine.md";
const REPORT_JSON = "reports/a11y-engine.json";

export interface ComponentVerdict {
  verdict: "PASS" | "FAIL";
  renders: number;
  violations: number;
  findings: number;
  suite: "PASS" | "FAIL" | "none";
}

const startedAt = new Date().toISOString();
const failures: string[] = [];
const warnings: string[] = [];
const rows: string[] = [];
const components: Record<string, ComponentVerdict> = {};
const incompleteById = new Map<string, Set<string>>();

// Accent values come from tokens.json — never hand-listed (same rule as docs).
const tokens = JSON.parse(readFileSync(TOKENS_JSON, "utf8")).tokens as Record<string, unknown>;
const accents = Object.keys(tokens)
  .filter((k) => k.startsWith("Primitives/accent/"))
  .map((k) => k.split("/").pop() as string);
const tokensCss = readFileSync(TOKENS_CSS, "utf8");

const dirs = existsSync(COMPONENTS)
  ? readdirSync(COMPONENTS)
      .filter((d) => statSync(join(COMPONENTS, d)).isDirectory())
      .sort()
  : [];

for (const slug of dirs) {
  const dir = join(COMPONENTS, slug);
  const problems: string[] = [];
  const v: ComponentVerdict = { verdict: "PASS", renders: 0, violations: 0, findings: 0, suite: "none" };
  components[slug] = v;

  const metaFile = readdirSync(dir).find((n) => n.endsWith(".meta.ts"));
  if (!existsSync(join(dir, "contract.json")) || !metaFile) {
    problems.push("no contract.json / *.meta.ts — unverified surface");
  } else {
    const { meta } = await import(pathToFileURL(resolve(dir, metaFile)).href);
    const examples = (Array.isArray(meta?.examples) ? meta.examples : []) as Example[];
    if (examples.length === 0) {
      problems.push("no contract examples — nothing rendered, so nothing is verified");
    } else {
      const componentCss = readdirSync(dir)
        .filter((n) => n.endsWith(".css"))
        .sort()
        .map((n) => readFileSync(join(dir, n), "utf8"))
        .join("\n");
      const htmls = renderExamples(dir, meta.name, examples);
      for (const accent of accents) {
        for (const [i, html] of htmls.entries()) {
          const label = examples[i].label;
          const window = createWindow({ html, css: `${tokensCss}\n${componentCss}`, accent });
          const axe = await runAxe(window);
          const findings = checkFragment(window.document, componentCss);
          window.close();
          v.renders++;
          v.violations += axe.violations.length;
          v.findings += findings.length;
          for (const iss of axe.violations)
            problems.push(`[${accent}] "${label}": axe ${iss.id} (${iss.impact}) — ${iss.help} — ${iss.nodes[0] ?? ""}`);
          for (const f of findings) problems.push(`[${accent}] "${label}": ${f.rule} — ${f.message} — ${f.html}`);
          for (const inc of axe.incomplete) {
            if (!incompleteById.has(inc.id)) incompleteById.set(inc.id, new Set());
            incompleteById.get(inc.id)!.add(slug);
          }
          const red = axe.violations.length + findings.length > 0;
          rows.push(
            `| ${slug} | ${accent} | ${label} | ${axe.violations.length} | ${findings.length} | ${red ? "**FAIL**" : "PASS"} |`,
          );
        }
      }
    }
    // Optional local behaviour suite — discovered, never listed by hand.
    const suite = readdirSync(dir).find((n) => n.endsWith(".a11y.test.ts"));
    if (suite) {
      const r = spawnSync(process.execPath, ["--test", join(dir, suite)], { encoding: "utf8" });
      v.suite = r.status === 0 ? "PASS" : "FAIL";
      if (r.status !== 0)
        problems.push(
          `local suite ${suite} red:\n${((r.stdout ?? "") + (r.stderr ?? "")).trim().slice(0, 1500)}`,
        );
    }
  }
  if (problems.length) v.verdict = "FAIL";
  failures.push(...problems.map((p) => `${slug}: ${p}`));
}

for (const [id, slugs] of incompleteById)
  warnings.push(
    `axe "${id}" came back incomplete for ${[...slugs].join(", ")} — axe cannot decide it without layout` +
      (id === "color-contrast"
        ? " (contrast is proved by the contrast gate from resolved tokens)"
        : " — read the rule and decide; a new incomplete id is information, not a pass"),
  );

mkdirSync("reports", { recursive: true });
const verdict = failures.length === 0 ? "PASS" : "FAIL";
writeFileSync(
  REPORT_JSON,
  JSON.stringify(
    { gate: "check-a11y-engine", verdict, startedAt, generatedAt: new Date().toISOString(), accents, wcagTags: WCAG_TAGS, disabledRules: FRAGMENT_DISABLED_RULES, components },
    null,
    2,
  ) + "\n",
);
writeFileSync(
  REPORT,
  `# check-a11y-engine — ${verdict}\n\n${dirs.length} component(s) found; accents: ${accents.join(", ")}; axe tags: ${WCAG_TAGS.join(", ")}; page-level rules off for fragments: ${FRAGMENT_DISABLED_RULES.join(", ")}.\n` +
    (dirs.length
      ? `\n## Components\n\n| Component | Renders | axe violations | Keyboard findings | Local suite | Verdict |\n| --- | --- | --- | --- | --- | --- |\n` +
        Object.entries(components)
          .map(([s, c]) => `| ${s} | ${c.renders} | ${c.violations} | ${c.findings} | ${c.suite} | ${c.verdict === "PASS" ? "PASS" : "**FAIL**"} |`)
          .join("\n") +
        `\n\n## Renders\n\n| Component | Accent | Example | axe violations | Keyboard findings | Verdict |\n| --- | --- | --- | --- | --- | --- |\n${rows.join("\n")}\n`
      : "\nNo components yet — the gate passes vacuously and will bite from the first scaffold.\n") +
    (warnings.length ? `\n## Warnings (axe incomplete — visible, never silent)\n\n${warnings.map((w) => `- ${w}`).join("\n")}\n` : "") +
    (failures.length ? `\n## Failures\n\n${failures.map((f) => `- ${f}`).join("\n")}\n` : ""),
);
if (failures.length) {
  console.error(
    `check-a11y-engine: FAIL (${failures.length}) — see ${REPORT}\n` + failures.map((f) => `  - ${f}`).join("\n"),
  );
  process.exit(1);
}
console.log(
  `check-a11y-engine: PASS (${dirs.length} component(s), ${rows.length} render(s), ${warnings.length} warning(s)) — see ${REPORT}`,
);
```

- [ ] **Step 2: Run the gate on the real Button**

Run:

```bash
node scripts/check-a11y-engine.ts
```

Expected: `check-a11y-engine: PASS (1 component(s), 15 render(s), 1 warning(s)) — see reports/a11y-engine.md` (3 examples × 5 accents; the warning is `color-contrast` incomplete). Open `reports/a11y-engine.md` and confirm the Components table shows `button | 15 | 0 | 0 | PASS | PASS`. If a render is red, read the failure line: it names the accent, the example, the rule and the node — fix the component only if the finding is real; a finding caused by the gate itself is a gate bug to fix in Task 1–2.

- [ ] **Step 3: Wire the alias**

Modify `package.json` `scripts` — add after `"gate:a11y"`:

```json
    "gate:a11y-engine": "node scripts/check-a11y-engine.ts",
```

- [ ] **Step 4: Wire the aggregator**

Modify `scripts/check-conformity.ts` — insert into `GATES` right after the "Accessibility status" entry:

```ts
  {
    name: "Accessibility engine",
    command: process.execPath,
    args: ["scripts/check-a11y-engine.ts"],
  },
```

- [ ] **Step 5: Index it in the playbook**

Modify `process/PLAYBOOK.md` — add two rows after the "Check a11y status consistency" row (prettier will realign the table):

```markdown
| Run the a11y engine + keyboard suite (CI gate) | `pnpm gate:a11y-engine` (part of conformity)     | exit 0 + `reports/a11y-engine.md` + `.json`                                                              |
| Add a component's keyboard behaviour suite  | `<Name>.a11y.test.ts` next to the component (see `Button.a11y.test.ts`) | picked up by `pnpm gate:a11y-engine`; red suite = red gate                                        |
```

- [ ] **Step 6: Run the whole aggregator**

Run:

```bash
pnpm format
pnpm conformity
```

Expected: nine `PASS` lines including `PASS  Accessibility engine`, then `conformity: PASS (9 gates) — see reports/conformity.md`. `reports/playbook-drift.md` must list `check-a11y-engine.ts` as found.

- [ ] **Step 7: Commit (gate + aggregator + alias + playbook together — the proofs join in Task 6, same PR)**

```bash
git branch --show-current
git add scripts/check-a11y-engine.ts scripts/check-conformity.ts package.json process/PLAYBOOK.md
git commit -m "feat(gates): accessibility engine + keyboard suite — gate 9

Auto-discovered over every component x contract example x accent: SSR of the
real component, axe-core (WCAG 2.1 AA tags) inside jsdom with the real CSS,
generic keyboard checks, and the optional local behaviour suite. Violations
and findings are red; axe incompletes are visible warnings. Writes
reports/a11y-engine.{md,json}; wired into the conformity aggregator (9 gates)
and indexed in the playbook.

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 5: Promotion script — engine criterion and the a11y flip

**Files:**
- Modify: `scripts/promote.ts`

- [ ] **Step 1: Record the run start before executing conformity**

In `scripts/promote.ts`, replace the criterion-1 block:

```ts
// 1. Every blocking gate green, executed now — a summary is not evidence.
const conf = spawnSync(process.execPath, ["scripts/check-conformity.ts"], { encoding: "utf8" });
```

with:

```ts
// 1. Every blocking gate green, executed now — a summary is not evidence.
//    The start time gates the engine report below: only a report written by
//    THIS run counts (never a stale file from an earlier session).
const runStartedAt = Date.now() - 1000; // clock-granularity margin
const conf = spawnSync(process.execPath, ["scripts/check-conformity.ts"], { encoding: "utf8" });
```

- [ ] **Step 2: Add the engine criterion right after criterion 1's `check(...)`**

Insert after the `check("gates green (pnpm conformity, executed)", ...)` call:

```ts
// 1b. Accessibility engine green for THIS component, read from the JSON the
//     engine gate wrote during the conformity run above.
const ENGINE_JSON = "reports/a11y-engine.json";
type EngineReport = { generatedAt: string; components: Record<string, { verdict: "PASS" | "FAIL" }> };
const engine: EngineReport | undefined = existsSync(ENGINE_JSON)
  ? JSON.parse(readFileSync(ENGINE_JSON, "utf8"))
  : undefined;
const engineFresh = !!engine && Date.parse(engine.generatedAt) >= runStartedAt;
const engineRow = engineFresh ? engine!.components[name] : undefined;
check(
  "accessibility engine green for this component (reports/a11y-engine.json, this run)",
  engineRow?.verdict === "PASS",
  !engineFresh
    ? "no engine report from this run — the engine gate did not execute"
    : !engineRow
      ? "component absent from the engine report"
      : `engine verdict ${engineRow.verdict} — see reports/a11y-engine.md`,
);
```

- [ ] **Step 3: Rewrite criterion 5 (a11y status) to accept a pending-but-green component**

Replace the block starting `// 5. Post-flip gate prediction:` through its `check(...)` call with:

```ts
// 5. Post-flip gate prediction: stable requires a11y "pass" (check-a11y-status
//    would red the repository right after the flip otherwise). A "pending"
//    status with the engine green is flipped to "pass" by --write — the only
//    legal way that status changes (design record 2026-09-09).
const a11yStatus: string | undefined = contract.a11y?.status;
const a11yFlip = a11yStatus === "pending" && engineRow?.verdict === "PASS";
check(
  'a11y status "pass" — or "pending" with the engine green (flipped by --write)',
  a11yStatus === "pass" || a11yFlip,
  `currently "${a11yStatus}"${a11yStatus === "pending" ? " and the engine is not green for it" : ""}`,
);
```

- [ ] **Step 4: Make the export criterion see the flip too**

In the `if (target === "exported")` block, replace:

```ts
  const covered =
    contract.a11y?.status === "pass" ||
    (contract.a11y?.status === "fail" && allow.entries.some((e) => e.scope === name));
```

with:

```ts
  const covered =
    a11yStatus === "pass" ||
    a11yFlip ||
    (a11yStatus === "fail" && allow.entries.some((e) => e.scope === name));
```

- [ ] **Step 5: Flip the a11y status in `--write`**

Replace:

```ts
if (target === "stable") contract.status = "stable";
if (target === "exported") {
  contract.status = "stable";
  contract.exported = true;
}
```

with:

```ts
if (target === "stable") contract.status = "stable";
if (target === "exported") {
  contract.status = "stable";
  contract.exported = true;
}
if (a11yFlip) contract.a11y.status = "pass"; // verified by execution above, never by hand
```

and change the commit message line so the flip is visible in history:

```ts
  [
    "commit",
    "-m",
    `feat(${name}): promote to ${target} — criteria verified by scripts/promote.ts` +
      (a11yFlip ? " (a11y pending → pass by the accessibility engine gate)" : ""),
  ],
```

- [ ] **Step 6: Verify-only run on the real Button**

Run:

```bash
pnpm promote button stable
```

Expected: every line `PASS`, including `PASS  accessibility engine green for this component (...)` and `PASS  a11y status "pass" — or "pending" with the engine green (flipped by --write)`, then `promote: READY — every criterion holds. Re-run with --write to flip, regenerate and commit.` Nothing changed on disk (`git status --short` shows only `scripts/promote.ts`).

- [ ] **Step 7: Prove the stale-report refusal**

Run (Git Bash):

```bash
node -e "const f='reports/a11y-engine.json';const j=JSON.parse(require('fs').readFileSync(f,'utf8'));j.generatedAt='2020-01-01T00:00:00.000Z';require('fs').writeFileSync(f,JSON.stringify(j,null,2))"
node -e "console.log(JSON.parse(require('fs').readFileSync('reports/a11y-engine.json','utf8')).generatedAt)"
```

Expected second line: `2020-01-01T00:00:00.000Z` (injection landed). Then `pnpm promote button stable` — the conformity criterion re-runs the engine, which rewrites the JSON with a fresh timestamp, so the result is still READY. That is the intended behaviour: the report is always regenerated by the run. Now prove the other direction — temporarily make the engine gate not run by editing nothing and instead deleting the JSON *after* conformity is impossible in one command, so prove the freshness check with a unit-level probe:

```bash
node -e "const s=Date.now()-1000;const j={generatedAt:'2020-01-01T00:00:00.000Z'};console.log('fresh?',Date.parse(j.generatedAt)>=s)"
```

Expected: `fresh? false`. Record this as a documented seam in PROOF-OF-BLOCKING (Task 6): the freshness check is proved at unit level, the integration path always regenerates.

- [ ] **Step 8: Format and commit**

```bash
pnpm format
git branch --show-current
git add scripts/promote.ts
git commit -m "feat(process): promotion reads the engine verdict and flips a11y pending → pass

New criterion: the accessibility engine is green for the component, read from
reports/a11y-engine.json written during this run's conformity execution (a
stale report is refused). A pending a11y status with the engine green is
flipped to pass by --write, together with the status — never by hand.

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 6: Red/green proofs and the documents that must move with a new gate

**Files:**
- Modify: `process/PROOF-OF-BLOCKING.md`, `packages/ui/src/STATE-MANIFEST.md` (promotion criteria wording), `README.md` (gate count)

Each injection below: apply, **verify it landed** (the grep/print shown), run the gate, read the verdict, restore, run the gate green. The working tree must be clean (only the intended injection) before each `git checkout --` — check `git status --short` first (L08).

- [ ] **Step 1: Injection A — empty label (axe `button-name` / `link-name`)**

Edit `packages/ui/src/components/button/Button.meta.ts`: change the first example's `children: "Start a league"` to `children: ""`. Verify:

```bash
grep -n 'children: ""' packages/ui/src/components/button/Button.meta.ts
```

Expected: one line. Run `pnpm gate:a11y-engine`. Expected: `check-a11y-engine: FAIL (5)` — one `axe button-name (critical)` line per accent for example "Primary action". Restore:

```bash
git status --short
git checkout -- packages/ui/src/components/button/Button.meta.ts
pnpm gate:a11y-engine
```

Expected: PASS. (Also run `pnpm tokens:check` if in doubt: the docs generator would have flagged drift while the injection was in place — it is not regenerated, so nothing to clean.)

- [ ] **Step 2: Injection B — positive tabindex (keyboard `no-positive-tabindex` + axe `tabindex`)**

Edit `packages/ui/src/components/button/Button.tsx`: on the `<button` element add `tabIndex={1}`. Verify:

```bash
grep -n "tabIndex={1}" packages/ui/src/components/button/Button.tsx
```

Run `pnpm gate:a11y-engine`. Expected: FAIL with both `axe tabindex` and `no-positive-tabindex — tabindex="1" breaks the natural tab order` for the two button-rendered examples under every accent (20 failure lines). Restore with `git checkout -- packages/ui/src/components/button/Button.tsx`, re-run: PASS.

- [ ] **Step 3: Injection C — focus ring removed (`focus-visible-styled`)**

Edit `packages/ui/src/components/button/button.css`: delete the whole `.ll-button:focus-visible { … }` rule. Verify:

```bash
grep -c "focus-visible" packages/ui/src/components/button/button.css
```

Expected: `0`. Run `pnpm gate:a11y-engine`. Expected: FAIL — `focus-visible-styled — no :focus-visible rule targets .ll-button .ll-button--primary` for every render (15 lines). Restore with `git checkout -- packages/ui/src/components/button/button.css`, re-run: PASS.

- [ ] **Step 4: Injection D — focusable under aria-hidden (`hidden-focusable`; axe alone stays incomplete)**

Edit `Button.tsx`: wrap the `<button …>…</button>` return in `<div aria-hidden="true">…</div>`. Verify:

```bash
grep -n 'aria-hidden="true"' packages/ui/src/components/button/Button.tsx
```

Run `pnpm gate:a11y-engine`. Expected: FAIL — `hidden-focusable` lines for the button-rendered examples, and `reports/a11y-engine.md` Warnings section listing `axe "aria-hidden-focus" came back incomplete` (this is the gap our rule closes). Restore with `git checkout -- packages/ui/src/components/button/Button.tsx`, re-run: PASS.

- [ ] **Step 5: Injection E — behaviour regression (local suite)**

Edit `Button.tsx`: on the `<a` rendering, remove `onClick={onClick}`. Verify:

```bash
grep -c "onClick={onClick}" packages/ui/src/components/button/Button.tsx
```

Expected: `1` (was 2). Run `pnpm gate:a11y-engine`. Expected: FAIL — `button: local suite Button.a11y.test.ts red:` followed by the failing test name `href: native <a href>, type ignored, focusable, onClick fires on click`. Restore with `git checkout -- packages/ui/src/components/button/Button.tsx`, re-run: PASS.

- [ ] **Step 6: Aggregator proof**

With Injection C re-applied (verify `grep -c` prints `0`), run `pnpm conformity`. Expected: `FAIL  Accessibility engine` among eight `PASS` lines, `conformity: FAIL (1/9 gate(s) red)`, and the failure quoted in `reports/conformity.md`. Restore, `pnpm conformity` → `PASS (9 gates)`.

- [ ] **Step 7: Record the proofs**

Append to the table in `process/PROOF-OF-BLOCKING.md` (prettier realigns):

```markdown
| A11y engine — empty label                 | first Button example `children: ""`, verified present                      | exit 1, `axe button-name (critical)` × 5 accents                        | exit 0 after `git checkout --`                                    |
| A11y engine — positive tabindex           | `tabIndex={1}` on the `<button>` rendering, verified present               | exit 1, `axe tabindex` + `no-positive-tabindex` × 2 examples × 5 accents | exit 0 after restore                                              |
| A11y engine — focus ring removed          | `.ll-button:focus-visible` rule deleted, `grep -c` = 0                     | exit 1, `focus-visible-styled` × 15 renders                             | exit 0 after restore                                              |
| A11y engine — hidden focusable            | `<div aria-hidden="true">` around the button rendering, verified present   | exit 1, `hidden-focusable`; axe `aria-hidden-focus` only *incomplete*   | exit 0 after restore                                              |
| A11y engine — behaviour regression        | `onClick` dropped from the `<a>` rendering, `grep -c` = 1                  | exit 1, local suite red, failing test named                             | exit 0 after restore                                              |
| A11y engine — aggregator                  | focus-ring injection under `pnpm conformity`                               | `FAIL  Accessibility engine`, 1/9 red, quoted in conformity.md          | `conformity: PASS (9 gates)`                                      |
| A11y engine — incomplete never silent     | real Button, no injection                                                  | —                                                                       | exit 0 **with** `color-contrast` incomplete listed under Warnings |
| Promotion — engine criterion              | `pnpm promote button stable` on the real Button after the gate landed      | (before: BLOCKED on a11y pending)                                       | `READY`, engine criterion PASS, flip announced for `--write`      |
| Promotion — stale engine report (seam)    | `generatedAt` set to 2020 in `reports/a11y-engine.json`, verified          | unit probe `fresh? false`; integration path always regenerates the JSON | documented seam, not a gate                                       |
```

and add under the "Schema-gate re-proof" paragraph:

```markdown
A11y-engine proofs: 2026-09-09 (gate 9 landed), locally, Node 24.16.0 —
axe-core 4.13.0 / jsdom 30.0.1.
```

- [ ] **Step 8: Update the promotion-criteria wording and the gate count**

`packages/ui/src/STATE-MANIFEST.md`, line "1. **Gates pass:** conformity pipeline green (format, drift, schema, lint, contrast, a11y)." → `(format, drift, schema, lint, contrast, a11y status, a11y engine, playbook, detectors)`.

`README.md`: "the conformity CI job blocks on 8 executable gates" → "9 executable gates".

- [ ] **Step 9: Format, full run, commit**

```bash
pnpm format
pnpm conformity
git status --short
git branch --show-current
git add process/PROOF-OF-BLOCKING.md packages/ui/src/STATE-MANIFEST.md README.md
git commit -m "docs(proof): accessibility engine gate proved red/green; criteria and gate count updated

Five injections (empty label, positive tabindex, focus ring removed, focusable
under aria-hidden, onClick regression) each verified landed, red observed,
restored green; aggregator red proved; the incomplete-never-silent behaviour
recorded; the stale-report freshness check documented as a unit-proved seam.

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

Expected before commit: `conformity: PASS (9 gates)`, `git status --short` showing only the three documents.

---

### Task 7: Promote the Button for real, then open the PR

**Files:**
- Written by the script: `packages/ui/src/components/button/contract.json`, `packages/ui/src/STATE-MANIFEST.md`, `docs/**`
- Modify (by hand, after): `packages/ui/src/STATE-MANIFEST.md` (PR number in the button row)

- [ ] **Step 1: Promote**

Run:

```bash
git branch --show-current
pnpm promote button stable --write
```

Expected: every criterion PASS, then `on branch: feat/a11y-engine-gate`, docs regenerated, and `promote: button is stable — committed on feat/a11y-engine-gate.` The commit title is `feat(button): promote to stable — criteria verified by scripts/promote.ts (a11y pending → pass by the accessibility engine gate)`. Verify:

```bash
git show --stat HEAD | head -20
node -e "const c=require('./packages/ui/src/components/button/contract.json');console.log(c.status,c.a11y.status)"
```

Expected: `stable pass`; the manifest row's status column reads `stable`; `docs/index.html` and `docs/components/button.html` are in the commit.

- [ ] **Step 2: Everything green after the flip**

Run:

```bash
pnpm conformity
```

Expected: `conformity: PASS (9 gates)` — in particular `Accessibility status` stays green with `button | stable | no | pass | PASS`.

- [ ] **Step 3: Push and open the PR (five-section body; bump-policy flag for the two dependencies)**

```bash
git push
```

Then create the PR (title becomes the squash commit title):

```bash
"/c/Program Files/GitHub CLI/gh.exe" pr create --base main --title "feat(gates): accessibility engine + keyboard suite — gate 9, Button promoted to stable" --body-file process/archives/.pr-body-tmp.md
```

Write `process/archives/.pr-body-tmp.md` first (delete it right after; it must not be committed) with these five sections, filled from the executed results:

```markdown
## Summary

Blueprint gate 9 lands: axe-core (WCAG 2.1 AA tags) inside jsdom over the SSR render of every contract example under every accent, five generic keyboard checks, and an optional per-component behaviour suite (`<Name>.a11y.test.ts`). The Button's a11y status moved `pending → pass` **by execution** through `pnpm promote button stable --write`, which also flipped its status to `stable` — the first promotion by the script. Design record: `process/archives/2026-09-09-a11y-engine-design.md`; plan: `…-a11y-engine-plan.md`.

## Changes

- `scripts/lib/a11y-dom.ts` — jsdom window + axe runner; four page-level rules disabled for fragments, rationale in code.
- `scripts/lib/a11y-checks.ts` (+ tests, in gate 10) — focusable, no positive tabindex, focus lands, `:focus-visible` styled, no focusable under aria-hidden. Documented limitation: static markup carries no handlers.
- `scripts/lib/a11y-mount.ts` + `Button.a11y.test.ts` — client mount in jsdom; both renderings, forwarded `onClick`, focus, `type`.
- `scripts/check-a11y-engine.ts` — the gate; `reports/a11y-engine.{md,json}`; wired into conformity (9 gates), PLAYBOOK rows.
- `scripts/promote.ts` — engine criterion from this run's JSON; `--write` flips a11y pending → pass.
- PROOF-OF-BLOCKING: five injections + aggregator + incomplete-never-silent + promotion rows.

## Verification

`conformity: PASS (9 gates)` — executed after the promotion commit. `pnpm promote button stable`: READY before `--write`; contract now `stable` / a11y `pass`; docs regenerated in the promotion commit.

## Flags for review

- **Dependency bump policy:** `axe-core` 4.13.0 and `jsdom` 30.0.1 added as exact-pinned root devDependencies (dev-only; `packages/ui` unchanged, consumer path untouched). Same pin discipline as esbuild — say if you want a different policy.
- axe `color-contrast` is structurally *incomplete* in jsdom and listed as a warning on every run; the contrast gate remains the proof. Real-browser keyboard activation stays out (design record, out of scope).
- The docs-site structural a11y gate is the next small PR (same jsdom, page rules enabled).

## Session report

**To understand:** gate 9 is executable; Button is the first stable component. **To decide:** merge; the bump-policy flag above. **To paste:** nothing. **Decisions made autonomously:** exact pins; the four disabled page rules; JSON sidecar report for the promotion script; `.a11y.test.ts` naming; disabled elements excluded from keyboard checks.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

- [ ] **Step 4: Record the PR number in the manifest row and push**

Edit the button row in `packages/ui/src/STATE-MANIFEST.md`: PR column `—` → `#<number>`. Then:

```bash
pnpm format
pnpm conformity
git branch --show-current
git add packages/ui/src/STATE-MANIFEST.md
git commit -m "docs(manifest): record the a11y engine PR number on the button row

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
git push
rm process/archives/.pr-body-tmp.md
git status --short
```

Expected: clean tree (only `.claude/` untracked), CI green on the PR. Merge is Louis's gesture (human lock).

---

## Self-review (done while writing)

- **Spec coverage:** §1 surface/matrix → Task 4 (discovery, accents from tokens.json, no-examples red, vacuous pass). §2 rendering/engine → Task 1 (tags, disabled rules, incomplete as warnings) + Task 4. §3 generic checks + gate 10 → Task 2. §4 local suite + mount helper → Task 3. §5 wiring, JSON sidecar, promotion criterion + flip, dependencies, manifest wording, gate count → Tasks 4, 5, 6. §6 proofs → Task 6. Promotion + PR → Task 7. Out-of-scope items untouched.
- **Placeholders:** none; every code step carries its code; every run step its expected output.
- **Type consistency:** `createWindow({html, css, accent})` / `runAxe(window)` / `FRAGMENT_DISABLED_RULES` / `WCAG_TAGS` (Task 1) match their uses in Task 4; `checkFragment(doc, css)`, `interactiveElements`, `focusVisibleSelectors` (Task 2) match the tests and Task 4; `mountComponent(dir, exportName, props, children)` returning `{window, root, unmount}` (Task 3) matches the Button suite; `ComponentVerdict.verdict` is what `promote.ts` reads as `components[name].verdict` (Task 5); `generatedAt` is written in Task 4 and read in Task 5.
