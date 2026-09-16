# Usage analysis — the site's mono labels ("tag", "eyebrow") — 2026-09-16

Measured on the LearningLeagues checkout at `main` 6a26dcb (fetched, on
`origin/main` — L09), before any RFC. Purpose: decide whether the third
component candidate ("Tag / Eyebrow", the two most-cited patterns in the site
measure) is a component at all. Louis chose (2026-09-16) to run this analysis
FIRST instead of writing a `Docs / Tag` page in Figma — see the convention
addendum in `process/PROJECT-CONTEXT.md` (Design source).

## 1. What the site calls a tag

`grep -E '(class|className)="[^"]*\b[a-z-]*tag\b'` over `*.html *.jsx`:
**19 usages in 10 files, 12 distinct local classes.** No standalone `.tag`
rule exists in any stylesheet: every rule is contextual (`.hero-sigil .tag`,
`.champ-meta .tag`, `.build-block h3 .tag`, `.archetype-tab .tag`) or a
page-local class (`fund-cell-tag`, `train-row-tag`, `res-row-tag`, `qz-tag`,
`exercise-tag`, `ds-brand-tag`, `ds-type-tag`, `ds-empty-tag`,
`ds-lb-youtag`). The font comes from the `.mono` utility or is restated
inline.

| Class                          | Files                      | Recipe (measured)                                                            |
| ------------------------------ | -------------------------- | ---------------------------------------------------------------------------- |
| `.tag` (8 usages)              | components, glossary, landing, role-sections ×4, fundamentals-cards, design-system | mono, 10px, uppercase, tracking 0.12–0.16em, `fg-mute` or `accent` by parent |
| `.hero-sigil .tag` and kin     | components, landing, glossary, design-system, fundamentals-cards | 10–11px, 0.14–0.16em, `fg-mute`, absolutely positioned bottom-left of a sigil |
| `fund-cell-tag`, `train-row-tag`, `res-row-tag` | landing         | 9.5–10px, 0.14–0.16em, `accent` or `fg-mute`                                   |
| `qz-tag`                       | quiz-app                   | 10px, 0.18em, `accent`, with a 5px rotated-square glyph before (`::before`)    |
| `exercise-tag`                 | role-sections              | 10px, 0.14em, `accent`                                                         |
| `ds-*-tag`                     | design-system, ds-*        | 10px, 0.14–0.18em, `fg-mute` or `accent` (showcase pages)                      |
| `.ds-chip` (4 usages)          | ds-components only         | the ONLY chrome: 1px `border`, padding 4px 10px, `fg-dim`; `--accent` / `--win` / `--loss` variants — DS showcase, zero product page |

## 2. What the site calls an eyebrow

`.eyebrow` (`styles.css:136`): mono, 11px, weight 500, uppercase, tracking
0.18em, `fg-mute`; `.eyebrow--accent` → `accent`. **9 class usages in 6 JSX
files** (components 1, design-system 1, fundamentals-cards 2, glossary 1,
landing 2, quiz-app 2); the word appears in 15 files (the earlier "15" count
included stylesheets and pages that only load the class). Always the first
line of a hero or a section head, above a serif title.

## 3. Against the library

The Lib text style `type/meta` (tokens.css): mono, 11px, weight 400,
tracking 0.06em, case none, line-height 1.4. Neither recipe maps onto it as
is: both add `uppercase` and a wide tracking (0.12–0.18em, five distinct
values on the site), the eyebrow adds weight 500, the tags drop to 10px. The
arbitration of 2026-08-12 (PROJECT-CONTEXT: `type/eyebrow` deleted, "one mono
utility style is enough; the eyebrow treatment is a usage of `type/meta`-family
typography, not a separate style") still stands: the treatment is a
COMPONENT-level decision, not a token.

## 4. Conclusion

- **"Tag" as a chip with chrome: no product usage.** `.ds-chip` lives on the
  design-system showcase only (4 usages). Promotion criterion 4 ("at least one
  consuming product has a confirmed use case") cannot be met → STOP for a
  chrome Tag.
- **The real pattern is one typographic label** used 28 times in 12 product
  and showcase files under 13 different class names: mono, uppercase, wide
  tracking, muted or accent, 10–11px. It is the same object the site calls
  `eyebrow` at the top of a section and `tag` inside a card, a row or a
  sigil. Extracting it would delete 13 local classes and settle five tracking
  values and two sizes into tokens — a design arbitration (Louis's lock).
- **The sigil** (`hero-sigil`, `ds-hero-sigil`, `ft-intro-sigil`: 5 usages,
  bordered square, accent SVG art, corner brackets, a `.tag` label) is a
  separate candidate — decorative (`aria-hidden`), page-specific art. Not
  measured further here.

Options handed to Louis (2026-09-16): (a) STOP — no third component from
this family; (b) an `Eyebrow` component (the site's own word, the 2026-08-12
arbitration's word): `<span>` with the mono uppercase recipe, `tone` mute /
accent, one arbitrated size and tracking (or two), covering the 28 usages;
(c) build the Figma component set for (b) first, since the RFC prompt requires
a design node and none exists.
