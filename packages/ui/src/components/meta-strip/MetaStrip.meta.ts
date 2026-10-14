// Example facts follow the Figma set's samples (106:29: Difficulty / Medium,
// Read time / ~15 min, Patch / 26.12) and the site's five content shapes
// (usage analysis §3.2): key + value, key alone, key + a value with a typed
// "·". Every word is product content (manifest split, "Content of a library
// slot"); these are specimens, not library copy.
const facts = [
  { label: "Read time", value: "~15 min" },
  { label: "Patch", value: "26.12" },
  { label: "Difficulty", value: "Medium" },
];

export const meta = {
  name: "MetaStrip",
  description:
    "The row of small mono facts at the foot of a hero: a dashed top rule, then a wrapping list of facts — each a key rendered by the library's Eyebrow, followed by an optional value in fg/mute — or in the accent, with valueTone. Text only, no states; the parent places it.",
  // The docs' generic "variant" column carries the tone, as for the Eyebrow
  // whose tone it forwards (RFC §3.1, §7 Q4).
  variants: [{ variant: "dim" }, { variant: "accent" }],
  // The accent example comes first: the docs tile the first example under
  // the five accents, and only the accent keys follow the axis.
  examples: [
    { label: "Accent keys", props: { tone: "accent", items: facts } },
    { label: "Dim keys (default)", props: { items: facts } },
    // valueTone is independent of tone (RFC §3.1, §7 checkpoint rows
    // 2026-10-14): dim keys, accent values — the role guides' highlights.
    { label: "Accent values", props: { valueTone: "accent", items: facts } },
    {
      label: "Key alone",
      props: { items: [{ label: "Patch-stable" }, { label: "Read time", value: "~15 min" }] },
    },
    {
      label: "Many facts (wrapping)",
      props: {
        items: [
          { label: "5 sections", value: "· structured path" },
          { label: "Read time", value: "~40 min" },
          { label: "Patch", value: "26.12" },
          { label: "Level", value: "Iron to Platinum" },
          { label: "Difficulty", value: "Medium" },
          { label: "Patch-stable" },
        ],
      },
    },
  ],
  // Usage guidance — no Figma docs page for this component (page-less path,
  // RFC header): every line traces to MetaStrip.rfc.md §3.4, §4 and §7.
  guidelines: {
    golden: [
      {
        rule: "A list of facts, read fact by fact",
        detail:
          'One <ul role="list"> with one <li> per entry of items, in order: a screen reader announces "list, 3 items" and steps through them (RFC §4.1, §7 Q8). An empty items renders nothing.',
      },
      {
        rule: "The key is an Eyebrow",
        detail:
          "Every key renders the library's Eyebrow — the type/meta recipe in capitals, by CSS — so the strip never restates it (RFC §7 Q3). Write the key in its own casing.",
      },
      {
        rule: "One tone per strip",
        detail:
          "dim (the default) or accent, which follows data-accent — forwarded to every key (RFC §3.1, §7 Q4). The values have their own tone, valueTone: fg/mute by default, or accent (RFC §3.1, §7 checkpoint rows 2026-10-14). Both apply to the whole strip.",
      },
      {
        rule: "Text only — the parent places it",
        detail:
          "The strip ships its dashed top rule, the 24px above its text and its own gaps; no outer margin, width or alignment. A slot class product-side spaces it from what follows (RFC §3.4).",
      },
    ],
    do: [
      'Pass the facts as data: items={[{ label: "Read time", value: "~15 min" }]} (RFC §3.1).',
      'Omit value for a key alone ({ label: "Patch-stable" }) — no empty value, no placeholder (RFC §3.4).',
      'Use tone="accent" when the keys should follow the page accent; keep the default dim otherwise (RFC §7 Q4).',
      'Use valueTone="accent" where the values are the highlights (the role guides: level, read time, patch); keep the default mute elsewhere (RFC §7 checkpoint rows 2026-10-14).',
      "Place it as the last child of the hero's text column and let the column set its width (RFC §2.3).",
    ],
    dont: [
      "Don't put a symbol rating in a value (★★☆): write the level as a word (RFC §7 Q5).",
      "Don't add separators between facts — the gap separates them; a · typed inside a value stays content (RFC §7 Q6).",
      "Don't override the strip's size, tracking or gaps product-side — one recipe (RFC §7 Q2, Q7).",
      "Don't put interactive content in a value: the strip is static text (RFC §4.2).",
    ],
  },
  notes:
    "No states: nothing hovers, nothing focuses (RFC §3.3). The keys are real Eyebrows (the library's first component-to-component dependency, §3.5): a change to the Eyebrow is a change to the MetaStrip. The dashed rule is the browser's CSS dashed — the Figma set's [3, 3] dash array is a stand-in for it (§3.4).",
};
