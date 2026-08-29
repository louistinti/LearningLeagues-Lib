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
  ],
  examples: [
    { label: "Primary action", props: { variant: "primary" }, children: "Start a league" },
    { label: "Secondary action", props: { variant: "secondary" }, children: "View the rules" },
    {
      label: "Link rendering (href set)",
      props: { variant: "primary", href: "#" },
      children: "Open the guide",
    },
  ],
  notes:
    "Hover and focus-visible are CSS states, never props (RFC §3). Chrome lives in button.css; the type/button text-style values are restated there until a text-style extraction stage exists.",
};
