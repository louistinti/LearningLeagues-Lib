# Design — Button product adoption, pilot 1 (approved 2026-08-30)

Approved by Louis Tinthilier in session, 2026-08-30. Scope: the first run of
the blueprint §8 product-adoption playbook — Button into the LearningLeagues
site — adapted to a buildless host (React UMD + Babel standalone, no install).
This is also the pilot that writes the adapted playbook by being run (§8.4:
the playbook improves by being executed).

## Decisions taken (with their arbitration)

| Decision                                  | Choice                                                                                                        | Decided by |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------- | ---------- |
| Consumption mechanism (phase-1 pin, adapted) | Generated vendored dist: `pnpm dist:build` (esbuild — types stripped, JSX preserved, `window.LL` globals) + `vendor-dist.ts` copying into the product at a named commit pin | Louis      |
| Pilot scope                               | `landing.jsx` + `ds-patterns.jsx` (the 4 real product usages); `ds-components.jsx` handled by the next row     | Louis      |
| Site DS showcase button section           | Retired — it links to the library docs site's Button page (forced states included); kills the `.is-hover` need | Louis      |
| Where dist lives                          | Committed `dist/` at the repo root (drift-gated like docs/), `.gitignore` entry removed                        | agent (flagged) |

## Measured baseline (2026-08-30)

8 `.btn-primary`/`.btn-ghost` JSX usages: 3 in `landing.jsx` (two hero `<a>`,
one showcase CTA `<a class="btn-primary showcase-cta">`), 1 in
`ds-patterns.jsx`, 4 in `ds-components.jsx` (showcase specimens, two with
`.is-hover`). CSS: `styles.css:1478-1521` + `.is-hover` mirrors in
`design-system.css`. The RFC's `quiz-app.jsx` no longer exists under that
name — re-measure at migration time. `.showcase-cta` is product layout
(`align-self: flex-start`): a product-side wrapper, not a compensation.

## The two human-blocking checkpoints (§8.1, unchanged)

1. Visual — the site run for real, named screen list, explicit go.
2. Push — nothing leaves the machine toward the product repository without an
   explicit go; the push itself is Louis's gesture (human lock).

## Product-side artefacts (created during the pilot, in the product repo)

`lib/ll-lib.css` + `lib/ll-lib.jsx` (vendored, pin header), a feedback file
for library gaps (§8.4 — none expected for Button v1), `DS-WORKAROUND #N`
markers if any compensation is needed, and the session log entry. Scaffold
generators (§8.2) are deferred: one component, first pilot — file the gap
instead of inventing the machinery early.
