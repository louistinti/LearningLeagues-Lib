export const meta = {
  name: "Button",
  description:
    "Action trigger: accent-filled primary with corner brackets, outlined secondary. Renders a native <a> when href is set (all measured site usages navigate), a native <button> otherwise.",
  variants: [{ variant: "primary" }, { variant: "secondary" }],
  states: [
    { state: "default", note: "The resting chrome — what every example renders." },
    {
      state: "hover",
      note: "Versus default: primary's fill lightens toward white and an accent glow ring appears; secondary recolors its border and label to the accent. Pure CSS, never a prop (RFC §3).",
    },
    {
      state: "focus-visible",
      note: "Versus default: a 2px accent outline at 3px offset, both variants. Keyboard-only — pointer clicks never show it (RFC §4.2).",
    },
    {
      state: "current",
      attribute: { name: "aria-current", value: "page" },
      note: 'Versus default (secondary): accent fill, bg-coloured label, accent border; hover inert; the focus ring is unchanged. Emitted by the current prop as aria-current="page" — the CSS keys on the attribute, so the visual never exists without the semantic (RFC §3.1). Primary: attribute only, no visual (RFC §5).',
    },
  ],
  examples: [
    { label: "Primary action", props: { variant: "primary" }, children: "Start a league" },
    { label: "Secondary action", props: { variant: "secondary" }, children: "View the rules" },
    {
      label: "Link rendering (href set)",
      props: { variant: "primary", href: "#" },
      children: "Open the guide",
    },
    {
      label: "Current — you are here (secondary, href)",
      props: { variant: "secondary", href: "#", current: true },
      children: "Role quiz",
    },
  ],
  // Usage guidance — every line traces to Button.rfc.md (§ refs inline); the
  // wording is design-lead arbitrated content, like every contract field.
  guidelines: {
    golden: [
      {
        rule: "Primary carries the view's main action",
        detail:
          "Secondary supports it — same format, different weight in the hierarchy (RFC §7: iso-format arbitration; measured zones: landing CTA vs supporting actions).",
      },
      {
        rule: "Navigation wears the same chrome",
        detail:
          "When the action navigates, set href: the component renders a real <a> with identical chrome and link semantics kept (RFC §3.1 — all 11 measured site usages navigate).",
      },
      {
        rule: "Write labels in original casing",
        detail:
          "The uppercase treatment is CSS (text-transform), so assistive tech reads the author's casing — write children as a normal sentence (RFC §4.1).",
      },
      {
        rule: "Current says where you are, not what you chose",
        detail:
          'current marks the navigation target the reader is on (aria-current="page"); a pressed or toggled control is aria-pressed — a different state, out of scope (RFC §7, 2026-09-16).',
      },
    ],
    do: [
      "Write the label in sentence case — the uppercase is CSS.",
      "Use href when the action navigates; type only applies to the <button> rendering.",
      "Put inline SVG glyphs inside children — the site's Explore-arrow pattern (RFC §3.2).",
      "Set current on the one Button that leads to the page being viewed — the site's nav CTA on the Quiz page.",
    ],
    dont: [
      "Don't fake a disabled state product-side — disabled is arbitrated out of v1 and returns via RFC (§7, 2026-08-14).",
      "Don't wrap Button in an <a> — use the href prop instead.",
      "Don't use secondary for the view's main call-to-action.",
      "Don't use current as a toggle or a selection — that is aria-pressed, not aria-current.",
    ],
  },
  notes:
    "Hover and focus-visible are CSS states, never props (RFC §3). Chrome lives in button.css; the label typography is the extracted type/button text style (--ll-type-button-*).",
};
