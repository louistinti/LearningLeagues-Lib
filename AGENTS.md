# AGENTS.md — Operating contract

Read in the order of the documentation map below: `process/PROJECT-CONTEXT.md`
first (context), then this file — the first RULES source in every session,
before making changes.
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

| Order | File                                                                                          | Role (exactly one each)                                     |
| ----- | --------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| 1     | `process/PROJECT-CONTEXT.md`                                                                  | Mission, team, products, design source. Tool-agnostic.      |
| 2     | `AGENTS.md` (this file)                                                                       | Rules, contracts, gates, conventions. Wins on conflict.     |
| 3     | `process/LEARNINGS.md`                                                                        | Open lessons a human is still catching. Read before coding. |
| 4     | `process/ORCHESTRATION.md`                                                                    | Obligations indexed by trigger event. Re-consult per event. |
| 5     | `process/PLAYBOOK.md`                                                                         | Task → command routing.                                     |
| 6     | `packages/ui/src/STATE-MANIFEST.md`                                                           | Current state: every component's status, owner, open work.  |
| 7     | The touched component's own RFC and machine contract (`.rfc.md`, `contract.json`, `.meta.ts`) | Per-component truth.                                        |

`README.md` is the entry point that routes here; its Status paragraph is a
summary, never a source. The two prompts in `.github/prompts/` repeat this
order — a divergence between them and this table is a defect.

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
   not "just this once". (Gate: `pnpm gate:lint-tokens`, in the conformity job.)
2. **Never hand-edit a generated file.** Regenerate from the source; commit the
   artefact in the same commit as its source.
3. **Accessibility conformance is a hard requirement.** A non-conformant
   deliverable is never shippable. (Gates, all in the conformity job:
   `pnpm gate:contrast`, `pnpm gate:a11y`, `pnpm gate:a11y-engine`,
   `pnpm gate:docs-a11y`.)
4. **Never create a local approximation of a missing library component.**
   File the gap and stop.
5. **One writing session per repository at a time.** A session that works
   beside the main checkout uses its own isolated worktree and removes it when
   it ends (the hygiene audit expects the main worktree only); run
   `git branch --show-current` immediately before every commit.
6. **A stale file is active misinformation.** Recurring hygiene audit
   (`process/HYGIENE-AUDIT.md`: inventory → plan → human approval → execute),
   before any major session's last PR.

## Token rules

- Design tokens flow one way only: **Figma variables → extraction pipeline →
  one generated stylesheet**. No agent and no developer ever writes a token by
  hand. Library components consume tokens; they never define them.
- Design source: the Figma file named in `process/PROJECT-CONTEXT.md`.
- Theming axes (this organisation's adaptation — there is NO light/dark axis):
  - **Single dark palette** on `:root`. Parity gates check axis parity, not
    light/dark parity.
  - **Accent axis** — `[data-accent]` / `[data-role]` swap which accent token is
    live (`ambre`, `bleu`, `rouge`, `violet`, `jade` — `or` removed 2026-08-30;
    gold survives only as `tier/challenger` and the `gold-soft` alpha), on the
    root element or any subtree element (element-scoped since 2026-08-29).
    Every accent-dependent semantic token must resolve under every axis value
    (contrast included: `pnpm gate:contrast` scores every declared pair through
    `Semantic/accent/default` once per accent, since 2026-09-21).
  - **Density axis — removed 2026-08-30.** Every product page measured
    `compact`, so the axis carried no information; the base spacing unit lives
    on as the plain token `--ll-s` (`Spacing/s` = 8, the ladder's arithmetic
    base). The host application owns setting the accent attribute; the bare
    root defaults to `data-accent="ambre"` semantics (ambre since 2026-08-14 —
    the measured product default).
- The generated stylesheet is external input, like a vendored dependency: it has
  a provenance log, a CODEOWNERS rule, and a token-diff gate requiring a human
  approval label (`token-approved`).

## Naming conventions

- Branch: `type/scope-in-kebab-case`.
- Commit title: `type(scope): imperative description`. Squash merge — the PR
  title becomes the commit message.
- Component folder: kebab-case. The exported identifier comes from the
  component's own contract, never reconstructed from the folder name.
- Language: **everything in this repository, its commits and its PRs is
  English.** (No gate yet — the human reviewer holds this line; the blueprint's
  language gate stays a candidate.)

## Generated vs hand-written

Every file is explicitly one or the other. A generated file carries a
`GENERATED` header naming the command that regenerates it. Hand-written:
everything not listed below. Never hand-add an entry to a shell that renders
generated data.

| Generated file                                                  | Regenerated by                                                                       |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `packages/ui/src/tokens/raw/figma-variables.json`               | stage 1 procedure (`.github/prompts/extract-tokens.prompt.md`)                       |
| `packages/ui/src/tokens/tokens.json`                            | `pnpm tokens:normalize`                                                              |
| `packages/ui/src/tokens/tokens.css`                             | `pnpm tokens:transform` (utilities zone at the end is the one agent-extensible area) |
| `docs/index.html`, `docs/tokens.html`, `docs/components/*.html` | `pnpm docs:build`                                                                    |
| `docs/assets/lib.css`                                           | `pnpm docs:build` (tokens.css + component css + docs-only derived rules)             |
| `dist/ll-lib.css`, `dist/ll-lib.jsx`                            | `pnpm dist:build` (consumer artefacts; vendored at a pin via `vendor-dist.ts`)       |

## State manifest — usage rules

The state manifest is `packages/ui/src/STATE-MANIFEST.md` — hand-edited
markdown. Its component registry holds per-component:
status, owner, branch, PR, priority, RFC path, notes, `conflictsWith`.

The blueprint (`process/archives/2026-08-12-system-blueprint.md` §2.4) named a
root `ROADMAP.json` for this role; the markdown manifest is the adaptation the
blueprint itself invites ("the schema is arbitrary. The four rules are the
substance"). No `ROADMAP.json` exists and none is planned. If machine-checkable
state is ever needed, it must be a GENERATED artefact derived from this
manifest — never a second hand-edited file.

Four rules:

1. Claim ownership (set owner in the registry) in your branch's **first
   commit, pushed immediately** — main is push-protected; visibility comes
   from the pushed branch. One component, one working session at a time.
2. A component owned by another session is off-limits.
3. No owner does NOT mean free — read `notes` and `conflictsWith` first.
4. Status moves in the same commit as the work.

## Distribution contract (phase 1 delivered 2026-08-30; phase 2 planned — recorded so no decision contradicts it)

- The published stylesheet ships **no global CSS reset**; the host owns its
  reset, and every element the library renders is self-defensive about browser
  defaults, structurally (shared base), not per call site.
- Consumption phase 1 (delivered 2026-08-30, `scripts/vendor-dist.ts`): the
  consumer vendors `dist/ll-lib.{css,jsx}` at a **commit** pin (never a
  branch) — the buildless site cannot install a package — and this root
  manifest stays the install proxy for `packages/ui` for the day a building
  consumer arrives. Phase 2 is a registry; consumer import specifiers never
  change.
- The dist ships **every implemented component, whatever its status** — only
  an RFC-stage folder (no `*.meta.ts`) is left out. It has to: a product adopts
  a `draft` component BEFORE its promotion (adoption is a promotion criterion).
  `exported` is therefore a promise, not a filter: the component is `stable`,
  its accessibility status is `pass`, and its RFC matches the implementation.
  A product depends on a non-exported component only inside its adoption
  mission.
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
- Every session ends with the three-block report, including a **Decisions made
  autonomously** list: **To understand** — what was found, changed and why, in
  the reader's terms; **To decide** — the arbitrations only the human can make,
  as closed questions with options and consequences (empty is valid); **To
  paste** — the exact literal text the human must place where the agent cannot
  reach (a PR body, a label, a comment).
