# Design — docs-site structural accessibility gate (approved 2026-09-10)

Approved by Louis Tinthilier (design lead) in session, 2026-09-10. Scope: the
executable gate for blueprint §9.2 — "the site … carries structural
accessibility requirements of its own (a skip link as the first focusable
element, landmark elements on every page, table header scopes, a unique
descriptive title per page)" — deferred since the docs-site design record of
2026-08-29 ("the executable gate is planned, not invented ahead of its
milestone"). Gate 9 (PR #22) built the engine; this gate points it at pages.

## Decisions taken (with their arbitration)

| Decision                                   | Choice                                                                                                                                                          | Decided by      |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------- |
| Engine and surface                         | Same jsdom + axe-core runner as gate 9, page-level rules ENABLED, WCAG 2.1 AA + best-practice tags, over every `docs/**/*.html` as shipped (no script executed) | Louis           |
| The four §9.2 requirements                 | Explicit pure checks, not delegated to axe — `landmark-one-main` and `page-has-heading-one` are *incomplete* in jsdom (spike 2026-09-10)                        | Louis           |
| The sidebar `nested-interactive` defect    | Option A: the name stays a link; a separate, named `<summary>` chevron toggles the sections (see §3)                                                           | Louis           |
| Escape hatch                               | None (same as gate 9)                                                                                                                                           | Louis           |
| Visual checkpoint on the sidebar change    | Louis validates the rendered site before the PR (human lock)                                                                                                    | doctrine        |

## 1. Spike (2026-09-10, repo root, axe 4.13.0 / jsdom 30.0.1)

On the three generated pages: one real WCAG violation on every page —
`nested-interactive`, `<summary><a href>…</a></summary>` in the sidebar (a link
inside the disclosure control; two activation targets in one spot). Zero
best-practice violations. `color-contrast`, `landmark-one-main`,
`page-has-heading-one` come back incomplete. Structure otherwise sound: skip
link first focusable, one `<main>`, one `<h1>`, every `<th>` scoped, unique
titles, one named `<nav>`, `<header>`/`<footer>` present.

## 2. The gate — `scripts/check-docs-a11y.ts` (`pnpm gate:docs-a11y`)

- Discovery: every `.html` under `docs/`, recursively, sorted. Zero pages is a
  failure (the site always has at least the registry).
- Each page is loaded with `JSDOM.fromFile` (`runScripts: "outside-only"`,
  silent VirtualConsole, no external resources): the HTML as shipped, the
  no-JS baseline. Scripts are not executed.
- axe via `runAxe(window, { page: true })` — the runner gains an options
  parameter: page mode keeps the page-level rules on and adds the
  `best-practice` tag. Gate 9's fragment behaviour is unchanged (default).
- Every violation is red (rule, impact, help, first node, node count).
  Incomplete ids are visible warnings, never silent.
- Structural checks (pure, `scripts/lib/docs-a11y-checks.ts`, locked in gate
  10), each a finding `{ rule, message, html }`:

| Rule                | Red when                                                                                                                                                  |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `skip-link-first`   | The first focusable element in DOM order is not an `<a href="#…">` whose target exists, or the target is not the page's `<main>`                          |
| `landmarks`         | Not exactly one `<main>`; no `<header>`; no `<nav>`; a `<nav>` without an accessible name (`aria-label` / `aria-labelledby`)                             |
| `table-scopes`      | A `<th>` without `scope` in {`col`,`row`,`colgroup`,`rowgroup`}; a `<table>` without any `<th>`                                                          |
| `page-title`        | Empty `<title>`; no page-specific part before the site suffix (` — LearningLeagues Lib`, read from the page's own `.site-title` text); not exactly one `<h1>`; missing `html[lang]` |
| `unique-title`      | (gate level) two pages share a `<title>`                                                                                                                  |

- Reports: `reports/docs-a11y.md` (per-page table: axe violations, findings,
  verdict; warnings; failures). No JSON sidecar — nothing reads it.
- Wiring, same commit: `GATES` entry "Docs accessibility" after "Accessibility
  engine", PLAYBOOK row, PROOF rows, README gate count 9 → 10.

## 3. The sidebar fix (option A)

Template (`scripts/lib/docs-html.ts`, `sidebar()`), per entry:

```html
<li class="nav-item">
  <a href="…/components/button.html" aria-current="page">Button</a>
  <details open>
    <summary aria-label="Button sections"></summary>
    <ul class="sub">…</ul>
  </details>
</li>
```

The name is a plain link, as before. The `<details>` follows it; its `<summary>`
is an empty, named disclosure control rendered as a chevron and positioned by
CSS on the link's row (`.nav-item { position: relative }`, summary absolute at
top-right, link padded right). The section list still flows below the link.
Native disclosure, no JS, two distinct keyboard targets (Tab to the link, Tab
to the chevron). Same for the Tokens entry. `site.css`: replace `.sidebar
summary a` with the chevron/summary rules; keep every colour a token.

Visual checkpoint: the site is served locally and Louis says go before the PR
opens.

## 4. Proofs (red/green, injection verified, restore only tracked files)

Injections land in a generated page (`docs/index.html`, tracked, restored with
`git checkout --`; the drift gate would red the injection anyway, which the
aggregator proof records honestly):

| Injection                                                  | Expected red                                  |
| ---------------------------------------------------------- | --------------------------------------------- |
| Skip link removed                                          | `skip-link-first` (+ axe `bypass`)            |
| `scope` removed from one `<th>`                            | `table-scopes`                                |
| Second `<main>` appended                                   | `landmarks` (+ axe `landmark-no-duplicate-main`) |
| Title of `docs/tokens.html` set equal to the index title   | `unique-title`, `page-title`                  |
| The old `<summary><a>` nesting restored on one entry       | axe `nested-interactive`                      |
| Aggregator with one of the above                           | `FAIL  Docs accessibility` + drift co-red     |

Green: the regenerated site, every page PASS, incomplete ids listed.

## Out of scope

- Real-browser smoke (gate 17: page renders non-blank in a browser engine).
- Running `site.js` (scrollspy, tabs, switchers) under the audit — the shipped
  HTML is the no-JS baseline; scripted states are a later concern.
- The component fragment checks of gate 9 on the docs' shell controls.
