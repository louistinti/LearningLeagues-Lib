# PLAYBOOK — task → command routing

"I want to do X, what do I run?" (For "X just happened, what must I do?" see
`ORCHESTRATION.md`.)

Rule: every gate script, generator and prompt added to this repository gets its
row here **in the same commit**. (Enforced by the playbook anti-drift gate,
`pnpm gate:playbook`.)

| Task                                                 | Command / prompt                                                        | Exit check                                                                                                                         |
| ---------------------------------------------------- | ----------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Format the repository                                | `pnpm format`                                                           | `pnpm format:check` exits 0                                                                                                        |
| Check formatting (CI gate)                           | `pnpm format:check`                                                     | exit 0                                                                                                                             |
| Extract tokens from Figma (stage 1)                  | `.github/prompts/extract-tokens.prompt.md`                              | raw export committed + provenance entry                                                                                            |
| Regenerate token artefacts (stages 2–3)              | `pnpm tokens:build`                                                     | `pnpm tokens:check` exits 0                                                                                                        |
| Check token artefact drift (CI gate)                 | `pnpm tokens:check` (= `gate:drift`)                                    | exit 0 + `reports/drift.md`                                                                                                        |
| Validate theme schema (CI gate)                      | `pnpm validate:theme`                                                   | exit 0 + `reports/validate-theme.md`                                                                                               |
| Diff tokens vs base (CI gate, label-driven)          | `pnpm diff:tokens [--base <ref>]`                                       | exit 0, or expected-red awaiting `token-approved`                                                                                  |
| Lint for hardcoded design values                     | `pnpm gate:lint-tokens`                                                 | exit 0 + `reports/token-lint.md`                                                                                                   |
| Compute contrast from resolved tokens, per accent    | `pnpm gate:contrast`                                                    | exit 0 + `reports/contrast.md`                                                                                                     |
| Check a11y status consistency                        | `pnpm gate:a11y`                                                        | exit 0 + `reports/a11y-status.md`                                                                                                  |
| Run the a11y engine + keyboard suite (CI gate)       | `pnpm gate:a11y-engine` (part of conformity)                            | exit 0 + `reports/a11y-engine.md` + `.json`                                                                                        |
| Add a component's keyboard behaviour suite           | `<Name>.a11y.test.ts` next to the component (see `Button.a11y.test.ts`) | picked up by `pnpm gate:a11y-engine`; red suite = red gate                                                                         |
| Audit the docs site's accessibility (CI gate)        | `pnpm gate:docs-a11y` (part of conformity)                              | exit 0 + `reports/docs-a11y.md`                                                                                                    |
| Smoke-test the docs site in a real browser (CI gate) | `pnpm gate:docs-smoke` (part of conformity)                             | exit 0 + `reports/docs-smoke.md`; once per machine: `pnpm exec playwright install chromium`                                        |
| Run EVERY blocking gate (the CI job)                 | `pnpm conformity`                                                       | exit 0 + `reports/conformity.md`                                                                                                   |
| Check playbook index (CI gate)                       | `pnpm gate:playbook` (part of conformity)                               | exit 0 + `reports/playbook-drift.md`                                                                                               |
| Run the detectors' unit suite (CI gate)              | `pnpm gate:detectors` (part of conformity)                              | exit 0 + `reports/detectors.md`                                                                                                    |
| Regenerate the documentation site                    | `pnpm docs:build`                                                       | `node scripts/generate-docs.ts --check` exits 0                                                                                    |
| Regenerate the consumer dist                         | `pnpm dist:build`                                                       | `node scripts/generate-dist.ts --check` exits 0                                                                                    |
| Vendor the dist into a consuming repository          | `node scripts/vendor-dist.ts [--write] --target <path>`                 | dry run by default; `--write` refuses a dirty tree or a product page that runs JSX without loading the library (L11)               |
| Scaffold a new component                             | `node scripts/scaffold.ts <Name>`                                       | shell created (intentionally red)                                                                                                  |
| Generate an RFC for a new component                  | `.github/prompts/rfc-generation.prompt.md`                              | RFC in `draft` + manifest row + closed questions listed                                                                            |
| Implement a component from its approved RFC          | `.github/prompts/component-generation.prompt.md`                        | `pnpm conformity` verdict quoted; RFC arbitration untouched                                                                        |
| Promote a component (verify, then flip)              | `pnpm promote <name> <stable\|exported> [--write]`                      | verify-only by default; `--write` flips + regenerates + commits (run via pnpm: the conformity criterion shells out to `pnpm exec`) |

Notes:

- The blueprint's `sync` stage (a fourth executable overwriting the library
  stylesheet) was never built and is not planned: `transform` writes
  `tokens.css` directly, and `pnpm dist:build` (since 2026-08-30) concatenates
  it for consumers. Revisit only if the transform output ever stops being the
  library stylesheet.
- `pnpm conformity` is the single required CI step and never short-circuits.
  The token diff gate stays outside it on purpose: expected-red, human label.
- Adding a generator = add it to `GENERATORS` in `scripts/check-drift.ts` in
  the same commit. Adding a gate = add it to `GATES` in
  `scripts/check-conformity.ts`, a row here, and a red/green proof in
  `process/PROOF-OF-BLOCKING.md` — same commit.
- Allowlists (`scripts/*-allowlist.json`) load through the validated loader
  (`scripts/lib/allowlist.ts`), which defines their shape: a `description` and
  `entries[]` of `{ scope, reason, approvedBy, added, expires }`.
- Gate numbers in script headers, CI comments and `PROOF-OF-BLOCKING.md`
  ("gate 9", "gate 10", "gate 14", "gate 17") are the row numbers of the
  archived blueprint's gate table (§5.1), kept as stable names — not a rank
  among the 11 gates of `pnpm conformity`.
- "Milestone 1–5" in commit history and archives are the blueprint's delivery
  steps (foundations, tokens, gates, circuit, first component), all delivered
  by 2026-08-26. There is no milestone plan after them: the next piece of work
  is whatever the design lead ranks first (priority is a human lock).

## Planned (do not invent ahead of the design lead's priority)

- Nothing pending. Open work is read from the state manifest (a row "awaiting
  promotion") and from `process/LEARNINGS.md` (Active entries).
