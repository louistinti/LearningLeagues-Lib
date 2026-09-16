# Design — gate 17 follow-ups (approved 2026-09-16)

Approved by Louis Tinthilier (design lead) in session, 2026-09-16. Scope: the
three mechanical follow-ups the gate 17 PR (#33) left on the table — none needs
a Figma write or a doctrine arbitration, all three harden gates that already
exist: the gate 10 report under a red suite, the smoke gate's per-component-page
expectation, and the smoke gate's judgement window. No new gate, no new
dependency, no allowlist. The two other follow-ups (real-browser keyboard
activation; axe in the browser) stay separate: one is its own design, the other
an arbitration.

## Decisions taken (with their arbitration)

| Decision                         | Choice                                                                                                                                                                                                                                                              | Decided by      |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------- |
| Priority for this session        | These three follow-ups over the third component (blocked: no `Docs / Tag` page in Figma yet) and the `Docs / Button` refresh (a Figma write with no Button change to justify it)                                                                                    | Louis           |
| Scope                            | All three in one PR — the third (judgement window) included although the docs pages run only synchronous script: the gate should not depend on that staying true                                                                                                    | Louis           |
| Strength of the per-page rule    | At least one demo stage AND at least one accent tile on a component page — not the exact counts from the sources: the gate keeps reading rendered HTML only, and the drift gate already proves the HTML equals its sources                                          | Louis           |
| Page kind                        | Derived by the gate from the path (`docs/components/*.html` = component page, everything else = other) and passed to the pure judgement — no DOM marker, no source read                                                                                              | agent (flagged) |
| Judgement window                 | A fixed settle of 250 ms after `load` (`SETTLE_MS`), events raised inside it count — not `networkidle`, which under `file://` measures nothing beyond a 500 ms idle                                                                                                   | agent (flagged) |
| Failing-test extraction          | A pure helper `failingTests(output)` in its own module with its own suite, added to gate 10's `SUITES` — the doctrine (detectors locked by tests) applies to a report helper too                                                                                    | agent           |

## 1. Facts measured (2026-09-16, Node 24.16.0)

- `node --test` output formats, captured on a synthetic red suite (one green
  test, one red test, one red test nested in a `describe`):
  - **spec reporter** (the default under Node 24, even when piped — verified:
    `node --test red.test.mjs | head` prints `✔` / `✖`): each red test is a line
    `✖ <name> (<ms>ms)`, indented when nested; a suite holding a red test is
    itself a line `✖ <suite name> (<ms>ms)`; after the `ℹ tests/pass/fail`
    summary, a section headed `✖ failing tests:` repeats each red test line
    followed by its assertion detail. So a red name appears twice.
  - **tap reporter** (`--test-reporter=tap`): each red test is a line
    `not ok <n> - <name>`, indented when nested; the summary is `# tests 3` /
    `# fail 2`. The existing summary regex in `check-detectors.ts` already
    accepts both `ℹ` and `#` prefixes.
- The detectors gate today: `output.slice(0, 4000)` in the report,
  `output.slice(0, 2000)` on stderr — under a red suite the assertion details
  of the first failure alone can exceed 2000 chars, pushing later names out.
- Component pages today: `docs/components/button.html` has 5 `.stage` and 5
  `.accent-tile`; `callout.html` has 1 and 5. The registry and tokens pages
  have none of either. The generator refuses an empty `meta.examples`
  (`generate-docs.ts`: "must hold at least one example"), so a page with zero
  stages can only come from a template change — the residual gap this closes.
- `docs/assets/site.js` registers event listeners only (click, hashchange,
  scroll); no timer, no promise, no fetch. The window extension therefore
  changes no verdict today; it protects the gate against a future async
  script.

## 2. Gate 10 report — `scripts/lib/test-output.ts` + `scripts/check-detectors.ts`

New pure module `scripts/lib/test-output.ts`:

```ts
// Failing test names out of `node --test` output, both reporters Node emits:
// spec (`✖ name (1.2ms)`, the default) and tap (`not ok 3 - name`). Deduped in
// order of first appearance (spec repeats each red test under "failing
// tests:"); the "✖ failing tests:" header itself is not a test. A suite line
// (`✖ group`) counts: a suite holding a red test is red.
export function failingTests(output: string): string[]
```

Rules: a line matches `/^\s*✖ (.+?)(?: \(\d+(?:\.\d+)?ms\))?$/` or
`/^\s*not ok \d+ - (.+)$/`; the captured name is trimmed; `failing tests:` is
excluded; duplicates dropped, first occurrence wins; the result preserves
output order. Empty output → `[]`.

`check-detectors.ts` changes only what it writes when red: the report gains a
`## Failing tests` section (one `- name` per line) placed BEFORE the existing
`## Output` block (unchanged, still `slice(0, 4000)`); stderr prints the
failing names first, then the existing `slice(0, 2000)` excerpt. When the
helper finds no name under a red run (a crash before any test ran), the
section says `(no test line found — see Output)` so the reader is not misled.
`SUITES` gains `scripts/lib/test-output.test.ts` (one line, per the file's own
rule).

Tests (`scripts/lib/test-output.test.ts`): spec sample → the two names in
order, nested name included, no header, no duplicate; tap sample → the two
names; a green run (`✔` only) → `[]`; empty string → `[]`; a suite line is
listed.

## 3. Per-component-page expectation — `scripts/lib/docs-smoke.ts`

`judgePage(facts, events, kind: PageKind = "other")` with
`export type PageKind = "component" | "other"`. Two new findings, both after
the per-stage / per-tile loops (which stay as they are):

- `kind === "component" && facts.stages.length === 0` →
  `{ rule: "demo-stage", message: "component page renders no demo stage at all — the template stopped emitting .stage (blueprint §5.2.10)" }`
- `kind === "component" && facts.tiles.length === 0` →
  `{ rule: "accent-tile", message: "component page renders no accent tile at all — the accent axis section is missing" }`

`collectFacts` is untouched (it already returns every stage and tile). The
gate derives the kind: `posix(page).startsWith("docs/components/") ? "component" : "other"`
(the constant `DOCS` prefix, not a hard-coded string twice), and passes it.
The report's header sentence gains "component pages must render at least one
demo stage and one accent tile".

Tests (`docs-smoke.test.ts`): a component page with `stages: []` reds
`demo-stage` naming "no demo stage at all"; with `tiles: []` reds
`accent-tile`; both empty → both findings (never short-circuits); the existing
"a page without stages (registry, tokens) is not red" case is kept and made
explicit with `"other"`; the default kind is `"other"` (calling with two
arguments still passes for the registry facts).

## 4. Judgement window — `scripts/check-docs-smoke.ts`

After `await tab.goto(url, { waitUntil: "load" })`:
`await tab.waitForTimeout(SETTLE_MS)` with `const SETTLE_MS = 250` next to
`VIEWPORT`, commented: "errors thrown asynchronously after load are judged if
they land inside this window; the docs pages run only synchronous script
today, the window is insurance, not a wait for anything". The event listeners
are already attached before `goto`, so nothing else changes. The report header
sentence names the window (`load + 250 ms`). Cost: ~1 s over four pages.

## 5. Proofs (red/green, injection verified, restore only tracked files)

| Gate                                    | Injection                                                                                                                                              | Expected red                                                                                                  |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------- |
| Detector unit tests — failing names     | `if (s.visibleDescendants === 0)` → `if (false && …)` in `docs-smoke.ts` (the gate-17 proof row, re-used), `grep -c` = 1                               | `reports/detectors.md` has `## Failing tests` listing both `demo-stage` test names BEFORE `## Output`; stderr lists them first |
| Detector unit tests — test-output suite | `failingTests` returns `[]` unconditionally, verified landed                                                                                            | gate 10 red naming the `test-output` tests                                                                    |
| Docs smoke — component page, no stage   | every `<div class="stage">…</div>` block removed from `docs/components/callout.html` (it has one), `grep -c 'class="stage"'` = 0                        | `demo-stage — component page renders no demo stage at all`                                                    |
| Docs smoke — component page, no tile    | the whole accent-tile row removed from `callout.html`, `grep -c 'class="accent-tile"'` = 0                                                             | `accent-tile — component page renders no accent tile at all`                                                  |
| Docs smoke — late error                 | `<script>setTimeout(function () { throw new Error("late"); }, 50);</script>` inserted before `</body>` in `docs/index.html`, `grep -c` = 1             | `page-events — page error: late`                                                                              |
| Docs smoke — registry unaffected        | nothing injected: the registry and tokens pages (kind `other`) stay green with zero stages and tiles                                                   | `PASS` (green control)                                                                                        |

Restores by `git checkout --` on the injected tracked file (no other change on
it, L08). Each row lands in `process/PROOF-OF-BLOCKING.md` with a header
paragraph "Docs-smoke and detectors re-proof: 2026-09-16 (component-page
expectation, settle window, failing-test names)".

## 6. Paperwork

No new gate → README gate count, PLAYBOOK rows, `GATES`, STATE-MANIFEST
untouched. The gate 10 suite count in the report grows by the new suite. The
PR body follows the five-section template; commits regenerate nothing (no
generated artefact depends on these scripts).

## Out of scope (deliberately)

- Real-browser keyboard activation of components (Enter/Space) — its own
  design; the natural next use of this engine.
- axe in the real browser — would double gate 10 and the contrast gate on
  the same rules; arbitrate first.
- Exercising `site.js` (accent switchers, tabs, scrollspy) in the browser.
- Raising or removing the 4000 / 2000 truncation — the names are the
  information; the raw excerpt stays an excerpt.
- Exact stage/tile counts from the sources (rejected above).

Addendum 2026-09-16 (execution): the no-stage / no-tile proofs rename the
class (`class="stage` → `class="stagex`) instead of removing the blocks —
same fact for the gate (zero matching elements), well-formed HTML kept. Two
review outcomes went beyond §3–§4: `judgePage` takes the kind with NO default
(a permissive default on a gate rule would let a future caller get the
lenient branch silently), and the gate is red when `docs/components/` holds
no page at all (the expectation could otherwise vanish by path drift). The
report table gained a Kind column.
