# RFC: ProgressBar

> **Status:** approved
> **Author:** ProgressBar RFC session (Claude, sup. Louis Tinthilier)
> **Date:** 2026-10-13
> **Design node:** Figma: component `ProgressBar` 106:31 on page `ProgressBar` 106:30 — https://www.figma.com/design/6zp7CvEjdiFXzwh6ZGGwB8/Lib?node-id=106-31 (page `ProgressBar` of the `Lib` file; built by an agent, validated by the design lead, §7 Q7)
> **Docs page:** no docs page — reported 2026-10-13 (page-less path: usage analysis first, `process/archives/2026-10-13-progressbar-usage-analysis.md`; rules arbitrated in session and recorded in §7)
> **Base primitive:** none
> **Category:** feedback
> **Manifest entry:** progress-bar

---

## 1. Summary

The thin bar that tells how far a task has got: a 4px `border/soft` track
holding an accent fill whose length is `value / max`. Measured as three
page-local recipes on 4 mounts and 7 pages, none of them announced to
assistive technology; the component covers the three **progress** usages
(the role checklist on the five role guides, the DesignSystem XP rail, the
quiz header — §7 Q1) with the checklist recipe, which maps onto existing
tokens with zero design gap (§2.3), and makes every bar a named
`progressbar` with a readable value (§7 Q5). The quiz result ranking — a
measurement, not progress — stays product-side. Fifth component through the
circuit; the third on the page-less path.

---

## 2. Product usage analysis

### 2.1 Matching identifiers (legacy libraries)

| Identifier                                 | Source package                                                                                                                                                                                                                                                                                     |
| ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `.progress-bar` / `.progress-bar-fill`     | LearningLeagues site `styles.css` (lines 1142–1153): track `height: 4px; background: var(--border-soft); position: relative; overflow: hidden`, fill `position: absolute; left: 0; top: 0; bottom: 0; background: var(--accent); transition: width .3s cubic-bezier(.3,.7,.4,1)`, inline `%` width |
| `.qz-progress-bar` / `.qz-progress-fill`   | site `quiz.css` (lines 102–112): same track and fill at `height: 2px`, no `overflow`, `transition: width .35s cubic-bezier(.3,.7,.4,1)` (inert in practice: the question screen is remounted per question — analysis §5)                                                                           |
| `.qz-rank-bar-wrap` / `.qz-rank-bar`       | site `quiz.css` (lines 318–328): `height: 6px`, fill `var(--fg-mute)` at opacity .45 (the leader `var(--accent)`), `scaleX` grow-in `.7s` staggered `i * 90ms`, reduced-motion guard, hidden under 640px — **out of scope, stays product-side** (§7 Q1)                                            |
| `.progress-num`, `.ds-progress-meta`       | site `styles.css`, `design-system.css`: the visible counters next to the bars (`count/10`, `LVL 14` · `620 / 1000 XP`) — product text, stays product-side                                                                                                                                          |
| `.checklist-progress`, `.ds-progress-demo` | site: the sticky panel and the showcase column around the bar — layout, product-side                                                                                                                                                                                                               |

### 2.2 Usage metrics

Measured on the site checkout at `main` f6066ab (`HEAD` = `origin/main`,
tree clean — L09; the remote verified by the parent session), with
`git ls-files` grepped for `progress`, `meter`, `aria-value`, `-bar`,
`-fill`, `scaleX`, `track` and percentage inline widths, every hit read in
its file (`process/archives/2026-10-13-progressbar-usage-analysis.md` §1).
No page was rendered in a browser for the analysis.

| Product                                              | Files                                                                                                                    | Occurrences                                                                                                                                                                       | Main zones                                                                                                                                                       |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| LearningLeagues site (progress — in scope)           | 3 JSX mounts (`role-sections.jsx` `SectionChecklist`, `ds-components.jsx` `ChartsShowcase`, `quiz-app.jsx` `QzProgress`) | 3 mounts rendering 7 bars on 7 pages: the checklist on the five role guides (Top, Jungle, Mid, ADC, Support), the XP rail on DesignSystem (showcase), the question header on Quiz | checklist sticky panel (`count / 10`, 10 % steps, `localStorage`); showcase column (static 62 %); quiz header row between the counter and `← Back` (`index / 8`) |
| LearningLeagues site (ranking — out of scope, §7 Q1) | 1 JSX mount (`quiz-app.jsx` `QzResult`)                                                                                  | 1 mount, 5 bars on the Quiz result screen, hidden under 640px                                                                                                                     | `.qz-rank-row` grid column, beside the row's position, icon, name and `N PTS`                                                                                    |

In total 4 mounts in 3 JSX files, 3 CSS recipes in 2 stylesheets, 7 pages,
at most 12 rendered bars; all 7 pages already load `lib/ll-lib.{css,jsx}`
(no L11 risk). **None of the 12 carries `role="progressbar"`,
`role="meter"`, a native `<progress>` / `<meter>` or any `aria-value*`.**

### 2.3 Notes on product adoption

- Adoption replaces two recipes with one component: `.progress-bar` /
  `-fill` (`styles.css`, 2 mounts, 6 pages) and `.qz-progress-bar` /
  `-fill` (`quiz.css`, 1 mount). `.qz-rank-bar*` is untouched (§7 Q1).
  Visible changes, judged at the adoption run's visual checkpoint (human
  lock), not here: the quiz header thickens from 2px to 4px (§7 Q2); the
  checklist fill stops sliding (`.3s`) and jumps to its new length (§7 Q4).
- **L01 — every value maps to an existing token.** Track height
  `--ll-s-05` (4px; `Spacing/s-05` carries the `WIDTH_HEIGHT` scope, read
  in `tokens.json`; precedent: the Sigil's ring insets are spacing tokens),
  track `--ll-border-soft` (same `#1a2540` as the site), fill `--ll-accent`
  (follows `[data-accent]` / `[data-role]`). Every design gap the analysis
  found — heights 2px and 6px, the mute fill at .45, durations
  .3s / .35s / .7s, two easings, the 90ms stagger (analysis §3) — leaves
  with an option the design lead did not take (§7 Q2–Q4) or with the
  ranking (§7 Q1). The token lint does not catch a raw `px` in a CSS
  declaration nor a raw duration (analysis §3, gate note), so the L01
  judgement on this extraction stays human.
- Product-side, whatever the component is: the counters (`Q 01 / 08`, the
  serif `count/10`, `620 / 1000 XP`), the `Validated · saved locally`
  label, the readout sentence, the threshold logic, the `localStorage`
  persistence (manifest: state persistence is product), and every
  placement rule (`margin-bottom`, `flex: 1`, `align-self`, the showcase
  column) — the component fills the width it is given (manifest,
  "Placement and sizing of a library component in the page").
- The accessible name is product copy: the checklist's heading
  ("Am I ready to play ranked?", an `<h2>` with no `id` today —
  `components.jsx:350`) needs an `id` to be pointed at by `labelledBy`, or
  the mount passes a `label`. The value text is product copy too
  ("8 of 10 validated", "620 of 1000 XP", "Question 1 of 8").
- **Product defect, fixed in the adoption mission, not in the library**
  (§7 Q6): the quiz counter prints `index + 1` (`quiz-app.jsx:64`) while
  the bar fills `index / QZ_TOTAL` (`quiz-app.jsx:67`) — 0 % on question 1,
  never 100 %. At adoption the bar follows the counter: question 1 =
  1 / 8, question 8 = full, value text "Question 1 of 8".
- The adoption needs no new import shape: no library-internal dependency,
  no children.

---

## 3. API design

### 3.1 Properties

| Name         | Type     | Default | Required                      | Description                                                                                                                                                                                                       |
| ------------ | -------- | ------- | ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `value`      | `number` | —       | yes                           | How far the task has got, in the unit of `max`. Clamped to `[0, max]` for both the fill and `aria-valuenow`.                                                                                                      |
| `max`        | `number` | —       | yes                           | The total. No default: every measured usage has an explicit one (10 checklist items, 1000 XP, 8 questions). `aria-valuemin` is always `0`.                                                                        |
| `label`      | `string` | —       | one of `label` / `labelledBy` | Accessible name as text → `aria-label`. For a bar whose naming text is not on screen.                                                                                                                             |
| `labelledBy` | `string` | —       | one of `label` / `labelledBy` | Id of visible text that names the bar → `aria-labelledby`. Preferred when the heading or caption is already on screen.                                                                                            |
| `valueText`  | `string` | —       | yes                           | The value as a person says it → `aria-valuetext` ("8 of 10 validated", "Question 1 of 8"). Required on every bar (§7 checkpoint, « PB texte lu: Obligatoire »): a bare percentage is never what a person is told. |

Typed as a union so that exactly one of `label` / `labelledBy` is given
(`{ label: string; labelledBy?: never } | { labelledBy: string; label?: never }`
on top of the three shared props). No other prop (§7 Q2–Q5): no size, no
tone, no `decorative`, no animation flag, no `min`, no `as`, no
`className`, no children.

### 3.2 Slots / Children

None. The bar renders no text and takes no children: the visible counter
and caption next to it are the product's (§2.3).

### 3.3 Events / Callbacks

None. The ProgressBar is not interactive: no states, no handlers, nothing
focusable (§4.2). A value change is a re-render with a new `value`.

### 3.4 Rendering and behaviour

```html
<div
  class="ll-progress-bar"
  role="progressbar"
  aria-label="…"
  aria-valuemin="0"
  aria-valuemax="10"
  aria-valuenow="8"
  aria-valuetext="8 of 10 validated"
>
  <svg aria-hidden="true">
    <rect class="ll-progress-bar-fill" width="80%" height="100%"></rect>
  </svg>
</div>
```

Each rule is tagged by what enforces it — TEST (the component's suite),
GATE (a conformity gate), HUMAN (the reviewer or the visual checkpoint):

- Exactly one root `<div class="ll-progress-bar" role="progressbar">` carrying `aria-valuemin="0"`, `aria-valuemax={max}`, `aria-valuenow={clamped value}` and `aria-valuetext={valueText}`, always — TEST.
- Exactly one of `aria-label` / `aria-labelledby`, from `label` / `labelledBy`; never both, never neither — TEST (the type and the suite), GATE (accessibility engine: axe `aria-progressbar-name`, §4.3).
- `valueText` is required (§7 checkpoint, « PB texte lu: Obligatoire »): the type refuses a bar without it, and `aria-valuetext` is emitted on every render — TEST (the type and the suite).
- `value` below 0 renders 0, above `max` renders `max`, for the fill and for `aria-valuenow` alike — TEST.
- Exactly one child, an empty `<svg aria-hidden="true">` holding exactly one `<rect class="ll-progress-bar-fill" height="100%">` whose `width` **attribute** is `value / max` of the track as a percentage — never a `style` attribute (implementation detail, see below) — TEST, GATE (token lint on the source and on the generated docs page; docs smoke).
- `.ll-progress-bar`: `display: block; width: 100%; height: var(--ll-s-05); overflow: hidden; background: var(--ll-border-soft)` — its own `display` (the site's ranking bar was a `span` that only worked as a grid item; distribution contract, self-defensive base); `width: 100%` is its container's width and nothing more, so the bar also fills a flex row it is placed in (a block in a flex row otherwise shrinks to its content, which is nothing) — GATE (token lint), HUMAN (rendering).
- `.ll-progress-bar > svg`: `display: block; width: 100%; height: 100%` — without it an inline `<svg>` sits on a text baseline at its 300 × 150 default (no reset ships) — HUMAN.
- `.ll-progress-bar-fill`: `fill: var(--ll-accent)` — the accent follows the axis (`[data-accent]` / `[data-role]` on any ancestor) — GATE (token lint, contrast: one `ui-component` pair, §4.3), HUMAN.
- Square ends: no `border-radius` (the design language's square corners) — HUMAN.
- No `transition`, no `animation`, no keyframes: the fill takes its new length at once (§7 Q4). Nothing moves, so no `prefers-reduced-motion` guard is owed — HUMAN (the stylesheet is read).
- No margin, no width other than its container's, no alignment: the parent places the bar — HUMAN.
- A visible text counter sits beside every bar (§7 checkpoint, « PB fond: Accepte, compteur texte obligatoire en guideline »): the track keeps `border/soft`, whose end is not a 3:1 boundary (§4.3), so the proportion is always also printed as text. Product copy, product-side; a golden rule of the component's guidelines — HUMAN.

**Implementation detail — the fill is an SVG rect, not a styled div**
(implementation session, 2026-10-14; no API change, resolves open points 1
and 2). The docs generator renders every example as static markup, where
the draft's `style="width: …"` fill becomes a static inline style that the
token lint refuses (`inline-style-static`), and a stage holding only boxes
renders neither text nor a drawn mark, which the docs smoke gate refuses.
A `<rect>` whose length is its `width` attribute answers both: an SVG
attribute is not a style, and the rect is a drawn mark the smoke gate
counts. No gate was changed. Verified by the gates themselves: token lint
PASS on the generated page (no `style=` in it), docs smoke PASS; and by
injection, a fill forced to `0%` reds docs smoke on the demo stage and the
five accent tiles (restored, PASS again). The site's own technique (a
`%` width in an inline style) stays valid product-side; it is only the
library's static docs that rule it out.

### 3.5 Open points — for the orchestrator, not arbitrated

Found while drafting, after the batch answer (§7 Q1). Points 3 (value
text) and 4 (the track's end) were resolved at the checkpoint (§7) and
are folded into §3.1, §3.4 and §4; points 1 (the docs page and the token
lint) and 2 (the docs smoke gate) were solved by the implementation
without touching a gate (§3.4, implementation detail). The original
numbers are kept, because §7 cites them.

- **Point 5 — `max` ≤ 0 or a non-finite `value`.** Not covered by any answer.
  Proposal: the fill renders empty and `aria-valuenow` is `0`; or the
  component throws in development. The implementation follows the first
  proposal (`aria-valuemax` then reads `0`), locked by the local suite,
  until a ruling says otherwise.
- **Point 6 — Figma scope of the track colour.** `Semantic/border/soft` carries the
  `STROKE_COLOR` scope only (`tokens.json`), while the track is a fill.
  Whether the Figma component binds it to a fill as built, or the
  variable gains a fill scope (a token change under `token-approved`), is
  for the Figma checkpoint — no gate reads scopes against CSS properties.

---

## 4. Accessibility commitment

### 4.1 Semantic structure

A single `<div role="progressbar">` with an accessible name (from `label`
or `labelledBy`), `aria-valuemin="0"`, `aria-valuemax`, `aria-valuenow`
and `aria-valuetext` (required, §7 checkpoint). Every bar is announced, always — no
decorative mode (§7 Q5). The fill is an empty `aria-hidden` child (the
children of a `progressbar` are presentational in ARIA 1.2 anyway). No
live region: a value changes as the result of the user's own action (a
ticked item, a new question screen) and is read on request, not pushed.

`div` + role rather than a native `<progress>`: `<progress>` is styled
through engine-specific pseudo-elements (`::-webkit-progress-value`,
`::-moz-progress-bar`) and UA appearance, which the no-reset distribution
contract would have to neutralise per engine — an implementation proposal
from the usage analysis (its §7), recorded here for the reviewer.

### 4.2 Keyboard interaction

Nothing to do: a `progressbar` is not interactive and nothing is
focusable — no `a`, `button`, `input` or `tabindex` is rendered by the
component. The keyboard suite asserts it.

### 4.3 Component-specific decisions

- **First `ui-component` pair.** The fill against the track is a non-text
  contrast (WCAG 1.4.11, 3:1): `Semantic/accent/default` on
  `Semantic/border/soft`, usage `ui-component`, declared in
  `contrast-pairs.json` — the first pair at that level. Read in the code:
  the gate already has the 3:1 kind (`THRESHOLDS["ui-component"] = 3.0`,
  `scripts/lib/color.ts`; listed in the file's `$comment`),
  `check-contrast.ts` scores any declared usage, and `expandPairs`
  (`scripts/lib/contrast-axis.ts`) scores the pair once per accent; both
  tokens are opaque, so no `base`. Computed in this session by running
  those same functions from a scratch script — not the gate: ambre 6.48,
  bleu 6.01, jade 6.03, rouge 5.38, violet 4.97 — pass under all five. No
  unit test exercises the `ui-component` threshold today (the
  `contrast-axis` fixtures are all `normal-text`): the implementation
  proves the pair red by injection before relying on it (L10). Declared
  and proved 2026-10-14 by the implementation session: the gate scores the
  pair 6.48 / 6.01 / 5.38 / 4.97 / 6.03 (ambre, bleu, rouge, violet, jade);
  injected `Primitives/tier/iron` (2.18) → FAIL "needs 3 (ui-component)";
  injected `Semantic/fg/mute` (4.32) → PASS at `ui-component`, FAIL at
  `normal-text` (4.5) — the 3.0 threshold is the one applied.
- **The track against the page is not scored** (1.14:1 on
  `surface/default`, 1.30:1 on `bg/default`, computed the same way): the
  fill's length is legible, the total length is not. Accepted at the
  checkpoint (§7, « PB fond: Accepte, compteur texte obligatoire en
  guideline »): the track keeps `border/soft`, and a guideline requires a
  visible text counter beside every bar, so the bar is never the only
  carrier of the value.
- **The name is enforced twice.** axe's `aria-progressbar-name` carries
  the `wcag2a` tag in the installed axe-core 4.13.0, so the gate's
  `WCAG_TAGS` select it. Probed with the gate's own `runAxe` in fragment
  mode from a scratch script (an injection, not a gate verdict): a nameless
  bar → `aria-progressbar-name` violation; `aria-label` or a resolving
  `aria-labelledby` → none; a dangling `aria-labelledby` →
  `aria-progressbar-name`; `aria-valuenow="abc"` →
  `aria-valid-attr-value`. The implementation locks the rule id (L10).
- **One tone, the accent; no mute** (§7 Q3). The ranking's grey fill
  (`fg/mute` at .45 on `border/soft`, 1.95:1) fails 3:1 and is not part of
  the component.
- **The value is read twice on the checklist** (the visible `count/10`,
  then the bar): accepted at §7 Q5.
- **The quiz value text follows the visible counter** — "Question 1 of
  8" with the bar at 1 / 8 — once the product defect is fixed in the
  adoption mission (§7 Q6).

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

| Date       | Question (as asked)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | Decision (verbatim)                                                                                                                                                                                                                                                                                                                                           | Decided by       |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------- |
| 2026-10-13 | Lot selection — « Quels composants entrent dans le premier lot traité en parallèle ? (fixer les priorités, c'est ton verrou) » [multi-select; options: « MetaStrip » — 10 pages, 5 copies CSS. Statique, 3 valeurs visuelles à trancher. / « Breadcrumb » — 7 pages, 3 versions. Presque rien à arbitrer, gros gain d'accessibilité. / « ProgressBar » — 6 pages, 3 hauteurs. Arbitrer la hauteur et le ton (accent / atténué). / « SectionHead » — 52 occurrences, 4 versions. Arbitrer la mise en page (numéro au-dessus ou à côté).]                                                                                                                                                                                                                                        | « MetaStrip,ProgressBar,SectionHead » [priority and merge order set in the same batch form: « MetaStrip → ProgressBar → SectionHead (rec.) », answered with the batch defaults]                                                                                                                                                                               | Louis Tinthilier |
| 2026-10-13 | Q1 — « Go / no-go et périmètre : quelles barres le composant remplace-t-il ? » Options: (a) « STOP — les trois recettes restent dans le site. »; (b) « (Recommandé) Un composant `ProgressBar` pour les barres de progression seulement (checklist des 5 guides, vitrine DS, en-tête du quiz) ; les barres du classement du quiz restent côté produit. »; (c) « Deux composants : `ProgressBar` et `Meter` (même apparence, rôle différent). »; (d) « Un seul composant pour tout, avec une option « progression / mesure ». » Consequences as written in `process/archives/2026-10-13-progressbar-usage-analysis.md`, "Questions fermées". Asked with Q2–Q8 and the MetaStrip and SectionHead questions in one batch form (lot 1), whose labels shortened the same questions. | « Arbitrage du lot 1 — proceeding with defaults. » — one gesture for the whole batch form, taken as the recommended option of every question: here (b), one `ProgressBar` for the progress usages only (role checklist ×5 pages, DS showcase XP rail, quiz header); the quiz result ranking stays product-side. The Figma visual checkpoint is still to come. | Louis Tinthilier |
| 2026-10-13 | Q2 — « Combien d'épaisseurs ? (le site en a trois : 2px quiz, 4px checklist, 6px classement) » Options: (a) « (Recommandé) Une seule : 4px (`Spacing/s-05`, existe déjà). »; (b) « Deux : 4px et 2px. »; (c) « Trois : 2, 4 et 6px. »; (d) « Aucune imposée : l'épaisseur est réglée par le produit. »                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | recommended option (batch answer, see Q1): (a) — one height, 4px (`Spacing/s-05`).                                                                                                                                                                                                                                                                            | Louis Tinthilier |
| 2026-10-13 | Q3 — « Faut-il une teinte atténuée (le gris des rôles non gagnants du classement) ? » (sans objet si Q1 = b) Options: (a) « (Recommandé) Non : le remplissage est toujours à la couleur d'accent. »; (b) « Oui, `fg/mute` opaque (sans transparence). »; (c) « Oui, `fg/mute` à 45 % comme aujourd'hui. »                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | recommended option (batch answer, see Q1): (a) — the fill is always accent, no muted tone.                                                                                                                                                                                                                                                                    | Louis Tinthilier |
| 2026-10-13 | Q4 — « L'animation : dans la bibliothèque ou côté produit ? » Options: (a) « (Recommandé) Pas d'animation en v1 : la barre change de longueur instantanément. »; (b) « La bibliothèque anime le changement de valeur, et se coupe automatiquement si l'utilisateur demande moins d'animations. »; (c) « La bibliothèque propose en plus une apparition progressive au chargement (celle du classement, 0,7 s), le décalage entre lignes restant au produit. »                                                                                                                                                                                                                                                                                                                  | recommended option (batch answer, see Q1): (a) — no animation in v1; motion tokens are a system-wide decision, out of scope.                                                                                                                                                                                                                                  | Louis Tinthilier |
| 2026-10-13 | Q5 — « La barre s'annonce-t-elle toujours aux lecteurs d'écran ? » Options: (a) « (Recommandé) Toujours : rôle « barre de progression », nom obligatoire, valeur lue en clair (« 8 sur 10 validés »). »; (b) « Toujours, sauf une option « décorative » qui la masque quand le texte voisin dit déjà tout. »                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | recommended option (batch answer, see Q1): (a) — always announced: `role="progressbar"`, accessible name required (`label` or `labelledBy`), readable value text.                                                                                                                                                                                             | Louis Tinthilier |
| 2026-10-13 | Q6 — « Le quiz : que doit montrer la barre ? (défaut produit à corriger dans le site, pas dans la bibliothèque) » « Aujourd'hui le compteur dit « Q 01 / 08 » pendant que la barre est vide, et la barre n'atteint jamais 100 %. » Options: (a) « (Recommandé) La barre suit le compteur : question 1 = 1/8, question 8 = plein. »; (b) « La barre compte les réponses données : question 1 = vide, et le compteur change de libellé (« 0 répondue sur 8 »). »; (c) « Ne rien changer. »                                                                                                                                                                                                                                                                                       | recommended option (batch answer, see Q1): (a) — the bar follows the counter (Q1 = 1/8); a product fix done during the adoption mission, not in the library.                                                                                                                                                                                                  | Louis Tinthilier |
| 2026-10-13 | Q7 — « Le jeu de composants Figma (obligatoire avant le RFC, aucun n'existe à notre connaissance) » Options: (a) « (Recommandé) Une session agent le construit dans le fichier `Lib` à partir des réponses ci-dessus (variables liées, pas de valeurs en dur), puis tu le valides en checkpoint. »; (b) « Tu le construis toi-même. »; (c) « Page de docs Figma en plus du jeu de composants. »                                                                                                                                                                                                                                                                                                                                                                                | recommended option (batch answer, see Q1): (a) — the Figma component is built by an agent and validated by the design lead (being built 2026-10-13, page `ProgressBar`; checkpoint to come).                                                                                                                                                                  | Louis Tinthilier |
| 2026-10-13 | Q8 — « Priorité dans le registre (si Q1 n'est pas STOP) » Options: (a) « (Recommandé) Priorité 5, le prochain composant après le Sigil. »; (b) « Plus tard, derrière un autre candidat que tu nommes. »                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | recommended option (batch answer, see Q1): priority 6 — merge order MetaStrip → ProgressBar → SectionHead. [The analysis's option (a) reads « Priorité 5 »; the rank 6 is the lot's order as relayed by the orchestrator, MetaStrip taking 5 — the batch form's label for this question was not relayed to this session.]                                     | Louis Tinthilier |
| 2026-10-13 | Checkpoint — « Le rendu des 3 composants (Figma 106:29, 106:31, 106:34) : validé ? » [options: « Validé tel quel » / « À corriger »; shown with a dark-background preview of the three components as built, one batch form for the lot]                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | « Checkpoint du lot 1 — Rendu: Valide tel quel · SH ecart colonnes: 32 px s-4 (site) · SH mobile: Creer un point de rupture Figma · MS ecart lignes: 24 px (meme gap) · PB fond: Accepte, compteur texte obligatoire en guideline · PB texte lu: Obligatoire · Eyebrow description: Agent corrige »                                                           | Louis Tinthilier |
| 2026-10-13 | Checkpoint — « ProgressBar · le fond vide de la barre est très discret (1,14:1 sur la surface). Les 3 usages affichent déjà le compteur en texte. » [options: « Accepté, avec la règle « toujours un compteur texte à côté » (rec.) » / « Rendre le fond plus visible »; raised by the RFC draft, §3.5 point 4]                                                                                                                                                                                                                                                                                                                                                                                                                                                                | « Accepte, compteur texte obligatoire en guideline » [the track keeps `border/soft`; a guideline requires a visible text counter beside every bar; batch answer, see the checkpoint row]                                                                                                                                                                      | Louis Tinthilier |
| 2026-10-13 | Checkpoint — « ProgressBar · le texte lu par le lecteur d'écran (« 8 sur 10 validés ») » [options: « Optionnel, par défaut « 8 sur 10 » (rec.) » / « Obligatoire à chaque usage »; raised by the RFC draft, §3.5 point 3]                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | « Obligatoire » [`valueText` becomes a required prop — reverses the recommendation; batch answer, see the checkpoint row]                                                                                                                                                                                                                                     | Louis Tinthilier |
| 2026-10-13 | Approval — asked after the checkpoint with a one-line API summary per RFC and the full drafts linked: « Pour approuver, réponds simplement « RFC MetaStrip, ProgressBar, SectionHead approuvées » »; announced: each implementing agent first aligns the RFC body on the checkpoint answers (no new arbitration). Approval is the design lead's lock: an attestation, not a computation.                                                                                                                                                                                                                                                                                                                                                                                       | « RFC MetaStrip, ProgressBar, SectionHead approuvées » — Status set to `approved`; §6 stays for the ratification at adoption.                                                                                                                                                                                                                                 | Louis Tinthilier |
