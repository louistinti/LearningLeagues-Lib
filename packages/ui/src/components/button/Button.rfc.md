# RFC: Button

> **Status:** approved
> **Author:** M5 agent session (sup. Louis Tinthilier)
> **Date:** 2026-08-14
> **Design node:** `16:18` — [link](https://www.figma.com/design/6zp7CvEjdiFXzwh6ZGGwB8/Lib?node-id=16-18)
> **Base primitive:** none
> **Category:** action
> **Manifest entry:** button

---

## 1. Summary

The action trigger of the library: the site's landing/quiz call-to-action in
its two measured styles (accent-filled `primary` with corner brackets, and
outlined `secondary` — named `ghost` until the 2026-08-29 arbitration, §7).
First component through the RFC circuit; its job is as much to exercise the
circuit as to ship the button.

---

## 2. Product usage analysis

### 2.1 Matching identifiers (legacy libraries)

| Identifier       | Source package                                      |
| ---------------- | --------------------------------------------------- |
| `.btn-primary`   | LearningLeagues site `styles.css` (landing buttons) |
| `.btn-ghost`     | LearningLeagues site `styles.css` (landing buttons) |
| `.nav-roles-btn` | site `styles.css` — nav one-off, stays product-side |
| `.lang-btn`      | site `styles.css` — nav one-off, stays product-side |

### 2.2 Usage metrics

| Product                              | Files                                                                     | Occurrences | Main zones                             |
| ------------------------------------ | ------------------------------------------------------------------------- | ----------- | -------------------------------------- |
| LearningLeagues site (`btn-primary`) | 3 (`landing.jsx`, `quiz-app.jsx`, `ds-components.jsx`)                    | 6           | landing CTA, quiz actions, DS showcase |
| LearningLeagues site (`btn-ghost`)   | 4 (`landing.jsx`, `quiz-app.jsx`, `ds-components.jsx`, `ds-patterns.jsx`) | 5           | secondary actions                      |

### 2.3 Notes on product adoption

Site is static and buildless (JSX via in-browser transform); adoption means
replacing the `.btn-primary` / `.btn-ghost` class pairs. The two nav buttons
(`nav-roles-btn`, `lang-btn`) are navigation chrome with their own geometry —
excluded from this component, candidates for a future nav component. The
`display: inline-flex; gap: 10px` on the site buttons implies icon+label
usage exists or was planned — the icon slot question goes to arbitration.

---

## 3. API design

Hover and focus are CSS states (`:hover`, `:focus-visible`), never props —
the State axis in the design node documents visuals, it does not extend the
API.

### 3.1 Properties

| Name    | Type                              | Default     | Required | Description                                                                                                           |
| ------- | --------------------------------- | ----------- | -------- | --------------------------------------------------------------------------------------------------------------------- |
| variant | `"primary" \| "secondary"`        | `"primary"` | no       | Visual style; primary carries corner brackets. (`ghost` renamed `secondary`, §7 2026-08-29.)                          |
| href    | `string`                          | —           | no       | When set, renders an `<a href>` with identical chrome (all 11 measured site usages navigate). `type` is then ignored. |
| type    | `"button" \| "submit" \| "reset"` | `"button"`  | no       | Native button type when no `href` (explicit default: a bare `<button>` inside a form submits).                        |
| onClick | `(e: MouseEvent) => void`         | —           | no       | Native click handler, forwarded on both renderings.                                                                   |

`disabled`: arbitrated out of v1 (§7, 2026-08-14) — returns via RFC when a
real product usage demands it.

### 3.2 Slots / Children

`children`: the label as inline content — text and inline SVG glyphs, exactly
as the site's measured usages do (Explore's arrow is an inline `<svg>` child).
A dedicated icon slot API stays out of v1 (§7, 2026-08-14).

### 3.3 Events / Callbacks

Native `<button>` events only; `onClick` forwarded, nothing synthesized.

---

## 4. Accessibility commitment

### 4.1 Semantic structure

Renders a native `<button type="...">`, or a native `<a href>` when `href` is
set (§7): link semantics are kept deliberately — announced as a link,
activated with Enter (Space scrolls, as for any link). No ARIA role
overrides in either rendering; the uppercase treatment is CSS
(`text-transform`), so assistive tech reads the author's original casing.

### 4.2 Keyboard interaction

Native activation (Enter and Space) — no custom key handling. Focus is
visible via `:focus-visible` only (no ring on pointer click): 2px accent
outline offset 3px, on both variants.

### 4.3 Component-specific decisions

- The corner brackets (primary) and hover glow are purely decorative:
  pseudo-elements/box-shadow, invisible to assistive tech.
- The hover brightening keeps the same text-on-accent pair; contrast is
  computed by the gate from resolved tokens, never declared here.
- Disabled treatment: out of v1 by arbitration (§7) — a future RFC adding it
  must record the choice between `disabled` and `aria-disabled` (focusable
  but inert).
- Both variants share `type/button` at weight 600 (§7) — a deliberate
  deviation from the site's 400-weight ghost.

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

| Date       | Question (as asked)                                                                                                                               | Decision (verbatim)                                                                                                                                                                                                                                                                                                          | Decided by       |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------- |
| 2026-08-14 | Typo bouton : le site dit mono 12px weight 600 ; l'échelle n'a que type/meta (11px Regular). Où va la vérité ?                                    | Round 1: "On se base sur le site, y a un décalage entre les token et figma ? Pourquoi ?" — after the L01 explanation (the site never had these as tokens), round 2: "Style type/button dans Figma (Recommended)"                                                                                                             | Louis Tinthilier |
| 2026-08-14 | Espacements hors échelle : padding-x 22px et gap icône-label 10px (échelle : s-2=16, s-15=12, s-3=24).                                            | Round 1: "Non non on refait tout comme le site, je sais pas pq on a pas les token du site sur figma" — round 2: "Nouveaux tokens s-275 et s-125 (Recommended)" (naming arithmetic holds: 2.75×8=22, 1.25×8=10)                                                                                                               | Louis Tinthilier |
| 2026-08-14 | Hover primary : accent éclairci (color-mix 88% + blanc) et glow shadow — aucun token dédié n'existe.                                              | "sjuit lke site" [suit le site] — the site already derives it from the token (`color-mix(in oklab, var(--accent) 88%, white)`), so: derived in component CSS from `--ll-accent`, no new token                                                                                                                                | Louis Tinthilier |
| 2026-08-14 | Périmètre API v1 — disabled et slot icône, absents du site, à trancher :                                                                          | "Ni l'un ni l'autre (Recommended)" — v1 minimal strict (variant/type/onClick/children); both return via RFC when a real product usage demands them                                                                                                                                                                           | Louis Tinthilier |
| 2026-08-14 | Graisse du label Ghost : le site a Primary 600 / Ghost 400 ; type/button porte le 600. Le Ghost garde 400 ou tout passe en 600 ?                  | "Tout en 600 ça reste les boutons \"primaires\" et \"secondaires\"" — one type/button style for both variants; deliberate deviation from the site's ghost weight                                                                                                                                                             | Louis Tinthilier |
| 2026-08-14 | Tes boutons du site naviguent (ce sont des liens `<a href>` habillés en bouton). Le composant Button v1 doit-il savoir être un lien ?             | "Oui : prop href (Recommended)" — with `href` Button renders an `<a>` with identical chrome, else a native `<button>`; the 11 measured usages become replaceable                                                                                                                                                             | Louis Tinthilier |
| 2026-08-14 | L'accent par défaut du système (`accent/default`) : `or` (choisi au seeding, utilisé par aucune page) ou `ambre` (ta landing et 5 autres pages) ? | "Basculer sur ambre (Recommended)" — `accent/default` realiased to `accent/ambre`; `or` stays a selectable accent and tier colour; `accent/soft` keeps the gold-fixed alias like the site's `--gold-soft`                                                                                                                    | Louis Tinthilier |
| 2026-08-29 | (unprompted — Louis's visual checkpoint of the docs site, PR #10)                                                                                 | "Le bouton \"ghost\" est un secondary, ça fonctionne meixu que ghost" [mieux] — variant renamed `ghost` → `secondary`; component is draft/unexported, no consumer migration needed                                                                                                                                           | Louis Tinthilier |
| 2026-08-29 | (unprompted — same checkpoint)                                                                                                                    | "Il faut que les boutons primary et secondary fasse le même format pour que l'interface soit iso" — measured cause: the `<a href>` rendering inherited the host's line-height (45px vs 40px); fixed with `line-height: normal` on the shared `.ll-button` base (distribution contract §3.7: self-defensive browser defaults) | Louis Tinthilier |
