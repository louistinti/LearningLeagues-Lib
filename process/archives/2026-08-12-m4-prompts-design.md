# M4 prompts — design record (2026-08-12)

> Dated snapshot: the design agreed before writing the RFC-generation and
> component-generation prompts (milestone 4, item 17 — the last deferred piece
> of commit 0f499f6). History, not instructions: the prompts themselves,
> `PLAYBOOK.md` and `PROOF-OF-BLOCKING.md` are the living sources.

## Scope

Two prompt files and their index entries. Out of scope, decided explicitly:
detector unit tests (gate 10, separate lot) and any mechanical
"RFC approved" gate script (deferred — see Arbitrations).

## Arbitrations (human: Louis Tinthilier)

1. **Prompt location: `.github/prompts/*.prompt.md`** per the blueprint (§2),
   overriding the de facto `scripts/` placement. Consequence: the playbook
   anti-drift gate extends its scan surface to `.github/prompts/`.
2. **`scripts/extract-tokens/extract.md` migrates** to
   `.github/prompts/extract-tokens.prompt.md` in the same lot (separate
   commit), restoring "one location for per-operation executable pipelines".
3. **"RFC approved" is verified at prompt level**, not by a new gate script.
   The prompt reads the RFC `Status:` line and refuses with "RFC not approved"
   as its first blocking step (blueprint §4.1). The mechanical check lands
   later in the planned promotion script, which owns status semantics; a gate
   added now would have to special-case intentionally-red scaffolds (draft
   RFCs) and would duplicate that future logic. Recorded in
   `LEARNINGS-ACTIVE.md` with the gate that does not exist yet.

## Commit A — migration and scan surface

- `git mv scripts/extract-tokens/extract.md .github/prompts/extract-tokens.prompt.md`;
  update every reference (`PLAYBOOK.md` row, `AGENTS.md` generated-files table).
- Extend `scripts/check-playbook-drift.ts`: also walk `.github/prompts/`,
  pattern `*.prompt.md`. Keep the existing `scripts/` patterns.
- Scan-surface change ⇒ re-prove the gate red/green and update
  `process/PROOF-OF-BLOCKING.md` (ORCHESTRATION trigger: "You touched a gate's
  detector or scan surface"). Proof injection verified to have landed before
  the verdict is trusted (L04).

## Commit B — the two prompts

Both follow the blueprint §7.2 anatomy: Usage / Required inputs / Step 0
read-context (BLOCKING) / numbered steps / Final Summary with **Decisions made
autonomously** / Never. Both state the missing-input rule: STOP and report,
never improvise.

### `rfc-generation.prompt.md` — circuit steps 1–4

- Inputs: component name (mandatory), Figma design node (mandatory),
  consuming repositories (optional — if absent, RFC §2 records
  "source unavailable" and the prompt reports it; it does not invent metrics).
- Step 0 (BLOCKING): read, in order, `process/PROJECT-CONTEXT.md`,
  `AGENTS.md`, `process/LEARNINGS-ACTIVE.md`, `process/ORCHESTRATION.md`,
  `process/PLAYBOOK.md`, the state manifest.
- Claim ownership in the state manifest registry **before** branching.
- Pre-fill only the `AGENT PRE-FILL` blocks of `process/templates/RFC-BLANK.md`.
- Cross-reference design intent vs measured product usage, then **STOP** for
  human arbitration; the arbitration is recorded verbatim in the RFC.
- Never: fill `HUMAN ONLY` blocks (§5, §6), set status to `approved`,
  improvise a missing extraction value.

### `component-generation.prompt.md` — circuit steps 5–8

- Step 1 (BLOCKING, first): read the RFC `Status:` line; anything other than
  `approved` ⇒ refuse, report "RFC not approved", execute nothing else.
- Step 2: confirm ownership in the state manifest; run
  `git branch --show-current` and confirm it matches intent.
- Step 3: `node scripts/scaffold.ts <Name>`; fix the intentional red in order
  token-lint → contrast → contract.json → RFC (existing ORCHESTRATION trigger).
- Steps 4–6: implement to the RFC's API (any API deviation goes back to the
  RFC — never a silent change), fill `contract.json` in full (accessibility
  included), run `pnpm conformity` and quote the executed verdict.
- Never: modify the RFC's API sections during implementation, write a token by
  hand, add an allowlist entry (human-only).

## Commit 0 — pre-existing red found while proving the baseline (added 2026-08-12)

`pnpm format:check` was red at HEAD (0f499f6), discovered when verifying the
baseline for this lot. Two causes, fixed in a preliminary commit:

- `scaffold.ts` emits JSX in `<Name>.meta.ts`; prettier's TS parser rejects
  JSX in `.ts` (SyntaxError, exit 2). Not one of the scaffold's documented
  intentional violations ⇒ needs-fixing-red. Fix: express the intentional
  token-lint violation without JSX (`export const exampleRed = { padding:
  "12px" }`), regenerate `TestButton.meta.ts`, and re-prove token-lint still
  red on the scaffold.
- `.claude/worktrees/` (parallel agent sessions) is scanned by prettier —
  cross-session interference; `pnpm format` could rewrite files inside another
  session's worktree. Fix: add `.claude/` to `.prettierignore`. Other gates
  are unaffected (token-lint walks `packages`+`docs`; playbook-drift walks
  `scripts`).

## Addendum — review findings (2026-08-12, after the record above was committed)

Appended, not rewritten: the body above stays as first agreed. Two defects
found on re-review against the blueprint, both folded into commit 0:

1. **The scaffold clobbers an approved RFC.** `scaffold.ts` writes every file
   unconditionally, including the `<Name>.rfc.md` stub (`Status: draft`). The
   circuit requires the approved RFC to exist in the component folder
   *before* scaffolding (blueprint §4.1, step 4 before step 5), so a scaffold
   run would overwrite the approval and the arbitration log. Fix: the
   scaffold never overwrites an existing file (idempotent by construction).
   Related: the ORCHESTRATION scaffold trigger's fix order
   "… → contract.json → RFC" is reworded — the RFC is a precondition the
   scaffold must not touch, not a violation to fix afterwards.
2. **Missing format-gate re-proof.** Commit 0 touches `.prettierignore`, the
   format gate's scan surface; the ORCHESTRATION trigger requires that gate
   re-proved red/green in `PROOF-OF-BLOCKING.md`, in addition to the
   token-lint re-proof already planned.

Watch items (not defects): coordinate the commit-A `AGENTS.md` edit with the
parallel state-manifest reconciliation session; the component-generation
prompt must reference the manifest path that lands. The
consuming-repos-unavailable STOP allows the human to arbitrate "proceed
without usage data", recorded in the RFC arbitration log — a STOP hands the
decision to the human, it does not dead-end the circuit.

## Index and proofs (same commits as their files)

- One `PLAYBOOK.md` row per prompt (commit B) and the updated extract row
  (commit A). Enforced mechanically once the gate scans `.github/prompts/`.
- Red/green table for the extended gate in `process/PROOF-OF-BLOCKING.md`:
  inject an unindexed `*.prompt.md`, capture exit 1, revert, re-verify green.
- `pnpm conformity` green on both commits.
