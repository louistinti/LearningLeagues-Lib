// Examples name the bar with `label`: the docs page and the accessibility
// engine render each example as an isolated fragment, where a labelledBy id
// would point at nothing. labelledBy is covered by the local suite. The
// first example has a non-empty fill: the accent tiles render it.
export const meta = {
  name: "ProgressBar",
  description:
    "The thin bar that tells how far a task has got: a 4px border/soft track holding an accent fill whose length is value / max. Always announced as a named progressbar with a readable value; no states, no animation — the parent places it and prints the counter beside it.",
  variants: [],
  examples: [
    {
      label: "Checklist",
      props: { value: 8, max: 10, label: "Ready for ranked", valueText: "8 of 10 validated" },
    },
    {
      label: "Experience",
      props: { value: 620, max: 1000, label: "Level 14 experience", valueText: "620 of 1000 XP" },
    },
    {
      label: "Quiz",
      props: { value: 1, max: 8, label: "Quiz progress", valueText: "Question 1 of 8" },
    },
    {
      label: "Not started",
      props: { value: 0, max: 10, label: "Ready for ranked", valueText: "0 of 10 validated" },
    },
  ],
  guidelines: {
    golden: [
      {
        rule: "Always a text counter beside the bar",
        detail:
          "The track (border/soft) is barely visible against the page, so the bar never carries the value alone: print the count as text next to it — '8/10', '620 / 1000 XP', 'Q 01 / 08' (RFC §4.3, §7 checkpoint). The counter is product copy, product-side.",
      },
      {
        rule: "Always named, always read",
        detail:
          "Exactly one of label (text) or labelledBy (the id of visible text — preferred when a heading already names the task), and a valueText said the way a person says it: '8 of 10 validated', never a bare percentage (RFC §3.1, §7 Q5, §7 checkpoint).",
      },
      {
        rule: "Progress, not measurement",
        detail:
          "A task that moves toward done — a checklist, a level, a quiz. A ranking or a score among others is a measurement and stays product-side (RFC §7 Q1).",
      },
      {
        rule: "One height, one tone, no motion",
        detail:
          "4px (s-05), the live accent on border/soft, square ends; the fill takes its new length at once (RFC §7 Q2–Q4).",
      },
    ],
    do: [
      "Point labelledBy at the heading or caption that already names the task on screen; give that element an id (RFC §2.3).",
      "Keep valueText in step with the visible counter — the quiz bar shows question 1 as 1 / 8, the same as its 'Q 01 / 08' (RFC §7 Q6).",
      "Give the bar the width you want through its parent (a column, flex: 1); it fills the width it is given (RFC §3.4).",
      "Set data-accent / data-role on an ancestor to change the fill colour; the track stays neutral (RFC §3.4).",
    ],
    dont: [
      "Don't pass both label and labelledBy, or neither — the type refuses it, and axe reds a nameless bar (RFC §4.3).",
      "Don't use it for a score or a ranking among several items (RFC §7 Q1).",
      "Don't add a transition, a radius, a margin or a height product-side — one recipe (RFC §7 Q2, Q4).",
    ],
  },
  notes:
    "No states: nothing hovers, nothing focuses (RFC §3.3). value is clamped to [0, max]; a max ≤ 0 or a non-finite value draws an empty fill and announces 0 (RFC §3.5 point 5). The fill is an aria-hidden SVG rect whose width attribute is value / max — no inline style (RFC §3.4).",
};
