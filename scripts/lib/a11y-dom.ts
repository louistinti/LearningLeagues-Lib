// jsdom window factory + axe-core runner for the accessibility engine gate
// (blueprint §5.1 row 9). The audited unit is a RENDERED FRAGMENT of a real
// component with the library's real CSS — never a page, never an
// approximation. axe runs INSIDE the window (window.eval of axe.source, the
// pattern axe documents for jsdom) so no global leaks between renders.
import { JSDOM, VirtualConsole } from "jsdom";
import axe from "axe-core";

export type Window = JSDOM["window"];

// WCAG 2.1 AA — the standard AGENTS.md axiom 3 binds the library to.
export const WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];

// Page-level rules, disabled ON PURPOSE: a fragment has no main landmark, no
// skip link, no h1 and no regions. The docs-site structural gate runs these
// on real pages. Spike 2026-09-09: every one of them fires on a bare
// <button> fragment. Add to this list only with the same rationale.
export const FRAGMENT_DISABLED_RULES = [
  "region",
  "bypass",
  "landmark-one-main",
  "page-has-heading-one",
];

export interface Fragment {
  html: string; // SSR output of one contract example
  css: string; // tokens.css + the component's own stylesheets
  accent: string; // value placed on <html data-accent>
}

export function createWindow(f: Fragment): Window {
  // Inputs are trusted today (tokens.json accent names, repo CSS) but the
  // gate is "never silent" — that assumption becomes a contract, loudly.
  if (!/^[a-z][a-z0-9-]*$/.test(f.accent))
    throw new Error(`createWindow: accent "${f.accent}" is not a plain token name`);
  if (/<\/style/i.test(f.css))
    throw new Error(
      "createWindow: css contains </style — it would end the style block and leak into <body>",
    );
  // A silent VirtualConsole: jsdom otherwise prints "Not implemented:
  // HTMLCanvasElement.getContext" (axe probes canvas for contrast) and
  // "navigation" noise on link clicks — neither is a finding.
  const dom = new JSDOM(
    `<!doctype html><html lang="en" data-accent="${f.accent}"><head><meta charset="utf-8"><title>a11y engine — ${f.accent}</title><style>${f.css}</style></head><body>${f.html}</body></html>`,
    { runScripts: "outside-only", virtualConsole: new VirtualConsole() },
  );
  return dom.window;
}

export interface AxeIssue {
  id: string;
  impact: string;
  help: string;
  nodes: string[]; // outer HTML of each flagged node
}
export interface AxeOutcome {
  violations: AxeIssue[];
  incomplete: AxeIssue[]; // axe could not decide — reported visibly, never silently
  passes: number; // lets a gate refuse a vacuous green — zero passes means axe ran zero rules
}

// axe runs inside the jsdom window, so `list` (and each `r.nodes`) is an
// array from that window's realm: `.map` on it species-constructs another
// foreign-realm array, which assert.deepEqual then refuses to treat as a
// plain array even when the contents match. Array.from, called here as a
// bare reference, always builds in THIS module's (Node's) realm instead.
const pick = (list: axe.Result[]): AxeIssue[] =>
  Array.from(list, (r) => ({
    id: r.id,
    impact: r.impact ?? "n/a",
    help: r.help,
    nodes: Array.from(r.nodes, (n) => n.html),
  }));

export async function runAxe(window: Window): Promise<AxeOutcome> {
  // ~70ms per window to eval the 1.3MB axe.source — unavoidable, since each
  // jsdom window is its own V8 context. Guard it so a caller that already
  // ran axe in this window (or reused it) doesn't pay the cost twice.
  if (!("axe" in window)) window.eval(axe.source);
  const inWindow = (window as unknown as { axe: typeof axe }).axe;
  const result = await inWindow.run(window.document, {
    runOnly: { type: "tag", values: WCAG_TAGS },
    rules: Object.fromEntries(FRAGMENT_DISABLED_RULES.map((id) => [id, { enabled: false }])),
  });
  return {
    violations: pick(result.violations),
    incomplete: pick(result.incomplete),
    passes: result.passes.length,
  };
}
