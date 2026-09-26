// A contract example's children: a string (text, printed as-is in the docs
// code block) or the element form { snippet, node } — `node` is a real
// ReactNode built in the meta file (React.createElement, never JSX in a .ts
// file), rendered by the docs generator and mounted by the a11y engine;
// `snippet` is the JSX source printed under the demo stage. One pure helper
// so the three consumers (docs-render, a11y-mount, docs-html) cannot drift.
// Locked by scripts/lib/example-children.test.ts (gate 10).
export interface ElementChildren {
  snippet: string;
  node: unknown; // React.ReactNode — typed loosely here: this file never imports React
}
export type ExampleChildren = string | ElementChildren | undefined;

const isElementForm = (c: unknown): c is ElementChildren =>
  typeof c === "object" && c !== null && "snippet" in c;

export function childSnippet(c: ExampleChildren): string | undefined {
  return isElementForm(c) ? c.snippet : c;
}

export function childNode(c: ExampleChildren): unknown {
  return isElementForm(c) ? c.node : c;
}

/** null when well-formed, otherwise the defect to report. */
export function validateExampleChildren(c: unknown): string | null {
  if (c === undefined || typeof c === "string") return null;
  if (isElementForm(c)) {
    if (typeof c.snippet !== "string" || !c.snippet)
      return "element children need a non-empty snippet";
    if (!("node" in c) || c.node === undefined || c.node === null)
      return "element children need a node (React.createElement(...))";
    return null;
  }
  return "children must be a string or { snippet, node }";
}
