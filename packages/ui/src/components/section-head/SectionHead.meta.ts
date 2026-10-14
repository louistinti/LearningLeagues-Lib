export const meta = {
  name: "SectionHead",
  description:
    "The numbered head that opens a section: a serif italic number in the live accent with a short accent underline, alone in its own column beside an h2 title and an optional lede; the number stacks above the title on narrow viewports. One layout, no variant, no states — the page places it.",
  // One layout, no variant (RFC §7 Q1): the grid is empty on purpose.
  variants: [],
  // The first example is tiled under the five accents: it carries a lede so
  // the accent number sits beside both text colours. No example sets `id`:
  // the docs page repeats each example (accents, states), and a repeated id
  // would be a duplicate in the page — the id forwarding is proven by the
  // local suite.
  examples: [
    {
      label: "With a lede",
      props: {
        num: "01",
        title: "Phases",
        lede: "What you do at each moment of the game.",
      },
    },
    { label: "Without a lede", props: { num: "02", title: "Wave management" } },
  ],
  // Usage guidance — no Figma docs page for this component (page-less path,
  // RFC header): every line traces to SectionHead.rfc.md §3–§4 and §7.
  guidelines: {
    golden: [
      {
        rule: "One layout, always an h2",
        detail:
          "The number in its own column beside the title, stacked above it at 768px and below (--ll-breakpoint-md). The heading level is always 2 — no level, layout or size option (RFC §7 Q1, Q10, checkpoint row).",
      },
      {
        rule: "The number is order, not meaning",
        detail:
          'num is required and rendered verbatim, hidden from assistive technology: the document order (and the role guides\' table of contents) already give it (RFC §7 Q2, Q9). The product computes it — two digits by convention, "01" … "11".',
      },
      {
        rule: "The title wraps",
        detail:
          "No single-line rule: a long or translated title wraps instead of overflowing (RFC §7 Q7, WCAG 1.4.10). An <em> in it renders italic in the live accent (§7 Q8).",
      },
      {
        rule: "The page places it",
        detail:
          "The component ships no margin, padding or width: the <section>, its anchor id, its spacing and the page grid are the product's (RFC §2.3, §3.4).",
      },
    ],
    do: [
      'Pass the section number as a string the product formats ("01"): the component never pads or computes it (§3.1).',
      'Give id to name the section: <section aria-labelledby="phases"> with <SectionHead id="phases" …> — the id lands on the h2 (§3.1, §4.1).',
      "Keep the section's own anchor id (the TOC target) on the product's <section>, not on the head (§3.1).",
      "Put the lede in lede, not after the component: it sits s-15 under the title and is left out entirely when omitted (§7 Q11).",
      "Use h3 for the headings inside the section: the head is the h2 (§7 Q10).",
    ],
    dont: [
      "Don't put an Eyebrow, the number or any label inside title — the h2's accessible name stays the title alone (§4.1; Eyebrow §7 Q9).",
      "Don't rely on the number being announced: a product that needs it voiced writes it into the title, where it joins the heading's name (§4.3).",
      "Don't force the title onto one line or truncate it (§7 Q7).",
      "Don't override the number's size, the underline or the column width product-side — one recipe (§7 Q3–Q6).",
    ],
  },
  notes:
    "No states: nothing hovers, nothing focuses (RFC §3.3). Stacked at a viewport width of 768px and below — the one media query, in section-head.css, restating --ll-breakpoint-md (§3.4). The <em> rendering of the title (§7 Q8) is proven by the local suite, not shown as a docs example: an element-valued prop has no JSX snippet form in the docs generator yet. The stacked heads of Fundamentals and the landing stay product compositions (LL.Eyebrow + title + text, §7 Q1).",
};
