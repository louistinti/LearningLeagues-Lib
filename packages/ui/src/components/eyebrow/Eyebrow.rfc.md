# RFC: Eyebrow

> **Status:** approved
> **Author:** Eyebrow RFC session (Claude, sup. Louis Tinthilier)
> **Date:** 2026-09-16
> **Design node:** `80:7` — [link](https://www.figma.com/design/6zp7CvEjdiFXzwh6ZGGwB8/Lib?node-id=80-7) (component set `Eyebrow`, page `Eyebrow` 80:2: variants `Tone=Dim` 80:3 — `Tone=Mute` until §7 Q13 — and `Tone=Accent` 80:5)
> **Docs page:** no docs page — reported 2026-09-16 (the first component without one: the usage analysis came first, `process/archives/2026-09-16-mono-label-usage-analysis.md`, and the rules are arbitrated in session and recorded in §7)
> **Base primitive:** none
> **Category:** data-display
> **Manifest entry:** eyebrow

---

## 1. Summary

The library's one mono label: a short uppercase caption in JetBrains Mono,
dimmed by default (`fg/dim`, §7 Q13) or in the live accent, that the site sets above a section
title ("eyebrow") and inside a card, a table row or a sigil ("tag"). One
typographic object, measured 28 times under 13 local class recipes with four
tracking values and three sizes; the component settles it on the `type/meta`
recipe plus `text-transform: uppercase`, as the Callout's tag already does.
It is text only — no chrome, no states, laid out by its parent. Third
component through the circuit, and the first whose rules are arbitrated in
session instead of imported from a Figma docs page.

---

## 2. Product usage analysis

### 2.1 Matching identifiers (legacy libraries)

| Identifier                                                                                                                                                                                                  | Source package                                                                                                                                            |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `.eyebrow`, `.eyebrow--accent`                                                                                                                                                                              | LearningLeagues site `styles.css` (lines 136–141, 161): mono 11px, weight 500, tracking 0.18em, uppercase, `fg-mute` / `accent`                           |
| `.ft-overlay-eyebrow`                                                                                                                                                                                       | site `fundamentals.css` (line 126): mono 11px, 0.16em, uppercase, `accent`, own `margin-bottom`                                                           |
| `.tag` — no standalone rule: the `.mono` utility plus contextual rules `.hero-sigil .tag`, `.champ-meta .tag`, `.build-block h3 .tag`, `.archetype-tab .tag`, `.ds-hero-sigil .tag`, `.ft-intro-sigil .tag` | site `styles.css`, `design-system.css`, `fundamentals.css`: 10–11px, 0.12–0.16em, `fg-mute` or `accent` by parent; the sigil rules position it absolutely |
| `.exercise-tag`, `.fund-cell-tag`, `.train-row-tag`, `.res-row-tag`                                                                                                                                         | site `styles.css`: 9.5–10px, 0.14–0.16em, `accent` / `fg-mute` (`train-row-tag` adds `text-align: right`)                                                 |
| `.qz-tag`                                                                                                                                                                                                   | site `quiz.css` (lines 126–136): 10px, 0.18em, `accent`, a 5px rotated-square `::before` glyph, own `margin-bottom`                                       |
| `.ds-brand-tag`, `.ds-type-tag`, `.ds-empty-tag`, `.ds-lb-youtag`                                                                                                                                           | site `design-system.css` (showcase): 10px, 0.14–0.18em, `fg-mute` / `accent`; `ds-lb-youtag` has no rule at all (the `.mono` utility only)                |
| `.ds-chip`, `.ds-chip--accent/--win/--loss`                                                                                                                                                                 | site `design-system.css` (lines 410–420): the only chrome (1px border, padding 4px 10px) — showcase only, out of scope (Step 4 question)                  |

### 2.2 Usage metrics

Measured on the site checkout at `origin/main` 6a26dcb (fetched and verified
clean before measuring — L09), with
`grep -oE '(class|className)="[^"]*\b[a-z-]*(tag|eyebrow)\b'` over the
tracked `*.html *.jsx`; every hit is in a `.jsx` file.

| Product                                  | Files                                                                                                              | Occurrences                                                                                                                                                                  | Main zones                                                                                             |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| LearningLeagues site (`.eyebrow` family) | 6 (`components.jsx`, `design-system.jsx`, `fundamentals-cards.jsx`, `glossary.jsx`, `landing.jsx`, `quiz-app.jsx`) | 9 (8 `.eyebrow`, of which 5 `--accent`; 1 `.ft-overlay-eyebrow`)                                                                                                             | first line of a hero or a section head, above a serif title; quiz screens                              |
| LearningLeagues site (`*tag` classes)    | 10 (the 6 above + `ds-components.jsx`, `ds-foundations.jsx`, `ds-patterns.jsx`, `role-sections.jsx`)               | 19 under 10 class names (`tag` ×8, `exercise-tag`, `qz-tag`, `fund-cell-tag`, `train-row-tag`, `res-row-tag`, `ds-brand-tag`, `ds-type-tag`, `ds-empty-tag`, `ds-lb-youtag`) | sigil corner label, champion/build/archetype meta, landing rows and cells, quiz question tag, showcase |
| LearningLeagues site (`.ds-chip`)        | 1 (`ds-components.jsx`)                                                                                            | 4                                                                                                                                                                            | DS showcase only — no product page                                                                     |

Total: 28 label usages in 10 JSX files (the 6 eyebrow files are all among the
10 tag files). The grep also hits `lib/ll-lib.jsx` once (`ll-callout-tag`,
the vendored library itself) — excluded. Against the prior analysis
(2026-09-16 archive: 19 tag usages in 10 files, 9 eyebrows in 6 files): same
counts; the archive's "12 distinct local classes" and "12 files" count CSS
recipes and stylesheets, this table counts class names in markup (10) and JSX
files (10) — same population, different unit.

### 2.3 Notes on product adoption

- Adoption replaces 13 class recipes with one component and one recipe:
  every size (9.5 / 10 / 11px), tracking (0.12 / 0.14 / 0.16 / 0.18em) and
  the eyebrow's weight 500 collapse to `type/meta` (11px, 400, 0.06em) plus
  uppercase — arbitrated 2026-09-16 (§7 Q2): the site aligns on the library.
  This is a visible change on every usage; the adoption run's visual
  checkpoint (human lock) is where it is judged, not here.
- Layout is product-side and stays so: the sigil's absolute positioning
  (`bottom: 10px; left: 12px`), `margin-bottom` on `qz-tag` and
  `ft-overlay-eyebrow`, `margin-left` on `ds-brand-tag`, `text-align: right`
  on `train-row-tag`, `align-self: center` on `ds-type-tag`. The component
  is inline text; the parent stacks it above a title or puts it in a row —
  like the Callout grid (Callout §7 Q4).
- One usage carries chrome the text does not: `qz-tag`'s rotated-square
  `::before` glyph (1 usage, quiz). Step 4 question.
- `.ds-chip` (4 usages) is a bordered chip on the design-system showcase
  only: promotion criterion 4 (a consuming product with a confirmed use
  case) cannot be met for it — out of scope for v1 (Step 4 question).
- Three tag usages sit inside a heading (`.build-block h3 .tag`,
  `role-sections.jsx`): there the label becomes part of the heading's
  accessible name. Arbitrated 2026-09-17 (§7 Q9): forbidden — the adoption
  run moves the Eyebrow before those three headings.
- The Callout's own tag (`.ll-callout-tag`) is the same recipe with a border
  and a glyph. It stays inside the Callout: no refactor in v1, no dependency
  between the two components.
- Every site page already loads `lib/ll-lib.{css,jsx}` since the Callout
  adoption (L11 check, `vendor-dist.ts`); the Eyebrow adds no new page to
  that list.

---

## 3. API design

Dim and Accent are tones, not states: the component has no interactive
state (no hover, no focus), no chrome, no layout. Every rule below is tagged
with what enforces it — TEST (the component's `Eyebrow.a11y.test.ts`
behaviour suite, run by the accessibility engine gate), GATE (conformity),
HUMAN (review).

### 3.1 Properties

| Name     | Type                | Default | Required | Description                                                                                                                                                                                                                            |
| -------- | ------------------- | ------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| tone     | `"dim" \| "accent"` | `"dim"` | no       | Text colour: `fg/dim` (default, §7 Q13 — replaces Q3's `mute`, judged too dark at the adoption checkpoint) or `accent/default`, which follows the accent axis (`[data-accent]`). Emits `ll-eyebrow--{tone}`. No other tone in v1. TEST |
| children | `ReactNode`         | —       | yes      | The label: a short string or inline nodes. The component never supplies text and never transforms it beyond CSS casing. HUMAN (wording, length)                                                                                        |

Naming rule: `tone` names a colour and nothing else. `variant` stays
reserved for visual styles with chrome (Button); `type` for an editorial kind
(Callout §7 Q6). Arbitrated 2026-09-17 (§7 Q10).

Element: renders a `<span>` only — inline, so the parent decides block or row
placement; no `as` prop (§7 Q4). Sizes and weight: one recipe, 11px / 400
(§7 Q7) — no `size` prop.

### 3.2 Slots / Children

`children` is the whole content. No other slot, no glyph, no icon: the
`qz-tag` diamond stays product-side (§7 Q5), the `.ds-chip` bordered chip is
out of scope in v1 (§7 Q6).

### 3.3 Events / Callbacks

None. Not interactive.

### 3.4 Behaviours (testable)

- Renders exactly one `<span class="ll-eyebrow ll-eyebrow--{tone}">` whose
  only content is `children` — no wrapper, no pseudo-element content, no
  ARIA attribute, no `role`. TEST
- `tone` omitted → `ll-eyebrow--dim`; `tone="accent"` → `ll-eyebrow--accent`.
  TEST
- Nothing interactive is rendered by the component itself (no `a`, `button`,
  `input`, `[tabindex]`). TEST
- The uppercase is CSS (`text-transform`), never a string transform: the
  DOM text equals the author's text. TEST
- Every value in `eyebrow.css` is a token: the `type/meta` family
  (`--ll-type-meta-*`) plus `text-transform: uppercase`; colour `--ll-fg-dim`
  or `--ll-accent`. No margin, padding, border, background or `display`
  override — the stylesheet ships no layout for it. GATE (token lint) +
  HUMAN (the "no layout" rule has no detector; the reviewer reads the CSS).
- Contrast of `fg/dim` and of `accent/default` under the five accents,
  against `surface/default` and `bg` — contrast gate; a11y engine over the
  contract examples × 5 accents. GATE
- Wording: short, a category or a counter, never a sentence; at most one
  per title; the author's own casing in the source. HUMAN
- Never inside a heading element: the Eyebrow is placed BEFORE the `h2` /
  `h3`, never inside it, so the heading's accessible name stays the title
  alone (§7 Q9) — a `dont` guideline in the contract; the three measured
  in-heading usages are restructured at adoption. HUMAN
- Positioning stays product-side, sigil included (§7 Q8): the stylesheet
  ships no `position`, margin or alignment for it. HUMAN

---

## 4. Accessibility commitment

### 4.1 Semantic structure

A `<span>` with plain text: no ARIA role, no label, no live region. The
uppercase treatment is CSS `text-transform`, so assistive tech reads the
author's casing (an all-caps source string would be spelled out letter by
letter by some readers — the guideline is to write it in the source as
prose). The Eyebrow is not a heading and carries no heading semantics: the
serif title next to it stays the heading, the Eyebrow is a caption before it.
Placed inside a heading element it would join that heading's accessible
name: forbidden by the `dont` guideline (§7 Q9); the three measured usages
are restructured at adoption.

### 4.2 Keyboard interaction

Nothing to do: no interactive element, nothing focusable. Interactive
children are not expected; if the product nests one, it keeps its own
semantics — product-side.

### 4.3 Component-specific decisions

- Contrast is computed by the gate from resolved tokens, never declared here:
  `fg/dim` on `surface/default` and on `bg` (the label sits on both — section
  heads on the page background, tags inside cards); `accent/default` on the
  same two under the five accents. At 11px the text is "normal" size for
  WCAG 1.4.3 (4.5:1), not "large" — the gate applies that threshold. (A
  pre-check from the current token values puts every pair above it; the
  gate's verdict, not this sentence, is the evidence.)
- Nothing in the component is decorative, so nothing is `aria-hidden`: unlike
  the Callout's glyph, the label IS the meaning. If the product hides a whole
  sigil (`aria-hidden` on the art), the Eyebrow inside it is hidden with it —
  product-side.
- The tracking is the token's 0.06em (§7 Q2), not the site's 0.12–0.18em:
  wide tracking on uppercase mono helps letter recognition at small sizes,
  and the tighter value is a design arbitration already made, recorded so
  the next reader does not reopen it as an accessibility defect.
- Not interactive, so no focus ring and no keyboard rule.

---

## 5. Known limitations

<!-- HUMAN ONLY. Document constraints that aren't defects. Example: "SVG icons
     only, raster icons would require a separate variant"; "focused on desktop,
     mobile gestures deferred to v2". Be specific on the why. -->

---

## 6. Ratification checklist

<!-- HUMAN ONLY. Gates pass? Design sign-off? Product adoption clear? Anything
     that would block approval. Leave blank if this RFC is not yet under review. -->

- [x] Gates pass (conformity, accessibility, token lint, contrast)
- [x] Design sign-off (design lead)
- [x] Product adoption clear (consuming side)
- [x] Implementation approach reviewed

---

## 7. Arbitration log

<!-- AGENT RECORDS, HUMAN DECIDES. One entry per arbitration, verbatim — the
     question as asked (closed, with options and consequences), the human's
     answer as given, the date. Never paraphrase, never backfill. -->

| Date       | Question (as asked)                                                                                                                                                                                                                                                                                                                                                                                                                                                           | Decision (verbatim)                                                                                                                                                                                                                               | Decided by       |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------- |
| 2026-09-16 | Q1 — « Que faire du candidat « tag / eyebrow » ? » [options: Composant Eyebrow / STOP / Sigil plutôt — asked on the usage analysis, before any Figma page or RFC]                                                                                                                                                                                                                                                                                                             | « Composant Eyebrow » [an Eyebrow component — the site's own word and the 2026-08-12 arbitration's word; the Figma set 80:7 was then written as the design node this RFC requires]                                                                | Louis Tinthilier |
| 2026-09-16 | Q2 — « Typographie de l'Eyebrow : quelle recette ? » [options: type/meta en capitales comme le Callout / nouveau style type/eyebrow dans Figma / type/meta + un token d'interlettrage large]                                                                                                                                                                                                                                                                                  | « type/meta en capitales, comme le Callout » [11px, weight 400, tracking 0.06em from the existing tokens, `text-transform: uppercase`; no token change; the site aligns on the library — its 10px and 0.12–0.18em disappear]                      | Louis Tinthilier |
| 2026-09-16 | Q3 — « Tons de l'Eyebrow : lesquels ? » [options: mute (défaut) et accent / mute, accent et dim / accent seul]                                                                                                                                                                                                                                                                                                                                                                | « mute (défaut) et accent » [mute is the default tone; accent follows the accent axis; no `dim`]                                                                                                                                                  | Louis Tinthilier |
| 2026-09-16 | Q4 — « Élément rendu : `<span>` seul, ou une prop `as` (span \| p) pour l'usage en tête de section ? » [options: `<span>` seul — one render path, the section head stacks it by its own layout / prop `as` — block semantics for free, two render paths to test]                                                                                                                                                                                                              | « `<span>` seul » [one element, no `as` prop]                                                                                                                                                                                                     | Louis Tinthilier |
| 2026-09-17 | Q5 — « Le glyphe losange de `qz-tag` (1 usage, le quiz) : hors périmètre, ou un booléen `glyph` dans l'API ? » [options: hors périmètre — the quiz keeps a product-side ornament or drops it / booléen `glyph` — a decorative aria-hidden ornament enters the API for one usage]                                                                                                                                                                                              | « Hors périmètre » [no glyph in the API; product-side]                                                                                                                                                                                            | Louis Tinthilier |
| 2026-09-17 | Q6 — « Le chip bordé `.ds-chip` (4 usages, vitrine design-system seulement) : hors périmètre v1, ou une variante chip maintenant ? » [options: hors périmètre v1 — promotion criterion 4 unmet, returns via §7 if a product needs it / variante chip maintenant — chrome, padding, border to arbitrate with no product usage]                                                                                                                                                 | « Hors périmètre v1 » [no chip variant]                                                                                                                                                                                                           | Louis Tinthilier |
| 2026-09-17 | Q7 — « Tailles et graisse : l'arbitrage typo ramène déjà les 9,5 / 10 px et la graisse 500 du site à 11 px / 400. Confirmer, ou prévoir une prop `size` ? » [options: confirmer — visible change on ~20 in-card labels, judged at the adoption checkpoint / prop `size` plus tard via §7 — no 10px text token exists, readability floor]                                                                                                                                      | « Confirmer » [one recipe, 11px / 400; no `size` prop]                                                                                                                                                                                            | Louis Tinthilier |
| 2026-09-17 | Q8 — « L'étiquette du sigil (positionnée en absolu dans le carré) : l'Eyebrow est le texte seul et le positionnement reste produit, ou le composant possède son positionnement ? » [options: texte seul, position produit — like the Callout grid, no layout in the stylesheet / le composant positionne — breaks the no-layout rule for one context, 10 / 12px become tokens]                                                                                                | « Texte seul, position produit » [the stylesheet ships no positioning]                                                                                                                                                                            | Louis Tinthilier |
| 2026-09-17 | Q9 — « Une étiquette à l'intérieur d'un titre (`.build-block h3 .tag`, 3 usages) : le tag rejoint le nom accessible du titre. Interdire par une règle don't, ou laisser au produit ? » [options: interdire (don't) — accessibility is a hard requirement, the site restructures 3 headings at adoption: the Eyebrow before the h3, not inside / laisser au produit — the accessible name of 3 headings stays polluted]                                                        | « Interdire (don't) » [a `dont` guideline; the three headings are restructured at adoption]                                                                                                                                                       | Louis Tinthilier |
| 2026-09-17 | Q10 — « Nom de la prop de couleur : `tone`, ou `variant` par cohérence avec le Button ? » [options: `tone` — names a colour only; `variant` reserved for chrome styles, `type` for editorial kinds / `variant` — same word as the Button, conflates colour with chrome]                                                                                                                                                                                                       | « tone » [prop `tone`]                                                                                                                                                                                                                            | Louis Tinthilier |
| 2026-09-17 | Q11 — « Priorité de l'Eyebrow dans le manifeste (votre lock) ? » [options: 3 — after Button (1) and Callout (2), the order of arrival / 1 — ahead of the two delivered components]                                                                                                                                                                                                                                                                                            | « 3 » [manifest priority 3]                                                                                                                                                                                                                       | Louis Tinthilier |
| 2026-09-17 | Q12 — « La RFC Eyebrow (main, §1–§4 contre le set Figma 80:7) : l'approuvez-vous ? C'est votre lock : une attestation, pas un calcul. » [options: Approuvée / Pas encore, je veux relire / Approuvée avec une réserve]                                                                                                                                                                                                                                                        | « Approuvée » [status draft → approved; §5 left blank by the design lead; implementation may start via component-generation.prompt.md]                                                                                                            | Louis Tinthilier |
| 2026-09-21 | Q13 — « Comment corrige-t-on le ton par défaut de l'Eyebrow, trop sombre ? » [asked at the site adoption's visual checkpoint, after the design lead's remark « en mute je les trouve bcp trop sombre pour être accessibles »; measured by the contrast gate: `fg/mute` 5.63:1 on `bg`, 4.94 on `surface`, 4.53 on `surface/raised` — `fg/dim` 9.35 / 8.21 / 7.53. Options: Remplacer mute par dim / Ajouter dim, garder mute / Éclaircir le token fg/mute / Laisser tel quel] | « Remplacer mute par dim » [the default tone becomes `dim` (`fg/dim`); `mute` leaves the API — supersedes Q3's « mute (défaut) et accent »; no token change; Figma variant 80:3 re-bound to `fg/dim` and renamed `Tone=Dim`; the site re-vendors] | Louis Tinthilier |
| 2026-09-21 | Q14 — site adoption visual checkpoint (site branch `feat/eyebrow-adoption`, 28 usages): two points flagged to the design lead — (2) in the champion cards the accent label is 11px beside a « Diff · … » sibling left at 10px; (3) in the « Default runes » / « Build path » blocks the label, moved before the h3 (Q9), is kept on the title's line, on the right (alternative: stacked above the title)                                                                     | « 2. On passe le 10 à 11 aussi 3. On laisse comme ça » [the site's `.champ-meta` line goes to 11px, product-side; the build-head row stays as delivered — DOM order label then h3, `row-reverse`]                                                 | Louis Tinthilier |
| 2026-09-21 | Q15 — §6 ratification checklist, asked in session after the `dim` rendering was checked on the local site (« Ok j'aime bien comme ça ») and pushed (site `main` 64193d7, dist pin bb039ef): the four boxes explained one by one — gates green (`conformity: PASS (11 gates)`), rendering approved, site adoption pushed, implementation approach (span only, `tone`, no size, no layout)                                                                                      | « poussé, je valide les 4 » [the four §6 boxes ticked by the agent on the design lead's attestation, verbatim]                                                                                                                                    | Louis Tinthilier |
