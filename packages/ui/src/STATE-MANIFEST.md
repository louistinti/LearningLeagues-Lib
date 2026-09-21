# State Manifest — component ownership and lifecycle

**Source of truth for every component in the library.** Status is never
flipped by hand — only by the promotion script, which verifies eligibility
(gates green, docs complete) and regenerates shared artefacts.

## Four usage rules

The four rules from `AGENTS.md` ("State manifest — usage rules"), restated here
verbatim because this file is where they are exercised:

1. Claim ownership (set owner in the registry) in your branch's **first
   commit, pushed immediately** — main is push-protected; visibility comes
   from the pushed branch. One component, one working session at a time.
2. A component owned by another session is off-limits.
3. No owner does NOT mean free — read `notes` and `conflictsWith` first.
4. Status moves in the same commit as the work.

For **status** specifically, rule 4 is satisfied by the promotion script: it
flips the status and commits together with the regenerated artefacts, so the
script's commit **is** the same-commit move. The one legitimate hand write on
status is its initial `draft` value when the row is created (the
RFC-generation prompt does exactly this); every status **change** goes through
the script. Every other field (owner, branch, PR, priority, RFC, notes,
`conflictsWith`) is hand-edited, and rule 4 applies to the commit doing the
work.

## Library / product responsibility split

These rows settle the recurring cases in advance. When a question arises, find
its row; if none match, it is a doctrine gap — flag it.

| Area                                                                                                      | Owner   | Rationale                                                                                                                                                                                |
| --------------------------------------------------------------------------------------------------------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Design tokens**                                                                                         | Library | Token values are read-only from the consumer's perspective; changes flow Figma → tokens → stylesheet, never the reverse. Consumers select tokens via class names, not values.            |
| **Component chrome** — visual structure, layout, interactive states (default/hover/focus/active/disabled) | Library | The component's HTML shape, CSS classes, and visual semantics are the library's promise; permuting them is a breaking change.                                                            |
| **Accessibility semantics** — ARIA roles, labels, live regions, keyboard handling, contrast pairs         | Library | Semantic correctness is non-negotiable and decoupled from consumer-side state. The component emits its semantics; the consumer consumes them.                                            |
| **Portalled surface stacking** — z-index coordination for dropdowns, modals, tooltips, popovers           | Library | Multiple portalled surfaces from the same library must coordinate z-index; consumers cannot opt into or out of this coordination without breaking the contract.                          |
| **Menu contents, permissions, routing**                                                                   | Product | The component is a shell; the consumer owns what goes inside. Permissions and navigation are consumer-side concerns.                                                                     |
| **State persistence**                                                                                     | Product | Whether a component's state survives a page reload is a product-side choice. The component reads and writes state; the consumer decides the backend.                                     |
| **Theme attribute on the root or a subtree**                                                              | Product | There is no light/dark axis (`AGENTS.md`, Token rules). The consumer sets `data-accent` / `data-role` on the root element or any subtree element; the library responds to the attribute. |
| **Sizing of the product's own assets inside library slots**                                               | Product | A library component with a slot for a user-supplied image or video: the library controls the slot dimensions (aspect ratio, max-width), the consumer sizes their asset to fit.           |

## Component registry

Priority is the design lead's ranking (a human lock): 1 is worked first. PR is
the last merged PR that changed the component itself (code, contract or
status); an open PR while a session owns the row.

| Component | Status | Owner                                                     | Branch                 | PR  | Priority | RFC                                                 | Notes                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | `conflictsWith` |
| --------- | ------ | --------------------------------------------------------- | ---------------------- | --- | -------- | --------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------- |
| button    | stable | —                                                         | —                      | #34 | 1        | `packages/ui/src/components/button/Button.rfc.md`   | First component through the circuit (M5). **Adopted by LearningLeagues** 2026-08-31 (site `main` b6f0d0c, dist pin 6be46f6): 12 rendered usages, zero compensations, legacy button CSS deleted. Promoted `stable` 2026-09-09 by `promote.ts` (PR #22): a11y `pass` by the accessibility engine gate. **`current` state delivered 2026-09-16** (the selected/aria-current ask filed at adoption; design record `process/archives/2026-09-16-button-current-state-design.md`): `aria-current="page"` on either rendering, secondary filled; Figma variant 73:2. **Adopted by LearningLeagues** 2026-09-16 (site `main` 6a26dcb, dist pin 45ea047): the header CTA carries `current` on the Quiz page. No session owns it.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | —               |
| callout   | stable | —                                                         | —                      | #30 | 2        | `packages/ui/src/components/callout/Callout.rfc.md` | Second component through the circuit; the first whose rules were authored on a Figma docs page (`Docs / Callout`, 66:3) before the RFC. **Adopted by LearningLeagues** 2026-09-11 (site `main` 12ac249, dist pin 8dd599d): 23 rendered usages (20 in the five role guides + 3 in the DS showcase), zero compensations, legacy `.callout*` CSS deleted (`.callout-grid` stays product-side). Integration defect fixed on the way: seven pages did not load the vendored lib although `Nav` renders `LL.Button` (L11). No session owns it.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | —               |
| eyebrow   | stable | Eyebrow promotion session (Claude, sup. Louis Tinthilier) | `feat/eyebrow-promote` | #42 | 3        | `packages/ui/src/components/eyebrow/Eyebrow.rfc.md` | Third component candidate: the site's one typographic mono label ("eyebrow" above a section title, "tag" inside a card, a row or a sigil — usage analysis `process/archives/2026-09-16-mono-label-usage-analysis.md`). RFC approved 2026-09-17 (§7 Q12) and implemented the same day (PR #40) — contract, meta, a11y suite, docs and dist; **awaiting promotion**: the site's adoption, then the design lead's RFC §6 attestation (`pnpm promote eyebrow stable` lists the blockers). The first component with **no Figma docs page**: its rules are arbitrated in session and recorded in RFC §7. The Callout's tag shares the recipe but stays inside the Callout (no dependency in v1). Priority 3 set by the design lead 2026-09-17 (RFC §7 Q11); eight closed questions arbitrated in session 2026-09-16/17 (§7 Q4–Q11). **Default tone `dim` replaces `mute`** 2026-09-21 (§7 Q13): at the site adoption's visual checkpoint (site `main` 4ed5b3d, dist pin c17e443, 28 usages) the design lead judged `fg/mute` too dark; Figma variant 80:3 is `Tone=Dim`, bound to `fg/dim`. **Adopted by LearningLeagues** 2026-09-21 (site `main` 64193d7, dist pin bb039ef): 28 label usages replaced plus 3 showcase specimens, 13 local class recipes deleted, layout kept product-side (`.label-slot`, `.sigil-label`, `.build-head`), the two in-heading labels moved before their h3 (§7 Q9; two were found in source, not three), zero compensations; checkpoint decisions in §7 Q14, ratification in §7 Q15. | —               |

---

## Promotion criteria

A component is promoted from `draft` to `stable` when:

1. **Gates pass:** conformity pipeline green — the 11 gates of `pnpm conformity` (format, drift, schema, token lint, contrast, a11y status, a11y engine, docs a11y, docs smoke, playbook, detectors).
2. **Design sign-off:** design lead approves the RFC and the visual implementation.
3. **Documentation complete:** RFC has real sections (not placeholders), examples, documented props, design link.
4. **Product adoption clear:** at least one consuming product has a confirmed use case and is ready to import.

A component is promoted to `exported` (the library's promise that products may
depend on it — not a delivery filter: see `AGENTS.md`, Distribution contract)
when:

1. **Status is `stable`.**
2. **Accessibility status is `pass`** — or a documented `fail` covered by a time-boxed allowlist entry.
3. **No breaking changes in flight** — RFC reflects the current implementation.

The promotion script verifies all criteria, flips the contract status, regenerates the registry and the documentation site, and commits in one change. It also flips the contract's `a11y.status` from `pending` to `pass` when — and only when — the accessibility engine gate executed green for that component in the same run. It fails with a detailed blocker list if any criterion is not met.

---

## Rationale: no hand-flips

A status field that can be edited by hand has no meaning. The moment a human
can write `stable` because "it looks done", the status becomes opinion, not
fact. By gating promotion on an executable checklist and a script that enforces
it, we make status mean something: "this component has proven it satisfies
every gate."
