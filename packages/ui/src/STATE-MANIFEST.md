# State Manifest — component ownership and lifecycle

**Source of truth for every component shipped to consumers.** Status is never
flipped by hand — only by the promotion script, which verifies eligibility
(gates green, docs complete) and regenerates shared artefacts.

## Four ownership rules

These rules settle the recurring cases in advance. When a question arises, find
its rule; if none match, it is a doctrine gap — flag it.

| Area                                                                                                      | Owner   | Rationale                                                                                                                                                                      |
| --------------------------------------------------------------------------------------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Design tokens**                                                                                         | Library | Token values are read-only from the consumer's perspective; changes flow Figma → tokens → stylesheet, never the reverse. Consumers select tokens via class names, not values.  |
| **Component chrome** — visual structure, layout, interactive states (default/hover/focus/active/disabled) | Library | The component's HTML shape, CSS classes, and visual semantics are the library's promise; permuting them is a breaking change.                                                  |
| **Accessibility semantics** — ARIA roles, labels, live regions, keyboard handling, contrast pairs         | Library | Semantic correctness is non-negotiable and decoupled from consumer-side state. The component emits its semantics; the consumer consumes them.                                  |
| **Portalled surface stacking** — z-index coordination for dropdowns, modals, tooltips, popovers           | Library | Multiple portalled surfaces from the same library must coordinate z-index; consumers cannot opt into or out of this coordination without breaking the contract.                |
| **Menu contents, permissions, routing**                                                                   | Product | The component is a shell; the consumer owns what goes inside. Permissions and navigation are consumer-side concerns.                                                           |
| **State persistence**                                                                                     | Product | Whether a component's state survives a page reload is a product-side choice. The component reads and writes state; the consumer decides the backend.                           |
| **Theme class on the root element**                                                                       | Product | The consumer chooses light/dark/contrast/custom; the library responds to `[data-*]` attributes placed by the consumer on the root or an ancestor.                              |
| **Sizing of the product's own assets inside library slots**                                               | Product | A library component with a slot for a user-supplied image or video: the library controls the slot dimensions (aspect ratio, max-width), the consumer sizes their asset to fit. |

## Component registry

| Component    | Status | Ownership | RFC | Notes                        |
| ------------ | ------ | --------- | --- | ---------------------------- |
| _(none yet)_ | —      | —         | —   | First component: Button (M5) |

---

## Promotion criteria

A component is promoted from `draft` to `stable` when:

1. **Gates pass:** conformity pipeline green (format, drift, schema, lint, contrast, a11y).
2. **Design sign-off:** design lead approves the RFC and the visual implementation.
3. **Documentation complete:** RFC has real sections (not placeholders), examples, documented props, design link.
4. **Product adoption clear:** at least one consuming product has a confirmed use case and is ready to import.

A component is promoted to `exported` (shipped to consumers) when:

1. **Status is `stable`.**
2. **Accessibility status is `pass`** — or a documented `fail` covered by a time-boxed allowlist entry.
3. **No breaking changes in flight** — RFC reflects the current implementation.

The promotion script verifies all criteria, flips the contract status, regenerates the registry and the documentation site, and commits in one change. It fails with a detailed blocker list if any criterion is not met.

---

## Rationale: no hand-flips

A status field that can be edited by hand has no meaning. The moment a human
can write `stable` because "it looks done", the status becomes opinion, not
fact. By gating promotion on an executable checklist and a script that enforces
it, we make status mean something: "this component has proven it satisfies
every gate."
