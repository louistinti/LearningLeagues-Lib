# HYGIENE-AUDIT — the recurring pass against stale files

Axiom 6 (`AGENTS.md`): a stale file is active misinformation. This pass runs
after every major session (ORCHESTRATION: "You finished a major session") and
before that session's last PR. It is a procedure, not a gate: the drift gate
catches generated artefacts, nothing catches prose that stopped being true.

## The four steps

1. **Inventory** — the agent scans the surfaces below and lists every line
   that no longer matches the repository's real state, with the fact that
   contradicts it.
2. **Plan** — one line per fix: file, what changes, why. Deletions are listed
   apart, with what the deletion loses.
3. **Approval** — the human approves the plan. Deletions are a human lock
   (`AGENTS.md`, human locks); an unapproved deletion is never executed.
4. **Execute** — one PR, edits only as planned, `pnpm conformity` executed,
   a row added to the log below.

## Surfaces to scan

| Surface                                | What goes stale there                                                                                  |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `README.md` Status                     | component count, gate count, milestone wording                                                         |
| `AGENTS.md` axioms and rules           | "planned" annotations naming gates or files that now exist — or still do not                           |
| `process/PLAYBOOK.md` Planned section  | items delivered or dropped                                                                             |
| `process/LEARNINGS.md`                 | an Active entry whose named gate now exists (move to Archive, gate named verbatim)                     |
| `packages/ui/src/STATE-MANIFEST.md`    | owner / branch / PR left on a row after its merge; notes contradicting the contract                    |
| `process/PROOF-OF-BLOCKING.md` header  | "last full run" dates after a detector or scan-surface change                                          |
| Generated artefacts (`docs/`, `dist/`) | regenerated in the same commit as their source — the drift gate proves it, the pass re-runs it         |
| Git                                    | one worktree, no orphan local branch, no stale remote branch, `.gitignore` covering session-local dirs |
| Memory / session notes (agent-side)    | consolidated, not accumulated                                                                          |

`process/archives/` is never edited by this pass: dated records stay verbatim
(a dated addendum is the only allowed addition).

## Log

| Date       | Session                                  | Fixes                                                                                                                                           | Deletions |
| ---------- | ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| 2026-08-30 | post-tokens audit (PR #15)               | README refresh, generated-files table, manifest row                                                                                             | none      |
| 2026-09-11 | gate 9 → Callout circuit → L11 (this PR) | README status (two exported components, docs-page convention, 10 gates); AGENTS.md: token-lint and language-gate annotations, this file created | none      |
