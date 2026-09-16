# Gate 17 Follow-ups Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Harden three existing gates without adding one: gate 10's report names every red test even when its raw excerpt is truncated; gate 17 reds a component page that renders no demo stage or no accent tile at all; gate 17 judges a 250 ms window after `load` so a late thrown error is seen.

**Architecture:** A new pure helper `scripts/lib/test-output.ts` (`failingTests`) with its own suite, printed by `check-detectors.ts` before the truncated excerpt. `judgePage` in `scripts/lib/docs-smoke.ts` gains a third argument, the page kind, that `check-docs-smoke.ts` derives from the path; the same script waits `SETTLE_MS` after `load`. Every rule change is locked by gate 10 and proved red/green by injection in `process/PROOF-OF-BLOCKING.md`.

**Tech Stack:** Node 24 native `.ts` (types stripped, no build), `node:test` (spec reporter is the default under Node 24 even when piped; tap on `--test-reporter=tap`), Playwright 1.63.0 / its pinned Chromium (installed on this machine), prettier 3.6.2.

**Design record:** `process/archives/2026-09-16-gate17-follow-ups-design.md`. Branch: `feat/gate17-follow-ups` (exists; first commit 99224ea = the design record).

**Binding rules** (`AGENTS.md`, `ORCHESTRATION.md`): `git branch --show-current` before every commit; English in every file; `pnpm exec prettier --write <files>` on every hand-written file before committing (`process/archives/`, `docs/`, `dist/`, `reports/` are prettier-ignored — never format them); never hand-edit a generated file except as a proof injection restored by `git checkout --` in the same step; a gate is proved AFTER its commit (a stash runs the old script); every proof injection is verified landed (`grep -c`) before its verdict is trusted (L04); restore only tracked files carrying no uncommitted work (L08); commits end with `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>` — exactly that line, no other model name; never `git push | grep` inside a `&&` chain; never a `;` before `gh pr create`. No generated artefact depends on these scripts: nothing to regenerate.

---

## File structure

| File                                                          | Responsibility                                                                                                                     |
| ------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `scripts/lib/test-output.ts` (create)                         | Pure: `failingTests(output)` — red test names out of `node --test` output, spec and tap, deduped, in order.                          |
| `scripts/lib/test-output.test.ts` (create)                    | Locks the helper on verbatim reporter samples.                                                                                     |
| `scripts/check-detectors.ts` (modify)                         | Registers the new suite; under a red run writes `## Failing tests` before `## Output` and prints the names first on stderr.        |
| `scripts/lib/docs-smoke.ts` (modify)                          | `PageKind`; `judgePage(facts, events, kind = "other")` reds a component page with zero stages / zero tiles.                          |
| `scripts/lib/docs-smoke.test.ts` (modify)                     | Three new cases; the registry case made explicit.                                                                                  |
| `scripts/check-docs-smoke.ts` (modify)                        | Derives the kind from the path; `SETTLE_MS = 250` after `load`; report sentence names both.                                        |
| `process/PROOF-OF-BLOCKING.md` (modify)                       | Header paragraph + five injection rows.                                                                                            |
| `process/archives/2026-09-16-gate17-follow-ups-design.md`     | One dated addendum line (the injection method for the no-stage / no-tile proofs renames the class instead of removing the block). |

---

### Task 1: `failingTests` — helper, suite, gate 10 wiring (TDD)

**Files:**

- Create: `scripts/lib/test-output.ts`
- Create: `scripts/lib/test-output.test.ts`
- Modify: `scripts/check-detectors.ts`

- [ ] **Step 1: Write the failing suite**

Create `scripts/lib/test-output.test.ts` with exactly:

```ts
// Unit suite for the failing-test extraction gate 10 prints under a red run
// (design record process/archives/2026-09-16-gate17-follow-ups-design.md).
// The samples are the verbatim shapes Node 24's spec and tap reporters
// produce on a synthetic red suite (one green test, one red test, one red
// test nested in a describe) — captured 2026-09-16.
// Run: node --test scripts/lib/test-output.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { failingTests } from "./test-output.ts";

const SPEC = `✔ green one (0.8791ms)
✖ red one: names (its) position (2.5216ms)
▶ group
  ✖ red nested (13.0531ms)
✖ group (13.35ms)
ℹ tests 3
ℹ suites 1
ℹ pass 1
ℹ fail 2
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 114.5426
✖ failing tests:
test at red.test.mjs:4:1
✖ red one: names (its) position (2.5216ms)
  AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:

  1 !== 2

test at red.test.mjs:5:27
✖ red nested (13.0531ms)
  AssertionError [ERR_ASSERTION]: The expression evaluated to a falsy value:
`;

const TAP = `TAP version 13
# Subtest: green one
ok 1 - green one
  ---
  duration_ms: 0.837
  type: 'test'
  ...
# Subtest: red one: names (its) position
not ok 2 - red one: names (its) position
  ---
  duration_ms: 0.9066
  failureType: 'testCodeFailure'
  error: |-
    Expected values to be strictly equal:
  ...
# Subtest: group
    # Subtest: red nested
    not ok 1 - red nested
      ---
      duration_ms: 3.6522
      ...
    1..1
not ok 3 - group
  ---
  duration_ms: 4.1
  type: 'suite'
  ...
1..3
# tests 3
# suites 1
# pass 1
# fail 2
`;

test("spec reporter: red names in order of first appearance, nested included, header and repeats dropped", () => {
  assert.deepEqual(failingTests(SPEC), ["red one: names (its) position", "red nested", "group"]);
});

test("tap reporter: not-ok names in order, nested included", () => {
  assert.deepEqual(failingTests(TAP), ["red one: names (its) position", "red nested", "group"]);
});

test("a green run and an empty output yield nothing", () => {
  assert.deepEqual(failingTests("✔ green one (0.8ms)\nℹ tests 1\nℹ pass 1\nℹ fail 0\n"), []);
  assert.deepEqual(failingTests(""), []);
});

test("a suite line counts: a suite holding a red test is red", () => {
  assert.deepEqual(failingTests("▶ group\n  ✖ inner (1ms)\n✖ group (2ms)\n"), ["inner", "group"]);
});

test("the duration is stripped, the name keeps its own parentheses", () => {
  assert.deepEqual(failingTests("✖ names (its) position (2.5ms)"), ["names (its) position"]);
  assert.deepEqual(failingTests("✖ no duration at all"), ["no duration at all"]);
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `node --test scripts/lib/test-output.test.ts`
Expected: red — `Cannot find module` for `./test-output.ts` (the suite fails to load; `fail 1`, exit 1).

- [ ] **Step 3: Write the helper**

Create `scripts/lib/test-output.ts` with exactly:

```ts
// Failing test names out of `node --test` output, in both reporters Node
// emits: spec (`✖ name (1.2ms)`, the default under Node 24 even when piped)
// and tap (`not ok 3 - name`). Pure — gate 10 (check-detectors.ts) prints the
// result BEFORE its truncated raw excerpt, so a red suite always names its
// red tests whatever the excerpt cuts off. Deduped in order of first
// appearance: spec repeats every red test under its "✖ failing tests:"
// section, and that header is not a test. A suite line (`✖ group`) counts —
// a suite holding a red test is red.
const SPEC = /^\s*✖ (.+?)(?: \(\d+(?:\.\d+)?ms\))?$/;
const TAP = /^\s*not ok \d+ - (.+)$/;
const SPEC_HEADER = "failing tests:";

export function failingTests(output: string): string[] {
  const seen = new Set<string>();
  const names: string[] = [];
  for (const line of output.split("\n")) {
    const m = SPEC.exec(line) ?? TAP.exec(line);
    if (!m) continue;
    const name = m[1].trim();
    if (name === SPEC_HEADER || seen.has(name)) continue;
    seen.add(name);
    names.push(name);
  }
  return names;
}
```

- [ ] **Step 4: Run the suite to verify it passes**

Run: `node --test scripts/lib/test-output.test.ts`
Expected: `ℹ tests 5`, `ℹ pass 5`, `ℹ fail 0`, exit 0.

- [ ] **Step 5: Wire gate 10**

In `scripts/check-detectors.ts`, apply these four edits (the rest of the file stays as it is):

Add the import after the `node:fs` import:

```ts
import { failingTests } from "./lib/test-output.ts";
```

Append one line to `SUITES` (after the `docs-smoke.test.ts` line):

```ts
  "scripts/lib/test-output.test.ts", // gate 10 itself — failing-test names out of node --test output
```

Replace the block from `mkdirSync("reports", { recursive: true });` to the end of the file with:

```ts
// Under a red run the raw excerpt below is truncated; the names never are.
const failing = ok ? [] : failingTests(output);
const failingSection = ok
  ? ""
  : `\n## Failing tests\n\n${failing.length ? failing.map((n) => `- ${n}`).join("\n") : "(no test line found — a crash before any test ran; see Output)"}\n`;

mkdirSync("reports", { recursive: true });
writeFileSync(
  REPORT,
  `# check-detectors — ${ok ? "PASS" : "FAIL"}\n\nSuites (via \`node --test\`):\n${SUITES.map((s) => `- \`${s}\``).join("\n")}\n${summary ? `\n${summary}\n` : ""}` +
    failingSection +
    (ok ? "" : `\n## Output\n\n\`\`\`\n${output.slice(0, 4000)}\n\`\`\`\n`),
);
if (!ok) {
  console.error(
    `check-detectors: FAIL — see ${REPORT}\n` +
      (failing.length ? failing.map((n) => `  ✖ ${n}`).join("\n") + "\n" : "") +
      output.slice(0, 2000),
  );
  process.exit(1);
}
console.log(`check-detectors: PASS (${summary || "suites green"}) — see ${REPORT}`);
```

Update the header comment's second sentence to read: `Wraps \`node --test\` over the pure detector suites and writes the standard per-gate report; under a red run the report and stderr name every failing test BEFORE the truncated raw excerpt (scripts/lib/test-output.ts); a detector regression (or a silently widened blind spot) goes red in the required job.`

- [ ] **Step 6: Run gate 10 green**

Run: `pnpm gate:detectors`
Expected: `check-detectors: PASS (tests 85, pass 85, fail 0) — see reports/detectors.md` (80 existing + 5 new; if the count differs, the SUITES line did not land — check). `reports/detectors.md` lists six suites and has no `## Failing tests` section (green run).

- [ ] **Step 7: Format and commit**

```bash
pnpm exec prettier --write scripts/lib/test-output.ts scripts/lib/test-output.test.ts scripts/check-detectors.ts
git branch --show-current
git add scripts/lib/test-output.ts scripts/lib/test-output.test.ts scripts/check-detectors.ts
git commit -F - <<'EOF'
feat(detectors): gate 10 names every failing test before its truncated excerpt

New pure helper scripts/lib/test-output.ts (failingTests: spec and tap
reporters, deduped, in order) with its suite in SUITES; the report gains a
"Failing tests" section ahead of the 4000-char excerpt and stderr lists the
names ahead of the 2000-char excerpt. Follow-up from PR #33.

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
EOF
```

Expected: `feat/gate17-follow-ups` printed by `git branch --show-current`; the commit lands; the prettier run may rewrap the long template string — that is fine, re-run `pnpm gate:detectors` once after formatting and confirm PASS.

---

### Task 2: Component-page expectation and settle window (TDD)

**Files:**

- Modify: `scripts/lib/docs-smoke.ts`
- Modify: `scripts/lib/docs-smoke.test.ts`
- Modify: `scripts/check-docs-smoke.ts`

- [ ] **Step 1: Write the failing tests**

In `scripts/lib/docs-smoke.test.ts`, replace the existing test

```ts
test("demo-stage: a page without stages (registry, tokens) is not red", () => {
  assert.deepEqual(rules({ ...good(), stages: [] }), []);
});
```

with

```ts
test("demo-stage: a page without stages (registry, tokens — kind other, the default) is not red", () => {
  assert.deepEqual(rules({ ...good(), stages: [] }), []);
  assert.deepEqual(judgePage({ ...good(), stages: [] }, [], "other"), []);
});

test("demo-stage: a component page with no stage at all is red", () => {
  const out = judgePage({ ...good(), stages: [] }, [], "component");
  assert.deepEqual(
    out.map((f) => f.rule),
    ["demo-stage"],
  );
  assert.ok(out[0].message.includes("no demo stage at all"));
});
```

and append, after the test `accent-tile: visible descendants but no text beyond the name is red`:

```ts
test("accent-tile: a component page with no tile at all is red; kind other is not", () => {
  const out = judgePage({ ...good(), tiles: [] }, [], "component");
  assert.deepEqual(
    out.map((f) => f.rule),
    ["accent-tile"],
  );
  assert.ok(out[0].message.includes("no accent tile at all"));
  assert.deepEqual(judgePage({ ...good(), tiles: [] }, [], "other"), []);
});

test("component page: no stage AND no tile are both listed, and a healthy component page passes", () => {
  assert.deepEqual(
    judgePage({ ...good(), stages: [], tiles: [] }, [], "component").map((f) => f.rule),
    ["demo-stage", "accent-tile"],
  );
  assert.deepEqual(judgePage(good(), [], "component"), []);
});
```

- [ ] **Step 2: Run the suite to verify it fails**

Run: `node --test scripts/lib/docs-smoke.test.ts`
Expected: `fail 3` — the three new cases (`a component page with no stage at all is red`, `a component page with no tile at all is red; kind other is not`, `no stage AND no tile are both listed…`) red because `judgePage` ignores its third argument today; the renamed registry case green.

- [ ] **Step 3: Implement the rule**

In `scripts/lib/docs-smoke.ts`:

Add after the `Finding` interface:

```ts
// The gate derives the kind from the path: docs/components/*.html is a
// component page and must render at least one demo stage and one accent
// tile; the registry and tokens pages ("other") legitimately have none.
export type PageKind = "component" | "other";
```

Change the signature to:

```ts
export function judgePage(facts: Facts, events: string[], kind: PageKind = "other"): Finding[] {
```

Insert right after the `facts.stages.forEach(...)` block (before `for (const t of facts.tiles)`):

```ts
  if (kind === "component" && facts.stages.length === 0)
    out.push({
      rule: "demo-stage",
      message:
        "component page renders no demo stage at all — the template stopped emitting .stage (blueprint §5.2.10)",
    });
```

Insert right after the `for (const t of facts.tiles) ...` statement (before `if (facts.hasPanels)`):

```ts
  if (kind === "component" && facts.tiles.length === 0)
    out.push({
      rule: "accent-tile",
      message: "component page renders no accent tile at all — the accent axis section is missing",
    });
```

Extend the file's header comment: after the sentence ending `inactive tab panels are 0×0 by design).` add ` A component page (kind passed by the gate) must also carry at least one stage and one tile — a template that stopped emitting the wrappers would otherwise ship green (follow-up from PR #33).`

- [ ] **Step 4: Run the suite to verify it passes**

Run: `node --test scripts/lib/docs-smoke.test.ts`
Expected: `ℹ tests 17`, `ℹ pass 17`, `ℹ fail 0`.

- [ ] **Step 5: Wire the gate — kind and settle window**

In `scripts/check-docs-smoke.ts`:

Change the lib import to:

```ts
import { collectFacts, judgePage, type Finding, type PageKind } from "./lib/docs-smoke.ts";
```

After `const VIEWPORT = { width: 1280, height: 800 };` add:

```ts
// Judgement window: facts are collected SETTLE_MS after `load`, so an error
// thrown asynchronously inside that window is judged. The docs pages run only
// synchronous script today — this is insurance, not a wait for anything.
const SETTLE_MS = 250;
// docs/components/*.html are component pages: at least one demo stage and
// one accent tile expected (registry and tokens pages have none by design).
const COMPONENT_PAGES = `${DOCS}/components/`;
```

Inside the per-page loop, after `const name = posix(page);` add:

```ts
    const kind: PageKind = name.startsWith(COMPONENT_PAGES) ? "component" : "other";
```

Replace

```ts
      await tab.goto(pathToFileURL(resolve(page)).href, { waitUntil: "load" });
      const facts = await tab.evaluate(collectFacts);
      findings = judgePage(facts, events);
```

with

```ts
      await tab.goto(pathToFileURL(resolve(page)).href, { waitUntil: "load" });
      await tab.waitForTimeout(SETTLE_MS);
      const facts = await tab.evaluate(collectFacts);
      findings = judgePage(facts, events, kind);
```

Replace the report's intro sentence (inside the `writeFileSync(REPORT, ...)` template) — the part reading

`content present — browser events, painted body, <main> and <h1>, demo stages, accent tiles, active tab panel.`

with

`content present — browser events (until load + ${SETTLE_MS} ms), painted body, <main> and <h1>, demo stages, accent tiles (component pages: at least one of each), active tab panel.`

Update the header comment: after `the active tab panel rendered.` add ` Facts are collected 250 ms after load; a component page (docs/components/) must carry at least one stage and one tile.`

- [ ] **Step 6: Run the gate green**

Run: `pnpm gate:docs-smoke`
Expected: `check-docs-smoke: PASS (4 page(s), Playwright 1.63.0 / Chromium 153.0.8010.12) — see reports/docs-smoke.md`; the report intro reads `… browser events (until load + 250 ms) …`. Then `pnpm gate:detectors` → `PASS (tests 88, pass 88, fail 0)` (85 after Task 1 + the 3 new smoke cases).

- [ ] **Step 7: Format and commit**

```bash
pnpm exec prettier --write scripts/lib/docs-smoke.ts scripts/lib/docs-smoke.test.ts scripts/check-docs-smoke.ts
git branch --show-current
git add scripts/lib/docs-smoke.ts scripts/lib/docs-smoke.test.ts scripts/check-docs-smoke.ts
git commit -F - <<'EOF'
feat(smoke): component pages must render a demo stage and an accent tile; facts collected 250 ms after load

judgePage gains the page kind (component = docs/components/*.html, derived
from the path by the gate): zero .stage or zero .accent-tile on a component
page is red; registry and tokens pages keep their freedom. The gate waits
SETTLE_MS = 250 after load before collecting facts so a late thrown error is
judged. Three new detector cases. Follow-ups from PR #33.

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
EOF
```

---

### Task 3: Red/green proofs and PROOF-OF-BLOCKING

**Files:**

- Modify: `process/PROOF-OF-BLOCKING.md` (header paragraph + five rows at the end of the table)
- Modify: `process/archives/2026-09-16-gate17-follow-ups-design.md` (one addendum line at the very end)

Precondition: Tasks 1 and 2 are committed (`git status` clean, `git log --oneline -3` shows both commits). Every injection below is on a tracked file with no uncommitted work, restored by `git checkout -- <file>` (L08). Verify each injection landed with the `grep -c` before trusting the verdict (L04). Record the verbatim messages you observe — the "Expected" text is what the design predicts, the row must quote what ran.

- [ ] **Step 1: Proof A — gate 10 names the red tests (docs-smoke suite blinded)**

```bash
sed -i 's/if (s.visibleDescendants === 0)/if (false \&\& s.visibleDescendants === 0)/' scripts/lib/docs-smoke.ts
grep -c 'if (false && s.visibleDescendants === 0)' scripts/lib/docs-smoke.ts
pnpm gate:detectors; echo "exit=$?"
grep -n -A4 '## Failing tests' reports/detectors.md
grep -n '## Output' reports/detectors.md
git checkout -- scripts/lib/docs-smoke.ts
pnpm gate:detectors
```

Expected: `grep -c` = 1; exit 1; stderr starts `check-detectors: FAIL — see reports/detectors.md` then `  ✖ demo-stage: a stage with nothing visible is red, and names its position` and `  ✖ never short-circuits: several symptoms are all listed` BEFORE the raw excerpt; in the report, `## Failing tests` lists those two names and its line number is smaller than `## Output`'s. Restored: `PASS (tests 88, pass 88, fail 0)`.

- [ ] **Step 2: Proof B — the test-output suite locks the helper**

```bash
sed -i 's/^  const seen = new Set<string>();/  return [];\n  const seen = new Set<string>();/' scripts/lib/test-output.ts
grep -c '^  return \[\];' scripts/lib/test-output.ts
pnpm gate:detectors; echo "exit=$?"
git checkout -- scripts/lib/test-output.ts
pnpm gate:detectors
```

Expected: `grep -c` = 1; exit 1, `tests 88, pass 84, fail 4` naming the four `test-output` cases that expect names (`spec reporter…`, `tap reporter…`, `a suite line counts…`, `the duration is stripped…`) — and, honestly, the `## Failing tests` section is then `(no test line found …)` ONLY IF the helper is blinded; here it is blinded, so note what the section shows: the blinded helper returns `[]`, the section reads `(no test line found — a crash before any test ran; see Output)` — record that as the observed behaviour (the helper cannot name its own failure; the raw excerpt still does). Restored: `PASS (tests 88, pass 88, fail 0)`.

- [ ] **Step 3: Proof C — component page with no stage (Callout page, one stage)**

```bash
sed -i 's/class="stage/class="stagex/g' docs/components/callout.html
grep -c 'class="stage' docs/components/callout.html
pnpm gate:docs-smoke; echo "exit=$?"
git checkout -- docs/components/callout.html
pnpm gate:docs-smoke
```

Expected: `grep -c` = 0 (the `.stage` element is gone from the selector's reach, the HTML stays well-formed); exit 1, `FAIL (1)`: `docs/components/callout.html: demo-stage — component page renders no demo stage at all — the template stopped emitting .stage (blueprint §5.2.10)`; the Button, registry and tokens rows still PASS. Restored: `PASS (4 page(s), …)`.

- [ ] **Step 4: Proof D — component page with no tile**

```bash
sed -i 's/class="accent-tile/class="accent-tilex/g' docs/components/callout.html
grep -c 'class="accent-tile' docs/components/callout.html
pnpm gate:docs-smoke; echo "exit=$?"
git checkout -- docs/components/callout.html
pnpm gate:docs-smoke
```

Expected: `grep -c` = 0; exit 1, `FAIL (1)`: `docs/components/callout.html: accent-tile — component page renders no accent tile at all — the accent axis section is missing`. Restored: `PASS (4 page(s), …)`.

- [ ] **Step 5: Proof E — late thrown error inside the window**

Insert, with the Edit tool, the line `<script>setTimeout(function () { throw new Error("late"); }, 50);</script>` immediately before `</body>` in `docs/index.html` (the last `</body>` of the file), then:

```bash
grep -c 'throw new Error("late")' docs/index.html
pnpm gate:docs-smoke; echo "exit=$?"
git checkout -- docs/index.html
pnpm gate:docs-smoke
```

Expected: `grep -c` = 1; exit 1, `FAIL (1)`: `docs/index.html: page-events — page error: late`; the index row carries `1` browser event. Restored: `PASS (4 page(s), …)`. If instead the run is green, the settle wait did not land — re-read `check-docs-smoke.ts` Step 5 of Task 2.

- [ ] **Step 6: Record the proofs**

In `process/PROOF-OF-BLOCKING.md`, insert after the paragraph `Docs-smoke proofs: 2026-09-15 …` (before the table):

```markdown
Docs-smoke and detectors re-proof: 2026-09-16 (gate 17 follow-ups —
component-page expectation, 250 ms settle window, failing-test names in the
gate 10 report), locally, Node 24.16.0 — Playwright 1.63.0 / Chromium
153.0.8010.12 (build 1243), Windows 11. Five rows at the end of the table.
```

Append five rows at the END of the table, one per proof, in this shape (fill the observed columns with what you saw, verbatim, in the same voice as the neighbouring rows):

```markdown
| Detector unit tests — failing names       | `if (s.visibleDescendants === 0)` → `if (false && s.visibleDescendants === 0)` in `scripts/lib/docs-smoke.ts`, `grep -c` = 1 (the gate-17 proof injection re-used) | exit 1, `check-detectors: FAIL`, stderr lists `✖ demo-stage: a stage with nothing visible is red, and names its position` and `✖ never short-circuits: several symptoms are all listed` BEFORE the raw excerpt; `reports/detectors.md` carries `## Failing tests` with both names ahead of `## Output` | exit 0 after `git checkout --`, `check-detectors: PASS (tests 88, pass 88, fail 0)` |
| Detector unit tests — test-output suite   | `return [];` inserted as the first statement of `failingTests` in `scripts/lib/test-output.ts`, `grep -c` = 1 | exit 1, `tests 88, pass 84, fail 4`, the four name-expecting `test-output` cases; the report's `## Failing tests` degrades to `(no test line found …)` — the blinded helper cannot name its own failure, the raw excerpt still does | exit 0 after `git checkout --`, `PASS (tests 88, pass 88, fail 0)` |
| Docs smoke — component page, no stage     | every `class="stage` → `class="stagex` in `docs/components/callout.html` (one stage on that page), `grep -c 'class="stage'` = 0 | exit 1, `FAIL (1)`: `docs/components/callout.html: demo-stage — component page renders no demo stage at all — the template stopped emitting .stage (blueprint §5.2.10)`; the registry and tokens pages (kind other, zero stages by design) still PASS | exit 0 after `git checkout --`, `check-docs-smoke: PASS (4 page(s), Playwright 1.63.0 / Chromium 153.0.8010.12)` |
| Docs smoke — component page, no tile      | every `class="accent-tile` → `class="accent-tilex` in `docs/components/callout.html`, `grep -c 'class="accent-tile'` = 0 | exit 1, `FAIL (1)`: `docs/components/callout.html: accent-tile — component page renders no accent tile at all — the accent axis section is missing` | exit 0 after `git checkout --`, `PASS (4 page(s), …)` |
| Docs smoke — late error inside the window | `<script>setTimeout(function () { throw new Error("late"); }, 50);</script>` inserted before `</body>` in `docs/index.html`, `grep -c` = 1 | exit 1, `FAIL (1)`: `docs/index.html: page-events — page error: late`; the index row carries `1` browser event — thrown 50 ms after load, inside the 250 ms window that did not exist before | exit 0 after `git checkout --`, `PASS (4 page(s), …)` |
```

Then append at the very end of `process/archives/2026-09-16-gate17-follow-ups-design.md` (archives are never rewritten; a dated addendum is the one allowed addition):

```markdown

Addendum 2026-09-16 (execution): the no-stage / no-tile proofs rename the
class (`class="stage` → `class="stagex`) instead of removing the blocks —
same fact for the gate (zero matching elements), well-formed HTML kept.
```

- [ ] **Step 7: Format and commit**

```bash
pnpm exec prettier --write process/PROOF-OF-BLOCKING.md
git branch --show-current
git status --short
git add process/PROOF-OF-BLOCKING.md process/archives/2026-09-16-gate17-follow-ups-design.md
git commit -F - <<'EOF'
docs(proof): gate 17 follow-ups proved red/green — failing names, component-page expectation, settle window

Five injection rows and a dated header paragraph in PROOF-OF-BLOCKING; one
dated addendum on the design record (class renamed instead of blocks removed).

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
EOF
```

Expected: `git status --short` shows only the two files before the add (every injection restored); the commit lands.

---

### Task 4: Whole-branch review, conformity, PR (main session)

- [ ] **Step 1: Conformity on the pushed tree**

```bash
git branch --show-current
pnpm conformity
```

Expected: `conformity: PASS (11 gates) — see reports/conformity.md`, the detectors line `PASS (tests 88, pass 88, fail 0)`.

- [ ] **Step 2: Whole-branch review** — one subagent, read-only, against the design record: spec pass (every section of the record has its code / test / proof row) then quality pass (English, comments truthful, no dead code, prettier clean). Fix findings in a hardening commit, re-run `pnpm conformity`.

- [ ] **Step 3: Trailers, push, PR**

```bash
git log --format="%h %s%n%(trailers)" main..HEAD
```

Every commit ends with `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`; amend any that does not (unpushed only). Then push on its own line, then `gh pr create` (body via `--body-file`, five sections: Summary / Changes / Verification / Flags for review / Session report, ending with the Claude Code line). Louis merges.

---

## Self-review

- **Spec coverage:** design §2 (helper, wiring, tests) → Task 1; §3 (kind, two findings, tests) → Task 2 steps 1–4; §4 (settle window, report sentence) → Task 2 step 5; §5 (five proofs + header) → Task 3; §6 (no paperwork beyond PROOF) → nothing else touched; the "registry unaffected" control is observed in Proof C's row (registry and tokens still PASS).
- **Placeholders:** none — every code step carries its code, every proof its command and expected text.
- **Type consistency:** `PageKind` exported from `docs-smoke.ts`, imported as a type in `check-docs-smoke.ts`; `judgePage(facts, events, kind)` order identical in lib, tests and gate; `failingTests` name identical in helper, suite and gate 10; suite count 80 → 85 after Task 1 (5 cases in `test-output.test.ts`) → 88 after Task 2 (`docs-smoke.test.ts` 12 → 15: one case split in two, two appended); every expected line and proof row uses 85 for Task 1 and 88 from Task 2 on — if a real run differs, the discrepancy is a finding to report, not a number to adjust silently.
