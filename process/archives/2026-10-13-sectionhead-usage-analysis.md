# Usage analysis — the site's section head — 2026-10-13

Measured on the LearningLeagues checkout at `main` f6066ab (`HEAD` =
`origin/main`, tree clean — L09; no fetch run in this session, the remote ref
was verified by the caller), library at `main` dc9945b, before any RFC or
Figma work. Computed styles were read in a local browser
(`python -m http.server`, read-only) at 1440, 901 and 375px viewports with the
web fonts loaded (`document.fonts.check('36px "EB Garamond"')` true). Purpose:
decide whether the fifth component candidate — the numbered section head —
is a component at all, and with which shape. Same convention as the Eyebrow
and the Sigil: usage analysis FIRST, then Louis chooses
(`process/PROJECT-CONTEXT.md`, Design source, addendum 2026-09-16).

## 1. What the site calls a section head

`grep -rn "SectionHead|DSSection|ft-sec-head|showcase-text|section-head"`
over the tracked `*.jsx *.css *.html` (the vendored `lib/ll-lib.*` excluded),
plus every `<h2` in the site: **4 implementations, 4 CSS recipes in 3
stylesheets**. Every h2 on the site is one of them, except the Glossary's
letter headings (§5.3) and the Quiz question (`quiz-app.jsx:109`, not a
section head).

| Implementation                    | Markup / CSS                                                                                           | Mounted from                                                                                          | Pages rendered (renders)                                                                                   | Number                                     | Title                                                        | Lede                    |
| --------------------------------- | ------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- | ------------------------------------------ | ------------------------------------------------------------ | ----------------------- |
| `SectionHead` (A)                 | `components.jsx:345-355` — `div.section-head > div.section-num + div > h2.section-title + p.section-lede`; `styles.css:172-203` | 11 call sites in `role-sections.jsx` (one per section component) + `glossary.jsx:71`                  | Top, Jungle, Mid, ADC (10 each), Support (11), Glossary (1) — **52 renders on 6 pages**                    | serif italic 56px accent, own column       | plain string — 0 of 52 contain `<em>`                        | present in 52 of 52     |
| `.ft-sec-head` (B)                | inline in `fundamentals-cards.jsx:69-76` and `fundamentals-graph.jsx:233-241`; `fundamentals.css:40-47` | 2 hand-written blocks                                                                                 | Fundamentals — **2 renders**                                                                               | mono 11.5px accent line above the title, text `01 / THE SIX THAT CARRY YOUR RANK`, `02 / THE FULL MAP` | `Start with the <em>six.</em>`, `All twenty-five, <em>wired together.</em>` | present in 2 of 2       |
| `.showcase-text` header (C)       | `landing.jsx:84-88` (`Showcase`) and `landing.jsx:146-153` (`RolesSection`); `styles.css:1541-1563`    | `Showcase` ×3 in `index.html:33,47,59` + `RolesSection` ×1                                            | index — **4 renders**                                                                                      | `div.showcase-num` — **empty in 3 of 3** (bug, below); absent in `RolesSection` | `<em>` in 4 of 4                                             | present in 4 of 4       |
| `DSSection` (D)                   | `design-system.jsx:147-160` — `section.ds-section > header.ds-section-head`, a copy of (A); `design-system.css:13-35` | 22 calls: `ds-foundations.jsx` 6, `ds-components.jsx` 11, `ds-patterns.jsx` 5                        | DesignSystem (showcase) — **6 / 11 / 5 renders**, one tab at a time (`DSApp` renders the active tab only) | as (A)                                     | plain string — 0 of 22                                       | present in 22 of 22 (rendered conditionally) |

Totals: **58 product renders on 8 product pages** (A 52, B 2, C 4) + 22
showcase renders. Quiz has none. Number format is two digits everywhere it
exists: `String(i + 1).padStart(2, "0")` in `app.jsx` for the role guides
(01–10, 01–11 on Support), a hard-coded `"01"` on the Glossary (its only
section), hard-coded strings in the showcase, and a composed text
`"01 / LABEL"` on Fundamentals.

**Reported bug confirmed:** `Showcase` renders `<div className="showcase-num mono">{num}</div>`
but no call in `index.html` passes `num`. Measured: the div renders with
`textContent ""`, height 0 and `margin-bottom: 16px`, pushing the Eyebrow
16px down in 3 of the 4 landing heads (`RolesSection` has no such div — its
Eyebrow sits at 0). Product-side, not this component's to fix.

## 2. Where the recipes diverge

Values are the computed styles at 1440px unless stated (site density
`compact`, `--s` = 8px, on all 10 pages).

| Property             | (A) `SectionHead`                                    | (D) `DSSection`                          | (B) `.ft-sec-head`                                   | (C) `.showcase-text`                                   |
| -------------------- | ---------------------------------------------------- | ---------------------------------------- | ---------------------------------------------------- | ------------------------------------------------------ |
| Layout               | grid `100px 1fr`, gap 32, number aside               | grid `110px 1fr`, gap 32, number aside   | stacked: number line, title, lede; `max-width: 760px` | stacked: (empty number), Eyebrow, title, lede, CTA; column of a 2-col grid beside a visual |
| Under 768px          | one column, gap 16; number 44px, title 28px          | one column, gap 16; **no size step**     | (no breakpoint; the clamp does it)                   | grid collapses under 900px                              |
| Number               | EB Garamond italic 56 / 400, lh 1, −0.02em, accent, `padding-top: 4px` | same, but tracking `normal`              | JetBrains Mono 11.5px, 0.18em, accent, caps **typed in the source** (no `text-transform`) | mono 11px, 0.18em, `fg-mute`, uppercase — renders nothing |
| Number ornament      | `::after` 60×1px accent at opacity .5, `bottom: -14px` | identical                                | none                                                 | none                                                   |
| Title size           | 36px fixed (28px under 768)                          | 36px fixed                               | `clamp(30px, 4vw, 42px)` → 42 at 1440, 30 at 375     | `clamp(36px, 4.5vw, 56px)` → 56 at 1440, 36 at 375     |
| Title line-height / tracking | 1.1 / −0.01em (global `h2` rule)             | 1.1 / −0.01em                            | 1.08 / −0.015em                                      | 1.05 / −0.02em, `max-width: 16ch`                      |
| Title wrapping       | `white-space: nowrap` above 900px                    | wraps                                    | wraps                                                | wraps                                                  |
| `<em>` in title      | no rule (would render browser italic, title colour)  | no rule                                  | italic + accent                                      | italic + accent                                        |
| Lede                 | 16px / 1.6, `fg-dim`, no max-width                   | 15.5px / 1.6, `fg-dim`, `max-width: 78ch` | 16px / 1.62, `fg-dim`, `max-width: 60ch`, `margin-top: 16px` | 17px / 1.6, `fg-dim`, `max-width: 50ch`, `margin-bottom: 40px` |
| Title → lede spacing | title `margin-bottom: 12px`                          | 12px                                     | lede `margin-top: 16px`                              | title `margin-bottom: 24px`                            |
| Bottom margin        | 56px                                                 | 40px                                     | 56px                                                 | (lede 40px, then CTA)                                  |
| Wrapper element      | `div`                                                | `header`                                 | `div`                                                | `div`                                                  |

(D) is a near-verbatim copy of (A) on the showcase; (B) and (C) are a
different object — a stacked "label + display title + lede" block that the
landing also uses as a feature column with a CTA and a visual beside it.

## 3. Layouts observed and responsive behaviour

- **Aside** (A, D — 52 product renders + 22 showcase): the number sits in its
  own fixed column (100 / 110px) left of the title and lede; at ≤768px the
  grid collapses to one column, the number stacks above the title with a 16px
  row gap. Measured at 375px: the underline (`bottom: -14px`) lands **2px**
  above the title — the ornament nearly touches it on phones.
- **Stacked** (B, C — 6 product renders): a mono line above the title, no
  column; sizes fluid via `clamp()`.
- **`nowrap` (A only):** measured at 901px — the narrowest width where it
  applies — the title column is 754px and the longest title on any role page
  (`Key concept: the clear sets up everything`, Jungle) measures 558px: **no
  overflow today**, minimum spare 196px. The risk is latent: a title about
  35 % longer, or a translation (the `LangSwitcher` lists FR / ES / DE but
  switches nothing yet), would overflow the column with no wrap.
- **Side finding (product-side layout, not this component):** on the role
  guides and the Glossary the section is `<section className="section shell">`,
  and `.section { padding: var(--section-y) 0 }` (`styles.css:169`) is
  declared after `.shell` and cancels its horizontal gutter. Measured: at
  375px and at 901px the head's left edge is at **x = 0** (flush to the
  viewport). A `nowrap` overflow there would hit the viewport edge directly.

## 4. Against the library — every property to a token (L01)

`DESIGN GAP` = no token holds the value; it is never copied. Nearest
candidates are listed for the arbitration, not chosen. `font-style: italic`,
`text-transform: uppercase` and `white-space` are keywords, not design values
(the Eyebrow ships `uppercase` as a literal keyword for the same reason). The
1px line is the design language's fixed line weight, as in the Callout and
the Sigil.

### 4.1 Recipe (A) `SectionHead` — `styles.css:172-203`

| Property                                   | Site value                 | Token                                                                                                                                       |
| ------------------------------------------ | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `.section-head` column 1                   | 100px                      | **DESIGN GAP** — the spacing ladder stops at `--ll-s-8` 64px; no Layout token. Nearest: `--ll-s-8` (64)                                     |
| column gap                                 | `--s × 4` = 32px           | `--ll-s-4`                                                                                                                                  |
| row gap ≤768px                             | `--s × 2` = 16px           | `--ll-s-2`                                                                                                                                  |
| `margin-bottom`                            | `--s × 7` = 56px           | `--ll-s-7` — but product-side spacing (§7)                                                                                                  |
| breakpoint                                 | 768px                      | **DESIGN GAP** — no breakpoint token exists in the library (no component has shipped a media query yet)                                    |
| number family                              | EB Garamond                | `--ll-font-display`                                                                                                                         |
| number size                                | 56px                       | **DESIGN GAP** — no type token at 56. Nearest: `--ll-type-display-size` 64, `--ll-type-h1-italic-size` 44. (`--ll-s-7` is 56 but a spacing token — never used for type) |
| number size ≤768px                         | 44px                       | `--ll-type-h1-italic-size` (44) — exact                                                                                                     |
| number style                               | italic                     | keyword; `--ll-type-h1-italic-style` = italic                                                                                               |
| number weight                              | 400                        | **DESIGN GAP** — every display-family type token is 500. Nearest: `--ll-type-h1-italic-weight` 500                                          |
| number line-height                         | 1                          | `--ll-type-display-line-height` (1) — exact, but a different text style than the size                                                       |
| number tracking                            | −0.02em                    | **DESIGN GAP** — tokens hold −0.025em (display) and −0.01em (h1-italic, h2, h3)                                                             |
| number colour                              | `var(--accent)`            | `--ll-accent`                                                                                                                               |
| number `padding-top`                       | `--s × 0.5` = 4px          | `--ll-s-05`                                                                                                                                 |
| underline width                            | 60px                       | **DESIGN GAP** — ladder has `--ll-s-7` 56 and `--ll-s-8` 64                                                                                 |
| underline height                           | 1px                        | fixed line weight (Callout, Sigil precedent)                                                                                                |
| underline offset (`bottom`)                | −14px                      | **DESIGN GAP** — ladder has `--ll-s-15` 12 and `--ll-s-2` 16                                                                                |
| underline colour                           | `var(--accent)`            | `--ll-accent`                                                                                                                               |
| underline opacity                          | .5                         | **DESIGN GAP** — the one opacity token is `--ll-opacity-ornament` 0.25                                                                      |
| title family / weight / tracking           | EB Garamond / 500 / −0.01em (global `h1, h2, h3` rule) | `--ll-type-h2-family` / `--ll-type-h2-weight` / `--ll-type-h2-tracking` — exact                                  |
| title size                                 | 36px                       | **DESIGN GAP** — `--ll-type-h2-size` is 32, `--ll-type-h1-italic-size` 44. (The DS showcase's own type scale advertises "H2 · 36px", `ds-foundations.jsx:139`, against the 32px token.) |
| title size ≤768px                          | 28px                       | **DESIGN GAP** — between `--ll-type-h3-size` 22 and `--ll-type-h2-size` 32                                                                  |
| title line-height                          | 1.1                        | `--ll-type-h2-line-height` — exact                                                                                                          |
| title colour                               | inherited `--fg`           | `--ll-fg`                                                                                                                                   |
| title `margin-bottom`                      | `--s × 1.5` = 12px         | `--ll-s-15`                                                                                                                                 |
| title `white-space`                        | `nowrap` > 900px           | keyword — behaviour question (§3), and a second breakpoint (900px, gap)                                                                    |
| lede colour                                | `var(--fg-dim)`            | `--ll-fg-dim`                                                                                                                               |
| lede family                                | Inter (body)               | `--ll-type-body-family`                                                                                                                     |
| lede size                                  | 16px                       | **DESIGN GAP** — `--ll-type-body-size` 15, `--ll-type-body-sm-size` 14                                                                      |
| lede line-height                           | 1.6                        | **DESIGN GAP** — `--ll-type-body-line-height` 1.55                                                                                          |

### 4.2 Recipe (D) `DSSection` — `design-system.css:13-35`

Same mapping as (A), with these differences: column 110px (**DESIGN GAP**),
`margin-bottom` 40px (`--ll-s-5`), number tracking `normal`, no ≤768px size
step, no `nowrap`, lede 15.5px (**DESIGN GAP** — between body 15 and the
site's 16) with `max-width: 78ch` (**DESIGN GAP**, no measure token).

### 4.3 Recipe (B) `.ft-sec-head` — `fundamentals.css:40-47`

| Property            | Site value                    | Token                                                                                           |
| ------------------- | ----------------------------- | ----------------------------------------------------------------------------------------------- |
| head `max-width`    | 760px                         | **DESIGN GAP** — product-side measure                                                           |
| head `margin-bottom`| 56px                          | `--ll-s-7` (product-side)                                                                       |
| number family       | JetBrains Mono                | `--ll-type-meta-family`                                                                         |
| number size         | 11.5px                        | **DESIGN GAP** — `--ll-type-meta-size` 11 (the Eyebrow recipe)                                  |
| number tracking     | 0.18em                        | **DESIGN GAP** — `--ll-type-meta-tracking` 0.06em; the Eyebrow §7 Q2 already aligned every mono label's 0.12–0.18em on it |
| number colour       | accent                        | `--ll-accent`                                                                                   |
| number spacing      | `margin-bottom` 16px          | `--ll-s-2`                                                                                      |
| title size          | `clamp(30px, 4vw, 42px)`      | **DESIGN GAP** — fluid; every type token is a fixed size; 30 and 42 are not tokens either       |
| title line-height   | 1.08                          | **DESIGN GAP** — `--ll-type-h2-line-height` 1.1                                                 |
| title tracking      | −0.015em                      | **DESIGN GAP** — h2 −0.01em, display −0.025em                                                   |
| `em`                | italic, accent                | keyword + `--ll-accent`                                                                         |
| lede                | 16px / 1.62, `fg-dim`, 60ch, `margin-top` 16px | size and line-height **DESIGN GAP** (body 15 / 1.55); `--ll-fg-dim`; 60ch **DESIGN GAP**; `--ll-s-2` |

### 4.4 Recipe (C) `.showcase-text` header — `styles.css:1541-1563`

| Property            | Site value                    | Token                                                                                       |
| ------------------- | ----------------------------- | ------------------------------------------------------------------------------------------- |
| number              | mono 11px, 0.18em, `fg-mute`, uppercase, mb 16px — **renders empty** | `--ll-type-meta-size`; 0.18em **DESIGN GAP**; `--ll-fg-mute`; `--ll-s-2` |
| eyebrow             | `LL.Eyebrow tone="accent"` in a `.label-slot`, mb 16px | already the library (Eyebrow, exported); `--ll-s-2`                                         |
| title size          | `clamp(36px, 4.5vw, 56px)`    | **DESIGN GAP** — fluid; 56 has no type token (see 4.1)                                      |
| title lh / tracking | 1.05 / −0.02em                | **DESIGN GAP** both                                                                         |
| title `max-width`   | 16ch                          | **DESIGN GAP** (product measure)                                                            |
| title mb            | 24px                          | `--ll-s-3`                                                                                  |
| `em`                | italic, accent                | keyword + `--ll-accent`                                                                     |
| lede                | 17px / 1.6, `fg-dim`, 50ch, mb 40px | 17 and 1.6 **DESIGN GAP**; `--ll-fg-dim`; 50ch **DESIGN GAP**; `--ll-s-5`             |

### 4.5 What the mapping says

Of recipe (A)'s 30 properties, 15 map to a token, 3 are keywords or the
fixed line weight, and **12 are design gaps**,
and the gaps are the identity of the object: the number's size, weight and
tracking, all three underline values, the title's two sizes, the lede's size
and line-height, the column and the breakpoint. The library's type scale has
no 36px title and no 56px number; `type/h2` (32) and `type/h1-italic` (44)
are the existing styles nearest to them. Whichever way Louis goes, either the
site aligns on existing tokens (the Eyebrow precedent, §7 Q2 there) or the
Figma file gains variables / a text style (the Sigil precedent,
`opacity/ornament`). Fluid sizes (B, C) have no token concept at all.

## 5. Accessibility

### 5.1 Heading level

Every measured title is an `<h2>` under the page's single `<h1>` (hero),
with `<h3>` inside the sections — the outline is correct on all 8 product
pages. No usage needs another level today. A `level` prop would serve no
measured case; an h2-only component keeps one render path.

### 5.2 How the number is voiced

The number is a sibling `div` outside the heading: a screen reader reading
linearly announces "zero one" (or "01") then the heading; heading navigation
skips it, so the heading's accessible name is the title alone — consistent
with the Eyebrow's rule (§7 Q9 there: nothing inside the heading). On the
role guides the same numbers are repeated by the `TocSidebar`
(`aside aria-label="Contents"`). The number carries order only, which the
document order already gives. On Fundamentals the number line also carries
a label (`THE SIX THAT CARRY YOUR RANK`) typed in capitals in the source —
the case the Eyebrow §4.1 warns some readers spell letter by letter.

### 5.3 Section labelling and the Glossary letters

No `<section>` on the site has `aria-labelledby`; an unnamed `<section>` is
not a region landmark, so nothing is lost today, but a component that gives
its heading an `id` lets the product name its section in one attribute. The
Glossary puts 18 letter headings (`glossary.jsx:85`, A … W, measured) at
`<h2>` — the **same level** as its section head `Every term, defined`, of
which they are the subsections. Product-side outline defect (they should be
`<h3>`); the section head itself is correct.

### 5.4 Contrast

Title `fg` and lede `fg-dim` on `bg` are pairs the contrast gate already
scores (`fg/dim` on `bg` 9.35:1, Eyebrow §7 Q13). The accent number is large
text (≥ 24px) and already passes as normal text under the five accents for
the Eyebrow; the underline at opacity .5 is decoration (WCAG 1.4.3 exempt).
Whatever the component declares, the gate computes; this paragraph is not
evidence.

## 6. Dependencies — is the mono number an Eyebrow?

- **(A) / (D) serif number:** not an Eyebrow — a display numeral, no mono,
  no capitals. No library dependency.
- **(B) Fundamentals number line:** it is a mono accent label above a title
  — exactly the Eyebrow's job — at 11.5px / 0.18em instead of 11px / 0.06em,
  capitals in source. It escaped the Eyebrow adoption (that grep matched
  `tag|eyebrow` class names; `ft-sec-num` matches neither). An Eyebrow
  **before** the `<h2>` is what Eyebrow §7 Q9 prescribes ("placed BEFORE the
  h2 / h3, never inside it"); beside or above the heading is allowed.
- **(C) landing:** already places `LL.Eyebrow` before the `<h2>` — the
  stacked shape is today expressible with the library as Eyebrow + h2 + p,
  without a new component.
- A SectionHead that rendered an Eyebrow would be the first library →
  library dependency; both the Callout (Eyebrow RFC §1) and the Sigil (§7 Q11
  there, label removed) avoided it. A slot the product fills with
  `LL.Eyebrow` keeps the components independent.

## 7. What stays product-side

Per the manifest's responsibility split ("Placement and sizing of a library
component in the page … margins"): the head's `margin-bottom` (56 / 40px),
the section's vertical padding and border (`.section`, `.ft-section`,
`.showcase`, `.ds-section`), the `<section>` element and its `id` (the TOC
anchors `s01` … depend on it), the page grid (shell width, the landing's
2-column showcase grid, `order` swaps of `--reverse`), the head's own
`max-width` (760px on Fundamentals), the CTA and the visual beside the
landing heads, and the number's computation (`padStart` in `app.jsx`) — the
component receives a string.

## 8. Draft API (for the RFC, not decided)

```tsx
<SectionHead
  num="01"            // string, two digits by product convention; required or optional (Q2)
  title={<>Start with the <em>six.</em></>}   // ReactNode; <em> styled (Q8)
  lede="…"            // ReactNode, optional (Q11)
  id="s01-title"      // optional, forwarded to the heading so the product can aria-labelledby its <section>
/>
```

Renders `div.ll-section-head > [span.ll-section-head-num (aria per Q9)] +
div > h2.ll-section-head-title + p.ll-section-head-lede` — one `<h2>`, no
`level` prop (Q10), no margin outside itself, the title wraps (Q7). A
`layout` prop (`"aside" | "stacked"`) and an `eyebrow` slot exist only if Q1
keeps two layouts. Extraction of the aside shape deletes `.section-head` and
its children (`styles.css:172-203`, 32 lines) and `.ds-section-head` and its
children (`design-system.css:13-35`, 23 lines), and replaces the
`SectionHead` and `DSSection` header markup — 52 product renders + 22
showcase renders. No Figma component set exists for it (Lib file pages as
recorded 2026-10-13: Cover, Button, Docs / Button, Callout, Docs / Callout,
Eyebrow, Sigil — not re-read in this session, no Figma call); the set is the
one mandatory Figma object before the RFC.

## 9. Conclusion

- **The aside section head is one object**, 52 renders on 6 product pages
  under one recipe, plus a 22-render copy on the showcase that diverges on
  six details. Promotion criterion 4 (a consuming product with a confirmed
  use case) is met before the RFC.
- **The stacked heads (Fundamentals 2, landing 4) are a different object**
  that differs on every property and is already expressible with
  `LL.Eyebrow` + an `<h2>` + a `<p>`; whether the library also owns it is
  Louis's call (Q1).
- **12 of recipe (A)'s 30 values have no token** — the arbitration is mostly
  "align on `type/h2` / `type/h1-italic` / `type/body` and the ladder, or
  create Figma variables" (Q3–Q6, Q12).
- **Product-side findings recorded, not fixed:** the landing's empty number
  div (3 renders, +16px above the Eyebrow); `.section` cancelling `.shell`'s
  gutter on role guides and Glossary (heads flush to the viewport edge at
  ≤ 1200px); the Glossary letters at `<h2>` instead of `<h3>`; the
  Fundamentals number line as an un-adopted mono label (11.5px / 0.18em,
  capitals in source).

## 10. Closed questions for the design lead

> Pour Louis. Chaque question a des options fermées, la conséquence concrète
> de chacune, et une recommandation. Rien n'est décidé tant que vous n'avez
> pas répondu.

**Q1 — Que faire du candidat « tête de section » ?**

- **STOP** — les quatre recettes restent dans le site. Conséquence : aucun
  travail bibliothèque ; les 52 têtes des guides et les 22 de la vitrine
  gardent leur CSS local, le risque de débordement (`nowrap`) reste.
- **Composant SectionHead, une seule disposition : le numéro dans sa colonne
  à gauche** (guides de rôle, Glossaire, vitrine). (Recommandé) — Pourquoi :
  c'est 52 des 58 têtes du site sous une seule recette ; Fundamentals et la
  page d'accueil gardent leur composition, qui s'écrit déjà avec la
  bibliothèque (Eyebrow + titre + texte).
- **Composant SectionHead à deux dispositions** (colonne ET empilée, avec un
  emplacement pour un Eyebrow au-dessus du titre). Conséquence : couvre aussi
  Fundamentals (2) et l'accueil (4), mais ces six têtes diffèrent sur toutes
  les valeurs (taille, numéro, largeur) — deux fois plus de choses à
  arbitrer dans Figma pour 6 usages.

**Q2 — Le numéro est-il obligatoire ?**

- **Obligatoire.** (Recommandé) — Pourquoi : les 74 têtes « colonne »
  mesurées ont toutes un numéro ; une tête sans numéro n'a plus besoin de la
  colonne, c'est un simple titre + texte.
- **Optionnel** — sans numéro, la colonne disparaît et le titre se cale à
  gauche. Conséquence : un deuxième rendu à dessiner et à tester, sans
  usage aujourd'hui.

**Q3 — Le trait sous le numéro (60 px de large, 14 px sous le chiffre,
opacité 50 %) : aucune de ces trois valeurs n'existe dans les variables.**

- **Garder le trait, aligné sur les variables existantes** (largeur 56 ou
  64 px, décalage 12 ou 16 px, opacité `opacity/ornament` 25 %).
  (Recommandé) — Pourquoi : aucune nouvelle variable ; le trait devient
  plus discret (25 % au lieu de 50 %), à juger au point de contrôle visuel
  dans Figma.
- **Garder le rendu exact** — créer dans Figma les variables manquantes
  (largeur 60, décalage 14, opacité 50 %). Conséquence : trois variables pour
  un seul ornement, label `token-approved` et passage du pipeline.
- **Supprimer le trait.** Conséquence : changement visible sur les 52 têtes ;
  règle aussi le trait qui touche presque le titre sur mobile (2 px mesurés).

**Q4 — Taille du titre : le site utilise 36 px (28 px sur mobile) ; la
variable `type/h2` vaut 32 px.**

- **`type/h2` 32 px partout, sans palier mobile.** (Recommandé) — Pourquoi :
  zéro nouvelle variable, même logique que l'Eyebrow (le site s'aligne sur la
  bibliothèque). Conséquence : titres 4 px plus petits sur ordinateur, 4 px
  plus grands sur mobile.
- **Nouveau style de texte Figma 36 / 28 px.** Conséquence : rendu identique ;
  premier style typographique avec un palier responsive dans la bibliothèque
  (aucun mécanisme n'existe encore pour ça).
- **Taille fluide (comme Fundamentals, entre deux bornes selon la largeur
  d'écran).** Conséquence : aucune variable ne sait exprimer une taille
  fluide aujourd'hui — il faudrait inventer ce concept dans le pipeline.

**Q5 — Taille du numéro : 56 px italique graisse 400 (44 px sur mobile) ;
aucune variable à 56, mais `type/h1-italic` vaut exactement 44 px.**

- **`type/h1-italic` (44 px, graisse 500) partout.** (Recommandé) — Pourquoi :
  c'est déjà la taille du numéro sur mobile ; zéro nouvelle variable.
  Conséquence : numéro plus petit et un peu plus gras sur ordinateur.
- **Nouveau style de texte Figma « numéro de section » 56 px / 400.**
  Conséquence : rendu identique ; un style de plus pour un seul usage.
- **`type/display` (64 px).** Conséquence : numéro plus grand, et ce style
  n'est pas en italique — il faudrait le forcer.

**Q6 — La largeur de la colonne du numéro (100 px ; 110 px dans la vitrine)
n'existe pas dans les variables.**

- **64 px (`s-8`, la plus grande marche existante).** (Recommandé) —
  Pourquoi : aucune variable nouvelle, et un numéro de 44 px (Q5) y tient
  avec sa marge. Conséquence : le titre se rapproche du numéro de 36 px.
- **Nouvelle variable Figma 100 px.** Conséquence : rendu identique ; une
  variable de mise en page en plus.
- **Largeur automatique (celle du numéro).** Conséquence : les titres « 01 »
  et « 11 » ne sont plus parfaitement alignés d'une section à l'autre.

**Q7 — Le titre doit-il rester sur une seule ligne au-dessus de 900 px
(règle actuelle) ?**

- **Non, le titre passe à la ligne si besoin.** (Recommandé) — Pourquoi :
  aucun changement visible aujourd'hui (le titre le plus long, 558 px, tient
  dans 754 px au pire cas mesuré) et plus aucun risque de débordement si un
  titre s'allonge ou est traduit.
- **Oui, garder une seule ligne.** Conséquence : un titre ~35 % plus long
  déborde de sa colonne, et sur ces pages le contenu touche déjà le bord de
  l'écran.
- **Une seule ligne, coupée par « … ».** Conséquence : une partie du titre
  devient invisible — mauvais pour la lecture et l'accessibilité.

**Q8 — Un mot en italique accent dans le titre (`<em>`), comme sur les héros,
l'accueil et Fundamentals ?**

- **Oui, l'`<em>` du titre s'affiche en italique couleur accent.**
  (Recommandé) — Pourquoi : c'est la règle des quatre autres titres du site ;
  aucun des 52 titres actuels n'en contient, donc rien ne change à
  l'adoption.
- **Non, pas de règle** — l'`<em>` reste un italique du navigateur, couleur
  du titre. Conséquence : un titre qui en utilise un ne ressemble pas aux
  héros.

**Q9 — Le numéro pour les lecteurs d'écran (lu « zéro un » avant le titre
aujourd'hui).**

- **Masqué aux lecteurs d'écran.** (Recommandé) — Pourquoi : il ne donne que
  l'ordre, que la page donne déjà ; sur les guides le sommaire répète les
  mêmes numéros.
- **Lu tel quel** (rendu actuel). Conséquence : « zéro un » annoncé avant
  chaque titre lu en continu ; rien ne change.
- **Intégré au titre** (« 01 — Phases »). Conséquence : le numéro pollue le
  nom du titre dans la navigation par titres — ce que la règle Eyebrow Q9 a
  interdit pour les étiquettes.

**Q10 — Niveau du titre.**

- **Toujours un h2.** (Recommandé) — Pourquoi : les 74 têtes mesurées sont
  toutes des h2 sous le h1 du héros ; un seul rendu à tester.
- **Niveau réglable (h2 ou h3).** Conséquence : une option sans usage
  aujourd'hui. (Les lettres du Glossaire en h2 sont un défaut du site, à
  corriger côté site en h3 quoi qu'il arrive.)

**Q11 — Le texte d'introduction (lede) est-il obligatoire ?**

- **Optionnel.** (Recommandé) — Pourquoi : les 74 têtes en ont un, mais
  l'imposer n'apporte rien et le composant actuel du site laisse un
  paragraphe vide quand il manque.
- **Obligatoire.** Conséquence : toute future section sans introduction
  devra en inventer une ou contourner le composant.

**Q12 — Taille du texte d'introduction : 16 px / interligne 1,6 sur le site
(15,5 px dans la vitrine) ; la variable `type/body` vaut 15 px / 1,55.**

- **`type/body` (15 px / 1,55).** (Recommandé) — Pourquoi : zéro nouvelle
  variable ; 1 px de moins, à juger au point de contrôle visuel.
- **Nouveau style 16 px / 1,6.** Conséquence : rendu identique ; un style de
  texte de plus, proche de `type/body`.
