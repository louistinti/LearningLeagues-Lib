# Usage analysis — the site's hero meta strip — 2026-10-13

Measured on the LearningLeagues checkout at `main` f6066ab (`HEAD` =
`origin/main` = f6066ab after a fetch, tree clean — L09), against the library
at `main` dc9945b, before any RFC or Figma work. Purpose: decide whether the
fifth component candidate — a row of small mono facts at the foot of a hero,
working name **MetaStrip** — is a component at all. Same convention as the
Eyebrow and the Sigil: usage analysis FIRST, then Louis chooses
(`process/PROJECT-CONTEXT.md`, Design source, addendum 2026-09-16).

Method: static measurement — every value below is quoted from the stylesheet
or JSX line named next to it; the cascade (inherited font-size, line-height,
weight) was read by hand from `styles.css`. No browser computed-style pass
was run. Contrast ratios are computed (WCAG relative luminance) from the hex
values, against the page background `#070a14` (`--bg` / `--ll-bg`): every
strip sits directly on the page background, no hero paints a surface.

## 1. What the site calls a meta strip

`grep -n -E 'hero-meta|ft-intro-meta|landing-meta|qz-intro-meta|ds-hero-meta|dot-sep|stars'`
over the tracked `*.jsx *.css` (vendored `lib/ll-lib.*` and `docs/` plans
excluded): **6 mount points in 6 JSX files, 5 CSS recipes in 4
stylesheets**, rendered on **10 of the 10 pages** (9 product pages + the
design-system showcase). No other strip-shaped pattern exists: the other
`*-meta` classes (`.champ-meta`, `.video-meta`, `.ds-rank-meta`,
`.ds-progress-meta`, `.ds-tier-meta`, `.ds-type-meta`, `.ds-empty-meta`,
`.ds-token-meta`, `.ds-font-meta`) are card or showcase internals with no
dashed rule and no key — a different object, not measured further.

All six are the same object: a `display: flex; flex-wrap: wrap` row of
`<span>` facts in JetBrains Mono, `--fg-mute`, with a `1px dashed var(--rule)`
top border and `24px` above the text, each fact led by a `<strong>` key in
uppercase, weight 500, tracking 0.1em. It is the last line of the hero's
text column, under the intro paragraph.

| Mount (file:lines)                                         | Recipe (stylesheet:lines)            | Pages rendered                                     | Items rendered (source text, `<strong>` in **bold**)                                                                                             |
| ---------------------------------------------------------- | ------------------------------------ | -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `components.jsx:366-368` (`Hero`, `meta.map(m => <span>)`) | `.hero-meta` `styles.css:423-433`    | Top, Jungle, Mid, ADC, Support (via `app.jsx:67`)  | **Difficulty** + star rating · **Read time** ~15 min · **Patch** `{LL_PATCH}` (= "26.12", `components.jsx:27`) — Support writes "26.X" literally |
| `glossary.jsx:24-28`                                       | `.hero-meta` (same)                  | Glossary                                           | **{count} terms** · alphabetised · **Scope** · macro & mechanics · **Patch-stable**                                                              |
| `landing.jsx:43-49`                                        | `.landing-meta` `styles.css:1504-1514` | index                                            | **5 sections** · structured path `·` **By role** · top, jungle, mid, adc, support `·` **Iron → Platinium** (the `·` between items are two `.dot-sep` spans) |
| `fundamentals-cards.jsx:21-26`                             | `.ft-intro-meta` `fundamentals.css:22-31` | Fundamentals                                  | **25** fundamentals · **6** that carry your rank · **Read** ~12 min · **Patch** 26.X                                                             |
| `quiz-app.jsx:39-43`                                       | `.qz-intro-meta` `quiz.css:61-70`    | Quiz                                               | **Questions** 8 · **Time** ~2 min · **Result** all 5 roles, ranked                                                                               |
| `design-system.jsx:84-89`                                  | `.ds-hero-meta` `design-system.css:85-97` | DesignSystem (showcase)                       | **Density** Compact · **Accent** Ambre · **Mode** Dark only · **Patch** 26.X                                                                     |

Counts: 32 rendered facts on 10 pages (5 role pages × 3, then 3 + 3 + 4 + 3 +
4), written in 10 source places (the five `role-*.jsx` `ROLE_DATA.meta.meta`
arrays at lines 12-16 — `role-support.jsx` 10-14 — plus the five inline
mounts). Every page already loads `lib/ll-lib.{css,jsx}` (Callout adoption,
L11 check), so an adoption adds no page to that list.

The star rating (role pages only, 5 usages):
`<strong>Difficulty</strong><span className="stars">★★</span><span style={{opacity:.3}}>★</span>`
— filled stars in `.stars` (`styles.css:433`: `color: var(--accent);
letter-spacing: 2px`), empty stars in a sibling span with an **inline**
`opacity: .3` and no `.stars` class, so they carry neither the accent nor the
2px spacing (they are `--fg-mute` at 30 %). Measured levels: Support 1/3,
Top 2/3, Mid 2/3, ADC 2/3, Jungle 3/3. Elsewhere on the same pages difficulty
is a word: champion cards `Diff · Easy` / `Balanced` (`role-sections.jsx:280`),
matchup table pills (`role-sections.jsx:355`).

Shared by all five recipes, verbatim:

- `display: flex; flex-wrap: wrap;`
- `font-family: 'JetBrains Mono', monospace;`
- `color: var(--fg-mute);`
- `padding-top: calc(var(--s) * 3);` (24px — `--s` is 8px, compact density)
- `border-top: 1px dashed var(--rule);`
- key: `font-weight: 500; text-transform: uppercase; letter-spacing: 0.1em;`
- line-height inherited from `body` (`styles.css:18`: 1.55); weight of the
  text inherited (400 — `body` sets none)

## 2. Where the recipes diverge

| Property             | `.hero-meta` (2 mounts, 6 pages) | `.ft-intro-meta` (1) | `.landing-meta` (1)        | `.qz-intro-meta` (1)              | `.ds-hero-meta` (1, showcase) | Verdict                                                                                    |
| -------------------- | -------------------------------- | -------------------- | -------------------------- | --------------------------------- | ----------------------------- | ------------------------------------------------------------------------------------------ |
| Text size            | 11.5px                           | 11.5px               | 11px                       | 11px                              | 11px                          | **design arbitration** — 11 is `type/meta`; 11.5 has no token                              |
| Text tracking        | 0.04em                           | 0.04em               | 0.06em                     | 0.06em                            | 0.04em                        | **design arbitration** — 0.06 is `type/meta`; 0.04 has no token                            |
| Key colour           | `--fg-dim`                       | `--fg-dim`           | `--accent`                 | `--fg-dim`                        | `--accent`                    | **design arbitration** — exactly the Eyebrow's two tones                                   |
| Key size             | 10px                             | 11px                 | 11px (inherited)           | 10px                              | 10px                          | **design arbitration** — Eyebrow §7 Q7 already took 10 → 11 for labels                     |
| Key → value spacing  | `margin-right: 8px`              | 7px                  | 6px                        | 6px                               | 8px                           | **design arbitration** — 8 is `--ll-s-1`; 6 and 7 are off the ladder                       |
| Gap between facts    | 24px                             | 16px row / 24px col  | 16px                       | 24px                              | 24px                          | **design arbitration** — both values are tokens (`s-3`, `s-2`)                             |
| Cross-axis alignment | default (stretch)                | default              | `align-items: center`      | default                           | default                       | structural; one line of uniform text, no visible effect except with the `.dot-sep` spans   |
| Separator between facts | none                          | none                 | `.dot-sep` `·` at `opacity: .4` | none                         | none                          | **design arbitration** (one usage)                                                         |
| Padding below        | 0                                | 0                    | 0                          | `padding: 24px 0` + `margin-bottom: 40px` | 0                     | product-side — spacing to the quiz's Start button, not part of the strip                   |
| Rating               | stars on the 5 role pages        | —                    | —                          | —                                 | —                             | **design arbitration** — in or out of the component (Q5)                                 |

## 3. Against the library

### 3.1 Every property → token (L01: mapped or flagged, never copied)

Container (the strip):

| Property         | Site value(s)                               | Token                                                                                                                                                                                                                  |
| ---------------- | ------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `display`, `flex-wrap`, `align-items` | `flex`, `wrap`, `center` (landing) | not design values — structural layout of the component's own items                                                                                                                                         |
| `gap`            | 24px                                        | `--ll-s-3`                                                                                                                                                                                                             |
|                  | 16px (landing; fundamentals row-gap)        | `--ll-s-2`                                                                                                                                                                                                             |
| `font-family`    | `'JetBrains Mono', monospace`               | `--ll-type-meta-family` (= `--ll-font-mono`, which adds the `ui-monospace, Menlo` fallbacks — no visible change when the web font loads)                                                                                |
| `font-size`      | 11px                                        | `--ll-type-meta-size`                                                                                                                                                                                                  |
|                  | 11.5px (hero, fundamentals — 7 pages)       | **DESIGN GAP: no token.** Nearest: `--ll-type-meta-size` 11px, `--ll-type-button-size` 12px (the button style: 600, 0.14em, uppercase — not a candidate family)                                                         |
| `font-weight`    | 400 (inherited)                             | `--ll-type-meta-weight`                                                                                                                                                                                                |
| `line-height`    | 1.55 (inherited from `body`)                | **choice, not a gap:** `--ll-type-meta-line-height` is 1.4 (the strip's own text style; ~1.65px shorter per line at 11px). `--ll-type-body-line-height` is 1.55 but belongs to the Inter body style — borrowing it would mix two text styles |
| `letter-spacing` | 0.06em                                      | `--ll-type-meta-tracking`                                                                                                                                                                                              |
|                  | 0.04em (hero, fundamentals, DS — 8 pages)   | **DESIGN GAP: no token.** Nearest: `--ll-type-meta-tracking` 0.06em, `--ll-type-body-tracking` 0em                                                                                                                     |
| `color`          | `var(--fg-mute)` = `#6e7a94` on the site    | `--ll-fg-mute` = `#7d89a3`. **Visible change:** the site's local variable predates the 2026-08-12 contrast arbitration (`PROVENANCE.md:99`, `#6e7a94` → `#7d89a3`); 4.59:1 today → 5.63:1 on `bg` after adoption |
| `padding-top`    | 24px                                        | `--ll-s-3`                                                                                                                                                                                                             |
| `border-top`     | `1px dashed var(--rule)`                    | colour `--ll-rule` (`rgba(255,255,255,.09)`, identical to the site; first library use of the token). Width `1px`: no token — the library writes the hairline literally, by precedent ("1px rules are the design language's fixed line weight", `sigil.css`, as in `callout.css`). Style `dashed`: a CSS keyword, no token; **first dashed line in the library** (the site uses `dashed var(--rule)` on 34 lines across 4 stylesheets) — the Figma set must carry a dashed stroke |
| `padding-bottom` | 24px (quiz)                                 | `--ll-s-3` — product-side spacing (§3.4)                                                                                                                                                                               |
| `margin-bottom`  | 40px (quiz)                                 | `--ll-s-5` — product-side spacing (§3.4)                                                                                                                                                                               |

Key (`<strong>`):

| Property         | Site value(s)                        | Token                                                                                                                                                                                                                     |
| ---------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `color`          | `var(--fg-dim)` (hero, fundamentals, quiz — 8 pages) | `--ll-fg-dim` (9.35:1 on `bg`)                                                                                                                                                                               |
|                  | `var(--accent)` (landing, DS — 2 pages) | `--ll-accent` (follows `[data-accent]` / `[data-role]`; weakest on `bg`: violet 6.47:1)                                                                                                                                |
| `font-weight`    | 500 (all five)                       | **DESIGN GAP: no token.** Nearest: `--ll-type-meta-weight` 400. The 500s in the token set (`--ll-type-display/h1-italic/h2/h3-weight`) belong to the EB Garamond styles — not candidates. Eyebrow §7 Q7 took the site's mono 500 to 400 |
| `font-size`      | 11px (fundamentals, landing)         | `--ll-type-meta-size`                                                                                                                                                                                                     |
|                  | 10px (hero, quiz, DS — 8 pages)      | **DESIGN GAP: no token.** Nearest: `--ll-type-meta-size` 11px. Eyebrow §7 Q7: "no 10px text token exists, readability floor"                                                                                             |
| `letter-spacing` | 0.1em (all five)                     | **DESIGN GAP: no token.** Nearest: `--ll-type-meta-tracking` 0.06em, `--ll-type-button-tracking` 0.14em. Eyebrow §7 Q2 took the site's 0.12–0.18em to 0.06em                                                              |
| `text-transform` | `uppercase` (all five)               | CSS keyword, written literally — the Eyebrow's own precedent (`eyebrow.css`: "the capitals are the Q2 arbitration, not the text style"; `--ll-type-meta-case` is `none`)                                                    |
| `margin-right`   | 8px (hero, DS — 7 pages)             | `--ll-s-1`                                                                                                                                                                                                                |
|                  | 7px (fundamentals), 6px (landing, quiz) | **DESIGN GAP: no token.** Nearest: `--ll-s-05` 4px, `--ll-s-1` 8px. Note: every source also types a literal space after `</strong>`, so the visible gap today is margin + one space width |

Rating and separator:

| Property                         | Site value                   | Token                                                                                                                                       |
| -------------------------------- | ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `.stars` `color`                 | `var(--accent)`              | `--ll-accent`                                                                                                                               |
| `.stars` `letter-spacing`        | 2px                          | **DESIGN GAP: no token.** Nearest: `--ll-s-05` 4px (the site's own ladder note: "4px is the absolute minimum (hairline only)")               |
| empty stars `opacity` (inline)   | .3                           | **DESIGN GAP: no token.** Nearest: `--ll-opacity-ornament` 0.25 — named for the Sigil's ring, not a "disabled / empty" meaning               |
| empty stars `color`              | inherited `--fg-mute`        | `--ll-fg-mute` — at 30 % on `bg` the empty star renders `#262c3a`, **1.42:1** (1.50:1 with the token colour)                                |
| `.dot-sep` `opacity`             | .4                           | **DESIGN GAP: no token.** Nearest: `--ll-opacity-ornament` 0.25 (would make the dots fainter: 1.66:1 today on `bg`)                          |

Design gaps, in one list: text 11.5px, text tracking 0.04em, key weight 500,
key size 10px, key tracking 0.1em, key spacing 6/7px, star spacing 2px,
empty-star opacity .3, separator opacity .4. Every one disappears if the
strip aligns on `type/meta` and the Eyebrow (Q2–Q4 below); none needs a new
Figma variable in the recommended path.

### 3.2 Content model

The 32 facts are not all key/value pairs. Five shapes, measured:

| Shape                                     | Example (source)                                           | Count (rendered)  |
| ----------------------------------------- | ---------------------------------------------------------- | ----------------- |
| A. label first: key, then value           | **Read time** ~15 min; **Questions** 8; **Accent** Ambre   | 19 (roles 10, fundamentals 2, quiz 3, DS 4) |
| B. value first: the emphasised part is the number | **25** fundamentals; **6** that carry your rank    | 2 (fundamentals)  |
| C. key · description, with a typed `·`    | **{count} terms** · alphabetised; **5 sections** · structured path; **By role** · top, jungle…; **Scope** · macro & mechanics | 4 (glossary 2, landing 2) |
| D. key alone, no value                    | **Patch-stable**; **Iron → Platinium**                     | 2 (glossary, landing) |
| E. key + rating                           | **Difficulty** ★★☆                                          | 5 (role pages)    |

(19 + 2 + 4 + 2 + 5 = 32.) What this means for the API: a strict term/definition
model fits A only; B and D have no "definition", C has a description rather
than a value. A model of "a key, then optional free content" covers A, C, D
and E as written and B either as written (the number as key — it is
uppercase-neutral) or rewritten label-first ("Fundamentals 25"), which is a
product wording choice.

Separators: four recipes separate facts by the gap alone; the landing adds
`.dot-sep` spans between facts. The `·` typed inside C items is content, not
a separator — it stays in the text whatever is decided.

### 3.3 Accessibility today vs needed

Today, on every mount:

- A `<div>` of `<span>`s: no list, no grouping. A screen reader reads one run
  of text — "Difficulty … Read time ~15 min Patch 26.12" — with no count of
  facts and no boundary between a value and the next key except a pause.
- The key is `<strong>` (strong importance). Most screen readers do not
  announce it by default; it is a styling hook, not a meaning.
- The uppercase is CSS `text-transform`, so readers voice the author's casing
  (good — same rule as the Eyebrow §4.1).
- **The rating is not voiced as a rating.** "★" is read as the symbol's name
  ("black star") or skipped, depending on the reader and its punctuation
  level; the empty stars are the same character, distinguished only by
  `opacity: .3`, so "2 of 3" and "3 of 3" are voiced identically. The empty
  stars render at 1.42:1 on `bg`, under the 3:1 non-text contrast of WCAG
  1.4.11 — the difference between filled and empty is the information, so it
  is not decoration.
- The landing's `.dot-sep` `·` are not `aria-hidden`: read as "dot" / "middle
  dot" or skipped; 1.66:1 — acceptable only as decoration, which they are
  not marked as.
- Contrast of the text: key `--fg-dim` 9.35:1, key accent ≥ 6.47:1 (violet),
  body `#6e7a94` 4.59:1 today (just over 4.5:1 at 11–11.5px, normal-size
  text), 5.63:1 with `--ll-fg-mute`.
- Not interactive, nothing focusable — no keyboard work.

Needed (proposal, to be arbitrated — Q5, Q6, Q8):

- **A list.** `<ul>` with one `<li>` per fact: readers announce "list, 3
  items" and step fact by fact; it accepts all five content shapes. The
  library ships no reset (distribution contract), so the stylesheet must
  zero the `ul` defaults itself (`list-style`, `margin`, `padding`) —
  structural, like `box-sizing` in `sigil.css`.
- `<dl>` (`<div><dt>key</dt><dd>value</dd></div>` groups) is the honest
  element only if every fact is label-first (shape A); B and D would be
  semantically wrong without a product rewrite. Reader support for `dl`
  announcements is uneven.
- The rating: either it leaves the strip as a word (no symbol to voice), or
  the component renders it with an accessible name ("2 out of 3") and the
  stars `aria-hidden` — the library has no visually-hidden utility today
  (`grep sr-only|visually-hidden` empty in both repositories), so that path
  adds one.
- No separator in the DOM, or an `aria-hidden` one rendered by the component
  (a `·` inside a `<ul>` but outside an `<li>` is invalid HTML).

### 3.4 What stays product-side

Per the manifest's responsibility split ("Placement and sizing of a library
component in the page", "Content of a library slot"):

- Where the strip sits: the last child of the hero's text column; the hero
  grid (`.hero-grid` `align-items: end`, `.ds-hero-grid`, `.ft-intro-grid`,
  `.landing-hero-grid`) places it. The component fills the width it is
  given.
- Spacing outside the strip: the quiz's `padding-bottom: 24px` and
  `margin-bottom: 40px` (the distance to its Start button) — product-side,
  like `.label-slot`. The strip's own rule and its 24px above the text are
  the component (every recipe has them).
- Every word: keys, values, the `·` inside C items, the patch number.
  Content drift found in passing (product-side, not this component's
  business, listed for the product's own hygiene — axiom 6):
  `role-support.jsx:13` writes "26.X" where the four other roles read
  `LL_PATCH` ("26.12"); fundamentals and DS also write "26.X"; the DS strip
  says **Density** Compact although the density axis was removed 2026-08-30
  (the DS lede says "compact by density" too); the landing says "Platinium".
- Depending on Q5: the rating, if it stays a product rendering.

### 3.5 Dependencies

- **The key is an Eyebrow in all but numbers.** Mono, uppercase, wide
  tracking, `fg-dim` or `accent` — the Eyebrow's two tones exactly. Its
  divergences (10px, weight 500, 0.1em) are the very values Eyebrow §7 Q2/Q7
  took to 11px / 400 / 0.06em for the site's 28 other labels. The 2026-09-16
  mono-label analysis did not count these `<strong>` keys (it grepped
  `*tag|eyebrow` class names), so they escaped that arbitration.
- **Rendering `LL.Eyebrow` inside MetaStrip would be the first
  library-internal dependency.** None exists today (each `*.tsx` imports only
  React). Sigil §7 Q3 chose that dependency on 2026-09-26, then Q11 removed
  the label and the dependency with it; the Callout kept its tag inside
  itself "to avoid a dependency in v1". Concrete cost: `scripts/generate-dist.ts`
  strips only `import React from "react"` and refuses any other import
  (`residual import/export after stripping — teach generate-dist the
  shape`, line 72-73) — it must learn to drop an intra-library import (the
  dist is one classic script; `Eyebrow` is already a global function in it),
  with a test. Alternative without dependency: MetaStrip's own CSS restates
  the `type/meta` + uppercase recipe for its key (two copies of one recipe,
  as Callout's tag does).
- **No Figma component set exists** for a meta strip (no Figma call in this
  session; the project memory lists the Lib pages: Cover, Button, Callout,
  Eyebrow, Sigil, their docs pages — none for a strip). The set is the one
  mandatory Figma object; it needs a dashed top stroke bound to `rule`.
- Tokens: everything in the recommended path exists (`type/meta-*`, `fg/mute`,
  `fg/dim`, `accent/default`, `rule`, `s-1`, `s-3`). No token PR, no
  `token-approved` label, unless a gap is kept.

### 3.6 Draft API (to be arbitrated — not a decision)

```tsx
<LL.MetaStrip
  tone="dim" // key colour: "dim" (default) | "accent" — the Eyebrow's tones
  items={[
    { label: "Read time", value: "~15 min" },
    { label: "Patch", value: LL_PATCH },
    { label: "Patch-stable" }, // shape D: a key alone
  ]}
/>
```

```html
<ul class="ll-meta-strip">
  <li class="ll-meta-strip-item">
    <span class="ll-eyebrow ll-eyebrow--dim">Read time</span>
    <span class="ll-meta-strip-value">~15 min</span>
  </li>
  …
</ul>
```

- `items` — `Array<{ label: ReactNode; value?: ReactNode }>`, required, at
  least one. `label` is the key (rendered by the Eyebrow, or by the strip's
  own copy of its recipe — Q3); `value` is free inline content, omitted for
  shape D. An array rather than a compound `<LL.MetaStrip.Item>`: the dist
  exposes one global per component (`window.LL`, `generate-dist.ts:93`), and
  a static sub-component is a second shape to teach.
- `tone` — the key colour for the whole strip, never per item (no measured
  strip mixes tones).
- No `size`, no `as`, no layout prop, no `separator` and no `rating` unless
  Q5/Q6 say otherwise.
- Stylesheet, all tokens: `display: flex; flex-wrap: wrap; gap:
  var(--ll-s-3); padding: var(--ll-s-3) 0 0; margin: 0; list-style: none;
  border-top: 1px dashed var(--ll-rule);` text in `--ll-type-meta-*`,
  `color: var(--ll-fg-mute)`; key spacing `var(--ll-s-1)`; `li` margin and
  padding zeroed (no reset in the host contract).
- Category: data-display. Base primitive: none.

## 4. Conclusion

- **The meta strip is one object**, used 6 times on 10 pages (9 product
  pages + the showcase) under 5 recipes that agree on structure, font family,
  text colour, rule and spacing above, and diverge on six small values
  (text size and tracking, key size, colour and spacing, gap). Promotion
  criterion 4 (a consuming product with a confirmed use case) is met before
  the RFC is written.
- **Extracting it** deletes the five recipes (about 55 lines in
  `styles.css`, `fundamentals.css`, `quiz.css`, `design-system.css`) and the
  `.stars` / `.dot-sep` rules; keeps product-side the placement, the quiz's
  bottom spacing and every word.
- **Its key is the Eyebrow** under values the Eyebrow arbitration already
  retired; the recommended path (11px / 0.06em / `type/meta`, the key as
  `LL.Eyebrow`) needs no new token and leaves nine design gaps closed rather
  than created — at the price of the library's first component-to-component
  dependency and a `generate-dist.ts` change.
- **Accessibility gains are real**: a list instead of a run of text, the
  body colour on the arbitrated `fg/mute`, and the rating either voiced or
  gone — today "2 of 3" is not voiced at all.
- **What only Louis can decide:** go / no-go, and the questions below.

## 5. Closed questions for the design lead (en français)

**Q1 — La bande de méta-données du hero devient-elle le cinquième composant
de la librairie ?**

- **Oui, composant MetaStrip (Recommandé)** — une seule bande remplace les 5
  recettes du site sur les 10 pages ; vous arbitrez ensuite les valeurs
  ci-dessous. *Pourquoi :* même objet partout, déjà utilisé sur toutes les
  pages, aucun nouveau token nécessaire dans la voie recommandée.
- **Non, STOP** — les 5 recettes restent côté site, avec leurs écarts (11 et
  11,5 px, deux interlettrages, trois espacements clé/valeur).
- **Pas maintenant** — l'analyse est archivée, on y revient plus tard.

**Q2 — Le texte de la bande : quelle recette ?** (aujourd'hui 11,5 px /
0,04 em sur 7 pages — les 5 rôles, le glossaire, les fondamentaux — et
11 px / 0,06 em sur l'accueil, le quiz ; le DS mélange 11 px / 0,04 em)

- **Le style type/meta tel quel : 11 px, 0,06 em, interligne 1,4
  (Recommandé)** — aucun nouveau token ; 7 pages voient leur texte réduit
  d'un demi-pixel, 8 pages un interlettrage légèrement plus large, toutes les
  pages une interligne un peu plus serrée (1,55 → 1,4, environ 1,7 px de
  moins par ligne, visible seulement quand la bande passe sur deux lignes).
  *Pourquoi :* c'est le même choix que l'Eyebrow (§7 Q2) ; la bande et les
  étiquettes partagent un seul style mono.
- **11,5 px et 0,04 em (l'allure des pages de rôle)** — aucun changement sur
  7 pages, mais deux nouvelles variables Figma à créer (taille 11,5, interlettrage
  0,04), une PR de tokens avec votre label, et un deuxième style mono à
  côté de type/meta.
- **11 px avec 0,04 em** — une seule nouvelle variable (interlettrage 0,04) ;
  le texte rétrécit sur 7 pages, l'interlettrage change sur l'accueil et le
  quiz.

**Q3 — La clé en capitales (« READ TIME », « PATCH »…) est-elle un
Eyebrow ?** (aujourd'hui 10 ou 11 px, graisse 500, interlettrage 0,1 em —
exactement les valeurs que l'arbitrage Eyebrow a ramenées à 11 px / 400 /
0,06 em pour les 28 autres étiquettes du site)

- **Oui, la bande affiche un vrai LL.Eyebrow (Recommandé)** — la clé prend
  l'allure exacte des étiquettes : un peu plus grande sur 8 pages (10 → 11
  px), moins grasse et moins espacée partout ; une seule recette à maintenir.
  Coût : premier composant de la lib qui en utilise un autre ; le script qui
  fabrique le fichier livré au site doit apprendre ce cas (une modification
  + un test). *Pourquoi :* vous aviez déjà choisi cette dépendance pour le
  Sigil (§7 Q3) avant de retirer son label ; ici le visuel est identique à
  l'option suivante, et une recette unique ne peut pas diverger.
- **Même allure que l'Eyebrow, mais recopiée dans la bande** — rendu
  identique, aucune dépendance (comme le tag du Callout) ; deux copies de la
  même recette à garder alignées à la main.
- **Une clé à part, différente de l'Eyebrow (10 px, graisse 500, 0,1 em)** —
  aucun changement visuel sur 8 pages ; trois nouvelles variables Figma
  (taille 10, graisse mono 500, interlettrage 0,1) et une exception à vos
  arbitrages Eyebrow Q2 et Q7.

**Q4 — Couleur de la clé ?** (gris clair « dim » sur 8 pages : rôles,
glossaire, fondamentaux, quiz ; couleur d'accent sur 2 : accueil, DS)

- **Les deux, au choix par page, gris clair par défaut (Recommandé)** —
  aucun changement visuel sur les 10 pages ; le set Figma a deux variantes,
  les mêmes que l'Eyebrow. *Pourquoi :* ce sont exactement les deux tons de
  l'Eyebrow, donc aucun nouveau concept.
- **Gris clair seulement** — une seule variante ; l'accueil et le DS perdent
  leur clé colorée.
- **Accent seulement** — 8 pages passent leur clé en couleur d'accent (qui
  change avec le rôle : rouge sur Top, jade sur Jungle…).

**Q5 — Que devient la note de difficulté en étoiles (5 pages de rôle) ?**
(aujourd'hui un lecteur d'écran ne dit pas « 2 sur 3 » : il lit « étoile
noire » ou rien, et ne distingue pas les étoiles pleines des vides ; les
étoiles vides sont à 1,42:1 de contraste, sous le minimum de 3:1)

- **La note sort de la bande : le site écrit un mot (Recommandé)** — par
  exemple « DIFFICULTY  Medium », sur le modèle des cartes champion qui
  écrivent déjà « Diff · Easy » ; les étoiles disparaissent des 5 pages ; la
  bande reste du texte pur, lisible par tous. Le choix des mots revient au
  contenu du site. *Pourquoi :* c'est la seule option sans nouvelle valeur
  visuelle à créer et sans problème d'accessibilité.
- **La bande sait afficher une note** (par ex. `2 sur 3`) — les étoiles
  restent et deviennent accessibles (« 2 sur 3 » lu à voix haute) ; il faut
  arbitrer l'espacement des étoiles (2 px aujourd'hui, pas de token) et
  l'opacité des étoiles vides (0,3, pas de token, et à remonter pour
  atteindre 3:1) — deux variables Figma et une API plus large pour 5 usages.
- **Les étoiles restent dans le contenu, le site corrige lui-même
  l'accessibilité** — aucun changement visuel ; le site garde deux valeurs
  en dur (2 px, 0,3) hors librairie et la correction d'accessibilité dépend
  de lui.

**Q6 — Séparateurs entre les faits ?** (seul l'accueil met un point « · »
à 40 % d'opacité entre ses faits ; les 4 autres recettes n'utilisent que
l'espace)

- **Aucun séparateur, l'espace suffit (Recommandé)** — l'accueil perd ses
  deux points ; son espacement passe de 16 à 24 px (voir Q7), ce qui
  compense visuellement. *Pourquoi :* 4 recettes sur 5 font déjà ainsi, et
  l'opacité 0,4 n'existe pas en token.
- **Un séparateur « · » optionnel, dessiné par la bande** — l'accueil garde
  son allure ; il faut une opacité arbitrée (0,4 n'existe pas ; la seule
  opacité existante, 0,25 de l'ornement du Sigil, rendrait les points plus
  pâles) et une option de plus dans l'API.

(Les « · » écrits à l'intérieur d'un fait — « 5 sections · structured
path » — sont du texte et restent, quelle que soit la réponse.)

**Q7 — Espacements : entre deux faits, et entre la clé et sa valeur ?**
(entre faits : 24 px sur 4 recettes, 16 px sur l'accueil, 16 / 24 px sur les
fondamentaux ; clé → valeur : 8 px sur 7 pages, 7 px sur les fondamentaux,
6 px sur l'accueil et le quiz)

- **24 px entre faits, 8 px clé → valeur (Recommandé)** — deux tokens
  existants (s-3, s-1) ; l'accueil s'aère (16 → 24), les fondamentaux et le
  quiz écartent la valeur de 1 à 2 px. *Pourquoi :* c'est déjà la valeur
  majoritaire pour chacun des deux espacements.
- **16 px entre faits, 8 px clé → valeur** — tokens existants (s-2, s-1) ;
  la bande se resserre sur 9 pages.
- **24 px entre faits, 4 px clé → valeur** — tokens existants (s-3, s-05) ;
  clé et valeur se rapprochent sur les 10 pages.

**Q8 — Comment la bande se présente-t-elle à un lecteur d'écran ?**
(aujourd'hui : une suite de mots sans structure)

- **Une liste : « liste, 3 éléments », puis fait par fait (Recommandé)** —
  aucun changement visuel ; accepte tous les faits tels qu'ils sont écrits
  (« 25 fundamentals », « Patch-stable », « Iron → Platinium »). *Pourquoi :*
  c'est la seule structure qui convient aux 32 faits sans réécrire le site.
- **Une liste de définitions (terme → valeur)** — plus précise pour « Read
  time → ~15 min », mais fausse pour les 4 faits sans vraie valeur : le site
  doit les réécrire (par ex. « Fundamentals 25 ») ; la prise en charge par
  les lecteurs d'écran est inégale.
- **Aucune structure, comme aujourd'hui** — aucun changement ; la bande reste
  une phrase continue pour un lecteur d'écran.

**Q9 — Le set de composants Figma (obligatoire avant la RFC) : qui le
construit ?**

- **Je le construis via le MCP Figma après vos réponses (Recommandé)** — une
  page « MetaStrip » dans le fichier Lib, filet pointillé lié à la variable
  `rule`, textes liés au style type/meta, une variante par ton retenu en Q4 ;
  vous le validez visuellement. *Pourquoi :* c'est ce qui a été fait pour le
  Sigil, et toutes les valeurs existent déjà en variables dans la voie
  recommandée.
- **Vous le dessinez vous-même** — la RFC attend votre set.
