# RFC: Button

> **Status:** draft
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
outlined `ghost`). First component through the RFC circuit; its job is as much
to exercise the circuit as to ship the button.

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

| Name    | Type                              | Default     | Required | Description                                                                     |
| ------- | --------------------------------- | ----------- | -------- | ------------------------------------------------------------------------------- |
| variant | `"primary" \| "ghost"`            | `"primary"` | no       | Visual style; primary carries corner brackets.                                  |
| type    | `"button" \| "submit" \| "reset"` | `"button"`  | no       | Native button type (explicit default: a bare `<button>` inside a form submits). |
| onClick | `(e: MouseEvent) => void`         | —           | no       | Native click handler, forwarded.                                                |

Open (arbitration): `disabled` — not observed on the site; adding it commits
the library to a disabled visual + a11y treatment.

### 3.2 Slots / Children

`children`: the label content (text). Icon slot: open arbitration question —
not drafted in v1.

### 3.3 Events / Callbacks

Native `<button>` events only; `onClick` forwarded, nothing synthesized.

---

## 4. Accessibility commitment

### 4.1 Semantic structure

Renders a native `<button type="...">`. Label is the text content — no ARIA
role or `aria-label` needed for the label-only v1; the uppercase treatment is
CSS (`text-transform`), so assistive tech reads the author's original casing.

### 4.2 Keyboard interaction

Native activation (Enter and Space) — no custom key handling. Focus is
visible via `:focus-visible` only (no ring on pointer click): 2px accent
outline offset 3px, on both variants.

### 4.3 Component-specific decisions

- The corner brackets (primary) and hover glow are purely decorative:
  pseudo-elements/box-shadow, invisible to assistive tech.
- The hover brightening keeps the same text-on-accent pair; contrast is
  computed by the gate from resolved tokens, never declared here.
- Disabled treatment: deferred to arbitration (§7) — if accepted, the choice
  between `disabled` and `aria-disabled` (focusable but inert) must be
  recorded there.

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

| Date | Question (as asked) | Decision (verbatim) | Decided by |
| ---- | ------------------- | ------------------- | ---------- |
