# RFC: {ComponentName}

> **Status:** draft | review | approved | implemented
> **Author:** {name}
> **Date:** {YYYY-MM-DD}
> **Design node:** `{nodeId}` — [link]({url})
> **Base primitive:** `{package}` | none
> **Category:** action | navigation | feedback | input | layout | data-display
> **Manifest entry:** {name in the state manifest}

---

## 1. Summary

<!-- AGENT PRE-FILL → HUMAN VALIDATION
     2-3 sentences: what this component is, what problem it solves, why now. -->

---

## 2. Product usage analysis

<!-- AGENT PRE-FILL → HUMAN VALIDATION. Sources: usage inventory, crosswalk table, grep
     in the consuming repositories. -->

### 2.1 Matching identifiers (legacy libraries)

| Identifier | Source package |
| ---------- | -------------- |

### 2.2 Usage metrics

| Product | Files | Occurrences | Main zones |
| ------- | ----- | ----------- | ---------- |

### 2.3 Notes on product adoption

<!-- AGENT PRE-FILL: any blockers or patterns affecting adoption (e.g. "used only in
     a dialog", "requires managed focus", "polled from 6 code sites, no factory"). -->

---

## 3. API design

<!-- AGENT PRE-FILL → HUMAN VALIDATION. Component properties, slots, events. Include
     expected runtime behaviour. -->

### 3.1 Properties

| Name | Type | Default | Required | Description |
| ---- | ---- | ------- | -------- | ----------- |

### 3.2 Slots / Children

<!-- If applicable. -->

### 3.3 Events / Callbacks

<!-- If applicable. -->

---

## 4. Accessibility commitment

<!-- AGENT PRE-FILL → HUMAN VALIDATION.

Three sub-sections, each capturing a distinct responsibility layer:
- Accessibility semantics (ARIA roles, labels, live regions): what the component
  emits and how a screenreader sees it.
- Keyboard: all interactive states reachable without a pointer; focus management;
  expected keys (Enter, Space, Escape, arrow keys).
- Component-specific decisions: anything else (e.g. "disabled state is not keyboard
  reachable per WCAG 2.1 standard §4.1.2"; "the confirm button has a 500ms
  debounce to prevent double-submit").

Never include general "best practices" that apply to all components. -->

### 4.1 Semantic structure

### 4.2 Keyboard interaction

### 4.3 Component-specific decisions

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
