# Usage analysis — the site's progress bars — 2026-10-13

Measured on the LearningLeagues checkout at `main` f6066ab (`HEAD` =
`origin/main` = f6066ab, tree clean, branch `main` — L09; read-only, no
fetch run in this session, the parent session verified the remote) against
the library at `main` dc9945b. Before any RFC or Figma work. Purpose: decide
whether a fifth candidate, **ProgressBar**, is a component at all, and which
of the site's bars it would cover. Same convention as the Eyebrow and the
Sigil: usage analysis FIRST, then Louis chooses
(`process/PROJECT-CONTEXT.md`, Design source, addendum 2026-09-16).

Method: `git ls-files` (vendored `lib/` and `docs/` plans excluded) grepped
for `progress`, `meter`, `aria-value`, `-bar`, `-fill`, `scaleX`, `track`
and percentage inline widths; every hit read in its file. Everything below
is read from source — **no page was rendered in a browser this session**;
the motion findings in §5 are source reasoning, to be confirmed at the
visual checkpoint.

## 1. What the site calls a progress bar

**4 mount points in 3 JSX files, 3 CSS recipes in 2 stylesheets**, rendered
on **7 pages** (the 5 role guides, Quiz, DesignSystem) — **12 rendered
bars** at most. All 7 pages already load `lib/ll-lib.{css,jsx}` (no L11
risk). The object: a thin `--border-soft` track holding an absolutely
positioned fill whose width is an inline percentage.

| Mount (file:line)                       | Recipe (stylesheet:lines)                            | Pages rendered                              | Bars per page                                       | Value shown                                                                    | Text nearby                                                                                                   |
| --------------------------------------- | ---------------------------------------------------- | ------------------------------------------- | --------------------------------------------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------- |
| `role-sections.jsx:392-394` (`SectionChecklist`) | `.progress-bar` / `-fill`, `styles.css:1142-1153`    | Top, Jungle, Mid, ADC, Support              | 1 (10 items each, threshold 8 — `role-*.jsx`)      | `count / items.length` — 0 % to 100 % in 10 % steps, persisted in `localStorage` | big serif `count/10` above (`.progress-num`), `Validated · saved locally`, readout "N more points…" / "Threshold reached" |
| `ds-components.jsx:240` (`ChartsShowcase`, block "PROGRESS · BAR — XP rail") | same `.progress-bar` / `-fill` (`styles.css` is loaded by DesignSystem) | DesignSystem (showcase)                     | 1                                                   | static `62%`                                                                   | `LVL 14` · `620 / 1000 XP` (`.ds-progress-meta`) — note 620/1000 renders as 62 %, consistent                  |
| `quiz-app.jsx:66-68` (`QzProgress`)     | `.qz-progress-bar` / `-fill`, `quiz.css:102-112`     | Quiz (question screen, 8 screens)           | 1                                                   | `index / QZ_TOTAL` (`QZ_TOTAL` = 8) — **see §6**                              | counter `Q 01 / 08` (`index + 1`) to its left, `← Back` to its right                                          |
| `quiz-app.jsx:132-137` (`QzResult` ranking) | `.qz-rank-bar-wrap` / `.qz-rank-bar`, `quiz.css:318-328` | Quiz (result screen)                        | 5 (one per role, always 5) — **hidden under 640px** (`quiz.css:307`) | `score / max(1, leader score)` — the leader is always 100 % (unless every score is 0) | position `01`–`05`, role icon, role name, `N PTS` in the same row                                             |

Shared by the three recipes, verbatim: a track with `background:
var(--border-soft); position: relative;` and a fill with `position:
absolute; left: 0; top: 0; bottom: 0;`, square ends (no radius, the design
language's square corners), width driven by an inline `style={{ width:
`${…}%` }}`. **None carries `role="progressbar"`, `role="meter"`, a native
`<progress>` / `<meter>`, or any `aria-value*`** — the bars are invisible to
assistive technology as values (they are plain `div` / `span`, not hidden
either).

Not progress bars, set aside after reading: `.ds-bar-chart` /
`.ds-bar-fill` (vertical bar chart in the showcase, `ds-components.jsx:276-288`
— a chart, not a single value), `.ds-spacing-bar` (spacing specimen),
`.ds-toggle-track` (a switch).

## 2. Where the recipes diverge

| Property               | `.progress-bar` (2 mounts, 6 pages)        | `.qz-progress-bar` (1 mount)                          | `.qz-rank-bar` (1 mount, 5 bars)                                                       | Verdict                                                                                                  |
| ---------------------- | ------------------------------------------ | ----------------------------------------------------- | -------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Height                 | 4px                                        | 2px                                                   | 6px                                                                                    | **design arbitration** — three heights for one object; only 4px has a token (§3)                         |
| Fill tone              | `--accent`                                 | `--accent`                                            | `--fg-mute` at opacity .45; the leader row `--accent`, opacity 1                       | **design arbitration** — the muted tone exists on one mount only and has no token                       |
| Motion                 | `transition: width .3s cubic-bezier(.3,.7,.4,1)` | `transition: width .35s cubic-bezier(.3,.7,.4,1)` — inert in practice (§5) | `animation: qz-bar .7s cubic-bezier(.3,.7,.3,1) both` (`scaleX(0)` → `scaleX(1)`, `transform-origin: left center`), inline `animationDelay: i * 90ms` | **design arbitration** — three durations, two easings, two techniques; no motion token exists           |
| Reduced motion         | no guard                                   | no guard (only the screen fade is guarded, `quiz.css:42-44`) | guarded: `animation: none` (`quiz.css:328`)                                            | library obligation if motion ships (§5)                                                                  |
| Overflow               | `hidden`                                   | none                                                  | `hidden`                                                                               | structural — the component sets `overflow: hidden` (harmless at ≤ 100 %, required for a `scaleX` fill)   |
| Responsive             | —                                          | —                                                     | `display: none` under 640px                                                            | product-side (the row's layout decides)                                                                  |
| Placement              | `margin-bottom: calc(var(--s) * 2)` in a sticky panel; flex column `gap: 10px` in the showcase | `flex: 1; align-self: center` inside a flex row       | a `1fr` grid column of `.qz-rank-row`                                                  | product-side: the component fills the width it is given (manifest, responsibility split)                 |
| Element                | `div` / `div`                              | `div` / `div`                                         | `span` / `span` — sized only because a grid item is blockified                         | the component sets its own `display` (self-defensive, distribution contract)                             |

## 3. Every property against the library tokens (L01)

Each raw value is either mapped to an existing `--ll-*` token or flagged as a
design gap — none is copied. Token names verified in
`packages/ui/src/tokens/tokens.css` (dc9945b). **No motion token exists at
all** (no duration, no easing variable in `tokens.json`); the only opacity
token is `--ll-opacity-ornament` (0.25).

### 3.1 `.progress-bar` / `.progress-bar-fill` (`styles.css:1142-1153`)

| Property                                | Site value                       | Library                                                                                                                       |
| --------------------------------------- | -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| track `height`                          | `4px`                            | `--ll-s-05` (4px; `Spacing/s-05` carries the `WIDTH_HEIGHT` scope, so it binds to a height in Figma; precedent: the Sigil's ring insets are spacing tokens) |
| track `background`                      | `var(--border-soft)` `#1a2540`   | `--ll-border-soft` (`Semantic/border/soft`, same value)                                                                       |
| track `position: relative`, `overflow: hidden` | structural                 | structural, no value                                                                                                          |
| track `margin-bottom`                   | `calc(var(--s) * 2)` = 16px      | `--ll-s-2` exists, but **product-side** placement — does not enter the component                                              |
| fill `position: absolute; left/top/bottom: 0` | structural                 | structural                                                                                                                    |
| fill `background`                       | `var(--accent)`                  | `--ll-accent` (follows `[data-accent]` / `[data-role]`)                                                                       |
| fill `transition` duration              | `.3s`                            | **DESIGN GAP: no token.** Nearest: none (the Button's `0.18s` in `button.css` is a raw value, not a token)                    |
| fill `transition` easing                | `cubic-bezier(.3,.7,.4,1)`       | **DESIGN GAP: no token.** Nearest: none                                                                                       |
| fill `width`                            | inline `%`                       | the value — data, not design                                                                                                  |

### 3.2 `.qz-progress-bar` / `.qz-progress-fill` (`quiz.css:102-112`)

| Property                    | Site value                  | Library                                                                                                                                                             |
| --------------------------- | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| track `height`              | `2px`                       | **DESIGN GAP: no token** — the spacing ladder starts at `--ll-s-05` (4px). Nearest: `--ll-s-05`. (The Button's 2px focus ring is declared "fixed ornament geometry" in `button.css`, not a token — a precedent for geometry, not for a themable size.) |
| track `background`          | `var(--border-soft)`        | `--ll-border-soft`                                                                                                                                                  |
| track `flex: 1; align-self: center` | layout              | product-side                                                                                                                                                        |
| track `overflow`            | (none)                      | —                                                                                                                                                                   |
| fill `background`           | `var(--accent)`             | `--ll-accent`                                                                                                                                                       |
| fill `transition`           | `width .35s cubic-bezier(.3,.7,.4,1)` | **DESIGN GAP: no token** (duration and easing); `.35s` ≠ the checklist's `.3s`                                                                                      |

### 3.3 `.qz-rank-bar-wrap` / `.qz-rank-bar` (`quiz.css:318-328`)

| Property                         | Site value                                   | Library                                                                                                                                                                 |
| -------------------------------- | -------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| track `height`                   | `6px`                                        | **DESIGN GAP: no token** — between `--ll-s-05` (4) and `--ll-s-1` (8). Nearest: `--ll-s-05`                                                                             |
| track `background`               | `var(--border-soft)`                         | `--ll-border-soft`                                                                                                                                                      |
| track `position`, `overflow`     | structural                                   | structural                                                                                                                                                              |
| track `display: none` < 640px    | responsive                                   | product-side                                                                                                                                                            |
| fill `background` (non-leader)   | `var(--fg-mute)`                             | `--ll-fg-mute` — **value drift**: the site's `--fg-mute` is `#6e7a94`, the library's is `#7d89a3` (contrast arbitration 2026-08-12, `PROVENANCE.md:99`); adoption lightens it |
| fill `opacity` (non-leader)      | `.45`                                        | **DESIGN GAP: no token.** Nearest: `--ll-opacity-ornament` (0.25) — a different value and a different meaning (decorative ornament), not a match                       |
| fill leader                      | `background: var(--accent); opacity: 1`      | `--ll-accent`                                                                                                                                                           |
| fill `transform-origin: left center`, keyframes `scaleX(0)` → `scaleX(1)` | structural          | structural                                                                                                                                                              |
| fill `animation` duration        | `.7s`                                        | **DESIGN GAP: no token**                                                                                                                                                |
| fill `animation` easing          | `cubic-bezier(.3,.7,.3,1)`                   | **DESIGN GAP: no token** — differs from the other two by one coordinate (`.3` vs `.4`)                                                                                   |
| fill `animation-delay` (inline)  | `i * 90ms`                                   | product choreography (row index); **DESIGN GAP: no token** if the library ever owned it                                                                                  |
| reduced-motion guard             | `animation: none`                            | a library obligation if motion ships (§5)                                                                                                                               |

Gap tally: heights 2px and 6px; opacity .45; durations .3s / .35s / .7s;
easings `(.3,.7,.4,1)` / `(.3,.7,.3,1)`; stagger 90ms. **A ProgressBar built
on the checklist recipe alone, without motion, has zero gaps** (`--ll-s-05`,
`--ll-border-soft`, `--ll-accent`).

Gate note: `pnpm gate:lint-tokens` (`scripts/lib/detectors.ts`) detects raw
colours, arbitrary `[Npx]` classes, malformed `var()` and static inline
styles — **not raw `px` in a CSS declaration nor a raw duration**. A `2px`,
`6px`, `.45` or `.3s` copied into a component's CSS would pass green; the
L01 judgement on this extraction stays human. The inline fill value is
dynamic (`${…}`), which the static-inline-style detector already exempts.

## 4. Semantics — progress, measurement or decoration

HTML separates the two: `<progress>` / `role="progressbar"` for how far a
task has got, `<meter>` / `role="meter"` for a scalar inside a known range
(the HTML spec says `<meter>` must not be used for progress). Both need an
accessible name; both take `aria-valuetext` when the raw number is not what
a person says.

| Usage                          | Reading                                                                                                                                                       | Element                                                     | Accessible name (candidates — product copy, the product decides)                                                                                  | Value text                                       |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| Role checklist                 | progress toward a goal (points validated out of 10, readiness at 8). Can go down (unticking) — allowed for a progressbar, it is not monotonic by definition. | `role="progressbar"` (or `<progress>`)                      | the section heading "Am I ready to play ranked?" (an `<h2>` with no `id` today — `components.jsx:350`) or the visible `Validated · saved locally` | "8 of 10 validated"                              |
| DS "XP rail"                   | progress toward the next level                                                                                                                                | `role="progressbar"`                                        | "XP" / "Level 14 progress" (showcase specimen)                                                                                                    | "620 of 1000 XP"                                 |
| Quiz header                    | position in a sequence — the textbook progressbar                                                                                                             | `role="progressbar"`                                        | "Quiz progress"                                                                                                                                   | "Question 1 of 8" — must match the counter (§6)  |
| Quiz ranking (5 rows)          | a score relative to the leader — a **measurement**, not progress                                                                                              | `role="meter"` (or `<meter>`) — or decorative                | the row's role name ("Top", …)                                                                                                                    | "12 points"                                      |

The ranking bar is the one usage that can honestly be **decorative**
(`aria-hidden="true"`): the same row already says the value in text
(`N PTS`), the leader is already marked four other ways (position, name,
score and icon colour), and the site already drops the bar under 640px
without losing information. The checklist and the showcase also print
their value next to the bar (`count/10`, `620 / 1000 XP`); a progressbar
there duplicates the text mildly but gives the value a role and a name —
the manifest puts accessibility semantics on the library side
("The component emits its semantics").

Non-text contrast (WCAG 1.4.11, 3:1 for the parts needed to read the
value), computed by hand in this session with the WCAG formula — **not by
the gate**:

| Pair                                         | Ratio                                                             |
| -------------------------------------------- | ----------------------------------------------------------------- |
| `--ll-accent` fill on `--ll-border-soft` track | ambre 6.48, bleu 6.01, jade 6.03, rouge 5.38, violet **4.97** — pass under all five |
| `--ll-fg-mute` at .45 on `--ll-border-soft`  | **1.95** (library value; 1.75 with the site's older `#6e7a94`) — **fails 3:1** unless the bar is decorative |
| `--ll-fg-mute` opaque on `--ll-border-soft`  | 4.32 — passes                                                     |
| `--ll-border-soft` track on `--ll-surface` / `--ll-bg` | 1.14 / 1.30 — the empty track is near invisible; acceptable only because the fill carries the value |

`contrast-pairs.json` already defines a `ui-component` level (3.0) but
**declares no pair at that level yet**: ProgressBar would be the first
(`Semantic/accent/default` on `Semantic/border/soft`, expanded per accent by
the gate). A fill at an opacity cannot be declared as a pair (the gate
composites a semi-transparent `bg` over a `base`, not a translucent `fg`)
— a muted tone would need an opaque token or an alpha primitive.

Engine coverage: axe ships name rules for both roles
(`aria-progressbar-name`, `aria-meter-name`); whether they run under the
gate's WCAG tag set is **unverified** — per L10 it is proved by injection
before the RFC relies on it.

## 5. Motion and `prefers-reduced-motion`

- **Checklist** — the fill element persists across ticks, so the `.3s`
  width transition plays on every toggle; on page load the stored count
  renders at once (no transition on first paint). No reduced-motion guard.
- **Quiz header** — the `.35s` transition is very likely **dead code**: the
  question screen is keyed `q-${index}` (`quiz-app.jsx:221`, `:229`), so
  `QzProgress` is remounted on every question and a CSS transition never
  runs on an element's first paint. The bar arrives at its new width inside
  the screen's own fade (`qz-in .32s`, guarded under reduced motion).
  Source reasoning — to confirm in a browser at the checkpoint.
- **Ranking** — the only bar with a grow-in on mount (`scaleX` 0 → 1,
  `.7s`, `both`, staggered 90ms per row) and the only one with a
  reduced-motion guard.
- A `width` transition animates layout; a `transform: scaleX()` fill is the
  compositor-friendly equivalent and is what the ranking already uses.
- If the library ships any motion, it ships the reduced-motion guard with
  it (`@media (prefers-reduced-motion: reduce)` → none) — today no library
  component has one (`grep` over `packages/ui/src/components/**/*.css`: the
  Button's colour transition is not motion in the WCAG 2.3.3 sense). The
  durations and easings are design gaps (§3); motion tokens would be a
  system-wide decision (the Button's raw `0.18s` would fall under it too),
  bigger than this component.
- The stagger (`i * 90ms`) is choreography of a list the product owns;
  whatever the library does, the delay stays product-side.

## 6. Product-side, and one product defect to report

Stays in the product whatever ProgressBar becomes: the counters
(`Q 01 / 08`, the serif `count/10`, `620 / 1000 XP`), the
`Validated · saved locally` label and the readout sentence, the threshold
logic, `localStorage` persistence (manifest: state persistence is product),
the ranking row (`.qz-rank-row` grid: position, icon, name, bar column,
score; leader styling of the other cells), the 640px hide, the stagger, and
every placement rule (`margin-bottom`, `flex: 1`, `align-self`, the
`.ds-progress-demo` column). The `.checklist-progress` sticky panel is
layout, not part of the bar.

**Defect to report — not to fix in this mission (product repository,
human lock):** the quiz bar and the quiz counter disagree.
`quiz-app.jsx:64` prints `index + 1` ("Q 01 / 08") while
`quiz-app.jsx:67` fills `index / QZ_TOTAL`: **0 % on question 1**, 87.5 %
on question 8, and 100 % is never drawn (the result screen has no bar).
The bar reads "answered so far", the counter "current question" — both are
defensible, but not together; and once the bar carries a `progressbar`
role its value text must say one or the other. No intent is recorded in the
site's quiz spec (`docs/superpowers/specs/2026-07-08-role-quiz-integration-design.md:24`
says only "progress bar"). Louis decides (question Q6).

## 7. Draft API (a proposal — the API is Louis's to arbitrate)

```tsx
<ProgressBar
  value={count}            // number, required — clamped to [0, max]
  max={items.length}       // number, required — every site usage has an explicit total
  label="…"                // string — accessible name (aria-label); or
  labelledBy="heading-id"  // string — points at visible text (aria-labelledby); one of the two required
  valueText="8 of 10 validated" // string, optional — aria-valuetext
/>
```

- Renders `<div class="ll-progress-bar" role="progressbar" aria-valuemin="0"
  aria-valuemax={max} aria-valuenow={value}>` holding one `aria-hidden` fill;
  the fill's extent is an inline dynamic value (a `scaleX` ratio or a
  custom property), never a static style. `div` + role rather than native
  `<progress>`: `<progress>` styles through vendor pseudo-elements
  (`::-webkit-progress-value`, `::-moz-progress-bar`) and UA appearance,
  which the no-reset distribution contract would have to neutralise per
  engine — an implementation proposal, recorded in the RFC.
- Fills the width it is given, ships no margin, sets its own `display:
  block` (the ranking's `span` only worked as a grid item).
- Tokens: `--ll-s-05`, `--ll-border-soft`, `--ll-accent`. Nothing else
  unless an answer below adds it.
- Conditional on the answers: `tone?: "accent" | "mute"` (Q3), a size prop
  (Q2), `decorative?: boolean` → `aria-hidden` (Q5), motion (Q4). A
  `Meter` (role `meter`, same chrome) only if Q1 says so.
- No Figma component set exists for it as far as the manifest and the last
  recorded inventory show (not re-checked: no Figma call in this session);
  the set is the one mandatory Figma object before the RFC.

## 8. Conclusion

- **One object, three recipes, 4 mounts, 7 pages, up to 12 bars.** The
  three agree on the track colour, the accent fill, the square ends and the
  absolute fill; they disagree on height (2/4/6), tone (one muted usage),
  and motion (three durations, two easings, two techniques).
- **The checklist recipe is extractable with zero design gaps** and covers
  6 of the 7 pages. Every gap in this analysis comes from the two quiz
  bars, and most from the ranking alone (6px, mute at .45, `.7s`, its
  easing, the stagger).
- **Two semantics are mixed**: three usages are progress, the ranking is a
  measurement that can be decorative. No bar is announced today.
- **Promotion criterion 4** (a consuming product with a confirmed use case)
  is met before the RFC for the progress usages.
- Doctrine gap to flag (not filled here): `process/ORCHESTRATION.md` has no
  trigger for "you are starting a component candidate's usage analysis",
  although `PROJECT-CONTEXT.md` (addendum 2026-09-16) makes it mandatory.

## Questions fermées pour le design lead

Chaque question se tranche indépendamment ; les questions 2 à 5 dépendent du
périmètre choisi en Q1.

**Q1 — Go / no-go et périmètre : quelles barres le composant remplace-t-il ?**

- (a) STOP — les trois recettes restent dans le site. Conséquence : rien ne
  change, les barres restent muettes pour les lecteurs d'écran.
- (b) **(Recommandé)** Un composant `ProgressBar` pour les barres de
  progression seulement (checklist des 5 guides, vitrine DS, en-tête du
  quiz) ; les barres du classement du quiz restent côté produit.
  Conséquence : 6 des 7 pages couvertes, aucun écart de design côté
  checklist ; le classement garde ses valeurs propres au site. Pourquoi :
  le classement est une mesure, pas une progression, et concentre à lui
  seul presque tous les écarts (6px, gris à 45 %, animation) pour un seul
  écran.
- (c) Deux composants : `ProgressBar` et `Meter` (même apparence, rôle
  différent). Conséquence : le classement est couvert aussi, mais il faut
  trancher la teinte grise et la hauteur 6px dès maintenant, et construire
  deux jeux de composants Figma.
- (d) Un seul composant pour tout, avec une option « progression / mesure ».
  Conséquence : une seule pièce à maintenir, mais une API qui mélange deux
  sens différents pour les lecteurs d'écran.

**Q2 — Combien d'épaisseurs ? (le site en a trois : 2px quiz, 4px checklist, 6px classement)**

- (a) **(Recommandé)** Une seule : 4px (`Spacing/s-05`, existe déjà).
  Conséquence : aucune nouvelle variable Figma ; la barre du quiz
  s'épaissit (2 → 4px), visible au checkpoint visuel. Pourquoi : c'est la
  seule épaisseur qui a déjà un token, et elle couvre 6 pages sur 7.
- (b) Deux : 4px et 2px. Conséquence : une nouvelle variable Figma à créer
  pour 2px (la grille d'espacement commence à 4), le quiz garde son trait
  fin.
- (c) Trois : 2, 4 et 6px. Conséquence : deux nouvelles variables Figma
  (2 et 6), utile seulement si le classement entre dans le périmètre (Q1 c
  ou d).
- (d) Aucune imposée : l'épaisseur est réglée par le produit. Conséquence :
  le composant ne garantit plus son apparence — contraire à la règle « le
  produit choisit des tokens, pas des valeurs ».

**Q3 — Faut-il une teinte atténuée (le gris des rôles non gagnants du classement) ?** (sans objet si Q1 = b)

- (a) **(Recommandé)** Non : le remplissage est toujours à la couleur
  d'accent. Conséquence : zéro écart ; si le classement entre un jour, le
  gagnant se distingue déjà par sa position, son nom, son score et son
  icône. Pourquoi : un seul écran utilise le gris, et sous sa forme
  actuelle il est presque invisible (contraste 1,95:1, sous le seuil de
  3:1).
- (b) Oui, `fg/mute` opaque (sans transparence). Conséquence : token
  existant, contraste 4,32:1 conforme ; les barres grises deviennent
  nettement plus claires qu'aujourd'hui.
- (c) Oui, `fg/mute` à 45 % comme aujourd'hui. Conséquence : une nouvelle
  variable d'opacité à créer dans Figma ; la barre doit alors être
  décorative (masquée aux lecteurs d'écran), car elle échoue au contraste.

**Q4 — L'animation : dans la bibliothèque ou côté produit ?**

- (a) **(Recommandé)** Pas d'animation en v1 : la barre change de longueur
  instantanément. Conséquence : aucune durée ni courbe à inventer (aucun
  token de mouvement n'existe), rien à couper pour « réduire les
  animations » ; la checklist perd son glissement de 0,3 s au clic — à
  juger au checkpoint. Pourquoi : la transition du quiz ne joue déjà pas
  (l'écran est reconstruit à chaque question), il ne reste qu'un usage
  animé ; les tokens de mouvement sont une décision pour tout le système
  (le bouton a déjà une durée en dur), pas pour ce seul composant.
- (b) La bibliothèque anime le changement de valeur, et se coupe
  automatiquement si l'utilisateur demande moins d'animations.
  Conséquence : il faut d'abord créer dans Figma des variables de durée et
  de courbe (aujourd'hui 0,3 s / 0,35 s, deux courbes) et en choisir une.
- (c) La bibliothèque propose en plus une apparition progressive au
  chargement (celle du classement, 0,7 s), le décalage entre lignes restant
  au produit. Conséquence : utile seulement si le classement entre dans le
  périmètre ; ajoute une option et une durée de plus à créer.

**Q5 — La barre s'annonce-t-elle toujours aux lecteurs d'écran ?**

- (a) **(Recommandé)** Toujours : rôle « barre de progression », nom
  obligatoire, valeur lue en clair (« 8 sur 10 validés »). Conséquence :
  une seule règle, vérifiable par la porte d'accessibilité ; le chiffre
  affiché à côté est lu deux fois sur la checklist, ce qui reste
  acceptable.
- (b) Toujours, sauf une option « décorative » qui la masque quand le texte
  voisin dit déjà tout. Conséquence : nécessaire si le classement entre
  dans le périmètre ; risque qu'un produit masque une barre qui était la
  seule information.

**Q6 — Le quiz : que doit montrer la barre ? (défaut produit à corriger dans le site, pas dans la bibliothèque)**

Aujourd'hui le compteur dit « Q 01 / 08 » pendant que la barre est vide, et
la barre n'atteint jamais 100 %.

- (a) **(Recommandé)** La barre suit le compteur : question 1 = 1/8,
  question 8 = plein. Conséquence : ce qu'on voit et ce que lit le lecteur
  d'écran (« Question 1 sur 8 ») disent la même chose ; correctif d'une
  ligne dans le site, lors d'une mission produit. Pourquoi : le compteur
  est le texte visible, la barre doit le confirmer.
- (b) La barre compte les réponses données : question 1 = vide, et le
  compteur change de libellé (« 0 répondue sur 8 »). Conséquence : plus
  exact sur ce qui est fait, mais change un texte visible du quiz.
- (c) Ne rien changer. Conséquence : la valeur annoncée devra choisir l'un
  des deux sens et contredira l'autre.

**Q7 — Le jeu de composants Figma (obligatoire avant le RFC, aucun n'existe à notre connaissance)**

- (a) **(Recommandé)** Une session agent le construit dans le fichier `Lib`
  à partir des réponses ci-dessus (variables liées, pas de valeurs en dur),
  puis tu le valides en checkpoint. Conséquence : ton temps se limite à
  la validation, comme pour le Sigil.
- (b) Tu le construis toi-même. Conséquence : contrôle total du rendu,
  mais le RFC attend ton créneau.
- (c) Page de docs Figma en plus du jeu de composants. Conséquence : plus
  de documentation visuelle, plus de temps ; facultative depuis le
  2026-09-16 (les règles peuvent être tranchées en séance et notées en §7).

**Q8 — Priorité dans le registre (si Q1 n'est pas STOP)**

- (a) **(Recommandé)** Priorité 5, le prochain composant après le Sigil.
  Conséquence : le RFC démarre dès Q1–Q7 tranchées. Pourquoi : aucun autre
  candidat n'est ouvert dans le registre, et l'usage produit est confirmé.
- (b) Plus tard, derrière un autre candidat que tu nommes. Conséquence :
  cette analyse reste en archive jusque-là ; à remesurer avant le RFC (le
  site aura bougé).
