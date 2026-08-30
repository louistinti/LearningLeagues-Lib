# PLAYBOOK — task → command routing

"I want to do X, what do I run?" (For "X just happened, what must I do?" see
`ORCHESTRATION.md`.)

Rule: every gate script, generator and prompt added to this repository gets its
row here **in the same commit**. (Enforced by the playbook anti-drift gate from
Milestone 4.)

| Task                                        | Command / prompt                                        | Exit check                                                  |
| ------------------------------------------- | ------------------------------------------------------- | ----------------------------------------------------------- |
| Format the repository                       | `pnpm format`                                           | `pnpm format:check` exits 0                                 |
| Check formatting (CI gate)                  | `pnpm format:check`                                     | exit 0                                                      |
| Extract tokens from Figma (stage 1)         | `.github/prompts/extract-tokens.prompt.md`              | raw export committed + provenance entry                     |
| Regenerate token artefacts (stages 2–3)     | `pnpm tokens:build`                                     | `pnpm tokens:check` exits 0                                 |
| Check token artefact drift (CI gate)        | `pnpm tokens:check` (= `gate:drift`)                    | exit 0 + `reports/drift.md`                                 |
| Validate theme schema (CI gate)             | `pnpm validate:theme`                                   | exit 0 + `reports/validate-theme.md`                        |
| Diff tokens vs base (CI gate, label-driven) | `pnpm diff:tokens [--base <ref>]`                       | exit 0, or expected-red awaiting `token-approved`           |
| Lint for hardcoded design values            | `pnpm gate:lint-tokens`                                 | exit 0 + `reports/token-lint.md`                            |
| Compute contrast from resolved tokens       | `pnpm gate:contrast`                                    | exit 0 + `reports/contrast.md`                              |
| Check a11y status consistency               | `pnpm gate:a11y`                                        | exit 0 + `reports/a11y-status.md`                           |
| Run EVERY blocking gate (the CI job)        | `pnpm conformity`                                       | exit 0 + `reports/conformity.md`                            |
| Check playbook index (CI gate)              | `pnpm gate:playbook` (part of conformity)               | exit 0 + `reports/playbook-drift.md`                        |
| Run the detectors' unit suite (CI gate)     | `pnpm gate:detectors` (part of conformity)              | exit 0 + `reports/detectors.md`                             |
| Regenerate the documentation site           | `pnpm docs:build`                                       | `node scripts/generate-docs.ts --check` exits 0             |
| Regenerate the consumer dist                | `pnpm dist:build`                                       | `node scripts/generate-dist.ts --check` exits 0             |
| Vendor the dist into a consuming repository | `node scripts/vendor-dist.ts [--write] --target <path>` | dry run by default; `--write` refuses a dirty tree          |
| Scaffold a new component                    | `node scripts/scaffold.ts <Name>`                       | shell created (intentionally red)                           |
| Generate an RFC for a new component         | `.github/prompts/rfc-generation.prompt.md`              | RFC in `draft` + manifest row + closed questions listed     |
| Implement a component from its approved RFC | `.github/prompts/component-generation.prompt.md`        | `pnpm conformity` verdict quoted; RFC arbitration untouched |
| Promote a component (verify, then flip)     | `node scripts/promote.ts <name> <stable\|exported> [--write]` | verify-only by default; `--write` flips + regenerates + commits |

Notes:

- The blueprint's `sync` stage is deferred until a build/dist exists —
  `transform` currently writes the library stylesheet directly.
- `pnpm conformity` is the single required CI step and never short-circuits.
  The token diff gate stays outside it on purpose: expected-red, human label.
- Adding a generator = add it to `GENERATORS` in `scripts/check-drift.ts` in
  the same commit. Adding a gate = add it to `GATES` in
  `scripts/check-conformity.ts`, a row here, and a red/green proof in
  `process/PROOF-OF-BLOCKING.md` — same commit.
- Allowlists (`scripts/*-allowlist.json`) follow the blueprint §5.3 shape and
  load through the validated loader (`scripts/lib/allowlist.ts`).

## Planned (do not invent ahead of the milestone)

- Nothing pending — next items are decided at the next milestone's start.
