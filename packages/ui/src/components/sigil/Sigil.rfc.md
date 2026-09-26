# RFC: Sigil

> **Status:** approved
> **Author:** Sigil RFC session (Claude, sup. Louis Tinthilier)
> **Date:** 2026-09-26
> **Design node:** `89:4` — [link](https://www.figma.com/design/6zp7CvEjdiFXzwh6ZGGwB8/Lib?node-id=89-4) (component `Sigil`, page `Sigil` 89:3: frame bound to `surface/default` + `border/default`, rings `ring-soft` 89:5 and `ring-accent` 89:6, art slot = INSTANCE_SWAP property `Art` (instance 92:7, inside the accent ring, default `Sigil art / Hex frame` 92:3 — the motif the Glossary and landing sigils share, §7 Q10); no label since §7 Q11)
> **Docs page:** no docs page — reported 2026-09-26 (page-less path: usage analysis first, `process/archives/2026-09-26-sigil-usage-analysis.md`; rules arbitrated in session and recorded in §7; design record `process/archives/2026-09-26-sigil-design.md`)
> **Base primitive:** none
> **Category:** data-display
> **Manifest entry:** sigil

---

## 1. Summary

The framed square every hero of the site carries beside its title: a
1px-bordered `surface` square whose art inherits the live accent, with two
inset rings as ornament. Measured 5 times on 9 pages under three
page-local recipes that agree on everything but the ornament; the
component settles the ornament on the two rings (7 of the 9 pages today,
§7 Q2), places the page's art inside the accent ring (§7 Q11) and drops the
corner caption the site draws today (§7 Q11–Q12: the design lead removed it
from the design). Purely decorative (`aria-hidden`, as all six site mounts
already are) — the page's meaning stays in the heading next to it. Fourth
component through the circuit; the second on the page-less path.

---

## 2. Product usage analysis

### 2.1 Matching identifiers (legacy libraries)

| Identifier                                  | Source package                                                                                                                                                                                                                                                                                                                   |
| ------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `.hero-sigil` (+ `::before`, `::after`)     | LearningLeagues site `styles.css` (lines 436–451): `aspect-ratio: 1; width: min(320px, 100%); justify-self: end; position: relative; border: 1px solid var(--border); background: var(--surface); color: var(--accent)`; two inset rings (12px `border-soft`, 24px `accent` at opacity .25); `svg { width: 100%; height: 100% }` |
| `.hero-sigil-icon`                          | site `styles.css` (lines 454–460): the role-position PNG (CommunityDragon), `position: absolute; inset: 0; margin: auto; width: 44%; height: 44%; background: var(--accent)` through a `mask-image` — the art of the five role guides, product-side (§2.3)                                                                       |
| `.landing-sigil`                            | site `styles.css` (lines 1532–1533): `width: min(360px, 100%)`, `max-width: 240px` + `justify-self: start` under 900px — slot sizing, product-side                                                                                                                                                                               |
| `.sigil-label`                              | site `styles.css` (line 463): `position: absolute; bottom: 10px; left: 12px` — "position only; the text is an LL.Eyebrow", shared by the three recipes since the Eyebrow adoption; deleted at adoption with the caption itself (§7 Q12)                                                                                          |
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

Every framed mount carries `aria-hidden="true"` and, today, a corner caption
rendered by `LL.Eyebrow` (default tone): `SIGIL · TOP` … `SIGIL · SUPPORT`,
`SIGIL · GLOSSARY`, `RIFT · COMPASS`, `SIGIL · LL/DS · v1`,
`DEPENDENCY GRAPH`. The captions leave with the adoption (§7 Q12).

### 2.3 Notes on product adoption

- Adoption replaces the three frame recipes and the caption rule with one
  component: `.hero-sigil`, `.ds-hero-sigil`, `.ft-intro-sigil` (and their
  pseudo-elements) and `.sigil-label` are deleted — about 30 lines across
  three stylesheets — and the five `<LL.Eyebrow>` captions are removed from
  the JSX. Visible changes judged at the adoption run's visual checkpoint
  (human lock), not here: DesignSystem and Fundamentals change ornament
  (brackets → the two rings; the Fundamentals glow disappears — §7 Q2);
  every page loses its corner caption (§7 Q12); the art shrinks from the
  full frame to the square inside the accent ring, 85 % of the side
  (§7 Q11).
- Layout is product-side and stays so: the grid column sizes the slot (the
  component is `width: 100%; aspect-ratio: 1`), `justify-self` /
  `margin-inline` place it, `.landing-sigil` keeps its 360 / 240 widths as
  the slot's width. Same split as the Eyebrow (Eyebrow §7 Q8).
- The art is the page's: four inline SVGs drawn with `currentColor`, and
  the role guides' masked PNG (`.hero-sigil-icon`) — a product asset inside
  a library slot, settled by the manifest's responsibility split ("Sizing
  of the product's own assets inside library slots": the library controls
  the slot, the consumer sizes its asset). `.hero-sigil-icon` stays
  product-side; its `inset: 0` now measures the art slot, not the frame.
- `.ds-empty-sigil` (1 usage, showcase only) is not the same object and
  meets no adoption criterion: out of scope (§7 Q6).
- No library-internal dependency remains (the Eyebrow left with the
  caption, §7 Q11): the consumer dist needs no new import shape. The docs
  examples accept only string children today; the Sigil's examples need an
  SVG child (design record §6 — the deferred "children `string` →
  ReactNode" follow-up closes there).
- One token is missing: the accent ring's 25 % opacity. Created in Figma
  as `Primitives/opacity/ornament` = 25 (§7 Q4, Q9 — Figma reads a float
  bound to opacity as a percentage), to be extracted in the implementation
  PR under the `token-approved` label; the transform emits `opacity/*` as
  `value / 100`, unitless, the same mechanical arithmetic the normalise
  stage applies to a PERCENT line-height.

---

## 3. API design

### 3.1 Properties

| Name       | Type        | Default | Required | Description                                                                                                                                                                                                                       |
| ---------- | ----------- | ------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `children` | `ReactNode` | —       | yes      | The art: an inline `<svg>` drawn with `currentColor` (it inherits the accent), or any product element positioned inside the slot (the role guides' masked icon). Fills the art slot — the square inside the accent ring (§7 Q11). |

No other prop: no label (§7 Q11), no size, no tone, no ornament, no `as`,
no `className` (§7 Q2, Q5; design record, "Out of scope"). The square takes
the width its parent gives it.

### 3.2 Slots / Children

`children` is the single slot — the art. It renders inside
`.ll-sigil-art`, an absolutely positioned square inset by `--ll-s-3` on
every side (the accent ring's inset), so the art sits between the two rings
in paint order: the soft ring below it, the accent ring above it — the
Figma layer order (§7 Q11).

### 3.3 Events / Callbacks

None. The Sigil is not interactive: no states, no handlers, nothing
focusable (§4.2).

### 3.4 Rendering and behaviour

```html
<div class="ll-sigil" aria-hidden="true">
  <div class="ll-sigil-art">
    <svg …>…</svg>
  </div>
</div>
```

Each rule is tagged by what enforces it — TEST (the component's suite),
GATE (a conformity gate), HUMAN (the reviewer or the visual checkpoint):

- Exactly one root `<div class="ll-sigil">` with `aria-hidden="true"`, always, holding one `.ll-sigil-art` whose only content is `children` — TEST.
- `.ll-sigil`: `position: relative; aspect-ratio: 1; width: 100%; border: 1px solid var(--ll-border); background: var(--ll-surface); color: var(--ll-accent)` — the accent follows the axis (`[data-accent]` / `[data-role]` on any ancestor) — GATE (token lint), HUMAN (rendering).
- Two rings as pseudo-elements, `pointer-events: none`: `::before` inset `--ll-s-15` in `--ll-border-soft`; `::after` inset `--ll-s-3` in `--ll-accent` at `--ll-opacity-ornament` (§7 Q2, Q4) — GATE (token lint, contrast: no pair declared, §4.3), HUMAN.
- `.ll-sigil-art`: `position: absolute; inset: var(--ll-s-3)`; `.ll-sigil-art > svg { display: block; width: 100%; height: 100% }` — the art fills the slot (§7 Q11) — HUMAN.
- No margin, no width other than 100 %, no alignment: the parent grid places the frame — HUMAN (the stylesheet is read).

---

## 4. Accessibility commitment

### 4.1 Semantic structure

A single `<div class="ll-sigil" aria-hidden="true">` holding the art slot.
Decorative by construction: nothing inside it is exposed to assistive
technology — the art is ornament, and the frame carries no text (§7 Q11).
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
  to do so — instead of leaving it implicit. The component renders no text
  at all.
- **`aria-hidden` is unconditional.** A product that needs a meaningful
  image uses an `<img alt>` or a figure of its own, not a Sigil.
- **The engine gate** (axe under the gate's WCAG tags) runs on every
  example, all with the root `aria-hidden`.

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

| Date       | Question (as asked)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | Decision (verbatim)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | Decided by       |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------- |
| 2026-09-26 | Q1 — "Le sigil devient-il le quatrième composant de la librairie ?" Options: "Oui, composant Sigil (Recommended)" — un cadre carré (bord, surface, accent, un ornement arbitré) avec un slot pour l'art et un label en coin, couvre les 5 usages, supprime 3 recettes CSS du site; "Non, STOP" — le sigil reste trois recettes de page côté site; "Pas maintenant".                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | "Oui, composant Sigil (Recommended)"                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | Louis Tinthilier |
| 2026-09-26 | Q2 — Ornement, the three candidates rendered with the real tokens (visualize widget): A "Anneaux" — 2 cadres internes, 12px border-soft · 24px accent 25 %, 7 pages aujourd'hui; B "Équerres 14px" — 2 coins accent sur le bord, 14px (pas de token : 12 ou 16), 1 page; C "Équerres 22px + halo" — coins 22px (= s-275) + halo radial accent 8 %, 1 page; or "Plusieurs ornements (une prop)". Recommendation: A.                                                                                                                                                                                                                                                                                                                                                                                                                                       | "Ornement du Sigil : A, les deux anneaux internes"                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | Louis Tinthilier |
| 2026-09-26 | Q3 — "Qui rend le label de coin (« SIGIL · TOP ») ?" Options: "Le Sigil, via une prop label (Recommended)" — `<LL.Sigil label="SIGIL · TOP">art</LL.Sigil>`, le composant place lui-même un Eyebrow en bas à gauche (10px / 12px = tokens s-125 / s-15), premier composant qui dépend d'un autre composant de la lib, le site supprime `.sigil-label`; "Le produit, dans le slot" — aucune dépendance, la position reste une recette côté site; "Pas de label du tout" — changement visuel sur 9 pages.                                                                                                                                                                                                                                                                                                                                                  | "Le Sigil, via une prop label (Recommended)" — superseded by Q11 (the design lead removed the label from the design)                                                                                                                                                                                                                                                                                                                                                                                                                             | Louis Tinthilier |
| 2026-09-26 | Q4 — "Comment tokeniser l'opacité 25 % de l'anneau accent ?" Options: "Nouvelle variable Figma opacité (Recommended)" — une variable nombre que je crée dans Figma après ton OK, puis extraction, rendu identique au site, coût : une règle d'une ligne dans le transform + ton label token-approved; "Anneau accent plein, sans opacité" — ornement nettement plus visible sur 9 pages; "Deux anneaux border-soft, pas d'accent" — l'accent quitte l'ornement. First answer: "c'est obligé de les faires sur figma ?" — explained (axiom 1: every design value comes from Figma, a hand-written `opacity: 0.25` reds the token lint, the `s-275` precedent), re-asked with the split "créée par moi via le MCP" / "créée par toi à la main".                                                                                                            | "c'est obligé de les faires sur figma ?" then "Variable Figma créée par moi via le MCP (Recommended)"                                                                                                                                                                                                                                                                                                                                                                                                                                            | Louis Tinthilier |
| 2026-09-26 | Q5 — "Le label de coin est-il obligatoire ?" Options: "Obligatoire (Recommended)" — les 5 usages en ont un, contrat plus simple : `label: string` requis, un seul variant dans le set Figma; "Optionnel" — `label?: string`, ajoute un variant Label=Off au set Figma et un exemple dans la doc, aucun usage aujourd'hui.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | "Obligatoire (Recommended)" — superseded by Q11                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | Louis Tinthilier |
| 2026-09-26 | Q6 — "Le sigil sans cadre du showcase (« Empty / error state », DesignSystem) entre-t-il dans le composant ?" Options: "Non, hors périmètre (Recommended)" — 1 usage, showcase seulement, aucune page produit, le critère d'adoption n'est pas rempli, il reste une recette du site (`.ds-empty-sigil`), réouvrable si un usage produit apparaît; "Oui, un variant frameless" — une prop qui retire bord, surface, anneaux et label, deux rendus à documenter, deux variants Figma, pour un usage de vitrine.                                                                                                                                                                                                                                                                                                                                            | "Non, hors périmètre (Recommended)"                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | Louis Tinthilier |
| 2026-09-26 | Q7 — "Quelle priorité pour la ligne Sigil dans le manifeste (ton classement) ?" Options: "4 (Recommended)" — après Button 1, Callout 2, Eyebrow 3, l'ordre d'arrivée; "Autre rang".                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | "4 (Recommended)"                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | Louis Tinthilier |
| 2026-09-26 | Q8 — The design presented in five blocks (API; rendering; Figma set; two tooling extensions — dist relative imports, examples with element children; PR sequence) — "Ce design est-il validé tel quel ?" Options: "Validé, on enchaîne"; "À modifier".                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | "Validé, on enchaîne" (recorded in `process/archives/2026-09-26-sigil-design.md`; the label part and the dist extension were undone by Q11)                                                                                                                                                                                                                                                                                                                                                                                                      | Louis Tinthilier |
| 2026-09-26 | Q9 — "Feu vert pour les écritures Figma (crédits) ? Trois appels en séquence : la variable opacity/ornament = 0.25 dans Primitives, la page Sigil, le composant Sigil (cadre, deux anneaux, instance Eyebrow, hexagone de remplacement) avec sa capture pour ton checkpoint." Options: "Go"; "Pas encore".                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | "Go" — created: variable `VariableID:89:2` (`opacity/ornament`, stored as 25 because Figma reads a float bound to opacity as a percentage — the 0.25 first written rendered the ring at 0.25 %), page `Sigil` 89:3, component `Sigil` 89:4 (89:5–89:8). Design sign-off of the rendering pending (§6).                                                                                                                                                                                                                                           | Louis Tinthilier |
| 2026-09-26 | Q10 — At the Figma checkpoint Louis asked "Il manque des choses non ?" and sent the Top, Glossary and landing sigils as rendered on the site. Reading: the site art fills the frame (the drawing spans ~90 % of the square, the placeholder hexagon spanned 56 %), Glossary and landing share one motif (outer hexagon, inner hexagon, six spokes, the page glyph in the centre), and the Sigil exposed no property while the Button and the Callout expose `Label` / `Title`. "Je corrige le composant Figma comme ça ?" Options: "Oui, les deux (Recommended)" — slot `Art` plein cadre (instance swap) avec le motif hexagone + rayons par défaut, et la propriété Label exposée; "Seulement l'art plein cadre"; "Ce n'est pas ça". Louis first wrote "je demande pas le vrai art du site, mais ça c'est ce que j'ai pour le top, glossaire et home". | "Oui, les deux (Recommended)" — done: art component `Sigil art / Hex frame` 92:3 (vectors 93:6–93:8 at the site's proportions ×1.6, strokes bound to `accent/default`), instance 92:7 filling the frame between the two rings (the site's paint order: `::before` under the art, `::after` above), property `Art#92:0` (INSTANCE_SWAP, default 92:3), the Eyebrow instance 89:8 exposed (`isExposedInstance`) so its `Label` appears on the Sigil; placeholder polygon 89:7 removed. In code nothing changes: the art stays the page's children. | Louis Tinthilier |
| 2026-09-26 | Q11 — The design lead edited the Figma component himself and wrote: "J'ai modifié : J'ai rendu le hex inner plus petit et enlevé le texte "sigil" je veux que ce soit ça". Read back from the file: the Eyebrow instance 89:8 is deleted (no label on the Sigil — reverses Q3 and Q5, and removes the Eyebrow dependency); the art instance 92:7 is resized to 272 × 272 at (24, 24), i.e. the square inside the accent ring (inset `s-3`), the art component 92:3 itself unchanged; layer order ring-soft, art, ring-accent. Taken as the reference rendering.                                                                                                                                                                                                                                                                                          | "J'ai modifié : J'ai rendu le hex inner plus petit et enlevé le texte "sigil" je veux que ce soit ça"                                                                                                                                                                                                                                                                                                                                                                                                                                            | Louis Tinthilier |
| 2026-09-26 | Q12 — "Sur le site, que deviennent les légendes de coin actuelles (« SIGIL · TOP », « RIFT · COMPASS »…, sur 9 pages) ?" Options: "Elles disparaissent (Recommended)" — le site adopte le Sigil tel que dessiné : plus de légende de coin nulle part, changement visuel sur les 9 pages jugé au checkpoint d'adoption, la règle `.sigil-label` est supprimée; "Le site les garde lui-même" — la lib ne connaît pas la légende, le site continue de poser son LL.Eyebrow en absolu dans le cadre avec sa propre règle `.sigil-label`.                                                                                                                                                                                                                                                                                                                     | "Elles disparaissent (Recommended)"                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | Louis Tinthilier |
| 2026-09-26 | Q13 — After the amended RFC, design record and Figma component (89:4 as the design lead left it) were pushed to PR #47 with the session report ("À décider : 1. Le rendu Figma tel que tu l’as laissé : signé ? 2. La RFC : je passe le statut à approved maintenant ?"). Approval is the design lead’s lock: an attestation, not a computation.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | "Validé, passe la RFC en approved" — Status set to `approved` in this commit; §6 stays for the ratification at adoption, as for the Eyebrow.                                                                                                                                                                                                                                                                                                                                                                                                     | Louis Tinthilier |
