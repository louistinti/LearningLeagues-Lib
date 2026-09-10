export const meta = {
  name: "Callout",
  description:
    "An emphasised aside inside a guide section: a typed tag (Key concept / Pro tip / Trap — a decorative glyph and a mono label in the live accent), an optional serif title, a body of rich inline content. Not interactive.",
  // The docs' generic "variant" column carries the editorial type (RFC §7 Q6:
  // the prop is `type`; `variant` is reserved for visual styles).
  variants: [{ variant: "key" }, { variant: "pro" }, { variant: "trap" }],
  examples: [
    {
      label: "Key concept",
      props: { type: "key", title: "Shove, then leave" },
      children:
        "Fast-push the wave with your abilities, then roam while the enemy is stuck last-hitting under their tower.",
    },
    {
      label: "Pro tip",
      props: { type: "pro", title: "Priority is permission" },
      children: "Only roam when the enemy must choose between following you and losing CS.",
    },
    {
      label: "Trap",
      props: { type: "trap", title: "Don't roam into nothing" },
      children:
        "A roam that gets no kill, no tower and no vision is just lost farm and a missed wave.",
    },
    {
      label: "No title",
      props: { type: "pro" },
      children: "Title is optional: without it the tag leads straight into the body.",
    },
  ],
  // Usage guidance — authored with the design lead on the Figma page
  // `Docs / Callout` (node 66:3) before the RFC, imported once (RFC §7).
  guidelines: {
    golden: [
      {
        rule: "Key concept: the one takeaway",
        detail:
          "The single most important thing to retain from a section. Maximum one per section, placed first.",
      },
      {
        rule: "Pro tip: actionable, follows the key",
        detail: "Practical advice that follows from the Key concept. Several per section are fine.",
      },
      {
        rule: "Trap: short, direct, no hedging",
        detail: "A common low-Elo mistake and why it costs. Name the symptom, then the fix.",
      },
    ],
    do: [
      "Put one Key concept per section, first in the grid.",
      "Write the title as a short sentence; the tag already says the type.",
      "Keep the body to two or three sentences; bold the one phrase to remember.",
    ],
    dont: [
      "Don't use a Callout outside a guide section — it is not a generic card.",
      "Don't write the title in capitals; the tag is the only uppercase element.",
      "Don't make the body a bare link or a list — that is another component.",
    ],
  },
  notes:
    "Key / Pro / Trap are types, not states: no hover, no focus (RFC §3). Chrome lives in callout.css; the 2-column grid the site lays callouts in stays product-side (RFC §7 Q4).",
};
