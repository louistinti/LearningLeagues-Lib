import React from "react";

// Examples carry an element child ({ snippet, node } — scripts/lib/example-
// children.ts): the art is an SVG, built with createElement (a .ts file).
const hexFrame = () =>
  React.createElement(
    "svg",
    { viewBox: "0 0 200 200", fill: "none", stroke: "currentColor", strokeWidth: 0.8 },
    React.createElement("polygon", {
      points: "100,10 180,55 180,145 100,190 20,145 20,55",
      strokeWidth: 1,
      opacity: 0.55,
    }),
    React.createElement("polygon", {
      points: "100,40 155,72 155,128 100,160 45,128 45,72",
      opacity: 0.4,
    }),
    React.createElement("path", {
      d: "M100 10 L100 40 M180 55 L155 72 M180 145 L155 128 M100 190 L100 160 M20 145 L45 128 M20 55 L45 72",
      opacity: 0.5,
    }),
  );
const compass = () =>
  React.createElement(
    "svg",
    { viewBox: "0 0 200 200", fill: "none", stroke: "currentColor", strokeWidth: 0.8 },
    React.createElement("circle", { cx: 100, cy: 100, r: 36, strokeWidth: 1, opacity: 0.7 }),
    React.createElement("path", {
      d: "M100 64 L106 100 L100 136 L94 100 Z",
      fill: "currentColor",
      opacity: 0.85,
      stroke: "none",
    }),
    React.createElement("path", {
      d: "M64 100 L100 94 L136 100 L100 106 Z",
      fill: "currentColor",
      opacity: 0.4,
      stroke: "none",
    }),
    React.createElement("circle", { cx: 100, cy: 100, r: 3, fill: "currentColor", stroke: "none" }),
  );

export const meta = {
  name: "Sigil",
  description:
    "The framed decorative square beside a hero title: a bordered surface square, two inset rings, and the page's art inside the accent ring, drawn in the live accent. Decorative (aria-hidden), no label, no states — the parent grid sizes it.",
  variants: [],
  examples: [
    {
      label: "Hex frame",
      props: {},
      children: {
        snippet:
          '<svg viewBox="0 0 200 200" fill="none" stroke="currentColor">{/* hex frame */}…</svg>',
        node: hexFrame(),
      },
    },
    {
      label: "Compass",
      props: {},
      children: {
        snippet:
          '<svg viewBox="0 0 200 200" fill="none" stroke="currentColor">{/* compass */}…</svg>',
        node: compass(),
      },
    },
  ],
  guidelines: {
    golden: [
      {
        rule: "Decorative, always",
        detail:
          "The frame is aria-hidden unconditionally: the page's meaning lives in the heading beside it, never in the sigil (RFC §4.1, §4.3). A meaningful image is an <img alt> or a figure, not a Sigil.",
      },
      {
        rule: "The art is the page's",
        detail:
          "Pass an inline SVG drawn with currentColor — it inherits the accent — or your own positioned element; it renders inside the square within the accent ring (RFC §3.2, §7 Q11).",
      },
      {
        rule: "The parent sizes the square",
        detail:
          "width: 100% and aspect-ratio: 1 — the grid column decides the size and the placement; no size prop (RFC §3.4).",
      },
      {
        rule: "One ornament, no label",
        detail:
          "Two inset rings, nothing else (§7 Q2); the corner caption left the design (§7 Q11) — a product that wants one places its own element beside the Sigil.",
      },
    ],
    do: [
      'Draw the art with stroke="currentColor" / fill="currentColor" so it follows data-accent (§3.1).',
      "Give the Sigil a sized grid column or wrapper; it fills the width it is given (§3.4).",
      "Set data-accent / data-role on an ancestor to change the accent: the accent ring and the art follow; the frame's border and fill stay neutral (§3.4).",
    ],
    dont: [
      "Don't put anything focusable inside — an aria-hidden subtree must not hold interactive content (§4.2).",
      "Don't put text in the slot expecting it to be read: it is hidden with the art (§4.1).",
      "Don't override the rings or the inset product-side — one ornament (§7 Q2).",
    ],
  },
  notes:
    "No states: nothing hovers, nothing focuses (RFC §3.3). The stylesheet ships no layout beyond width: 100% and aspect-ratio: 1 (§3.4). The site's role icon (a masked PNG span with inset: 0) renders inside the art slot, product-side.",
};
