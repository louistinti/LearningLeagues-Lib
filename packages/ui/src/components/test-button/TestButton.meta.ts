import { TestButton } from "./TestButton";

export const meta = {
  name: "TestButton",
  description:
    "TODO: describe what TestButton does and what problem it solves.",
  variants: [],
  notes: "Scaffold is intentionally red (token-lint, contrast). Fix violations in TestButton.tsx, add variants, then promote to draft.",
};

// Intentional violation: inline style with hardcoded padding.
export const exampleRed = <TestButton>Padding is 12px hardcoded, not a token</TestButton>;
