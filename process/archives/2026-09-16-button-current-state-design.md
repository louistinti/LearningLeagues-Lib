# Design — Button `current` state (approved 2026-09-16)

Approved by Louis Tinthilier (design lead) in session, 2026-09-16. Scope: the
first product→library ask, filed at the Button adoption pilot (RFC §7,
2026-08-31): the header "Role quiz" CTA lost its filled you-are-here state
(`.nav-cta.is-active { background: var(--accent); color: var(--bg); }`) and
its `aria-current="page"` when it became the library Button; the state was to
"return via RFC". This record is that return — an additive, non-breaking
change to a `stable` / `exported` component (blueprint §4.5: "done means solid,
not frozen").

## Decisions taken (with their arbitration)

| Decision               | Choice                                                                                                                                                                                                                        | Decided by |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| Priority               | This candidate before the third component and the gate-17 follow-ups — Louis present to arbitrate, which is what the ask was waiting for                                                                                      | Louis      |
| API                    | Boolean prop `current`; the component emits `aria-current="page"` on whichever element it renders (`<a>` or `<button>`); the CSS hooks on that attribute — no dedicated class, so the visual cannot exist without the semantic | Louis      |
| Visual, and on which variant | Secondary only, the site's measured recipe: accent fill, `bg` text, accent border, no brackets, hover inert, focus ring unchanged. Primary + `current` emits the attribute with no visual change — a known limitation (§5), closed question (§7) | Louis      |
| Figma                  | One write: variant `Style=Secondary, State=Current` in the Button set (16:18). `Docs / Button` (54:3) is NOT refreshed now — the contract stays the source, the gap is noted in §7                                             | Louis      |
| Site adoption          | In this session, after the library PR merges: re-vendor at the new pin, `current={activeKey === "quiz"}` on the nav CTA, commit prepared on a site branch; the push to the product repository is Louis's (human lock)          | Louis      |

## 1. Facts measured (2026-09-16)

- Site history: `aede856` introduced `.nav-cta.is-active { background: var(--accent); color: var(--bg); }` (no hover override — the rule follows `.nav-cta:hover` at equal specificity and wins); `d02ff72` retired it with the adoption. Only `quiz-app.jsx` renders `<Nav activeKey="quiz" />`, so the state shows on the Quiz page alone.
- Contrast: the pair `Semantic/bg/default on Semantic/accent/default` is already declared (`contrast-pairs.json`, computed 8.43) — the filled state adds no pair. The contrast gate is re-run anyway (ORCHESTRATION: a touched colour → `pnpm gate:contrast`).
- Figma set 16:18: variants `Style=Primary|Secondary × State=Default|Hover|Focus` (six components at x=24, y=24+64·i), boolean `Icon ?#43:0`, text prop `Label#16:0`. `Style=Secondary, State=Default` (16:10, at y=216): no fill, stroke bound to `border/default` (1px), horizontal auto-layout 22/12 padding, gap 10; label TEXT 16:11 bound to `fg/default` (JetBrains Mono Bold, text style `type/button`); icon FRAME 43:8 (14×14) holding VECTOR 43:9 with stroke bound to `fg/default`. Pre-existing, out of scope: the icon frame carries an unbound white fill (the `createAutoLayout` default) on every variant — flagged to Louis at the visual checkpoint, not changed here.
- 18 `LL.Button` usages on the site; none passes an unknown prop, so the new optional prop is invisible to them.

## 2. The change — library

### 2.1 `Button.tsx`

`current?: boolean` (default `false`) in `ButtonProps`; both renderings get
`aria-current={current ? "page" : undefined}`. Nothing else changes.

### 2.2 `button.css`

After the secondary hover rule:

```css
/* Current ("you are here", RFC §3.1 / §4.1, 2026-09-16): the site's measured
   filled state, keyed on the semantic attribute so the visual never exists
   without it. Hover is inert on a current button — the state is stable, not
   an invitation. Primary + current: attribute only (RFC §5). */
.ll-button--secondary[aria-current="page"],
.ll-button--secondary[aria-current="page"]:hover {
  background: var(--ll-accent);
  color: var(--ll-bg);
  border-color: var(--ll-accent);
}
```

### 2.3 Contract (`Button.meta.ts`, `contract.json`)

- `states` gains `{ state: "current", attribute: { name: "aria-current", value: "page" }, note: "Versus default (secondary): accent fill, bg-coloured label, accent border; hover inert; the focus ring is unchanged. Emitted by the current prop as aria-current=\"page\" — the CSS hooks on the attribute, so the visual never exists without the semantic (RFC §3.1). Primary: attribute only, no visual (RFC §5)." }` — see §2.6 for why the entry names the attribute.
- `examples` gains `{ label: "Current — you are here (secondary, href)", props: { variant: "secondary", href: "#", current: true }, children: "Role quiz" }` — audited by the a11y engine × 5 accents like every example.
- `guidelines.golden` gains `{ rule: "Current says where you are, not what you chose", detail: "current marks the navigation target the reader is on (aria-current=\"page\"); a pressed/toggled control is aria-pressed — a different state, out of scope (RFC §7, 2026-09-16)." }`; `do`: "Set current on the one Button that leads to the page being viewed (the site's nav CTA on Quiz)."; `dont`: "Don't use current as a toggle or a selection — that is aria-pressed, not aria-current."
- `contract.json`: prop `current` (`boolean`, default `false`, note "emits aria-current=\"page\" on either rendering; secondary shows the filled state, primary shows nothing (RFC §5)"); `a11y.semanticStructure` gains the sentence "current adds aria-current=\"page\" (valid on both elements); no other ARIA."
- `notes` unchanged.

### 2.4 Tests (`Button.a11y.test.ts`)

Three cases: `current` on the `<a>` rendering emits `aria-current="page"`;
`current` on the `<button>` rendering emits it too; without `current` no
`aria-current` attribute is present (both renderings). The generic engine
checks and axe cover the rest.

### 2.5 RFC (`Button.rfc.md`)

- §3.1: a `current` row (`boolean`, `false`, "Marks the you-are-here target: emits `aria-current=\"page\"`; secondary renders the filled state, primary only the attribute (§5). Returned via §7, 2026-09-16.").
- §4.1: a sentence on `aria-current="page"` being the one ARIA attribute the component emits, on either element.
- §5 (HUMAN ONLY block — written as Louis's arbitration, quoted from §7): "`current` on primary has no visual: no product usage measured; the attribute is still emitted."
- §7: one row dated 2026-09-16, the four questions as asked (closed, with options) and the answers verbatim ("Prop `current` → aria-current=\"page\" (Recommended)"; "Secondary seul, recette du site (Recommended)"; "Variante seule, maintenant (Recommended)"; "Oui, après le merge lib (Recommended)"), decided by Louis Tinthilier.
- Status stays `approved`; §6 ticks stay (additive change; conformity re-run is the evidence).

### 2.6 Docs generator — attribute-driven states (agent decision, within the approved §3)

The docs site's "States" section holds every example in each declared state.
Today the mechanism is docs-only mirror rules derived from the component
stylesheet for pseudo-class states (`:hover` → `.ll-docs-force-hover`,
`generate-docs.ts` `forceStateRules`). A state keyed on an attribute has no
pseudo-class to mirror, and a class mirror would show the visual WITHOUT the
attribute — the exact thing this design forbids. So a `meta.states` entry may
declare `attribute: { name, value }`; `docs-html.ts` `withForcedState` then
sets that attribute on the example's root element instead of adding a class
(skipped when the root already carries it), and the component's real CSS
applies. `generate-docs.ts` validates the shape (both non-empty strings, the
name `^[a-z][a-z0-9-]*$`). The States intro prose becomes generic (pseudo-class
states via mirrors, attribute states via the attribute itself) instead of the
Button-specific sentence it carries today. No new gate: the docs a11y and
smoke gates audit the output as before.

### 2.7 Generated artefacts and manifest

`pnpm docs:build` and `pnpm dist:build` in the same commit as the source.
STATE-MANIFEST `button` row: owner/branch claimed in the branch's first commit
(rule 1), cleared after merge; notes: "selected/aria-current state delivered
2026-09-16 as `current` (PR #34); site adoption <pending → done at pin …>".

## 3. Figma — one write

`Style=Secondary, State=Current` cloned from `Style=Secondary, State=Default`
(16:10) inside set 16:18, placed at y=408 (the next 64px slot; the set grows
to fit): a solid fill bound to `Semantic/accent/default`, the stroke re-bound
to `Semantic/accent/default`, the label TEXT fill re-bound to
`Semantic/bg/default`, the icon VECTOR stroke re-bound to `Semantic/bg/default`
(so the trailing glyph follows the label as on the other variants). The `State`
variant property gains the option `Current` by the clone's name alone (Figma
derives options from variant names). Component-property references (`Label`,
`Icon ?`) survive the clone. Written with `use_figma` after loading the
`figma-use` skill; read back (`get_design_context`) to verify the bindings;
Louis's visual checkpoint before the PR (human lock). `docsNode` 54:3 untouched.

## 4. Verification

- `pnpm conformity` executed (11 gates) — the a11y engine audits the new example under every accent; the contrast gate re-run.
- Proofs: no new gate, so no PROOF-OF-BLOCKING rows. The a11y suite's three new tests are red before the `Button.tsx` change and green after (TDD order in the plan).
- Docs smoke (gate 17) renders the new example on the Button page.

## 5. Site adoption (after merge, this session)

On `../LearningLeagues`, branch `feat/nav-cta-current`: `git fetch` + on
`origin/main` (L09); `node scripts/vendor-dist.ts --write --target ../LearningLeagues`
at the merged pin; in `components.jsx` the nav CTA gets
`current={activeKey === "quiz"}` and its comment is rewritten (the ask is
delivered); `styles.css` comment at `.nav-cta-wrap` updated the same way.
One commit, prepared; Louis pushes.

## Out of scope (deliberately)

- `aria-pressed` / toggle semantics; `current` visual on primary; `disabled`; an
  `icon` prop.
- Refreshing `Docs / Button` (54:3) — the contract is the source; the page
  lags by one state until the next Button change justifies a write (§7 note).
- The site's other `is-active` links (`.nav-link`) — product chrome, not the
  library's.
