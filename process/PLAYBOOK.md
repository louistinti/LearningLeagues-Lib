# PLAYBOOK — task → command routing

"I want to do X, what do I run?" (For "X just happened, what must I do?" see
`ORCHESTRATION.md`.)

Rule: every gate script, generator and prompt added to this repository gets its
row here **in the same commit**. (Enforced by the playbook anti-drift gate from
Milestone 4.)

| Task                       | Command / prompt    | Exit check                  |
| -------------------------- | ------------------- | --------------------------- |
| Format the repository      | `pnpm format`       | `pnpm format:check` exits 0 |
| Check formatting (CI gate) | `pnpm format:check` | exit 0                      |

## Planned (do not invent ahead of the milestone)

- Milestone 2: token pipeline (`extract` → `normalize` → `transform` → `sync`),
  schema gate, token-diff gate, provenance log.
- Milestone 3: token lint, computed contrast, accessibility status gates,
  artefact drift, the aggregator (single required CI job).
- Milestone 4: RFC prompts, deterministic scaffold, state manifest, playbook
  anti-drift gate.
