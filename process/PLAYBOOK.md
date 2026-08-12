# PLAYBOOK — task → command routing

"I want to do X, what do I run?" (For "X just happened, what must I do?" see
`ORCHESTRATION.md`.)

Rule: every gate script, generator and prompt added to this repository gets its
row here **in the same commit**. (Enforced by the playbook anti-drift gate from
Milestone 4.)

| Task                                        | Command / prompt                    | Exit check                                        |
| ------------------------------------------- | ----------------------------------- | ------------------------------------------------- |
| Format the repository                       | `pnpm format`                       | `pnpm format:check` exits 0                       |
| Check formatting (CI gate)                  | `pnpm format:check`                 | exit 0                                            |
| Extract tokens from Figma (stage 1)         | `scripts/extract-tokens/extract.md` | raw export committed + provenance entry           |
| Regenerate token artefacts (stages 2–3)     | `pnpm tokens:build`                 | `pnpm tokens:check` exits 0                       |
| Check token artefact drift (CI gate)        | `pnpm tokens:check`                 | exit 0                                            |
| Validate theme schema (CI gate)             | `pnpm validate:theme`               | exit 0 + `reports/validate-theme.md`              |
| Diff tokens vs base (CI gate, label-driven) | `pnpm diff:tokens [--base <ref>]`   | exit 0, or expected-red awaiting `token-approved` |

Note: the blueprint's `sync` stage is deferred until a build/dist exists —
`transform` currently writes the library stylesheet directly. The gate
aggregator (one per-component report) arrives with Milestone 3.

## Planned (do not invent ahead of the milestone)

- Milestone 3: token lint, computed contrast, accessibility status gates,
  artefact drift, the aggregator (single required CI job).
- Milestone 4: RFC prompts, deterministic scaffold, state manifest, playbook
  anti-drift gate.
