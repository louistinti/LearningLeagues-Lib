# RFC: MetaStrip

> **Status:** approved
> **Author:** MetaStrip RFC session (Claude, sup. Louis Tinthilier)
> **Date:** 2026-10-13
> **Design node:** Figma: component set `MetaStrip` 106:29 on page `MetaStrip` 106:2 — https://www.figma.com/design/6zp7CvEjdiFXzwh6ZGGwB8/Lib?node-id=106-29 (page `MetaStrip` of the Lib file; built by an agent, validated by the design lead at a visual checkpoint — §7 Q9); variant property `Values` (`Mute` / `Accent`) added 2026-10-14 by the adoption-checkpoint session (§7, checkpoint rows 2026-10-14) — variants `Tone=Dim, Values=Mute` 106:3, `Tone=Accent, Values=Mute` 106:16, `Tone=Dim, Values=Accent` 112:8, `Tone=Accent, Values=Accent` 112:21
> **Docs page:** no docs page — reported 2026-10-13 (page-less path: usage analysis first, `process/archives/2026-10-13-metastrip-usage-analysis.md`; rules arbitrated in session and recorded in §7)
> **Base primitive:** none
> **Category:** data-display
> **Manifest entry:** meta-strip

---

## 1. Summary

The row of small mono facts at the foot of every hero ("READ TIME ~15 min ·
PATCH 26.12"): a dashed top rule, then a wrapping list of facts, each a key
in the Eyebrow's recipe followed by an optional value in `fg/mute`. Measured
as 6 mounts on 10 pages under five page-local recipes that agree on
structure and diverge on six small values; the component settles them on
`type/meta` and two existing spacing tokens (§7 Q2, Q7), renders each key as
a real `LL.Eyebrow` (§7 Q3), and gives the strip list semantics it does not
have today (§7 Q8). Fifth component through the circuit, the third on the
page-less path, and the first to render another library component — which
made a shared change to the dist generator a precondition, satisfied by
#54 before implementation (§3.5).

---

## 2. Product usage analysis

Source: `process/archives/2026-10-13-metastrip-usage-analysis.md`, measured
on the site checkout at `main` f6066ab (`HEAD` = `origin/main` after a
fetch, tree clean — L09), against the library at `main` dc9945b. Static
measurement: every value is quoted from the stylesheet or JSX line it names;
no browser computed-style pass was run. Not re-measured for this RFC.

### 2.1 Matching identifiers (legacy libraries)

| Identifier                               | Source package                                                                                                                                                                                                                                                                                            |
| ---------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `.hero-meta` (+ `strong`)                | LearningLeagues site `styles.css` (lines 423–433): text 11.5px / 0.04em, key 10px in `fg-dim`, key → value `margin-right: 8px`, gap 24px — the role guides' `Hero` and the Glossary                                                                                                                       |
| `.stars`, empty stars                    | site `styles.css` (line 433): filled stars `color: var(--accent); letter-spacing: 2px`; empty stars in a sibling span with an **inline** `opacity: .3` and no class — role guides only                                                                                                                    |
| `.landing-meta` (+ `strong`), `.dot-sep` | site `styles.css` (lines 1504–1514): text 11px / 0.06em, key 11px (inherited) in `accent`, key → value 6px, gap 16px, `align-items: center`; two `.dot-sep` `·` spans at `opacity: .4` between facts — index                                                                                              |
| `.ft-intro-meta` (+ `strong`)            | site `fundamentals.css` (lines 22–31): text 11.5px / 0.04em, key 11px in `fg-dim`, key → value 7px, gap 16px row / 24px column — Fundamentals                                                                                                                                                             |
| `.qz-intro-meta` (+ `strong`)            | site `quiz.css` (lines 61–70): text 11px / 0.06em, key 10px in `fg-dim`, key → value 6px, gap 24px, plus `padding: 24px 0` and `margin-bottom: 40px` (spacing to the Start button) — Quiz                                                                                                                 |
| `.ds-hero-meta` (+ `strong`)             | site `design-system.css` (lines 85–97): text 11px / 0.04em, key 10px in `accent`, key → value 8px, gap 24px — DesignSystem (showcase)                                                                                                                                                                     |
| Shared by all five, verbatim             | `display: flex; flex-wrap: wrap`; JetBrains Mono; `color: var(--fg-mute)`; `padding-top: calc(var(--s) * 3)` (24px); `border-top: 1px dashed var(--rule)`; key `<strong>` with `font-weight: 500; text-transform: uppercase; letter-spacing: 0.1em`; line-height inherited from `body` (1.55), weight 400 |

### 2.2 Usage metrics

Grep over the tracked `*.jsx *.css` of the site (vendored `lib/ll-lib.*` and
`docs/` plans excluded):
`grep -n -E 'hero-meta|ft-intro-meta|landing-meta|qz-intro-meta|ds-hero-meta|dot-sep|stars'`.

| Product                                 | Files                                                                                                                      | Occurrences                                                                                                             | Main zones                                           |
| --------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| LearningLeagues site (`.hero-meta`)     | 2 mounts (`components.jsx:366-368` `Hero`, `glossary.jsx:24-28`) + the five `role-*.jsx` `ROLE_DATA.meta.meta` data arrays | 6 pages (Top, Jungle, Mid, ADC, Support via `app.jsx:67`; Glossary), 18 facts (5 × 3 + 3); the 5 star ratings live here | last line of the hero's text column, under the intro |
| LearningLeagues site (`.landing-meta`)  | 1 (`landing.jsx:43-49`)                                                                                                    | 1 page (index), 3 facts + 2 `.dot-sep`                                                                                  | same, landing hero                                   |
| LearningLeagues site (`.ft-intro-meta`) | 1 (`fundamentals-cards.jsx:21-26`)                                                                                         | 1 page (Fundamentals), 4 facts                                                                                          | same, intro grid                                     |
| LearningLeagues site (`.qz-intro-meta`) | 1 (`quiz-app.jsx:39-43`)                                                                                                   | 1 page (Quiz), 3 facts                                                                                                  | quiz intro, above the Start button                   |
| LearningLeagues site (`.ds-hero-meta`)  | 1 (`design-system.jsx:84-89`)                                                                                              | 1 page (DesignSystem, showcase), 4 facts                                                                                | showcase hero                                        |
| **Total**                               | 6 mounts in 6 JSX files; 5 CSS recipes in 4 stylesheets; 10 source places for the facts                                    | 10 of the 10 pages (9 product pages + the showcase), 32 rendered facts                                                  | every hero                                           |

Content shapes of the 32 facts (analysis §3.2): A — key then value, 19
(**Read time** ~15 min); B — the emphasised part is the number, 2
(**25** fundamentals); C — key then a description with a typed `·`, 4
(**5 sections** · structured path); D — key alone, 2 (**Patch-stable**);
E — key + star rating, 5 (**Difficulty** ★★☆, role guides).

### 2.3 Notes on product adoption

- Promotion criterion 4 (a consuming product with a confirmed use case) is
  met before the RFC: the strip renders on all 10 pages. Every page already
  loads `lib/ll-lib.{css,jsx}` since the Callout adoption (L11 check,
  `vendor-dist.ts`), so the adoption adds no page to that list.
- Adoption replaces the five recipes (about 55 lines in `styles.css`,
  `fundamentals.css`, `quiz.css`, `design-system.css`) and the `.stars` /
  `.dot-sep` rules with one component. Visible changes, judged at the
  adoption run's visual checkpoint (human lock), not here: text 11.5 → 11px
  on 7 pages and tracking 0.04 → 0.06em on 8 (§7 Q2); line-height 1.55 → 1.4
  everywhere (visible only when the strip wraps); key 10 → 11px on 8 pages,
  weight 500 → 400 and tracking 0.1 → 0.06em everywhere (§7 Q3); the landing
  loses its two `·` and goes from 16 to 24px between facts (§7 Q6, Q7);
  key → value 6/7 → 8px on the landing, the quiz and Fundamentals (§7 Q7);
  the text colour moves from the site's local `#6e7a94` to the library's
  `fg/mute` `#7d89a3` (the site variable predates the 2026-08-12 contrast
  arbitration — 4.59:1 → 5.63:1 on `bg`).
- The star rating leaves the strip (§7 Q5): the five role guides write the
  difficulty as a word, on the model of the champion cards' `Diff · Easy`
  (`role-sections.jsx:280`) — the wording is product content, chosen
  product-side. Shape E becomes shape A; the inline `opacity: .3` and the
  `2px` star spacing leave the site with it.
- Every word stays product-side (manifest split, "Content of a library
  slot"): keys, values, the `·` typed inside a shape C value, the patch
  number. Content drift found in passing, for the product's own hygiene
  (axiom 6, not this component's business): `role-support.jsx:13`,
  Fundamentals and DS write "26.X" where the four other roles read
  `LL_PATCH` ("26.12"); the DS strip still says **Density** Compact although
  the density axis was removed 2026-08-30; the landing writes "Platinium".
- Layout stays product-side (manifest split, "Placement and sizing"): the
  hero grids place the strip as the last child of the text column, and the
  quiz's `padding-bottom: 24px` / `margin-bottom: 40px` (distance to its
  Start button) become a product slot class. The strip's own top rule and
  the 24px above its text are the component — every recipe has them.
- The five shapes all fit "a key, then optional free content" (§3.1).
  Shape B fits as written (the number as the key — uppercase-neutral) or
  rewritten label-first; that is a product wording choice.
- The key `<strong>` is the Eyebrow in all but the numbers Eyebrow §7 Q2/Q7
  already retired; the 2026-09-16 mono-label analysis grepped `*tag|eyebrow`
  class names and missed these keys. Rendering `LL.Eyebrow` makes this the
  library's first component-to-component dependency (§7 Q3, precondition in
  §3.5).
- No Figma component set existed at measurement; it was built on page
  `MetaStrip` of the Lib file (set 106:29, §7 Q9), validated as built at the
  lot-1 checkpoint (§7, checkpoint rows), and carries the library's first
  dashed stroke, bound to `rule`.
- No token change: every value of the arbitrated path is an existing token
  (§3.6) — no token PR, no `token-approved` label.

---

## 3. API design

The MetaStrip has no interactive state, no chrome beyond its top rule, and
no layout outside itself. Every rule below is tagged with what enforces it —
TEST (the component's `MetaStrip.a11y.test.ts` suite, run by the
accessibility engine gate), GATE (a conformity gate), HUMAN (the reviewer or
the visual checkpoint).

### 3.1 Properties

| Name        | Type                                                     | Default  | Required | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| ----------- | -------------------------------------------------------- | -------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `items`     | `ReadonlyArray<{ label: ReactNode; value?: ReactNode }>` | —        | yes      | The facts, in reading order, one list item each. `label` is the key, rendered by `LL.Eyebrow` (§7 Q3); `value` is free inline content after it, omitted for a key alone (shape D). Product content, passed through untouched. `label`, not `key`: `key` is reserved by React. TEST (structure), HUMAN (wording)                                                                                                                                                                                            |
| `tone`      | `"dim" \| "accent"`                                      | `"dim"`  | no       | The key colour for the whole strip, forwarded to every key's Eyebrow as its own `tone` (§7 Q4): `fg/dim` by default, or `accent/default`, which follows the accent axis. One tone per strip — no measured strip mixes them. TEST                                                                                                                                                                                                                                                                           |
| `valueTone` | `"mute" \| "accent"`                                     | `"mute"` | no       | The value colour for the whole strip (§7, adoption-checkpoint rows 2026-10-14): `fg/mute` by default — the value inherits the strip's colour, markup unchanged — or `accent/default`, which follows the accent axis. Independent of `tone` (the keys'): the role guides set accent values under dim keys. An option, not the default — the other pages keep `fg/mute` (« P1 portee: Roles seulement (option) »). The name is the implementing session's proposal, confirmed by the design lead at PR. TEST |

No other prop: no `children`, no `size`, no `as`, no `separator` (§7 Q6), no
`rating` (§7 Q5), no `className`, no layout prop. `items` is an array rather
than a compound `<LL.MetaStrip.Item>`: the dist exposes one global per
component (`window.LL`, `generate-dist.ts`), and a static sub-component would
be a second export shape to teach it.

### 3.2 Slots / Children

None as children. `label` and `value` of each item are the content slots;
what goes in them is the product's (manifest split, "Content of a library
slot"). No glyph, no icon, no rating symbol (§7 Q5).

### 3.3 Events / Callbacks

None. Not interactive.

### 3.4 Rendering and behaviour

```html
<ul class="ll-meta-strip" role="list">
  <li class="ll-meta-strip-item">
    <span class="ll-eyebrow ll-eyebrow--dim">Read time</span>
    <span class="ll-meta-strip-value">~15 min</span>
  </li>
  <li class="ll-meta-strip-item">
    <span class="ll-eyebrow ll-eyebrow--dim">Patch-stable</span>
  </li>
</ul>
```

- Exactly one root `<ul class="ll-meta-strip">`, and one
  `<li class="ll-meta-strip-item">` per entry of `items`, in order — no
  wrapper, nothing between two `li` (§7 Q6, Q8). TEST
- `role="list"` on the root, explicitly (§4.3 — the orchestrator's decision,
  recorded there). TEST
- Each item's first child is a real `<Eyebrow tone={tone}>` holding `label`
  — the strip never restates the Eyebrow recipe (§7 Q3). TEST (the key
  carries `ll-eyebrow ll-eyebrow--{tone}`), HUMAN (`meta-strip.css` holds no
  rule for the key's typography or colour).
- `tone` omitted → every key `ll-eyebrow--dim`; `tone="accent"` → every key
  `ll-eyebrow--accent`. TEST
- `valueTone` omitted → every value span is the bare
  `ll-meta-strip-value` and inherits the strip's `fg/mute`;
  `valueTone="accent"` → every value span also carries
  `ll-meta-strip-value--accent` (`color: var(--ll-accent)`). The modifier
  sits on the value, never on the strip or the key: `tone` and `valueTone`
  are independent (§7, adoption-checkpoint rows 2026-10-14). TEST (classes),
  GATE (token lint), HUMAN (rendering).
- `value` present → one literal space text node, then
  `<span class="ll-meta-strip-value">` holding `value`; `value` absent → no
  space, no value span. The item's text content is therefore
  `label + " " + value` (the word boundary assistive tech and copy-paste
  need), while the visible gap is the item's `column-gap` alone: a
  whitespace-only run between flex items is not rendered. TEST (DOM text),
  HUMAN (rendering).
- `items` empty → the component renders nothing (`null`), never an empty
  list. TEST
- Nothing interactive is rendered by the component itself (no `a`,
  `button`, `input`, `[tabindex]`), and no ARIA attribute beyond
  `role="list"`. TEST
- `.ll-meta-strip`: `display: flex`, `flex-wrap: wrap`,
  `gap: var(--ll-s-3)`, `margin: 0`, `padding: var(--ll-s-3) 0 0`,
  `list-style: none`, `border-top: 1px dashed var(--ll-rule)`; text in the
  `type/meta` family
  (`--ll-type-meta-family/-size/-weight/-style/-line-height/-tracking`),
  `color: var(--ll-fg-mute)` — the value inherits it, the key's Eyebrow
  sets its own (§7 Q2, Q7). The one `gap` serves both directions: 24px
  between two facts and 24px between two rows once the strip wraps (§7,
  checkpoint row « MS ecart lignes: 24 px (meme gap) ») — no separate
  `row-gap`. GATE (token lint), HUMAN (rendering).
- `.ll-meta-strip-item`: `margin: 0`, `padding: 0`, `display: flex`,
  `align-items: baseline`, `column-gap: var(--ll-s-1)` (§7 Q7). The `ul` /
  `li` defaults are zeroed by the component because the library ships no
  reset (distribution contract) — structural, not design values. GATE
  (token lint), HUMAN.
- No margin outside, no width, no alignment, no fixed height, no
  `overflow: hidden`: the parent places the strip and it takes the width it
  is given; the quiz's bottom spacing is a product slot class (§2.3). HUMAN
  (the "no layout" rule has no detector — the reviewer reads the CSS).
- The 1px rule width and the `dashed` style are written literally: 1px is
  the design language's fixed line weight (the `sigil.css` / `callout.css`
  precedent), `dashed` a CSS keyword — the first dashed line in the library.
  The dash pattern is the browser's own `dashed`: the Figma stroke's
  `[3, 3]` dash array is a stand-in chosen to approximate it (no variable
  can hold a dash pattern — Figma build report, 2026-10-13), validated with
  the set at the checkpoint (§7), not a value the CSS reproduces. GATE
  (token lint passes `1px` today), HUMAN (rendering).
- No rating and no separator are rendered (§7 Q5, Q6); a `·` typed inside a
  value is content and stays. HUMAN (a `dont` guideline: no symbol rating
  in a value).
- Contrast of the value text and of the key, under the five accents —
  contrast gate on the declared pairs (§4.3); a11y engine over the contract
  examples × 5 accents. GATE

### 3.5 Precondition — the first library-internal dependency

MetaStrip is the first component whose source imports another component of
the library (`Eyebrow`, §7 Q3). Today `scripts/generate-dist.ts` drops only
`import React from "react";` and refuses any other residual import
(`residual import/export after stripping — teach generate-dist the shape`).
Therefore:

1. **A separate shared PR lands on `main` first**, before the MetaStrip
   implementation PR: it teaches `generate-dist.ts` to drop an
   intra-library relative import (the dist is one classic script in which
   `Eyebrow` is already a hoisted global function), with a test locking the
   new shape and the refusal of any other import. The import specifier
   (`../eyebrow` or `../eyebrow/Eyebrow`) is that PR's decision. It touches
   a shared generator, so it is the orchestrator's change, not this
   component session's (ORCHESTRATION, "You are delegating components to
   parallel subagents").
2. The docs generator and the a11y engine import the real modules and are
   expected to need no change; the shared PR verifies it rather than
   assuming it.
3. From then on a change to the Eyebrow's API or rendering is a change to
   the MetaStrip: the manifest row should name `eyebrow` in its
   `conflictsWith`, and the Eyebrow's own row should mention its dependant.

**Satisfied (2026-10-13).** The shared PR is #54 (`7dfcb98` on `main`),
landed before this implementation. It fixed the one accepted form,
`import { Eyebrow } from "../eyebrow/Eyebrow.tsx";` (the sibling's folder,
its `meta.name` file with the extension, one unaliased binding —
`scripts/lib/component-deps.ts`), which the dist generator drops and the
docs renderer and the a11y engine resolve by bundling; the a11y engine also
audits a component with the CSS of every library component it renders. The
manifest row names `eyebrow` in `conflictsWith`.

### 3.6 Value → token (L01: every raw value mapped, none copied)

| Property                           | Arbitrated value | Token                                                                           |
| ---------------------------------- | ---------------- | ------------------------------------------------------------------------------- |
| text family / size / weight        | mono, 11px, 400  | `--ll-type-meta-family`, `--ll-type-meta-size`, `--ll-type-meta-weight` (§7 Q2) |
| text style                         | normal           | `--ll-type-meta-style`                                                          |
| text line-height                   | 1.4              | `--ll-type-meta-line-height` (§7 Q2 — not the body's 1.55)                      |
| text tracking                      | 0.06em           | `--ll-type-meta-tracking` (§7 Q2)                                               |
| value colour                       | `fg/mute`        | `--ll-fg-mute` (default, inherited from the strip)                              |
| value colour, `valueTone="accent"` | `accent/default` | `--ll-accent` (§7, adoption-checkpoint rows 2026-10-14)                         |
| key (all properties)               | the Eyebrow      | none in this stylesheet — `eyebrow.css` (§7 Q3, Q4)                             |
| gap between facts and rows         | 24px             | `--ll-s-3` (§7 Q7; rows: §7 checkpoint, one `gap` for both directions)          |
| key → value                        | 8px              | `--ll-s-1` (§7 Q7)                                                              |
| space above the text               | 24px             | `--ll-s-3` (all five recipes)                                                   |
| top rule colour                    | `line/rule`      | `--ll-rule` (first library use of the token)                                    |
| top rule width / style             | 1px, dashed      | literal: fixed line weight + CSS keyword (§3.4)                                 |

The nine design gaps the analysis listed (text 11.5px, text tracking
0.04em, key weight 500, key size 10px, key tracking 0.1em, key spacing
6/7px, star spacing 2px, empty-star opacity .3, separator opacity .4) are
all closed by the arbitrations, none by a new token.

---

## 4. Accessibility commitment

### 4.1 Semantic structure

A list (§7 Q8): `<ul role="list">` with one `<li>` per fact, so a screen
reader announces "list, 3 items" and steps fact by fact, where today it
reads one undivided run of text. A `<ul>` and not a `<dl>`: shapes B and D
(§2.2) have no definition, and `dl` announcements are uneven across
readers. The key is the Eyebrow's plain `<span>` — the site's `<strong>`
was a styling hook, not strong importance, and is not kept. The uppercase
is CSS `text-transform` (the Eyebrow's own rule), so assistive tech voices
the author's casing. A literal space separates key and value in the DOM
(§3.4), so "Patch 26.12" is never read as one word. No heading semantics,
no live region, no accessible name on the list (the hero heading above it
gives the context).

### 4.2 Keyboard interaction

Nothing to do: no interactive element, nothing focusable — no `a`,
`button`, `input` or `tabindex` is rendered by the component. Interactive
content in a value is not expected; if the product passes one, it keeps
its own semantics and focus — product-side.

### 4.3 Component-specific decisions

- **Contrast pairs.** Value text: `Semantic/fg/mute` on `Semantic/bg/default`
  (pre-check 5.63:1) by default; under `valueTone="accent"` (§7,
  adoption-checkpoint rows 2026-10-14), `Semantic/accent/default` on
  `Semantic/bg/default` — the same pair as the accent key, scored once per
  accent. Key, through the Eyebrow: `Semantic/fg/dim` on
  `Semantic/bg/default` (9.35:1) and `Semantic/accent/default` on
  `Semantic/bg/default`, which the gate scores once per
  `Primitives/accent/*` (weakest pre-check: violet, 6.47:1). All three are
  already declared in `packages/ui/src/tokens/contrast-pairs.json` (the
  accent value adds no fourth — verified 2026-10-14): the component adds no
  pair, and its contract's `a11y.decisions` names them.
  At 11px the text is normal size for WCAG 1.4.3 (4.5:1). Every measured
  strip sits directly on `bg` (no hero paints a surface); the gate's scan
  surface is the declared pairs, not the component's placement, so a
  product placing the strip on a surface is covered for `fg/mute` and
  `fg/dim` (declared on every surface) and for the accent key and the
  accent value only on `surface/default`. The pre-check figures are the
  analysis's arithmetic; the gate's verdict, not this sentence, is the
  evidence.
- **`role="list"` on the `<ul>`.** WebKit (Safari + VoiceOver) removes list
  semantics from a list styled `list-style: none`, which this one must be;
  an explicit `role="list"` restores them. Kept by the lot-1 orchestrator's
  decision (2026-10-13), not by a design-lead arbitration: the RFC draft's
  closed question A was not put in the batch forms, so §7 holds no row for
  it. The design lead reviews it with the implementation PR.
- **The dashed rule is decoration**, not a boundary that carries
  information (the strip is identified by its content and its list
  semantics), so WCAG 1.4.11 does not apply and no pair is declared for
  `line/rule` (a `STROKE_COLOR` token, outside the gate's text coverage) —
  the same reasoning as the Sigil's rings.
- **No rating, no separator.** The star rating leaves the strip (§7 Q5):
  the unvoiced "2 of 3" and the 1.42:1 empty stars disappear with it. No
  separator is rendered (§7 Q6), so no `aria-hidden` glyph and no invalid
  `·` between `li`.
- **Text spacing (WCAG 1.4.12).** No fixed height, no clipping, wrapping
  rows: a user stylesheet raising line-height, letter- or word-spacing
  grows the strip instead of cutting it. The tracking (0.06em) and the
  line-height (1.4) are the `type/meta` tokens (§7 Q2) — a design
  arbitration already made, recorded so it is not reopened as an
  accessibility defect.
- Nothing in the component is decorative except the rule (a border, not a
  node), so nothing is `aria-hidden`.

---

## 5. Known limitations

<!-- HUMAN ONLY. Document constraints that aren't defects. Example: "SVG icons
     only, raster icons would require a separate variant"; "focused on desktop,
     mobile gestures deferred to v2". Be specific on the why. -->

---

## 6. Ratification checklist

<!-- HUMAN ONLY. Gates pass? Design sign-off? Product adoption clear? Anything
     that would block approval. Leave blank if this RFC is not yet under review. -->

- [ ] Gates pass (conformity, accessibility, token lint, contrast)
- [ ] Design sign-off (design lead)
- [ ] Product adoption clear (consuming side)
- [ ] Implementation approach reviewed

---

## 7. Arbitration log

<!-- AGENT RECORDS, HUMAN DECIDES. One entry per arbitration, verbatim — the
     question as asked (closed, with options and consequences), the human's
     answer as given, the date. Never paraphrase, never backfill. -->

| Date       | Question (as asked)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | Decision (verbatim)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | Decided by       |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------- |
| 2026-10-13 | Q1 — « La bande de méta-données du hero devient-elle le cinquième composant de la librairie ? » [options: Oui, composant MetaStrip (Recommandé) — une seule bande remplace les 5 recettes du site sur les 10 pages / Non, STOP — les 5 recettes restent côté site, avec leurs écarts / Pas maintenant — l'analyse est archivée. Asked in `process/archives/2026-10-13-metastrip-usage-analysis.md` §5 (Q1–Q9); the batch form showed shortened labels of the same nine questions]                                                                                     | « Arbitrage du lot 1 — proceeding with defaults. » [one gesture for the whole batch form, taken as every recommended option, Q1–Q9; here « Oui, composant MetaStrip (Recommandé) » — component go, manifest priority 5, batch merge order MetaStrip → ProgressBar → SectionHead; the visual checkpoint on the Figma set is still to come]                                                                                                                                                                                              | Louis Tinthilier |
| 2026-10-13 | Q2 — « Le texte de la bande : quelle recette ? » [options: Le style type/meta tel quel : 11 px, 0,06 em, interligne 1,4 (Recommandé) — aucun nouveau token, 7 pages −0,5 px, 8 pages interlettrage plus large, interligne 1,55 → 1,4 / 11,5 px et 0,04 em (l'allure des pages de rôle) — deux nouvelles variables Figma, une PR de tokens, un deuxième style mono / 11 px avec 0,04 em — une nouvelle variable]                                                                                                                                                       | recommended option (batch answer, see row 1) [« Le style type/meta tel quel : 11 px, 0,06 em, interligne 1,4 » — no token change]                                                                                                                                                                                                                                                                                                                                                                                                      | Louis Tinthilier |
| 2026-10-13 | Q3 — « La clé en capitales (« READ TIME », « PATCH »…) est-elle un Eyebrow ? » [options: Oui, la bande affiche un vrai LL.Eyebrow (Recommandé) — une seule recette ; coût : premier composant de la lib qui en utilise un autre, le script du fichier livré au site doit apprendre ce cas (une modification + un test) / Même allure que l'Eyebrow, mais recopiée dans la bande — aucune dépendance, deux copies de la recette / Une clé à part (10 px, graisse 500, 0,1 em) — trois nouvelles variables Figma]                                                       | recommended option (batch answer, see row 1) [« Oui, la bande affiche un vrai LL.Eyebrow » — the first library-internal dependency; `scripts/generate-dist.ts` learns it in a separate shared PR landed first (§3.5)]                                                                                                                                                                                                                                                                                                                  | Louis Tinthilier |
| 2026-10-13 | Q4 — « Couleur de la clé ? » [options: Les deux, au choix par page, gris clair par défaut (Recommandé) — aucun changement visuel, deux variantes Figma, les mêmes que l'Eyebrow / Gris clair seulement — l'accueil et le DS perdent leur clé colorée / Accent seulement — 8 pages passent leur clé en couleur d'accent]                                                                                                                                                                                                                                               | recommended option (batch answer, see row 1) [« Les deux, au choix par page, gris clair par défaut » — `tone: "dim" \| "accent"`, default `dim`, matching the Eyebrow's tones]                                                                                                                                                                                                                                                                                                                                                         | Louis Tinthilier |
| 2026-10-13 | Q5 — « Que devient la note de difficulté en étoiles (5 pages de rôle) ? » [options: La note sort de la bande : le site écrit un mot (Recommandé) — les étoiles disparaissent des 5 pages, la bande reste du texte pur / La bande sait afficher une note (par ex. `2 sur 3`) — deux variables Figma, une API plus large pour 5 usages / Les étoiles restent dans le contenu, le site corrige lui-même l'accessibilité — deux valeurs en dur hors librairie]                                                                                                            | recommended option (batch answer, see row 1) [« La note sort de la bande : le site écrit un mot » — no rating in the API; the word is product content]                                                                                                                                                                                                                                                                                                                                                                                 | Louis Tinthilier |
| 2026-10-13 | Q6 — « Séparateurs entre les faits ? » [options: Aucun séparateur, l'espace suffit (Recommandé) — l'accueil perd ses deux points, son espacement passe de 16 à 24 px / Un séparateur « · » optionnel, dessiné par la bande — une opacité à arbitrer (0,4 n'existe pas) et une option de plus dans l'API. Les « · » écrits à l'intérieur d'un fait restent du texte]                                                                                                                                                                                                   | recommended option (batch answer, see row 1) [« Aucun séparateur, l'espace suffit » — no `separator` prop]                                                                                                                                                                                                                                                                                                                                                                                                                             | Louis Tinthilier |
| 2026-10-13 | Q7 — « Espacements : entre deux faits, et entre la clé et sa valeur ? » [options: 24 px entre faits, 8 px clé → valeur (Recommandé) — deux tokens existants (s-3, s-1) / 16 px entre faits, 8 px clé → valeur — s-2, s-1, la bande se resserre sur 9 pages / 24 px entre faits, 4 px clé → valeur — s-3, s-05]                                                                                                                                                                                                                                                        | recommended option (batch answer, see row 1) [« 24 px entre faits, 8 px clé → valeur » — `--ll-s-3` between facts, `--ll-s-1` key → value]                                                                                                                                                                                                                                                                                                                                                                                             | Louis Tinthilier |
| 2026-10-13 | Q8 — « Comment la bande se présente-t-elle à un lecteur d'écran ? » [options: Une liste : « liste, 3 éléments », puis fait par fait (Recommandé) — aucun changement visuel, accepte tous les faits tels qu'ils sont écrits / Une liste de définitions (terme → valeur) — fausse pour les 4 faits sans vraie valeur, le site doit les réécrire / Aucune structure, comme aujourd'hui]                                                                                                                                                                                  | recommended option (batch answer, see row 1) [« Une liste » — `<ul>`, one `<li>` per fact]                                                                                                                                                                                                                                                                                                                                                                                                                                             | Louis Tinthilier |
| 2026-10-13 | Q9 — « Le set de composants Figma (obligatoire avant la RFC) : qui le construit ? » [options: Je le construis via le MCP Figma après vos réponses (Recommandé) — une page « MetaStrip » dans le fichier Lib, filet pointillé lié à `rule`, textes liés à type/meta, une variante par ton retenu en Q4 ; vous le validez visuellement / Vous le dessinez vous-même — la RFC attend votre set]                                                                                                                                                                          | recommended option (batch answer, see row 1) [« Je le construis via le MCP Figma après vos réponses » — the set is built by an agent and validated by the design lead at a visual checkpoint, still to come; node id pending in the header]                                                                                                                                                                                                                                                                                            | Louis Tinthilier |
| 2026-10-13 | Lot selection — « Quels composants entrent dans le premier lot traité en parallèle ? (fixer les priorités, c'est ton verrou) » [multi-select; options: « MetaStrip » — 10 pages, 5 copies CSS. Statique, 3 valeurs visuelles à trancher. / « Breadcrumb » — 7 pages, 3 versions. Presque rien à arbitrer, gros gain d'accessibilité. / « ProgressBar » — 6 pages, 3 hauteurs. Arbitrer la hauteur et le ton (accent / atténué). / « SectionHead » — 52 occurrences, 4 versions. Arbitrer la mise en page (numéro au-dessus ou à côté).]                               | « MetaStrip,ProgressBar,SectionHead » [priority and merge order set in the same batch form: « MetaStrip → ProgressBar → SectionHead (rec.) », answered with the batch defaults]                                                                                                                                                                                                                                                                                                                                                        | Louis Tinthilier |
| 2026-10-13 | Checkpoint — « Le rendu des 3 composants (Figma 106:29, 106:31, 106:34) : validé ? » [options: « Validé tel quel » / « À corriger »; shown with a dark-background preview of the three components as built, one batch form for the lot]                                                                                                                                                                                                                                                                                                                               | « Checkpoint du lot 1 — Rendu: Valide tel quel · SH ecart colonnes: 32 px s-4 (site) · SH mobile: Creer un point de rupture Figma · MS ecart lignes: 24 px (meme gap) · PB fond: Accepte, compteur texte obligatoire en guideline · PB texte lu: Obligatoire · Eyebrow description: Agent corrige »                                                                                                                                                                                                                                    | Louis Tinthilier |
| 2026-10-13 | Checkpoint — « MetaStrip · quand la bande passe sur deux lignes, l'écart entre les lignes » [options: « 24 px, comme entre les faits (rec.) » / « 16 px »; raised by the RFC draft]                                                                                                                                                                                                                                                                                                                                                                                   | « 24 px (meme gap) » [one `gap: var(--ll-s-3)` for both directions; batch answer, see the checkpoint row]                                                                                                                                                                                                                                                                                                                                                                                                                              | Louis Tinthilier |
| 2026-10-13 | Approval — asked after the checkpoint with a one-line API summary per RFC and the full drafts linked: « Pour approuver, réponds simplement « RFC MetaStrip, ProgressBar, SectionHead approuvées » »; announced: each implementing agent first aligns the RFC body on the checkpoint answers (no new arbitration). Approval is the design lead's lock: an attestation, not a computation.                                                                                                                                                                              | « RFC MetaStrip, ProgressBar, SectionHead approuvées » — Status set to `approved`; §6 stays for the ratification at adoption.                                                                                                                                                                                                                                                                                                                                                                                                          | Louis Tinthilier |
| 2026-10-14 | Adoption checkpoint, point 1 — « Point 1 : quelle mise en valeur pour les valeurs (Medium, ~15 min, 26.12) ? » [options as labelled in the form: « 1B — blanc » / « 1C — accent » / « Autre », above rendered previews captioned « 1A — aujourd'hui (valeurs grises) », « 1B — valeurs en blanc (fg) », « 1C — valeurs en couleur d'accent ». Raised by the design lead's note at the adoption checkpoint of site branch `feat/lot1-adoption` (montage of the role-guide hero), verbatim: « Roles, je veux qu'on mette le medium, 15min et le patch en highlights. »] | « Corrections du checkpoint — P1 couleur: 1C accent · P1 portee: Roles seulement (option) · P2 desktop: 2B ligne de base · P5 mobile: 5B titre a cote du numero · P3 tirets: Tout le site » [one gesture for the whole batch form; here « P1 couleur: 1C accent » — the values in `accent/default`; P2 and P5 concern SectionHead, P3 the site]                                                                                                                                                                                        | Louis Tinthilier |
| 2026-10-14 | Adoption checkpoint, point 1 — « Point 1 : sur quelles pages ? » [options as labelled in the form: « Partout : le composant change pour les 10 pages » / « Les rôles seulement : une option du composant »; same batch form as the row above]                                                                                                                                                                                                                                                                                                                         | « Corrections du checkpoint — P1 couleur: 1C accent · P1 portee: Roles seulement (option) · P2 desktop: 2B ligne de base · P5 mobile: 5B titre a cote du numero · P3 tirets: Tout le site » [here « P1 portee: Roles seulement (option) » — a new optional prop, `valueTone: "mute" \| "accent"`, default `"mute"` (§3.1): the default rendering is unchanged, the five role guides opt in; the prop name is the implementing session's proposal, confirmed at PR; Figma: variant property `Values` = `Mute` / `Accent` on set 106:29] | Louis Tinthilier |
