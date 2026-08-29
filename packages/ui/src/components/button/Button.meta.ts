export const meta = {
  name: "Button",
  description:
    "Action trigger: accent-filled primary with corner brackets, outlined ghost. Renders a native <a> when href is set (all measured site usages navigate), a native <button> otherwise.",
  variants: [{ variant: "primary" }, { variant: "ghost" }],
  states: ["default", "hover", "focus-visible"],
  examples: [
    { label: "Primary action", props: { variant: "primary" }, children: "Start a league" },
    { label: "Ghost action", props: { variant: "ghost" }, children: "View the rules" },
    {
      label: "Link rendering (href set)",
      props: { variant: "primary", href: "#" },
      children: "Open the guide",
    },
  ],
  notes:
    "Hover and focus-visible are CSS states, never props (RFC §3). Chrome lives in button.css; the type/button text-style values are restated there until a text-style extraction stage exists.",
};
