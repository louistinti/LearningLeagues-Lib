# Sigil — design record — 2026-09-26

Brainstormed with Louis Tinthilier on 2026-09-26, after the usage analysis
(`2026-09-26-sigil-usage-analysis.md`) concluded the framed sigil is one
object under three site recipes. Seven closed questions were arbitrated in
session (recorded verbatim in the RFC's §7); this record is the validated
design the RFC and the implementation plan derive from. Design approved by
Louis the same day ("Validé, on enchaîne").

## Decisions (the arbitrations, in order)

| #   | Question                                                   | Decision                                                                                                          |
| --- | ---------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Q1  | Does the sigil become the fourth component?                | Yes — a `Sigil` component.                                                                                        |
| Q2  | Which ornament (rings / brackets 14 / brackets 22 + glow)? | A: the two inset rings (the `.hero-sigil` recipe, 7 of 9 pages).                                                  |
| Q3  | Who renders the corner label?                              | The Sigil, through a `label` prop that renders the library's Eyebrow — the first component composing another.     |
| Q4  | How is the accent ring's 25 % opacity tokenised?           | A new Figma float variable created through the MCP by the agent, extracted, `token-approved` by Louis.            |
| Q5  | Is the label mandatory?                                    | Yes — `label: string`, required; one Figma component, no `Label=Off` variant.                                     |
| Q6  | Does the showcase's frameless sigil enter the component?   | No — out of scope (one usage, showcase only, no product page); `.ds-empty-sigil` stays a site recipe.             |
| Q7  | Manifest priority?                                         | 4.                                                                                                                |

## 1. API

```jsx
<LL.Sigil label="Sigil · Top">
  <svg …>…</svg> {/* the page's art, unchanged */}
</LL.Sigil>
```

- `label: string` — required. Rendered as `<Eyebrow>` (default tone `dim`,
  what every site usage renders today) in the bottom-left corner. A short
  caption, never a sentence (the Eyebrow's own rule).
- `children: ReactNode` — the art: an inline SVG drawn with `currentColor`,
  or the site's masked role icon (a product asset inside the slot — the
  manifest's responsibility split: the library controls the slot, the
  consumer sizes its asset).
- Nothing else: no size, no tone, no ornament, no `as`, no `className`. The
  square fills the width its parent gives it; the parent grid column sizes
  it (320 on the heroes, 360 on the landing, 340 on Fundamentals — product
  settings that do not move).

## 2. Rendering

```html
<div class="ll-sigil" aria-hidden="true">
  <svg …>…</svg>
  <span class="ll-sigil-label"><span class="ll-eyebrow ll-eyebrow--dim">Sigil · Top</span></span>
</div>
```

Stylesheet (`sigil.css`), every value a token:

- `.ll-sigil`: `position: relative; aspect-ratio: 1; width: 100%; border: 1px solid var(--ll-border); background: var(--ll-surface); color: var(--ll-accent);`
- `.ll-sigil::before, ::after`: `content: ""; position: absolute; inset: var(--ll-s-15); border: 1px solid var(--ll-border-soft); pointer-events: none;`
- `.ll-sigil::after`: `inset: var(--ll-s-3); border-color: var(--ll-accent); opacity: var(--ll-opacity-ornament);`
- `.ll-sigil > svg`: `display: block; width: 100%; height: 100%;`
- `.ll-sigil-label`: `position: absolute; bottom: var(--ll-s-125); left: var(--ll-s-15); line-height: 0;` (the site's `.label-slot` recipe: block + line-height 0, so the Eyebrow's line box does not shift the corner)

The accent follows the axis through `--ll-accent` (`[data-accent]` /
`[data-role]` on any ancestor), as on the five role guides today.

## 3. Token

One new Figma variable: `Primitives/opacity/ornament` = `0.25` (float, scope
OPACITY), CSS `--ll-opacity-ornament`. Created in the Lib file through the
MCP after Louis's explicit go (Q4), then extracted by the stage-1 procedure
(`extract-tokens.prompt.md`, checksum-verified patch of the raw export),
normalised and transformed. The transform emits floats in px unless the key
is unitless by name (`Layout/z/*`, type weight and line-height): the
`opacity/*` family joins that list — one rule, locked by a detector test.
Provenance entry in `PROVENANCE.md`; the token-diff gate stays expected-red
until Louis applies `token-approved`.

Every other value already has its token: `--ll-border`, `--ll-border-soft`,
`--ll-surface`, `--ll-accent`, `--ll-s-15` (12px ring inset and label left),
`--ll-s-3` (24px ring inset), `--ll-s-125` (10px label bottom).

## 4. Accessibility commitment

- Decorative by construction: `aria-hidden="true"` on the root, always — the
  six site mounts already do this. The art and the label are hidden
  together; the page's meaning lives in the heading and the intro next to
  the sigil, never in the sigil.
- Not interactive: nothing focusable, no states, no ARIA role, no events.
  Interactive children are not expected (a `dont`).
- Contrast: the component declares **no contrast pair** — pure decoration
  is exempt from WCAG 1.4.3, and the contrast gate scores declared pairs
  only. First component with an empty pair set; the contract's `a11y`
  block says so explicitly, and the Eyebrow's own pairs are not re-declared
  (they are scored on the Eyebrow).
- Engine gate: the examples render under axe with the root `aria-hidden`;
  the keyboard suite asserts nothing focusable is rendered.

## 5. Figma component set (mandatory; none exists)

Page `Sigil`, one component `Sigil` (no variant axis — Q5 and Q2 leave
nothing to vary):

- frame 320 × 320, fill bound to `Semantic/bg/surface`, 1px stroke bound to
  `Semantic/border/default`;
- two inner rectangles (the rings): inset 12 (`Spacing/s-15`), stroke
  `Semantic/border/soft`; inset 24 (`Spacing/s-3`), stroke
  `Semantic/accent/default`, layer opacity bound to
  `Primitives/opacity/ornament`;
- an instance of `Eyebrow / Tone=Dim` (80:3) at bottom 10 (`Spacing/s-125`),
  left 12 (`Spacing/s-15`), text `SIGIL · TOP`;
- a placeholder art: a hexagon vector, stroke `Semantic/accent/default`,
  centred, as the slot's stand-in.

Built through `use_figma` (guard first, mutate once, return ids; clear the
white default fill on every auto-layout helper). Louis validates the
rendering (visual checkpoint — his lock); the node id goes into the RFC
header and `contract.json` (`designNode`).

## 6. Tooling extensions carried by this component

1. **Dist: relative component imports.** `generate-dist.ts` strips only
   `import React from "react"` and refuses any residual import. The Sigil
   imports `{ Eyebrow } from "../eyebrow"`; the generator learns that
   shape: strip a relative import whose binding is a component the dist
   already exports (function declarations are hoisted, so order is not a
   concern). Any other residual import still fails.
2. **Examples with element children.** `Example.children` is a string
   (`docs-render.ts`, `docs-html.ts`, `a11y-mount.ts`); the Sigil's
   examples need an SVG child. An example may now carry
   `children: { snippet: string; node: ReactNode }`: the renderer and the
   a11y mount pass `node`, the docs print `snippet` in the code block. The
   deferred follow-up "mountComponent children `string` → ReactNode" closes
   here. Locked by the detectors' unit suite where a pure function is
   touched.

Both extensions ship in the implementation PR, each with its red/green
proof where a gate's scan surface changes (ORCHESTRATION: "You touched a
gate's detector or scan surface").

## 7. Site adoption (product-integration mission, after the implementation)

- Five mounts become `<LL.Sigil label="…">art</LL.Sigil>`: `Hero` in
  `components.jsx` (five role guides), `glossary.jsx`, `landing.jsx`,
  `design-system.jsx`, `fundamentals-cards.jsx`.
- Deleted: `.hero-sigil` (+ pseudo-elements), `.ds-hero-sigil` (+), `.ft-intro-sigil` (+), `.sigil-label`.
- Kept product-side: `.hero-sigil-icon` (the masked role icon), the grid
  columns and `.landing-sigil` as the slot's width, `.ds-empty-sigil` (Q6).
- Visual checkpoint (Louis's lock): DesignSystem and Fundamentals change
  ornament (brackets → rings, the Fundamentals glow disappears); the seven
  other pages render identically.

## 8. PR sequence

1. `feat/sigil-rfc` — Figma set + opacity variable (the RFC needs the
   design node), RFC `draft` with §7 filled from the session log, manifest
   row (priority 4), the two archives. Louis approves the RFC (§6).
2. `feat/sigil` — token extraction (`token-approved`), component, CSS,
   a11y suite, meta, docs, dist, the two tooling extensions. `pnpm
conformity` verdict quoted.
3. Site adoption PR, visual checkpoint, ratification in §7.
4. Promotion `stable` then `exported` by `pnpm promote`, each its own PR.

## Out of scope (closed)

- A frameless variant (Q6).
- An ornament prop (Q2: one ornament).
- An optional label (Q5).
- A tone or size prop; a `className` passthrough.
