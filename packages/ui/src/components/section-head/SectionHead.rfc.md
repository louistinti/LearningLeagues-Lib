# RFC: SectionHead

> **Status:** approved
> **Author:** SectionHead RFC session (Claude, sup. Louis Tinthilier)
> **Date:** 2026-10-13
> **Design node:** Figma: component set `SectionHead` 109:9 on page `SectionHead` 106:33 (`Viewport=Desktop` 106:34, `Viewport=Mobile` 109:2; breakpoint variable `breakpoint/md` VariableID:108:2 = 768 in collection `Layout`) — https://www.figma.com/design/6zp7CvEjdiFXzwh6ZGGwB8/Lib?node-id=109-9 (page `SectionHead` of the Lib file; built by an agent, validated by the design lead at the visual checkpoint — §7 Q1–Q12 were answered before it)
> **Docs page:** no docs page — reported 2026-10-13 (page-less path, as the Eyebrow and the Sigil: usage analysis first, `process/archives/2026-10-13-sectionhead-usage-analysis.md`; rules arbitrated in session and recorded in §7)
> **Base primitive:** none
> **Category:** data-display
> **Manifest entry:** section-head

---

## 1. Summary

The numbered head that opens every section of the role guides and the
Glossary: a serif italic number in the live accent, alone in its own column
with a short accent underline, beside an `h2` title and an optional lede.
Measured 52 times on 6 product pages under one recipe, plus a 22-render copy
on the DesignSystem showcase; the component settles both on existing tokens
(`type/h2`, `type/h1-italic`, `type/body`, the spacing ladder,
`opacity/ornament` — §7 Q3–Q6, Q12), lets the title wrap (§7 Q7), stacks
the number above the title on narrow viewports (`Layout/breakpoint/md`,
768px — §7 checkpoint rows) and hides the number from assistive technology
(§7 Q9). The stacked heads of
Fundamentals and the landing stay product-side compositions (`LL.Eyebrow` +
title + text, §7 Q1). One of the first lot of three components drafted in
parallel (MetaStrip, ProgressBar, SectionHead — merged in that order,
manifest priority 7); page-less path, as the Eyebrow and the Sigil.

---

## 2. Product usage analysis

### 2.1 Matching identifiers (legacy libraries)

| Identifier                                                                       | Source package                                                                                                                                                                                                                                                                                                                                        |
| -------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `SectionHead` (JSX)                                                              | LearningLeagues site `components.jsx` (lines 345–355): `div.section-head > div.section-num + div > h2.section-title + p.section-lede` — props `num`, `title`, `lede`, all plain strings at every call site                                                                                                                                            |
| `.section-head`, `.section-num` (+ `::after`), `.section-title`, `.section-lede` | site `styles.css` (lines 172–203): grid `100px 1fr`, gap 32; number EB Garamond italic 56 / 400, −0.02em, accent, `padding-top: 4px`; underline `::after` 60 × 1px accent at opacity .5, `bottom: -14px`; title 36px (global `h2` rule otherwise), `nowrap` above 900px; lede 16 / 1.6 `fg-dim`; one column under 768px (number 44, title 28, gap 16) |
| `DSSection` (JSX), `.ds-section-head` and its children                           | site `design-system.jsx` (lines 147–160), `design-system.css` (lines 13–35): a near-verbatim copy of the above on the showcase, in a `header` — column 110px, number tracking `normal`, no size step under 768px, no `nowrap`, lede 15.5px with `max-width: 78ch`, `margin-bottom: 40px`                                                              |
| `.ft-sec-head`                                                                   | site `fundamentals.css` (lines 40–47), inline in `fundamentals-cards.jsx` and `fundamentals-graph.jsx`: a stacked head (mono number line `01 / LABEL` above a fluid `clamp()` title) — a different object, out of scope (§7 Q1)                                                                                                                       |
| `.showcase-text` header                                                          | site `styles.css` (lines 1541–1563), `landing.jsx` (`Showcase`, `RolesSection`): a stacked head (`LL.Eyebrow` + fluid title + lede + CTA, beside a visual) — a different object, out of scope (§7 Q1)                                                                                                                                                 |

### 2.2 Usage metrics

Measured in the usage analysis on the site checkout at `main` f6066ab
(`HEAD` = `origin/main`, tree clean — L09; no fetch was run in that session,
the remote ref was verified by the caller), with
`grep -rn "SectionHead|DSSection|ft-sec-head|showcase-text|section-head"`
over the tracked `*.jsx *.css *.html` (the vendored `lib/ll-lib.*` excluded)
plus every `<h2`; renders counted in a local browser at 1440, 901 and 375px.

| Product                                             | Files                                                                                                           | Occurrences                                                                                            | Main zones                                                                       |
| --------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------- |
| LearningLeagues site — aside head (`SectionHead`)   | 3 (`components.jsx` definition; `role-sections.jsx` 11 call sites, one per section component; `glossary.jsx` 1) | 12 call sites → **52 renders on 6 pages**: Top, Jungle, Mid, ADC (10 each), Support (11), Glossary (1) | first block of each `<section className="section shell">`, under the hero's `h1` |
| LearningLeagues site — showcase copy (`DSSection`)  | 4 (`design-system.jsx` definition; `ds-foundations.jsx` 6, `ds-components.jsx` 11, `ds-patterns.jsx` 5)         | 22 calls → 22 renders, one tab at a time                                                               | DesignSystem showcase only                                                       |
| LearningLeagues site — stacked heads (out of scope) | 3 (`fundamentals-cards.jsx`, `fundamentals-graph.jsx`, `landing.jsx`)                                           | 6 renders: Fundamentals 2 (`.ft-sec-head`), index 4 (`.showcase-text`)                                 | Fundamentals sections; landing feature columns beside a visual                   |

Every one of the 74 aside renders has a number (two digits: `padStart` in
`app.jsx` on the role guides, hard-coded `"01"` on the Glossary and strings
on the showcase) and a lede; 0 of 74 titles contain `<em>`. Every measured
title is an `h2` under the page's single `h1`. Quiz has no section head.

### 2.3 Notes on product adoption

- Adoption replaces the site's `SectionHead` markup and the showcase's
  `DSSection` header with one component (74 renders), and deletes
  `.section-head` and its children (`styles.css:172-203`, 32 lines) and
  `.ds-section-head` and its children (`design-system.css:13-35`, 23 lines).
  Visible changes, judged at the adoption run's visual checkpoint (human
  lock), not here: title 36 → 32px on desktop and 28 → 32px on phones
  (§7 Q4); number 56px / 400 → 44px / 500 on desktop (§7 Q5); number column
  100 / 110 → 64px (§7 Q6); underline 60 → 56px wide, 14 → 12px below the
  number, opacity 50 → 25 % (§7 Q3); lede 16 / 1.6 (15.5 on the showcase)
  → 15 / 1.55 (§7 Q12); the showcase lede loses its `78ch` measure; the
  title wraps instead of `nowrap` above 900px — no visible change today, the
  longest title (558px) fits the narrowest measured column (754px) (§7 Q7);
  the number loses the site's 4px top padding (the validated Figma node
  106:34 has none, §3.4).
- Under 768px the site stacks the number above the title, and so does the
  component (§7 checkpoint row « SH mobile: Creer un point de rupture
  Figma »): the token `Layout/breakpoint/md` (768, `--ll-breakpoint-md`,
  extracted in #55) and the Figma variant `Viewport=Mobile` 109:2. Stacked,
  the title sits `--ll-s-2` (16px, the site's 768 rule) below the
  underline, which takes part in the layout as in the Figma node — the
  site's absolute underline sits 2px from the title on phones (measured,
  §7 Q3); the component's does not. The showcase copy, which never
  stacked, starts stacking at the adoption.
- Layout stays product-side (manifest responsibility split, "Placement and
  sizing of a library component in the page"): the head's `margin-bottom`
  (56 / 40px), the section's padding and border (`.section`,
  `.ds-section`), the `<section>` element and its `id` (the TOC anchors
  `s01` … depend on it), the page grid, and the number's computation
  (`padStart`) — the component receives a string.
- Site-side fixes recorded for the adoption mission, not this library's to
  make: the Glossary's 18 letter headings are `h2` at the same level as
  their section head — they become `h3`; the landing's `Showcase` renders an
  empty `div.showcase-num` (3 renders, +16px above the Eyebrow) — delete it;
  `.section { padding: var(--section-y) 0 }` cancels `.shell`'s horizontal
  gutter on the role guides and the Glossary (heads flush to the viewport
  edge at ≤ 1200px) — restore the gutter.
- Fundamentals (2) and the landing (4) keep their local composition
  (§7 Q1): the landing already writes it as `LL.Eyebrow` + `h2` + `p`. The
  Fundamentals number line (`01 / THE SIX THAT CARRY YOUR RANK`, mono
  11.5px / 0.18em, capitals typed in the source) is an un-adopted mono label
  that escaped the Eyebrow adoption — recorded by the usage analysis, not
  part of this component.
- No library-internal dependency: the serif number is not an Eyebrow (no
  mono, no capitals), and the component renders no other library component.
  Every value maps to a token (§3.4); the one variable the component needed
  — the 768px stacking breakpoint — was created in Figma at the checkpoint
  and extracted through the token pipeline in its own shared PR (#55,
  axiom 5), before this implementation. L01 applied: the analysis mapped
  each of recipe (A)'s 30 properties to a token or flagged it as a design
  gap (12 gaps); every gap was closed by an arbitration onto an existing
  token (§7 Q3–Q6, Q12), left the component (the 900px `nowrap`
  breakpoint, §7 Q7; the `78ch` measure; the number's 4px top padding,
  absent from the validated node) or became a token (the 768px stacking
  breakpoint, §7 checkpoint row) — no site value is copied.

---

## 3. API design

One layout, no variant, no state: the component has no interaction, no
tone, no size. Every rule below is tagged with what enforces it — TEST (the
component's `SectionHead.a11y.test.ts` behaviour suite, run by the
accessibility engine gate), GATE (a conformity gate), HUMAN (the reviewer or
the visual checkpoint).

### 3.1 Properties

| Name    | Type        | Default | Required | Description                                                                                                                                                                                                                                                                   |
| ------- | ----------- | ------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `num`   | `string`    | —       | yes      | The section's number, rendered as given in its own column, hidden from assistive technology (§7 Q2, Q9). Two digits by product convention (`"01"` … `"11"`); the product computes it, the component never formats it. TEST (rendered verbatim, `aria-hidden`), HUMAN (format) |
| `title` | `ReactNode` | —       | yes      | The heading text, rendered inside the `h2`. May hold an `<em>`, rendered italic in the live accent (§7 Q8). Wraps freely (§7 Q7). Never an Eyebrow, the number or any label inside it (Eyebrow §7 Q9). TEST (one `h2`), HUMAN (content)                                       |
| `lede`  | `ReactNode` | —       | no       | The introductory paragraph under the title (§7 Q11). Omitted → no `<p>` is rendered at all (the site's component leaves an empty paragraph today). TEST                                                                                                                       |
| `id`    | `string`    | —       | no       | Forwarded to the `h2` — never to the root — so the product can name its `<section>` with `aria-labelledby` in one attribute. Omitted → the `h2` carries no `id`. The section's own anchor `id` (TOC) stays on the product's `<section>`. TEST                                 |

No other prop: no `level` (always `h2`, §7 Q10), no `layout` or eyebrow
slot (one layout, §7 Q1), no `as`, no `className`, no tone, no size.

### 3.2 Slots / Children

No `children`. `title` and `lede` are the two content slots; their content
is the product's (manifest responsibility split, "Content of a library
slot"). The number is a string, not a slot.

### 3.3 Events / Callbacks

None. Not interactive.

### 3.4 Rendering and behaviour

```html
<div class="ll-section-head">
  <span class="ll-section-head-num" aria-hidden="true">01</span>
  <div class="ll-section-head-body">
    <h2 class="ll-section-head-title" id="…">Start with the <em>six.</em></h2>
    <p class="ll-section-head-lede">…</p>
  </div>
</div>
```

- Exactly one root `<div class="ll-section-head">` holding, in DOM order,
  one `<span class="ll-section-head-num" aria-hidden="true">` whose text is
  `num` verbatim, then one `.ll-section-head-body` holding exactly one `h2`
  and, only when `lede` is given, one `p` — TEST.
- The heading is always an `h2`, whatever the context (§7 Q10); its
  accessible name is the title alone — the number sits outside it — TEST.
- `id` given → on the `h2`; omitted → no `id` attribute anywhere in the
  component — TEST.
- `.ll-section-head`: a two-column grid, `var(--ll-s-8) minmax(0, 1fr)`
  (the number column, 64px — §7 Q6; the text column may shrink below its
  longest word, so a long word wraps instead of widening the grid),
  `column-gap: var(--ll-s-4)` (32px, the site's value — §7 checkpoint row
  « SH ecart colonnes: 32 px s-4 (site) », Figma 106:34), items aligned to
  the start. No margin, no padding, no width other than the parent's: the
  page places it — GATE (token lint), HUMAN (the "no layout" rule has no
  detector; the reviewer reads the stylesheet).
- `.ll-section-head-num`: a block, the `type/h1-italic` text style in full
  (`--ll-type-h1-italic-*`: 44px, 500, italic, line-height 1.1, −0.01em —
  §7 Q5), colour `--ll-accent` (follows `[data-accent]` / `[data-role]` on
  any ancestor), no padding — the number sits at the top of its column, as
  in the validated Figma node 106:34 (the site's 4px top padding leaves) —
  GATE (token lint), HUMAN (rendering).
- The underline: a `::after` on the number, a block in the number's flow
  (Figma `number-col`: number, then the underline `--ll-s-15` below it),
  1px high (the design language's fixed line weight, as in the Callout and
  the Sigil), `width: var(--ll-s-7)` (56px), `margin-top: var(--ll-s-15)`
  (12px) below the number's box, `background: var(--ll-accent)` at
  `opacity: var(--ll-opacity-ornament)` (25 %), `pointer-events: none`
  (§7 Q3; the 56 / 12 pick validated at the checkpoint « Rendu: Valide tel
  quel », Figma 106:37 / 109:5) — GATE (token lint), HUMAN.
- `.ll-section-head-title`: the `type/h2` text style in full
  (`--ll-type-h2-*`: 32px at every width, 500, line-height 1.1, −0.01em —
  §7 Q4), colour `--ll-fg`, `margin: 0`; the lede sits `--ll-s-15` (12px)
  below it (Figma `text-col` gap 106:38 / 109:6); wraps — no `white-space`
  rule (§7 Q7), and `overflow-wrap: break-word` on the body so a single
  long word breaks rather than overflow (§4.3) — GATE (token lint), HUMAN.
- `.ll-section-head-title em`: `font-style: italic` (keyword),
  `color: var(--ll-accent)` (§7 Q8) — HUMAN (rendering), TEST only that the
  author's `<em>` reaches the DOM untouched.
- `.ll-section-head-lede`: the `type/body` text style in full
  (`--ll-type-body-*`: 15px / 1.55 — §7 Q12), colour `--ll-fg-dim`,
  `margin: var(--ll-s-15) 0 0`, no `max-width` (no measure token; the
  showcase's `78ch` leaves) — GATE (token lint), HUMAN.
- Self-defensive base: the `h2`, `p` and `em` get their margins, weight
  and style from the component's own rules, never from the host's
  (distribution contract: no global reset shipped) — HUMAN (the reviewer
  reads the stylesheet; no gate checks a rendering under a host reset).
- **Responsive — stacked under `Layout/breakpoint/md`** (§7 checkpoint row
  « SH mobile: Creer un point de rupture Figma »; Figma `Viewport=Mobile`
  109:2). At a viewport width of 768px and below — the site's
  `max-width: 768px` rule, kept inclusive so no width changes layout at
  the adoption — the grid becomes one column: the number block (number and
  underline) above the body, `row-gap: var(--ll-s-2)` (16px, the site's
  768 rule `calc(var(--s) * 2)`, Figma 109:2). Sizes do not change (§7 Q4,
  Q5: no mobile step). A custom property cannot be read inside a media
  condition, so the stylesheet restates the token's emitted value and names
  the token in the prelude, in the one form the token lint accepts
  (`AGENTS.md`, Token rules):
  `@media (width <= 768px) /* --ll-breakpoint-md */ {` — GATE (token lint:
  the length must equal `--ll-breakpoint-md`), HUMAN (rendering at both
  sides of the breakpoint).

---

## 4. Accessibility commitment

### 4.1 Semantic structure

A generic `div` (no role) holding a hidden number and a heading: one `h2`
whose accessible name is the title alone, and an optional `p`. The number is
`aria-hidden="true"` (§7 Q9): it carries order only, which the document
order already gives, and on the role guides the `TocSidebar`
(`aside aria-label="Contents"`) repeats the same numbers. It sits outside
the heading, so heading navigation never hears "zero one" — the rule the
Eyebrow set for labels (Eyebrow §7 Q9: placed before the heading, never
inside it), applied to the number and stated as a `dont` guideline for the
`title` slot (no Eyebrow, number or label inside it). The root is a `div`,
not a `header`: inside a `<section>` a `header` maps to no landmark, so it
would add a second render shape for no exposed semantics. The heading level
is always 2 (§7 Q10); the page outline (one `h1` above, `h3` inside the
section) is the product's. `id` lets the product turn its `<section>` into a
named region with `aria-labelledby` — the component does not render the
`<section>`.

### 4.2 Keyboard interaction

Nothing to do: no interactive element, nothing focusable — no `a`,
`button`, `input` or `tabindex` is rendered by the component. The number is
`aria-hidden` and holds text only, so the axe rule `aria-hidden-focus` has
nothing to find. Interactive content in `title` or `lede` is not expected;
if the product nests a link, it keeps its own semantics — product-side.

### 4.3 Component-specific decisions

- **Contrast pairs** (computed by `pnpm gate:contrast` from resolved
  tokens, never declared here as a verdict): the title `fg/default` on
  `bg/default`; the lede `fg/dim` on `bg/default`; the number and the
  title's `<em>` `accent/default` on `bg/default` — large text (44px and
  32px, WCAG 1.4.3 threshold 3:1). All three pairs are already declared in
  `packages/ui/src/tokens/contrast-pairs.json` at `normal-text` (4.5:1,
  stricter than large text needs), and the accent pair is scored once per
  `Primitives/accent/*` value — the component adds no pair. The aria-hidden
  number is still visible text: WCAG 1.4.3 applies to it, and the declared
  pair covers it. A head placed on `bg/soft` or `surface/*`: the `fg` pairs
  are declared on all four backgrounds, `accent/default` on `bg/default` and
  `surface/default` only — a product placement outside those is a pair to
  add, not to assume.
- **The underline is decoration** (WCAG 1.4.3 exempt, no text): no pair is
  declared for it — the Sigil precedent for its rings.
- **`aria-hidden` on the number is unconditional.** A product that needs
  the number voiced writes it in the title (it then joins the accessible
  name — the case §7 Q9 rejected for the component).
- **The title wraps** (§7 Q7): no `nowrap`, so no horizontal overflow at
  any width or text length (WCAG 1.4.10 reflow) — the latent overflow the
  usage analysis measured on the site's `nowrap` rule disappears. The text
  column is `minmax(0, 1fr)` with `overflow-wrap: break-word`, so even one
  long word breaks inside it; under `--ll-breakpoint-md` the head stacks
  (§3.4), giving the title the full width at 320 CSS px.
- **The engine gate** (axe under the gate's WCAG tags) runs on every
  contract example under the five accents.

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

| Date       | Question (as asked)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | Decision (verbatim)                                                                                                                                                                                                                                                                                                            | Decided by       |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------- |
| 2026-10-13 | Q1 — « Que faire du candidat « tête de section » ? » Options: « STOP » — les quatre recettes restent dans le site. Conséquence : aucun travail bibliothèque ; les 52 têtes des guides et les 22 de la vitrine gardent leur CSS local, le risque de débordement (`nowrap`) reste. « Composant SectionHead, une seule disposition : le numéro dans sa colonne à gauche » (guides de rôle, Glossaire, vitrine). (Recommandé) — Pourquoi : c'est 52 des 58 têtes du site sous une seule recette ; Fundamentals et la page d'accueil gardent leur composition, qui s'écrit déjà avec la bibliothèque (Eyebrow + titre + texte). « Composant SectionHead à deux dispositions » (colonne ET empilée, avec un emplacement pour un Eyebrow au-dessus du titre). Conséquence : couvre aussi Fundamentals (2) et l'accueil (4), mais ces six têtes diffèrent sur toutes les valeurs (taille, numéro, largeur) — deux fois plus de choses à arbitrer dans Figma pour 6 usages. [Q1–Q12 asked together in one batch form on the usage analysis, `process/archives/2026-10-13-sectionhead-usage-analysis.md` §10; the form grouped Q2, Q7–Q11 as « comportement » and Q4, Q5, Q6, Q12 as « tailles »] | « Arbitrage du lot 1 — proceeding with defaults. » [one gesture for the whole batch, taken as every recommended option (Q1–Q12); the Figma visual checkpoint is still to come. Here: one layout — the number in its own column; Fundamentals and the landing heads keep their local composition (Eyebrow + title + text)]      | Louis Tinthilier |
| 2026-10-13 | Q2 — « Le numéro est-il obligatoire ? » [group « comportement »] Options: « Obligatoire. » (Recommandé) — Pourquoi : les 74 têtes « colonne » mesurées ont toutes un numéro ; une tête sans numéro n'a plus besoin de la colonne, c'est un simple titre + texte. « Optionnel » — sans numéro, la colonne disparaît et le titre se cale à gauche. Conséquence : un deuxième rendu à dessiner et à tester, sans usage aujourd'hui.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | recommended option (batch answer, see row 1) [« Obligatoire » — `num` is required]                                                                                                                                                                                                                                             | Louis Tinthilier |
| 2026-10-13 | Q3 — « Le trait sous le numéro (60 px de large, 14 px sous le chiffre, opacité 50 %) : aucune de ces trois valeurs n'existe dans les variables. » Options: « Garder le trait, aligné sur les variables existantes » (largeur 56 ou 64 px, décalage 12 ou 16 px, opacité `opacity/ornament` 25 %). (Recommandé) — Pourquoi : aucune nouvelle variable ; le trait devient plus discret (25 % au lieu de 50 %), à juger au point de contrôle visuel dans Figma. « Garder le rendu exact » — créer dans Figma les variables manquantes (largeur 60, décalage 14, opacité 50 %). Conséquence : trois variables pour un seul ornement, label `token-approved` et passage du pipeline. « Supprimer le trait. » Conséquence : changement visible sur les 52 têtes ; règle aussi le trait qui touche presque le titre sur mobile (2 px mesurés).                                                                                                                                                                                                                                                                                                                                                 | recommended option (batch answer, see row 1) [underline kept, aligned on existing variables: width 56 (`s-7`), offset 12 (`s-15`), opacity `opacity/ornament` (25 %). The 56 / 12 pick between the option's 56 \| 64 and 12 \| 16 was made by the orchestrator, not the design lead — to be validated at the Figma checkpoint] | Louis Tinthilier |
| 2026-10-13 | Q4 — « Taille du titre : le site utilise 36 px (28 px sur mobile) ; la variable `type/h2` vaut 32 px. » [group « tailles »] Options: « `type/h2` 32 px partout, sans palier mobile. » (Recommandé) — Pourquoi : zéro nouvelle variable, même logique que l'Eyebrow (le site s'aligne sur la bibliothèque). Conséquence : titres 4 px plus petits sur ordinateur, 4 px plus grands sur mobile. « Nouveau style de texte Figma 36 / 28 px. » Conséquence : rendu identique ; premier style typographique avec un palier responsive dans la bibliothèque (aucun mécanisme n'existe encore pour ça). « Taille fluide (comme Fundamentals, entre deux bornes selon la largeur d'écran). » Conséquence : aucune variable ne sait exprimer une taille fluide aujourd'hui — il faudrait inventer ce concept dans le pipeline.                                                                                                                                                                                                                                                                                                                                                                   | recommended option (batch answer, see row 1) [title `type/h2` 32px at every width, no mobile step]                                                                                                                                                                                                                             | Louis Tinthilier |
| 2026-10-13 | Q5 — « Taille du numéro : 56 px italique graisse 400 (44 px sur mobile) ; aucune variable à 56, mais `type/h1-italic` vaut exactement 44 px. » [group « tailles »] Options: « `type/h1-italic` (44 px, graisse 500) partout. » (Recommandé) — Pourquoi : c'est déjà la taille du numéro sur mobile ; zéro nouvelle variable. Conséquence : numéro plus petit et un peu plus gras sur ordinateur. « Nouveau style de texte Figma « numéro de section » 56 px / 400. » Conséquence : rendu identique ; un style de plus pour un seul usage. « `type/display` (64 px). » Conséquence : numéro plus grand, et ce style n'est pas en italique — il faudrait le forcer.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | recommended option (batch answer, see row 1) [number `type/h1-italic` 44px at every width]                                                                                                                                                                                                                                     | Louis Tinthilier |
| 2026-10-13 | Q6 — « La largeur de la colonne du numéro (100 px ; 110 px dans la vitrine) n'existe pas dans les variables. » [group « tailles »] Options: « 64 px (`s-8`, la plus grande marche existante). » (Recommandé) — Pourquoi : aucune variable nouvelle, et un numéro de 44 px (Q5) y tient avec sa marge. Conséquence : le titre se rapproche du numéro de 36 px. « Nouvelle variable Figma 100 px. » Conséquence : rendu identique ; une variable de mise en page en plus. « Largeur automatique (celle du numéro). » Conséquence : les titres « 01 » et « 11 » ne sont plus parfaitement alignés d'une section à l'autre.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | recommended option (batch answer, see row 1) [number column 64px, `s-8`]                                                                                                                                                                                                                                                       | Louis Tinthilier |
| 2026-10-13 | Q7 — « Le titre doit-il rester sur une seule ligne au-dessus de 900 px (règle actuelle) ? » [group « comportement »] Options: « Non, le titre passe à la ligne si besoin. » (Recommandé) — Pourquoi : aucun changement visible aujourd'hui (le titre le plus long, 558 px, tient dans 754 px au pire cas mesuré) et plus aucun risque de débordement si un titre s'allonge ou est traduit. « Oui, garder une seule ligne. » Conséquence : un titre ~35 % plus long déborde de sa colonne, et sur ces pages le contenu touche déjà le bord de l'écran. « Une seule ligne, coupée par « … ». » Conséquence : une partie du titre devient invisible — mauvais pour la lecture et l'accessibilité.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | recommended option (batch answer, see row 1) [the title wraps; no `nowrap`]                                                                                                                                                                                                                                                    | Louis Tinthilier |
| 2026-10-13 | Q8 — « Un mot en italique accent dans le titre (`<em>`), comme sur les héros, l'accueil et Fundamentals ? » [group « comportement »] Options: « Oui, l'`<em>` du titre s'affiche en italique couleur accent. » (Recommandé) — Pourquoi : c'est la règle des quatre autres titres du site ; aucun des 52 titres actuels n'en contient, donc rien ne change à l'adoption. « Non, pas de règle » — l'`<em>` reste un italique du navigateur, couleur du titre. Conséquence : un titre qui en utilise un ne ressemble pas aux héros.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | recommended option (batch answer, see row 1) [`<em>` in the title renders italic in the live accent]                                                                                                                                                                                                                           | Louis Tinthilier |
| 2026-10-13 | Q9 — « Le numéro pour les lecteurs d'écran (lu « zéro un » avant le titre aujourd'hui). » [group « comportement »] Options: « Masqué aux lecteurs d'écran. » (Recommandé) — Pourquoi : il ne donne que l'ordre, que la page donne déjà ; sur les guides le sommaire répète les mêmes numéros. « Lu tel quel » (rendu actuel). Conséquence : « zéro un » annoncé avant chaque titre lu en continu ; rien ne change. « Intégré au titre » (« 01 — Phases »). Conséquence : le numéro pollue le nom du titre dans la navigation par titres — ce que la règle Eyebrow Q9 a interdit pour les étiquettes.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | recommended option (batch answer, see row 1) [the number is `aria-hidden`]                                                                                                                                                                                                                                                     | Louis Tinthilier |
| 2026-10-13 | Q10 — « Niveau du titre. » [group « comportement »] Options: « Toujours un h2. » (Recommandé) — Pourquoi : les 74 têtes mesurées sont toutes des h2 sous le h1 du héros ; un seul rendu à tester. « Niveau réglable (h2 ou h3). » Conséquence : une option sans usage aujourd'hui. (Les lettres du Glossaire en h2 sont un défaut du site, à corriger côté site en h3 quoi qu'il arrive.)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | recommended option (batch answer, see row 1) [always `h2`, no `level` prop; the Glossary letters h2 → h3 is a site-side fix for the adoption mission]                                                                                                                                                                          | Louis Tinthilier |
| 2026-10-13 | Q11 — « Le texte d'introduction (lede) est-il obligatoire ? » [group « comportement »] Options: « Optionnel. » (Recommandé) — Pourquoi : les 74 têtes en ont un, mais l'imposer n'apporte rien et le composant actuel du site laisse un paragraphe vide quand il manque. « Obligatoire. » Conséquence : toute future section sans introduction devra en inventer une ou contourner le composant.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | recommended option (batch answer, see row 1) [`lede` optional; no `<p>` when omitted]                                                                                                                                                                                                                                          | Louis Tinthilier |
| 2026-10-13 | Q12 — « Taille du texte d'introduction : 16 px / interligne 1,6 sur le site (15,5 px dans la vitrine) ; la variable `type/body` vaut 15 px / 1,55. » [group « tailles »] Options: « `type/body` (15 px / 1,55). » (Recommandé) — Pourquoi : zéro nouvelle variable ; 1 px de moins, à juger au point de contrôle visuel. « Nouveau style 16 px / 1,6. » Conséquence : rendu identique ; un style de texte de plus, proche de `type/body`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | recommended option (batch answer, see row 1) [lede `type/body` 15 / 1.55]                                                                                                                                                                                                                                                      | Louis Tinthilier |
| 2026-10-13 | Lot selection — « Quels composants entrent dans le premier lot traité en parallèle ? (fixer les priorités, c'est ton verrou) » [multi-select; options: « MetaStrip » — 10 pages, 5 copies CSS. Statique, 3 valeurs visuelles à trancher. / « Breadcrumb » — 7 pages, 3 versions. Presque rien à arbitrer, gros gain d'accessibilité. / « ProgressBar » — 6 pages, 3 hauteurs. Arbitrer la hauteur et le ton (accent / atténué). / « SectionHead » — 52 occurrences, 4 versions. Arbitrer la mise en page (numéro au-dessus ou à côté).]                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | « MetaStrip,ProgressBar,SectionHead » [priority and merge order set in the same batch form: « MetaStrip → ProgressBar → SectionHead (rec.) », answered with the batch defaults]                                                                                                                                                | Louis Tinthilier |
| 2026-10-13 | Checkpoint — « Le rendu des 3 composants (Figma 106:29, 106:31, 106:34) : validé ? » [options: « Validé tel quel » / « À corriger »; shown with a dark-background preview of the three components as built, one batch form for the lot]                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | « Checkpoint du lot 1 — Rendu: Valide tel quel · SH ecart colonnes: 32 px s-4 (site) · SH mobile: Creer un point de rupture Figma · MS ecart lignes: 24 px (meme gap) · PB fond: Accepte, compteur texte obligatoire en guideline · PB texte lu: Obligatoire · Eyebrow description: Agent corrige »                            | Louis Tinthilier |
| 2026-10-13 | Checkpoint — « SectionHead · écart entre la colonne du numéro et le texte » [options: « 32 px, comme le site (rec.) » / « 24 px, comme Figma »; the first Figma build used 24, the RFC draft mapped the site's 32 to `--ll-s-4`]                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | « 32 px s-4 (site) » [Figma 106:34 rebound to `s-4`; batch answer, see the checkpoint row]                                                                                                                                                                                                                                     | Louis Tinthilier |
| 2026-10-13 | Checkpoint — « SectionHead · sur mobile, le site met aujourd'hui le numéro au-dessus du titre (sous 768 px). Et le composant ? » [options: « Deux colonnes partout (rec.) » — aucun point de rupture à créer ; 64 px tiennent sur mobile / « Empilé sous 768 px » — nouvelle variable + extension du pipeline; raised by the RFC draft's open question]                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | « Creer un point de rupture Figma » [reverses the recommendation: a breakpoint variable (768, the site's value) is created in Figma, extracted through the token pipeline, and SectionHead stacks under it; the pipeline/lint support lands in its own shared PR first (axiom 5); batch answer, see the checkpoint row]        | Louis Tinthilier |
| 2026-10-13 | Approval — asked after the checkpoint with a one-line API summary per RFC and the full drafts linked: « Pour approuver, réponds simplement « RFC MetaStrip, ProgressBar, SectionHead approuvées » »; announced: each implementing agent first aligns the RFC body on the checkpoint answers (no new arbitration). Approval is the design lead's lock: an attestation, not a computation.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | « RFC MetaStrip, ProgressBar, SectionHead approuvées » — Status set to `approved`; §6 stays for the ratification at adoption.                                                                                                                                                                                                  | Louis Tinthilier |
