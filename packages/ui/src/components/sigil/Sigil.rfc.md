# RFC: Sigil

> **Status:** draft
> **Author:** Sigil RFC session (Claude, sup. Louis Tinthilier)
> **Date:** 2026-09-26
> **Design node:** `89:4` — [link](https://www.figma.com/design/6zp7CvEjdiFXzwh6ZGGwB8/Lib?node-id=89-4) (component `Sigil`, page `Sigil` 89:3: frame bound to `surface/default` + `border/default`, rings `ring-soft` 89:5 and `ring-accent` 89:6, art placeholder 89:7, label 89:8 = instance of `Eyebrow / Tone=Dim` 80:3)
> **Docs page:** no docs page — reported 2026-09-26 (page-less path: usage analysis first, `process/archives/2026-09-26-sigil-usage-analysis.md`; rules arbitrated in session and recorded in §7; design record `process/archives/2026-09-26-sigil-design.md`)
> **Base primitive:** none (composes the library's own `Eyebrow` — the first library-internal dependency, §7 Q3)
> **Category:** data-display
> **Manifest entry:** sigil

---

## 1. Summary

The framed square every hero of the site carries beside its title: a
1px-bordered `surface` square whose art inherits the live accent, two inset
rings as ornament, and a corner label. Measured 5 times on 9 pages under
three page-local recipes that agree on everything but the ornament; the
component settles the ornament on the two rings (7 of the 9 pages today,
§7 Q2), renders the label through the exported `Eyebrow` (§7 Q3) and leaves
the art to the page. Purely decorative (`aria-hidden`, as all six site
mounts already are) — the page's meaning stays in the heading next to it.
Fourth component through the circuit; the second on the page-less path.

---

## 2. Product usage analysis

### 2.1 Matching identifiers (legacy libraries)

| Identifier                                  | Source package                                                                                                                                                                                                                                                                                                                   |
| ------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `.hero-sigil` (+ `::before`, `::after`)     | LearningLeagues site `styles.css` (lines 436–451): `aspect-ratio: 1; width: min(320px, 100%); justify-self: end; position: relative; border: 1px solid var(--border); background: var(--surface); color: var(--accent)`; two inset rings (12px `border-soft`, 24px `accent` at opacity .25); `svg { width: 100%; height: 100% }` |
| `.hero-sigil-icon`                          | site `styles.css` (lines 454–460): the role-position PNG (CommunityDragon), `position: absolute; inset: 0; margin: auto; width: 44%; height: 44%; background: var(--accent)` through a `mask-image` — the art of the five role guides, product-side (§2.3)                                                                       |
| `.landing-sigil`                            | site `styles.css` (lines 1532–1533): `width: min(360px, 100%)`, `max-width: 240px` + `justify-self: start` under 900px — slot sizing, product-side                                                                                                                                                                               |
| `.sigil-label`                              | site `styles.css` (line 463): `position: absolute; bottom: 10px; left: 12px` — "position only; the text is an LL.Eyebrow", shared by the three recipes since the Eyebrow adoption                                                                                                                                                |
| `.ds-hero-sigil` (+ `::before`, `::after`)  | site `design-system.css` (lines 98–112): same frame (`max-width: 320px`), ornament = two 14px corner brackets in `accent` on the outer edge                                                                                                                                                                                      |
| `.ft-intro-sigil` (+ `::before`, `::after`) | site `fundamentals.css` (lines 34–46): same frame (`max-width: 340px; margin-inline: auto`), ornament = two 22px corner brackets in `accent` plus a radial accent glow (`color-mix(... 8%)`) behind                                                                                                                              |
| `.ds-empty-sigil`                           | site `design-system.css` (lines 586–587): `color: var(--accent); aspect-ratio: 1` and an SVG — no border, no surface, no ornament, no label; showcase only, out of scope (§7 Q6)                                                                                                                                                 |

### 2.2 Usage metrics

Measured on the site checkout at `origin/main` 061a33d (fetched and verified
clean before measuring — L09), with `grep -rn -i sigil` over the tracked
`*.html *.css *.jsx *.js`, the vendored `lib/ll-lib.*` excluded.

| Product                             | Files                                                                                                                | Occurrences                                                                                                                                                                                         | Main zones                                                                                                                                   |
| ----------------------------------- | -------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| LearningLeagues site (framed sigil) | 5 JSX mounts (`components.jsx` `Hero`, `glossary.jsx`, `landing.jsx`, `design-system.jsx`, `fundamentals-cards.jsx`) | 5 mounts rendering on 9 pages: the `Hero` mount serves the five role guides (Top, Jungle, Mid, ADC, Support), then Glossary, index, DesignSystem (showcase), Fundamentals — every lib page but Quiz | hero / intro grid, right column (320px on the heroes, 360px on the landing, `1fr` on Fundamentals); art = inline SVG ×4, masked role icon ×1 |
| LearningLeagues site (frameless)    | 1 (`ds-patterns.jsx`)                                                                                                | 1 (`.ds-empty-sigil`, the showcase's "Empty / error state" pattern)                                                                                                                                 | DS showcase only — no product page                                                                                                           |

Every framed mount carries `aria-hidden="true"` and a corner label rendered
by `LL.Eyebrow` (default tone): `SIGIL · TOP` … `SIGIL · SUPPORT`,
`SIGIL · GLOSSARY`, `RIFT · COMPASS`, `SIGIL · LL/DS · v1`, `DEPENDENCY GRAPH`.

### 2.3 Notes on product adoption

- Adoption replaces the three frame recipes and the label rule with one
  component: `.hero-sigil`, `.ds-hero-sigil`, `.ft-intro-sigil` (and their
  pseudo-elements) and `.sigil-label` are deleted — about 30 lines across
  three stylesheets. DesignSystem and Fundamentals **change ornament**
  (brackets → the two rings; the Fundamentals glow disappears) — a visible
  change judged at the adoption run's visual checkpoint (human lock), not
  here (§7 Q2). The seven other pages render identically.
- Layout is product-side and stays so: the grid column sizes the slot (the
  component is `width: 100%; aspect-ratio: 1`), `justify-self` /
  `margin-inline` place it, `.landing-sigil` keeps its 360 / 240 widths as
  the slot's width. Same split as the Eyebrow (Eyebrow §7 Q8).
- The art is the page's: four inline SVGs drawn with `currentColor`, and
  the role guides' masked PNG (`.hero-sigil-icon`) — a product asset inside
  a library slot, settled by the manifest's responsibility split ("Sizing
  of the product's own assets inside library slots": the library controls
  the slot, the consumer sizes its asset). `.hero-sigil-icon` stays
  product-side untouched.
- `.ds-empty-sigil` (1 usage, showcase only) is not the same object and
  meets no adoption criterion: out of scope (§7 Q6).
- The label is the exported `Eyebrow`: the Sigil imports it (§7 Q3). The
  consumer dist strips only the React import today and refuses any other;
  the implementation teaches it the relative component import (design
  record §6.1). The docs examples accept only string children today; the
  Sigil's examples need an SVG child (design record §6.2 — the deferred
  "children `string` → ReactNode" follow-up closes there).
- One token is missing: the accent ring's 25 % opacity. Created in Figma
  as `Primitives/opacity/ornament` = 25 (§7 Q4, Q9 — Figma reads a float
  bound to opacity as a percentage), to be extracted in the implementation
  PR under the `token-approved` label; the transform emits `opacity/*` as
  `value / 100`, unitless, the same mechanical arithmetic the normalise
  stage applies to a PERCENT line-height.

---

## 3. API design

### 3.1 Properties

| Name       | Type        | Default | Required | Description                                                                                                                                                                                                                                 |
| ---------- | ----------- | ------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `label`    | `string`    | —       | yes      | The corner caption, rendered as `<Eyebrow>` (default tone `dim`) at the bottom-left of the frame (§7 Q3, Q5). A category or a name, never a sentence — the Eyebrow's own rule. Written in prose casing; the capitals are the Eyebrow's CSS. |
| `children` | `ReactNode` | —       | yes      | The art: an inline `<svg>` drawn with `currentColor` (it inherits the accent), or any product element positioned inside the frame (the role guides' masked icon). Fills the frame.                                                          |

No other prop: no size, no tone, no ornament, no `as`, no `className` (§7
Q2, Q5; design record, "Out of scope"). The square takes the width its
parent gives it.

### 3.2 Slots / Children

`children` is the single slot — the art. The component renders it first,
then the label, so the label paints above the art.

### 3.3 Events / Callbacks

None. The Sigil is not interactive: no states, no handlers, nothing
focusable (§4.2).

### 3.4 Rendering and behaviour

```html
<div class="ll-sigil" aria-hidden="true">
  <svg …>…</svg>
  <span class="ll-sigil-label"><span class="ll-eyebrow ll-eyebrow--dim">Sigil · Top</span></span>
</div>
```

Each rule is tagged by what enforces it — TEST (the component's suite),
GATE (a conformity gate), HUMAN (the reviewer or the visual checkpoint):

- Exactly one root `<div class="ll-sigil">` with `aria-hidden="true"`, always — TEST.
- `position: relative; aspect-ratio: 1; width: 100%; border: 1px solid var(--ll-border); background: var(--ll-surface); color: var(--ll-accent)` — the accent follows the axis (`[data-accent]` / `[data-role]` on any ancestor) — GATE (token lint), HUMAN (rendering).
- Two rings as pseudo-elements, `pointer-events: none`: `::before` inset `--ll-s-15` in `--ll-border-soft`; `::after` inset `--ll-s-3` in `--ll-accent` at `--ll-opacity-ornament` (§7 Q2, Q4) — GATE (token lint, contrast: no pair declared, §4.3), HUMAN.
- `.ll-sigil > svg { display: block; width: 100%; height: 100% }` — the art fills the frame — HUMAN.
- `.ll-sigil-label`: `position: absolute; bottom: var(--ll-s-125); left: var(--ll-s-15); line-height: 0` — the site's `.label-slot` recipe (block + line-height 0, so the Eyebrow's line box does not shift the corner) — TEST (the label element and its Eyebrow class are present), HUMAN (position).
- The label is the library's `Eyebrow`, imported from `../eyebrow`, tone `dim` — TEST.
- No margin, no width other than 100 %, no alignment: the parent grid places the frame — HUMAN (the stylesheet is read).

---

## 4. Accessibility commitment

### 4.1 Semantic structure

A single `<div class="ll-sigil" aria-hidden="true">` holding the art and
the label span. Decorative by construction: nothing inside it is exposed
to assistive technology — the art is ornament and the label repeats a name
the page already gives in its heading (`SIGIL · TOP` beside the "Top" h1).
No ARIA role, no accessible name, no live region. The six site mounts
already ship `aria-hidden="true"`; the component makes it unconditional.

### 4.2 Keyboard interaction

Nothing to do: no interactive element, nothing focusable — no `a`,
`button`, `input` or `tabindex` is rendered by the component. Interactive
children are not expected: an `aria-hidden` subtree must not contain
focusable content (WCAG 4.1.2, axe `aria-hidden-focus`) — a `dont`
guideline, and the keyboard suite asserts the component itself renders
nothing focusable.

### 4.3 Component-specific decisions

- **No contrast pair is declared.** Pure decoration is exempt from WCAG
  1.4.3, and the contrast gate scores declared pairs only: the contract's
  `a11y` block states the empty pair set explicitly — the first component
  to do so — instead of leaving it implicit. The Eyebrow's own pairs
  (`fg/dim` on `surface/default`) are scored on the Eyebrow and are not
  re-declared here.
- **`aria-hidden` is unconditional.** A product that needs a meaningful
  image uses an `<img alt>` or a figure of its own, not a Sigil.
- **The label is hidden with the art**, as on the site today: the page's
  heading carries the name. Verified by the a11y engine (axe under the
  gate's WCAG tags) on every example, all with the root `aria-hidden`.

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

| Date       | Question (as asked)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | Decision (verbatim)                                                                                                                                                                                                                                                                                    | Decided by       |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------- |
| 2026-09-26 | Q1 — "Le sigil devient-il le quatrième composant de la librairie ?" Options: "Oui, composant Sigil (Recommended)" — un cadre carré (bord, surface, accent, un ornement arbitré) avec un slot pour l'art et un label en coin, couvre les 5 usages, supprime 3 recettes CSS du site; "Non, STOP" — le sigil reste trois recettes de page côté site; "Pas maintenant".                                                                                                                                                                                                                                                                                                                                                                           | "Oui, composant Sigil (Recommended)"                                                                                                                                                                                                                                                                   | Louis Tinthilier |
| 2026-09-26 | Q2 — Ornement, the three candidates rendered with the real tokens (visualize widget): A "Anneaux" — 2 cadres internes, 12px border-soft · 24px accent 25 %, 7 pages aujourd'hui; B "Équerres 14px" — 2 coins accent sur le bord, 14px (pas de token : 12 ou 16), 1 page; C "Équerres 22px + halo" — coins 22px (= s-275) + halo radial accent 8 %, 1 page; or "Plusieurs ornements (une prop)". Recommendation: A.                                                                                                                                                                                                                                                                                                                            | "Ornement du Sigil : A, les deux anneaux internes"                                                                                                                                                                                                                                                     | Louis Tinthilier |
| 2026-09-26 | Q3 — "Qui rend le label de coin (« SIGIL · TOP ») ?" Options: "Le Sigil, via une prop label (Recommended)" — `<LL.Sigil label="SIGIL · TOP">art</LL.Sigil>`, le composant place lui-même un Eyebrow en bas à gauche (10px / 12px = tokens s-125 / s-15), premier composant qui dépend d'un autre composant de la lib, le site supprime `.sigil-label`; "Le produit, dans le slot" — aucune dépendance, la position reste une recette côté site; "Pas de label du tout" — changement visuel sur 9 pages.                                                                                                                                                                                                                                       | "Le Sigil, via une prop label (Recommended)"                                                                                                                                                                                                                                                           | Louis Tinthilier |
| 2026-09-26 | Q4 — "Comment tokeniser l'opacité 25 % de l'anneau accent ?" Options: "Nouvelle variable Figma opacité (Recommended)" — une variable nombre que je crée dans Figma après ton OK, puis extraction, rendu identique au site, coût : une règle d'une ligne dans le transform + ton label token-approved; "Anneau accent plein, sans opacité" — ornement nettement plus visible sur 9 pages; "Deux anneaux border-soft, pas d'accent" — l'accent quitte l'ornement. First answer: "c'est obligé de les faires sur figma ?" — explained (axiom 1: every design value comes from Figma, a hand-written `opacity: 0.25` reds the token lint, the `s-275` precedent), re-asked with the split "créée par moi via le MCP" / "créée par toi à la main". | "c'est obligé de les faires sur figma ?" then "Variable Figma créée par moi via le MCP (Recommended)"                                                                                                                                                                                                  | Louis Tinthilier |
| 2026-09-26 | Q5 — "Le label de coin est-il obligatoire ?" Options: "Obligatoire (Recommended)" — les 5 usages en ont un, contrat plus simple : `label: string` requis, un seul variant dans le set Figma; "Optionnel" — `label?: string`, ajoute un variant Label=Off au set Figma et un exemple dans la doc, aucun usage aujourd'hui.                                                                                                                                                                                                                                                                                                                                                                                                                     | "Obligatoire (Recommended)"                                                                                                                                                                                                                                                                            | Louis Tinthilier |
| 2026-09-26 | Q6 — "Le sigil sans cadre du showcase (« Empty / error state », DesignSystem) entre-t-il dans le composant ?" Options: "Non, hors périmètre (Recommended)" — 1 usage, showcase seulement, aucune page produit, le critère d'adoption n'est pas rempli, il reste une recette du site (`.ds-empty-sigil`), réouvrable si un usage produit apparaît; "Oui, un variant frameless" — une prop qui retire bord, surface, anneaux et label, deux rendus à documenter, deux variants Figma, pour un usage de vitrine.                                                                                                                                                                                                                                 | "Non, hors périmètre (Recommended)"                                                                                                                                                                                                                                                                    | Louis Tinthilier |
| 2026-09-26 | Q7 — "Quelle priorité pour la ligne Sigil dans le manifeste (ton classement) ?" Options: "4 (Recommended)" — après Button 1, Callout 2, Eyebrow 3, l'ordre d'arrivée; "Autre rang".                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | "4 (Recommended)"                                                                                                                                                                                                                                                                                      | Louis Tinthilier |
| 2026-09-26 | Q8 — The design presented in five blocks (API; rendering; Figma set; two tooling extensions — dist relative imports, examples with element children; PR sequence) — "Ce design est-il validé tel quel ?" Options: "Validé, on enchaîne"; "À modifier".                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | "Validé, on enchaîne" (recorded in `process/archives/2026-09-26-sigil-design.md`)                                                                                                                                                                                                                      | Louis Tinthilier |
| 2026-09-26 | Q9 — "Feu vert pour les écritures Figma (crédits) ? Trois appels en séquence : la variable opacity/ornament = 0.25 dans Primitives, la page Sigil, le composant Sigil (cadre, deux anneaux, instance Eyebrow, hexagone de remplacement) avec sa capture pour ton checkpoint." Options: "Go"; "Pas encore".                                                                                                                                                                                                                                                                                                                                                                                                                                    | "Go" — created: variable `VariableID:89:2` (`opacity/ornament`, stored as 25 because Figma reads a float bound to opacity as a percentage — the 0.25 first written rendered the ring at 0.25 %), page `Sigil` 89:3, component `Sigil` 89:4 (89:5–89:8). Design sign-off of the rendering pending (§6). | Louis Tinthilier |
