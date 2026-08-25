# AGENTS.md — Operating contract

For project-wide context read `process/PROJECT-CONTEXT.md` first.
Use this file as the first rules source in every session before making changes.
Every agent must also read `process/ORCHESTRATION.md` before opening, reviewing or
merging any change — it indexes rules by TRIGGER EVENT and is meant to be
re-consulted at each event, not read once.

On conflict with any other document in this repository, this file wins.

## Mission

Build and maintain the LearningLeagues component library: consumed by AI agents
writing product code, and built by AI agents supervised by a human. The scarce
resource is human attention; the humans hold the locks listed below and delegate
everything else.

## Documentation map — reading order and roles

| Order | File                                                      | Role (exactly one each)                                     |
| ----- | --------------------------------------------------------- | ----------------------------------------------------------- |
| 1     | `process/PROJECT-CONTEXT.md`                              | Mission, team, products, design source. Tool-agnostic.      |
| 2     | `AGENTS.md` (this file)                                   | Rules, contracts, gates, conventions. Wins on conflict.     |
| 3     | `process/LEARNINGS.md`                                    | Open lessons a human is still catching. Read before coding. |
| 4     | `process/ORCHESTRATION.md`                                | Obligations indexed by trigger event. Re-consult per event. |
| 5     | `process/PLAYBOOK.md`                                     | Task → command routing.                                     |
| 6     | The touched component's own machine contract (`.meta.ts`) | Per-component truth.                                        |

If two files appear to cover the same thing, one of them is wrong — that is a
defect to flag, not a redundancy to tolerate.

## The human locks

These gestures are never an agent's. Anything not on this list is delegable.
The named human for every lock is **Louis Tinthilier** (design lead, reviewer,
merger — single-human team).

| Human-only gesture                            | Why                                                         |
| --------------------------------------------- | ----------------------------------------------------------- |
| Pressing merge                                | The last irreversible step; the human necessarily reads it. |
| Submitting a formal review approval           | An approval is an attestation, not a computation.           |
| Applying the token-approval label             | Attests the change matches the real Figma export.           |
| Arbitrating a component's API                 | Product judgement; an agent proposes, the human decides.    |
| Arbitrating any visual value                  | Sizes, spacings, opacities, thresholds.                     |
| Setting priority                              | Ranking work belongs to the design owner.                   |
| Validating a visual checkpoint                | A headless pipeline never sees "this looks wrong".          |
| Approving a hygiene-audit deletion plan       | Deletions are irreversible in practice.                     |
| Signing off a time-boxed exception            | Every allowlist entry carries a named approver.             |
| Authorising writes on another author's branch | Default is zero-write.                                      |
| Pushing to a consuming product's repository   | Product playbook checkpoint.                                |

## Six non-negotiable axioms

1. **Never hardcode a design value.** Not in a class, not in an inline style,
   not "just this once". (Gate: token lint — planned, Milestone 3.)
2. **Never hand-edit a generated file.** Regenerate from the source; commit the
   artefact in the same commit as its source.
3. **Accessibility conformance is a hard requirement.** A non-conformant
   deliverable is never shippable.
4. **Never create a local approximation of a missing library component.**
   File the gap and stop.
5. **One writing session per repository at a time.** Isolated worktrees; run
   `git branch --show-current` immediately before every commit.
6. **A stale file is active misinformation.** Recurring hygiene audit
   (`process/HYGIENE-AUDIT.md` — planned), blocking before any major session's PR.

## Token rules

- Design tokens flow one way only: **Figma variables → extraction pipeline →
  one generated stylesheet**. No agent and no developer ever writes a token by
  hand. Library components consume tokens; they never define them.
- Design source: the Figma file named in `process/PROJECT-CONTEXT.md`.
- Theming axes (this organisation's adaptation — there is NO light/dark axis):
  - **Single dark palette** on `:root`. Parity gates check axis parity, not
    light/dark parity.
  - **Accent axis** — `[data-accent]` / `[data-role]` swap which accent token is
    live (`or`, `ambre`, `bleu`, `rouge`, `violet`, `jade`). Every
    accent-dependent semantic token must resolve under every axis value.
  - **Density axis** — `[data-density="aere" | "compact"]` swaps the base
    spacing unit. The host application owns setting these attributes; the bare
    root defaults to `data-accent="ambre"`, `data-density="compact"` semantics
    (ambre since 2026-08-14 — the measured product default; no page uses `or`
    as its accent).
- The generated stylesheet is external input, like a vendored dependency: it has
  a provenance log, a CODEOWNERS rule, and a token-diff gate requiring a human
  approval label (Milestone 2).

## Naming conventions

- Branch: `type/scope-in-kebab-case`.
- Commit title: `type(scope): imperative description`. Squash merge — the PR
  title becomes the commit message.
- Component folder: kebab-case. The exported identifier comes from the
  component's own contract, never reconstructed from the folder name.
- Language: **everything in this repository, its commits and its PRs is
  English.** (Gate: language gate — planned, Milestone 3.)

## Generated vs hand-written

Every file is explicitly one or the other. A generated file carries a
`GENERATED` header naming the command that regenerates it. Hand-written:
everything not listed below. Never hand-add an entry to a shell that renders
generated data.

| Generated file                                    | Regenerated by                                                                       |
| ------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `packages/ui/src/tokens/raw/figma-variables.json` | stage 1 procedure (`.github/prompts/extract-tokens.prompt.md`)                       |
| `packages/ui/src/tokens/tokens.json`              | `pnpm tokens:normalize`                                                              |
| `packages/ui/src/tokens/tokens.css`               | `pnpm tokens:transform` (utilities zone at the end is the one agent-extensible area) |

## State manifest — usage rules (active from Milestone 4)

The state manifest is `packages/ui/src/STATE-MANIFEST.md` — hand-edited
markdown, delivered in Milestone 4. Its component registry holds per-component:
status, owner, branch, PR, priority, RFC path, notes, `conflictsWith`.

The blueprint (`process/archives/2026-08-12-system-blueprint.md` §2.4) named a
root `ROADMAP.json` for this role; the markdown manifest is the adaptation the
blueprint itself invites ("the schema is arbitrary. The four rules are the
substance"). No `ROADMAP.json` exists and none is planned. If machine-checkable
state is ever needed, it must be a GENERATED artefact derived from this
manifest — never a second hand-edited file.

Four rules:

1. Claim ownership (set owner + commit) **before** creating a branch.
2. A component owned by someone else is off-limits.
3. No owner does NOT mean free — read `notes` and `conflictsWith` first.
4. Status moves in the same commit as the work.

## Distribution contract (planned — recorded now so no decision contradicts it)

- The published stylesheet ships **no global CSS reset**; the host owns its
  reset, and every element the library renders is self-defensive about browser
  defaults, structurally (shared base), not per call site.
- Consumption phase 1 is a git dependency pinned to a **commit** (never a
  branch), with this root manifest maintained as the install proxy for
  `packages/ui`. Phase 2 is a registry; consumer import specifiers never change.
- The toolchain pin lives in `engines` (not `packageManager`), and every CI
  workflow sets the package-manager version explicitly. No gate catches drift
  between the two — grep by hand when bumping.

## Agent behavior rules

- Executed, never declared: every verification ends in a script/CI report. A
  session summary is not evidence.
- A red gate is information. Expected-red (token gate awaiting label) waits for
  the human; needs-fixing-red gets fixed. Never present one as the other.
- A trigger not listed in `process/ORCHESTRATION.md` is a doctrine gap to flag,
  not one to fill by improvising.
- When a required external input (e.g. Figma export) is unavailable: **STOP and
  report.** Never improvise the value it would have given.
- Every session ends with the three-block report: **To understand / To decide /
  To paste**, including a **Decisions made autonomously** list.
