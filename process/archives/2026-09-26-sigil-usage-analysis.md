# Usage analysis — the site's sigil — 2026-09-26

Measured on the LearningLeagues checkout at `main` 061a33d (fetched, on
`origin/main`, tree clean — L09), before any RFC or Figma work. Purpose:
decide whether the fourth component candidate — the "sigil" the mono-label
analysis (`2026-09-16-mono-label-usage-analysis.md`, §4) set aside as "a
separate candidate, not measured further" — is a component at all. Same
convention as the Eyebrow: usage analysis FIRST, then Louis chooses
(`process/PROJECT-CONTEXT.md`, Design source, addendum 2026-09-16).

## 1. What the site calls a sigil

`grep -rn -i sigil` over the tracked `*.html *.css *.jsx *.js` (the vendored
`lib/ll-lib.*` excluded): **6 mount points in 6 JSX files, 4 CSS recipes in 3
stylesheets**, rendered on **9 of the 10 pages** that load the library (every
page but Quiz).

Five of the six are the same object — a **framed sigil**: a square
(`aspect-ratio: 1`) with a 1px `--border` edge, a `--surface` background,
`color: var(--accent)` so the art inside inherits the live accent, an
ornament drawn by `::before` / `::after`, page-specific art in the middle,
and a corner label in the bottom-left. Every one is `aria-hidden="true"`.

| Mount (file)                 | Class                      | Pages rendered                                   | Art                                                                              | Ornament                                                                         | Width                                     | Label (an `LL.Eyebrow` since 2026-09-21) |
| ---------------------------- | -------------------------- | ------------------------------------------------ | -------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- | ----------------------------------------- | ---------------------------------------- |
| `components.jsx` (`Hero`)    | `.hero-sigil`              | Top, Jungle, Mid, ADC, Support (5 role guides)   | `.hero-sigil-icon`: a role-position PNG from CommunityDragon, masked, tinted accent, 44 % centred | two inset rings: 12px `--border-soft`, then 24px `--accent` at opacity .25       | `min(320px, 100%)`, in a 320px grid column | `SIGIL · TOP` … `SIGIL · SUPPORT`        |
| `glossary.jsx`               | `.hero-sigil`              | Glossary                                         | inline SVG (hexagon, spokes, a book glyph), `stroke="currentColor"`              | same two rings                                                                   | same                                      | `SIGIL · GLOSSARY`                       |
| `landing.jsx`                | `.hero-sigil.landing-sigil`| index                                            | inline SVG (hexagon, spokes, a compass glyph)                                    | same two rings                                                                   | `min(360px, 100%)`, `max-width: 240px` under 900px, `justify-self: start` there | `RIFT · COMPASS`                         |
| `design-system.jsx`          | `.ds-hero-sigil`           | DesignSystem (showcase)                          | inline SVG (three nested hexagons, a diamond, six satellites, cross-hairs)       | two corner brackets, 14px, `--accent`, on the outer edge (`-1px`)                | `max-width: 320px`, in a 320px grid column | `SIGIL · LL/DS · v1`                     |
| `fundamentals-cards.jsx`     | `.ft-intro-sigil`          | Fundamentals                                     | inline SVG (six spokes and satellites, a dashed ring, a core)                    | two corner brackets, 22px, `--accent`, plus a radial accent glow (8 %) behind    | `max-width: 340px`, `margin-inline: auto`, in a `1fr` column | `DEPENDENCY GRAPH`                       |

The sixth mount is not framed: `.ds-empty-sigil` (`ds-patterns.jsx`, the
DS showcase's "Empty / error state" pattern) is `color: var(--accent);
aspect-ratio: 1` and an SVG — no border, no surface, no ornament, no label —
in a 180px grid column. One usage, showcase only, no product page.

Shared by the five framed usages, verbatim from the stylesheets:

- `aspect-ratio: 1; position: relative; border: 1px solid var(--border); background: var(--surface); color: var(--accent);`
- `svg { width: 100%; height: 100%; }` (the fundamentals one adds `position: absolute; inset: 0`, same effect)
- the pseudo-element ornament carries `pointer-events: none`
- `.sigil-label { position: absolute; bottom: 10px; left: 12px; }` — one rule in `styles.css`, shared by the three recipes since the Eyebrow adoption ("position only; the text is an LL.Eyebrow")
- `aria-hidden="true"` on the frame, so the label's text is hidden from assistive technology with the art

## 2. Where the recipes diverge

| Property        | `.hero-sigil` (3 mounts, 7 pages)             | `.ds-hero-sigil` (1 mount)         | `.ft-intro-sigil` (1 mount)                                   | Verdict                                                                                   |
| --------------- | --------------------------------------------- | ---------------------------------- | ------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Ornament        | two inset rings (12px soft, 24px accent .25)  | corner brackets 14px               | corner brackets 22px + radial accent glow                     | **design arbitration** — one ornament, or a prop; the design language names "corner-bracket ornaments" (`PROJECT-CONTEXT.md`) |
| Width           | 320 (360 on the landing, 240 on mobile)       | 320                                | 340                                                           | product-side: the parent grid column sizes the slot; the component fills it (`width: 100%; aspect-ratio: 1`) |
| Alignment       | `justify-self: end`                           | `justify-self: end`                | `margin-inline: auto`                                         | product-side (grid placement)                                                             |
| Art             | masked PNG (role icon) or inline SVG          | inline SVG                         | inline SVG                                                    | product-side: a children slot; the art is page-specific by nature                          |
| Background      | `--surface`                                   | `--surface`                        | `--surface` + accent glow                                     | the glow is part of the ornament question                                                 |

The role-icon recipe (`.hero-sigil-icon`: `position: absolute; inset: 0;
margin: auto; width: 44%; height: 44%; background: var(--accent);
mask-image: url(<external PNG>)`) is a product asset inside the slot — the
manifest's responsibility split already settles it ("Sizing of the product's
own assets inside library slots": the library controls the slot, the consumer
sizes its asset). It stays product-side, whatever the sigil becomes.

## 3. Against the library

- **Tokens that exist for every shared value:** `--ll-border`,
  `--ll-border-soft`, `--ll-surface`, `--ll-accent`; the label offsets
  `10px` / `12px` are exactly `--ll-s-125` / `--ll-s-15`; the ring insets
  `12px` / `24px` are `--ll-s-15` / `--ll-s-3`; the 22px bracket is
  `--ll-s-275`.
- **Values with no token (design gaps, L01 — never copied):** the 14px
  bracket (the ladder has 12 and 16), the accent ring at **opacity .25**
  (no accent-following alpha token — `--ll-accent-soft` is the fixed gold
  alpha, it does not follow the accent axis), and the fundamentals glow
  (`color-mix(... var(--accent) 8%, transparent)` in a radial gradient).
  Whichever ornament is chosen decides which gap, if any, needs a Figma
  variable.
- **The corner label is the library's own Eyebrow** (`exported` since PR
  #44). A Sigil that renders it would be the first component composing
  another library component — the Callout kept its tag inside itself
  precisely to avoid a dependency in v1 (Eyebrow RFC §1). Either the Sigil
  imports `Eyebrow` (one recipe, one dependency) or it exposes a slot and the
  product places the `LL.Eyebrow` (what the site does today).
- **Accessibility:** decorative by construction (`aria-hidden` on all six
  mounts), no interaction, nothing focusable; the art and the label are
  hidden together. Contrast has no threshold to meet for pure decoration
  (WCAG 1.4.3 exempts decoration), but the contrast gate scores declared
  pairs only — a decorative component declares none, which is a first for
  the gate's `a11y` block and must be written down, not left implicit.
- **No Figma component set exists** (Lib file pages as of 2026-09-17:
  Cover, Button, Docs / Button, Callout, Docs / Callout, Eyebrow — nothing
  for a sigil). The RFC prompt requires a design node; the set is the one
  mandatory Figma object (docs page optional).

## 4. Conclusion

- **The framed sigil is one object**, used 5 times on 9 pages (8 product
  pages + the showcase) under 3 recipes that agree on everything except the
  ornament. Promotion criterion 4 (a consuming product with a confirmed use
  case) is met before the RFC is written.
- **Extracting it** deletes the three recipes and their pseudo-elements
  (about 30 lines across three stylesheets) and the `.sigil-label` rule;
  keeps product-side the grid placement, the `.landing-sigil` width, the
  role-icon recipe and every SVG.
- **The frameless `.ds-empty-sigil`** is a coloured SVG box on the showcase
  only — not the same object and not a product usage: out of scope unless
  Louis wants a frameless variant (a closed question, default no).
- **What only Louis can decide:** go / no-go; the ornament (rings, brackets,
  brackets + glow, or a prop); whether the label is a prop rendering the
  Eyebrow or a slot; the Figma set to build (none exists).

Options handed to Louis (2026-09-26): (a) STOP — the sigil stays three page
recipes; (b) a `Sigil` component: the frame (border, surface, accent, square,
one arbitrated ornament) with an art slot and a corner label, covering the
five usages; (c) build the Figma component set for (b) first, since the RFC
prompt requires a design node and none exists.
