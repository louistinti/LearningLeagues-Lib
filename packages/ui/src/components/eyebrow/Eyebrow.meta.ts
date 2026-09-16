export const meta = {
  name: "Eyebrow",
  description:
    "The library's one mono label: a short uppercase caption in JetBrains Mono, muted by default or in the live accent, set above a section title (eyebrow) or inside a card, a row or a sigil (tag). Text only — no chrome, no states, laid out by its parent.",
  // The docs' generic "variant" column carries the tone (RFC §7 Q10: the
  // prop is `tone` — a colour and nothing else; `variant` stays reserved for
  // visual styles with chrome, `type` for editorial kinds).
  variants: [{ variant: "mute" }, { variant: "accent" }],
  // The accent example comes first: the docs tile the first example under
  // the five accents, and only the accent tone follows the axis.
  examples: [
    { label: "Accent tag", props: { tone: "accent" }, children: "Mech" },
    { label: "Section eyebrow", props: { tone: "mute" }, children: "Rift · Compass" },
    { label: "In a row", props: { tone: "mute" }, children: "Map" },
  ],
  // Usage guidance — no Figma docs page for this component (the first
  // without one, RFC header): every line traces to the rules arbitrated in
  // session and recorded in Eyebrow.rfc.md §3.4 and §7 (Q refs inline).
  guidelines: {
    golden: [
      {
        rule: "One recipe, uppercase by CSS",
        detail:
          "Every Eyebrow is the type/meta text style (11px / 400 / 0.06em) in capitals — no size, weight or tracking option (RFC §7 Q2, Q7). Write the label in its own casing: the uppercase is text-transform, so assistive tech reads the source (§4.1).",
      },
      {
        rule: "A tone is a colour, nothing else",
        detail:
          "mute (the default) for a quiet caption; accent when the label should carry the live accent — it follows data-accent (RFC §3.1, §7 Q3, Q10). Neither is a state: no hover, no focus.",
      },
      {
        rule: "Text only — the parent lays it out",
        detail:
          "The stylesheet ships no margin, padding, border, background, position or display: a section head stacks it above the title, a card puts it in a row, a sigil positions it (RFC §3.4, §7 Q8).",
      },
      {
        rule: "Short: a category or a counter",
        detail: "Never a sentence, and at most one Eyebrow per title (RFC §3.4).",
      },
    ],
    do: [
      "Place it before the h2 / h3 it captions — a sibling of the heading, never a child (§7 Q9).",
      'Write the label as prose in the source ("Rift compass", not "RIFT COMPASS"): the capitals are CSS (§4.1).',
      'Use tone="accent" when the label should follow the page accent; keep the default mute otherwise (§3.1).',
      "Keep positioning product-side: the parent's stack, row or sigil places the Eyebrow (§7 Q8).",
    ],
    dont: [
      "Don't put an Eyebrow inside a heading element — place it before the h2/h3, never inside, so the heading's accessible name stays the title alone (§7 Q9).",
      "Don't add a glyph or an ornament: the quiz tag's diamond stays product-side (§7 Q5).",
      "Don't turn it into a chip — no border, no padding: the bordered showcase chip is out of scope in v1 (§7 Q6).",
      "Don't override its size, weight or tracking product-side — one recipe (§7 Q2, Q7).",
    ],
  },
  notes:
    "Mute and accent are tones, not states: no hover, no focus (RFC §3). The recipe lives in eyebrow.css and ships no layout (§3.4, §7 Q8). The Callout's own tag shares the recipe but stays inside the Callout — no dependency in v1 (RFC §2.3).",
};
