# RFC: Callout

> **Status:** approved
> **Author:** Callout RFC session (Claude, sup. Louis Tinthilier)
> **Date:** 2026-09-11
> **Design node:** `61:26` — [link](https://www.figma.com/design/6zp7CvEjdiFXzwh6ZGGwB8/Lib?node-id=61-26)
> **Docs page:** `66:3` — [link](https://www.figma.com/design/6zp7CvEjdiFXzwh6ZGGwB8/Lib?node-id=66-3) (`Docs / Callout`, written with the design lead before this RFC; imported once here per `rfc-generation.prompt.md` Step 2 3b)
> **Base primitive:** none
> **Category:** data-display
> **Manifest entry:** callout

---

## 1. Summary

An emphasised aside inside a guide section: a typed tag (Key concept / Pro
tip / Trap — a decorative glyph and a mono label in the live accent), an
optional serif title, and a body of rich inline content. It is not
interactive. Second component through the circuit, and the first whose rules
were authored on a Figma docs page before the RFC — its job is as much to
prove that flow as to ship the callout.

---

## 2. Product usage analysis

### 2.1 Matching identifiers (legacy libraries)

| Identifier                                                    | Source package                                                                                        |
| ------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `.callout`, `.callout-tag`, `.callout-title`, `.callout-body` | LearningLeagues site `styles.css` (lines 879–903)                                                     |
| `.callout-tag .gl--key/--pro/--trap`                          | site `styles.css` — the three glyphs                                                                  |
| `Callout({ type, title, children })`, `CALLOUT_TYPES`         | site `components.jsx` (lines 143–158) — a React component already, single source of tag label + glyph |
| `.callout-grid`                                               | site `styles.css` — 2-column grid, 1 column under 900px: product layout, out of scope (§7 Q4)         |

### 2.2 Usage metrics

Measured on the site checkout at `origin/main` b6f0d0c (fetched and
fast-forwarded before measuring — L09).

| Product                           | Files                                                                                       | Occurrences                                                                                                                                             | Main zones                                            |
| --------------------------------- | ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| LearningLeagues site (`<Callout`) | 3 (`components.jsx` definition, `role-sections.jsx` renderer, `ds-components.jsx` showcase) | 20 rendered callouts from the 5 role-guide data files (`role-{top,jungle,mid,adc,support}.jsx`): 5 `key`, 13 `pro`, 2 `trap`; plus 3 in the DS showcase | one "Key concept" section per role guide; DS showcase |

### 2.3 Notes on product adoption

- The site already renders through one component; adoption is a swap of
  `components.jsx`'s `Callout` for the library's, and deleting `.callout*`
  from `styles.css`. Every rendered usage passes `type` explicitly; `title`
  is always set in the guide data (the showcase proves the no-title path).
- Bodies are rich inline content: `<b>` and `<Gloss>` glossary terms (16 in
  the Mid guide alone). The library styles `b` inside the body; `Gloss` stays
  a product component rendered as children.
- The 2-column grid (`.callout-grid`) is the section's layout, not the
  callout's: it stays product-side (§7 Q4).
- `data-callout={type}` is emitted by the site's component but consumed by no
  CSS or script (grep across the site: definition only) — not carried over.

---

## 3. API design

Key / Pro / Trap are types, not states: the component has no interactive
state (no hover, no focus). Every rule below is tagged with what enforces
it — TEST (the component's `Callout.a11y.test.ts` behaviour suite, run by the
accessibility engine gate), GATE (conformity), HUMAN (review).

### 3.1 Properties

| Name     | Type                       | Default | Required | Description                                                                                                                                                                                                                 |
| -------- | -------------------------- | ------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| type     | `"key" \| "pro" \| "trap"` | —       | yes      | Selects the tag label ("Key concept" / "Pro tip" / "Trap") and its glyph. Required, no fallback (§7 Q5): an unknown type is a compile error, never a silent Pro tip. The label comes from the type, never from a prop. TEST |
| title    | `string`                   | —       | no       | Optional serif title. Absent → no heading element is rendered. TEST                                                                                                                                                         |
| children | `ReactNode`                | —       | yes      | The body: rich inline content (bold, glossary terms). HUMAN (wording)                                                                                                                                                       |

Naming rule (§7 Q6): `variant` is reserved for visual styles (Button); `type`
names an editorial kind — key / pro / trap. The title renders as a fixed
`<h3>` (§7 Q7): every measured usage sits under a section `<h2>`; a
`headingLevel` prop returns via RFC if another context appears.

### 3.2 Slots / Children

`children` is the body, rendered inside the body container: text, `<b>`
(styled by the library), inline product components such as glossary terms.
No other slot: the tag and the title are driven by props.

### 3.3 Events / Callbacks

None. Not interactive.

### 3.4 Behaviours (testable)

- Renders `<article>` with the tag first, then the optional title, then the
  body. TEST
- `type="key"` → "Key concept"; `"pro"` → "Pro tip"; `"trap"` → "Trap". TEST
- No `title` → no heading element in the output. TEST
- Every chrome value is a token — token lint; accent-on-surface contrast per
  type under the five accents — contrast gate; a11y engine over the four
  contract examples × 5 accents. GATE
- One Key concept per section, first in the grid; title wording; type choice.
  HUMAN

---

## 4. Accessibility commitment

### 4.1 Semantic structure

`<article>` as on the site. The optional title is an `<h3>` under the
section's `<h2>` (§7 Q7). The tag is plain text — "Key concept",
"Pro tip", "Trap" — and carries the meaning; the uppercase treatment is CSS
`text-transform`, so assistive tech reads the author's casing. No ARIA role
overrides.

### 4.2 Keyboard interaction

Nothing to do: no interactive element inside the component. Interactive
children (glossary terms) keep their own semantics — product-side.

### 4.3 Component-specific decisions

- The glyph (diamond / circle / triangle, 10px) is decorative — arbitrated
  2026-09-11 (§7 Q3): hidden from assistive tech (`aria-hidden="true"`), no
  alternative text, the label already says it.
- Contrast is computed by the gate from resolved tokens, never declared here:
  `accent/default` on `surface/default` (tag label and border) under the five
  accents; `fg/dim` on `surface/default` (body); `fg/default` (title, bold).
- Not interactive, so no focus ring and no keyboard rule; a future
  dismissable variant (out of scope, §8 of the docs page) would reopen §4.2.

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

| Date       | Question (as asked)                                                                                                                                                                                                                 | Decision (verbatim)                                                                                                                                                                                                                                                                                                                                                 | Decided by       |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------- |
| 2026-09-11 | Q1 — Le libellé du tag est en mono 10 px / 0.16 em sur le site ; aucun style n'existe à cette taille (`type/meta` = 11 px). [new `type/tag` style at 10px, or align on `type/meta`]                                                 | Round 1: "BEst practice est-ce que c'est nécessaire le 10px ?" [is 10px necessary?] — answered no (readability floor 11–12px; the site's own floor is type/meta 11 / Button 12) — round 2: "Oui, type/meta (Recommended)"                                                                                                                                           | Louis Tinthilier |
| 2026-09-11 | Q2 — Le titre est à 26 px / 1.2 sur le site ; `type/h3` est à 22 px. [align on type/h3, or a new 26px style]                                                                                                                        | "Aligner sur type/h3 (22 px) (Recommended)"                                                                                                                                                                                                                                                                                                                         | Louis Tinthilier |
| 2026-09-11 | Q3 — Le glyphe (losange / cercle / triangle) : décoratif ou porteur de sens ?                                                                                                                                                       | "Décoratif, le texte du tag porte le sens (Recommended)" [decorative; the tag text carries the meaning]                                                                                                                                                                                                                                                             | Louis Tinthilier |
| 2026-09-11 | Q4 — La grille à deux colonnes (`.callout-grid`, une colonne sous 900 px) : dans la lib ou côté produit ?                                                                                                                           | "Côté produit, hors périmètre v1 (Recommended)" [product-side, out of scope v1]                                                                                                                                                                                                                                                                                     | Louis Tinthilier |
| 2026-09-11 | Q5 — La prop `type` : obligatoire (union TypeScript, pas de repli) ou optionnelle avec repli sur `pro` comme le site ?                                                                                                              | "Obligatoire, sans repli (Recommended)" [required, no fallback]                                                                                                                                                                                                                                                                                                     | Louis Tinthilier |
| 2026-09-11 | Q6 — Nom de la prop : `type` (le site, sens éditorial) ou `variant` (convention du Button) ?                                                                                                                                        | "type (Recommended)"                                                                                                                                                                                                                                                                                                                                                | Louis Tinthilier |
| 2026-09-11 | Q7 — Le titre : `<h3>` fixe (le site, toujours sous le h2 de section) ou une prop `headingLevel` ?                                                                                                                                  | "h3 fixe (Recommended)" [fixed h3]                                                                                                                                                                                                                                                                                                                                  | Louis Tinthilier |
| 2026-09-11 | Q8 — Priorité du Callout dans le manifeste (verrou humain) ?                                                                                                                                                                        | "2 (Recommended)"                                                                                                                                                                                                                                                                                                                                                   | Louis Tinthilier |
| 2026-09-11 | Le gras dans le corps : le site le met en graisse 600, aucun token ne porte cette valeur. La lib remonte le `<b>` en `fg/default` et laisse la graisse au navigateur (700). Si tu veux le 600, ce sera un token `type/body-strong`. | "pour le gras on garde celui du navigateur" [keep the browser bold] — no `type/body-strong` token; `<b>`/`<strong>` lift to fg/default only                                                                                                                                                                                                                         | Louis Tinthilier |
| 2026-09-11 | (unprompted — adoption run on the site, PR #28 merged as 8dd599d)                                                                                                                                                                   | Visual checkpoint of Mid.html, DesignSystem#components and a role guide: "Go, committe" — site `main` 12ac249, 23 rendered usages, zero compensations. Found and fixed on the way: since the Button pilot, `Nav` renders `LL.Button` but ADC / Fundamentals / Glossary / Jungle / Mid / Support / Top did not load `lib/ll-lib.{css,jsx}` — their Nav crashed (L11) | Louis Tinthilier |
