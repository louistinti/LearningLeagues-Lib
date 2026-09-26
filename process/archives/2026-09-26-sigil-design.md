# Sigil — design record — 2026-09-26

Brainstormed with Louis Tinthilier on 2026-09-26, after the usage analysis
(`2026-09-26-sigil-usage-analysis.md`) concluded the framed sigil is one
object under three site recipes. Twelve closed questions were arbitrated in
session (recorded verbatim in the RFC's §7); this record is the validated
design the RFC and the implementation plan derive from. Design approved by
Louis the same day ("Validé, on enchaîne"), then amended twice at his Figma
checkpoint (Q10: art slot and exposed label; Q11–Q12: label removed, art
inside the accent ring). The amended design is what this record describes.

## Decisions (the arbitrations, in order)

| #   | Question                                                   | Decision                                                                                                                                  |
| --- | ---------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Q1  | Does the sigil become the fourth component?                | Yes — a `Sigil` component.                                                                                                                |
| Q2  | Which ornament (rings / brackets 14 / brackets 22 + glow)? | A: the two inset rings (the `.hero-sigil` recipe, 7 of 9 pages).                                                                          |
| Q3  | Who renders the corner label?                              | The Sigil, through a `label` prop rendering the Eyebrow — **superseded by Q11**.                                                          |
| Q4  | How is the accent ring's 25 % opacity tokenised?           | A new Figma float variable created through the MCP by the agent, extracted, `token-approved` by Louis.                                    |
| Q5  | Is the label mandatory?                                    | Yes — **superseded by Q11**.                                                                                                              |
| Q6  | Does the showcase's frameless sigil enter the component?   | No — out of scope (one usage, showcase only, no product page); `.ds-empty-sigil` stays a site recipe.                                     |
| Q7  | Manifest priority?                                         | 4.                                                                                                                                        |
| Q8  | Design validated?                                          | Yes ("Validé, on enchaîne").                                                                                                              |
| Q9  | Go for the Figma writes?                                   | Go — variable `VariableID:89:2`, page 89:3, component 89:4.                                                                               |
| Q10 | Figma checkpoint 1 ("Il manque des choses non ?")          | Art slot as an INSTANCE_SWAP property with the shared hex-frame motif; the nested Eyebrow exposed.                                        |
| Q11 | Figma checkpoint 2 (Louis edited the component)            | No label at all (reverses Q3, Q5; no Eyebrow dependency); the art sits inside the accent ring (inset `s-3`, 85 % of the side).           |
| Q12 | What happens to the site's corner captions?                | They disappear at adoption (9 pages; `.sigil-label` deleted).                                                                             |

## 1. API

```jsx
<LL.Sigil>
  <svg …>…</svg> {/* the page's art, unchanged */}
</LL.Sigil>
```

- `children: ReactNode` — the art: an inline SVG drawn with `currentColor`,
  or the site's masked role icon (a product asset inside the slot — the
  manifest's responsibility split: the library controls the slot, the
  consumer sizes its asset). Required.
- Nothing else: no label (Q11), no size, no tone, no ornament, no `as`, no
  `className`. The square fills the width its parent gives it; the parent
  grid column sizes it (320 on the heroes, 360 on the landing, 340 on
  Fundamentals — product settings that do not move).

## 2. Rendering

```html
<div class="ll-sigil" aria-hidden="true">
  <div class="ll-sigil-art">
    <svg …>…</svg>
  </div>
</div>
```

Stylesheet (`sigil.css`), every value a token:

- `.ll-sigil`: `position: relative; aspect-ratio: 1; width: 100%; border: 1px solid var(--ll-border); background: var(--ll-surface); color: var(--ll-accent);`
- `.ll-sigil::before, ::after`: `content: ""; position: absolute; inset: var(--ll-s-15); border: 1px solid var(--ll-border-soft); pointer-events: none;`
- `.ll-sigil::after`: `inset: var(--ll-s-3); border-color: var(--ll-accent); opacity: var(--ll-opacity-ornament);`
- `.ll-sigil-art`: `position: absolute; inset: var(--ll-s-3);` — the art slot is the square inside the accent ring (Q11); as a child it paints above `::before` and below `::after`, the Figma layer order (ring-soft, art, ring-accent).
- `.ll-sigil-art > svg`: `display: block; width: 100%; height: 100%;`

The accent follows the axis through `--ll-accent` (`[data-accent]` /
`[data-role]` on any ancestor), as on the five role guides today.

## 3. Token

One new Figma variable: `Primitives/opacity/ornament` = `25` (float, scope
OPACITY — Figma reads a float bound to a layer's opacity as a **percentage**,
verified at creation on 2026-09-26: a value of 0.25 rendered the ring at
0.25 %), CSS `--ll-opacity-ornament: 0.25`. Created in the Lib file through
the MCP after Louis's explicit go (Q4, Q9) — `VariableID:89:2` — then
extracted by the stage-1 procedure (`extract-tokens.prompt.md`,
checksum-verified patch of the raw export), normalised and transformed. The
transform emits floats in px unless the key is unitless by name (`Layout/z/*`,
type weight and line-height): the `opacity/*` family joins that list as a
mechanical percent conversion (`value / 100`, the same arithmetic the
normalise stage applies to a PERCENT line-height) — one rule, locked by a
detector test. Provenance entry in `PROVENANCE.md`; the token-diff gate stays
expected-red until Louis applies `token-approved`.

Every other value already has its token: `--ll-border`, `--ll-border-soft`,
`--ll-surface`, `--ll-accent`, `--ll-s-15` (12px soft-ring inset), `--ll-s-3`
(24px accent-ring inset and art-slot inset).

## 4. Accessibility commitment

- Decorative by construction: `aria-hidden="true"` on the root, always — the
  six site mounts already do this. The component renders no text (Q11);
  the page's meaning lives in the heading and the intro next to the sigil,
  never in the sigil.
- Not interactive: nothing focusable, no states, no ARIA role, no events.
  Interactive children are not expected (a `dont`).
- Contrast: the component declares **no contrast pair** — pure decoration
  is exempt from WCAG 1.4.3, and the contrast gate scores declared pairs
  only. First component with an empty pair set; the contract's `a11y`
  block says so explicitly.
- Engine gate: the examples render under axe with the root `aria-hidden`;
  the keyboard suite asserts nothing focusable is rendered.

## 5. Figma component set (mandatory; built 2026-09-26)

Page `Sigil` 89:3, one component `Sigil` 89:4 (no variant axis):

- frame 320 × 320, fill bound to `Semantic/surface/default`, 1px stroke
  bound to `Semantic/border/default`;
- two inner rectangles (the rings): `ring-soft` 89:5, inset 12
  (`Spacing/s-15`), stroke `Semantic/border/soft`; `ring-accent` 89:6,
  inset 24 (`Spacing/s-3`), stroke `Semantic/accent/default`, layer
  opacity bound to `Primitives/opacity/ornament`;
- the art slot: an INSTANCE_SWAP property `Art` (`Art#92:0`) whose instance
  92:7 is the 272 × 272 square inside the accent ring (Louis's edit, Q11),
  layered between the two rings. Default swap: the component
  `Sigil art / Hex frame` 92:3 (vectors 93:6–93:8: outer hexagon, inner
  hexagon, six spokes — the motif the Glossary and landing sigils share, at
  the site's `viewBox 200` coordinates × 1.6), strokes bound to
  `Semantic/accent/default`. A designer drops the page's glyph in the
  centre; in code the art stays the page's `children`;
- no label (Q11): the Eyebrow instance that Q3 and Q10 had placed
  bottom-left was removed by the design lead.

Built through `use_figma` (guard first, mutate once, return ids), then
edited by Louis in Figma; the file is the reference for the rendering. The
node id is in the RFC header and goes into `contract.json` (`designNode`).

## 6. Tooling extension carried by this component

**Examples with element children.** `Example.children` is a string
(`docs-render.ts`, `docs-html.ts`, `a11y-mount.ts`); the Sigil's examples
need an SVG child. An example may now carry
`children: { snippet: string; node: ReactNode }`: the renderer and the a11y
mount pass `node`, the docs print `snippet` in the code block. The deferred
follow-up "mountComponent children `string` → ReactNode" closes here.
Locked by the detectors' unit suite where a pure function is touched. Ships
in the implementation PR with its red/green proof (ORCHESTRATION: "You
touched a gate's detector or scan surface").

The dist extension planned at Q8 (a relative component import) is no longer
needed: the Sigil imports nothing from the library since Q11.

## 7. Site adoption (product-integration mission, after the implementation)

- Five mounts become `<LL.Sigil>art</LL.Sigil>`: `Hero` in
  `components.jsx` (five role guides), `glossary.jsx`, `landing.jsx`,
  `design-system.jsx`, `fundamentals-cards.jsx`. The five `<LL.Eyebrow>`
  captions and the `sigilLabel` data leave (Q12).
- Deleted: `.hero-sigil` (+ pseudo-elements), `.ds-hero-sigil` (+), `.ft-intro-sigil` (+), `.sigil-label`.
- Kept product-side: `.hero-sigil-icon` (the masked role icon — its
  `inset: 0` now measures the art slot), the grid columns and
  `.landing-sigil` as the slot's width, `.ds-empty-sigil` (Q6).
- Visual checkpoint (Louis's lock): DesignSystem and Fundamentals change
  ornament (brackets → rings, the Fundamentals glow disappears); every page
  loses its corner caption; the art shrinks to 85 % of the frame (inside
  the accent ring).

## 8. PR sequence

1. `feat/sigil-rfc` (PR #47) — Figma set + opacity variable (the RFC needs
   the design node), RFC `draft` with §7 filled from the session log,
   manifest row (priority 4), the two archives. Louis approves the RFC (§6).
2. `feat/sigil` — token extraction (`token-approved`), component, CSS,
   a11y suite, meta, docs, dist, the element-children extension.
   `pnpm conformity` verdict quoted.
3. Site adoption PR, visual checkpoint, ratification in §7.
4. Promotion `stable` then `exported` by `pnpm promote`, each its own PR.

## Out of scope (closed)

- A label of any kind (Q11): the caption is gone from the design; a product
  that wants one places its own element beside the Sigil.
- A frameless variant (Q6).
- An ornament prop (Q2: one ornament).
- A tone or size prop; a `className` passthrough.
