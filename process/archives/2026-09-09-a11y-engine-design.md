# Design — accessibility engine gate (approved 2026-09-09)

Approved by Louis Tinthilier (design lead) in session, 2026-09-09. Scope: the
blueprint's gate 9 — "Accessibility engine + keyboard suite, auto-discovered
over every component × variant × mode" (`2026-08-12-system-blueprint.md` §5.1
row 9) — for the component surface only. The docs-site structural gate (skip
link, landmarks, table scopes, unique titles) stays a separate, later PR.

Why now: `pnpm promote button stable` is blocked on exactly one criterion —
the Button contract's `a11y.status` is `pending`, and its own notes say the
status "moves to pass only through the accessibility engine gate, never by
assertion" (PR #20/#21 flags). This gate is that engine.

## Decisions taken (with their arbitration)

| Decision                                     | Choice                                                                                                                                       | Decided by      |
| -------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | --------------- |
| Rendering environment for the engine         | jsdom + axe-core (simulated DOM, no browser binary) — the blueprint's own choice for every suite except the docs smoke (gate 17)              | Louis           |
| Mission scope                                | Component gate only; the docs-site structural gate is the next small PR                                                                      | Louis           |
| Who flips `a11y.status` pending → pass       | The promotion script (`pnpm promote … --write`), after executing the engine gate — never a hand edit, never the gate itself                 | Louis           |
| Gate shape                                   | Generic auto-discovered checks on the existing SSR render + an optional per-component `<Name>.a11y.test.ts` behaviour suite run by the gate | Louis           |
| Dependency placement                         | `axe-core` 4.13.0 and `jsdom` 30.0.1 as root devDependencies, exact pins like esbuild; dev-only, outside the consumer path                   | agent (flagged) |
| Page-level axe rules disabled for fragments  | Explicit, documented list (see §2) — the spike showed them firing on any bare fragment                                                       | agent (flagged) |

## 1. Surface and matrix

Discovery mirrors the docs generator: every folder under
`packages/ui/src/components/` carrying a `contract.json`, sorted. For each
component, every `meta.examples` entry is rendered under every accent value
read from `tokens.json` (`Primitives/accent/*` — never hand-listed). Variants
are covered through the examples, exactly as the docs site covers them; a
component whose examples miss a variant is a docs-completeness defect, not
this gate's.

- A component without examples is a failure (unverified surface), not a skip.
- Zero components: the gate passes vacuously and says so in the report, like
  `check-a11y-status`.
- The gate reports every component and never short-circuits (§5.2.7).

## 2. Rendering and engine

HTML comes from `scripts/lib/docs-render.ts` (esbuild + `react-dom/server`
over the real component — axiom 4, never an approximation). Each rendered
example is mounted in a fresh jsdom window:

- `<html lang="en" data-accent="<value>">`, a `<title>`, and a `<style>`
  holding `tokens.css` + the component's own stylesheets, so style-reading
  rules see the library's real CSS.
- axe-core runs with `runOnly` tags `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`.
- Page-level rules are disabled by name because the audited unit is a
  fragment, not a page: `region`, `bypass`, `landmark-one-main`,
  `page-has-heading-one`. The list lives in one constant with this rationale;
  the docs-site gate will run those rules on real pages.
- Every axe **violation** is red, with rule id, impact, and the failing node's
  HTML in the report.
- Every axe **incomplete** result is a visible warning, never silent. The
  known one is `color-contrast`: axe cannot compute it without layout, and the
  contrast gate already proves it from resolved tokens. A new incomplete id
  appearing is information for the reviewer, not a pass.

Spike result (2026-09-09, scratchpad, Node 24.16 / axe 4.13.0 / jsdom 30.0.1):
`button-name`, `link-name`, `tabindex`, `aria-command-name`,
`aria-valid-attr-value` produce violations under jsdom; `aria-hidden-focus`
and `color-contrast` come back incomplete; `focus()` sets
`document.activeElement`.

## 3. Generic keyboard checks

Pure functions in `scripts/lib/a11y-checks.ts`, applied to every rendered
fragment, each returning a finding with a rule id and the node's HTML:

| Rule                     | Red when                                                                                                                       |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| `focusable`              | An interactive element (`a[href]`, `button`, `input`, `select`, `textarea`, `[role=button/link/menuitem/tab/checkbox/…]`) is neither natively focusable nor `tabindex="0"` |
| `no-positive-tabindex`   | Any `tabindex` > 0                                                                                                             |
| `focus-lands`            | `element.focus()` does not make it `document.activeElement`                                                                   |
| `focus-visible-styled`   | The component's CSS has no `:focus-visible` rule targeting the interactive element's class                                    |
| `hidden-focusable`       | A focusable element sits inside `[aria-hidden="true"]` (axe cannot decide this in jsdom — our rule closes the gap)             |

Documented limitation, frozen as a test: static markup carries no event
handlers (React emits none), so a `<div>` acting as a button is invisible to
the generic checks. Behaviour is proved by the local suite (§4), and the RFC's
§4.1 commitment to native elements is the reviewer's check.

These functions join the detector unit suite (gate 10): `check-detectors.ts`
runs a list of suites instead of one file, and `a11y-checks.test.ts` locks
each rule and each documented limitation.

## 4. Local behaviour suite

An optional `<Name>.a11y.test.ts` next to the component, discovered by the
gate and run with `node --test`; its output is folded into the gate report.
Helper `scripts/lib/a11y-mount.ts` mounts a component with `react-dom/client`
inside jsdom (act environment) so tests can dispatch events and read the live
DOM.

Button's suite: no `href` renders `<button type="button">`; `href` renders
`<a href>` and ignores `type`; `onClick` fires on a dispatched click in both
renderings; both renderings are focusable.

A component without a local suite is not red — the generic checks are the
floor. A red local suite is red for the gate.

## 5. Wiring and the flip

- `scripts/check-a11y-engine.ts`, alias `pnpm gate:a11y-engine`, report
  `reports/a11y-engine.md`: one row per component × accent × example, a
  per-component verdict block, warnings (incomplete ids), failures.
- Same commit: `GATES` entry in `check-conformity.ts` ("Accessibility
  engine"), PLAYBOOK row, PROOF-OF-BLOCKING rows (§6), STATE-MANIFEST
  promotion criteria list gains "a11y engine".
- The gate also writes `reports/a11y-engine.json` (per-component verdict +
  counts) next to the markdown report, so a script can read the verdict
  without parsing prose.
- `scripts/promote.ts` gains one criterion: "accessibility engine green for
  this component" — read from `reports/a11y-engine.json` right after the
  conformity criterion has executed the gate in the same run (never from a
  stale report: the timestamp in the JSON must postdate the run's start).
  With `--write`, when the contract's
  `a11y.status` is `pending` and the engine is green, the script sets it to
  `pass` in the same write as the status flip. `check-a11y-status` is
  unchanged; its notes-contradiction check still applies to the flipped
  contract.
- Dependencies declared in the root manifest only (dev-only; `packages/ui`
  has no devDependencies and the consumer path never loads them). Bump policy
  flagged in the PR body per ORCHESTRATION.

## 6. Proofs (red/green, injection verified before the verdict — L04, L08)

| Injection                                                       | Expected red                                           |
| --------------------------------------------------------------- | ------------------------------------------------------ |
| A contract example with empty `children`                        | axe `button-name` (and `link-name` for the href example) |
| `tabIndex={1}` on the rendered element                          | `no-positive-tabindex` (and axe `tabindex`)            |
| `:focus-visible` rule removed from `button.css`                 | `focus-visible-styled`                                 |
| `aria-hidden="true"` wrapper around the rendered element        | `hidden-focusable` (axe alone stays incomplete)        |
| `onClick` not forwarded on the `<a>` rendering                  | local suite red, gate red                              |

Green: the real Button under the five accents, then `pnpm promote button
stable` moving from "BLOCKED on a11y pending" to "READY". Restores use
`git checkout --` only on tracked files with no uncommitted work (L08).

## Out of scope (deliberately)

- Docs-site structural gate — next PR, reusing jsdom (no axe page rules yet).
- Real-browser keyboard activation (Enter/Space on native elements) — a
  browser behaviour, not a DOM one; arrives with gate 17's engine if ever.
- Hover/active forced states — colour-only differences, owned by the
  contrast gate.
- A selected/aria-current Button state — the pilot's product ask, returns via
  RFC.

## Addendum — proof findings (2026-09-09)

Injection B (positive tabindex) showed axe's `tabindex` rule never fires under
the gate's WCAG tags: it carries only `cat.keyboard` and `best-practice`. The
generic `no-positive-tabindex` check is therefore the only coverage for that
defect (PROOF-OF-BLOCKING, "A11y engine — positive tabindex"). §2 and §6 above
are kept as written; this note corrects the expectation.
