// Unit suite (gate 10) for the example-children helper: a contract example's
// children are either a string (rendered as text, printed as-is) or an
// element form { snippet, node } (node rendered, snippet printed) — the
// Sigil's examples need an SVG child (design record 2026-09-26 §6).
import { test } from "node:test";
import assert from "node:assert/strict";
import { childSnippet, childNode, validateExampleChildren } from "./example-children.ts";

test("a string child is its own snippet and its own node", () => {
  assert.equal(childSnippet("Rift · Compass"), "Rift · Compass");
  assert.equal(childNode("Rift · Compass"), "Rift · Compass");
});

test("undefined children stay undefined on both sides", () => {
  assert.equal(childSnippet(undefined), undefined);
  assert.equal(childNode(undefined), undefined);
});

test("the element form prints its snippet and renders its node", () => {
  const node = { $$typeof: Symbol.for("react.element"), type: "svg" };
  const c = { snippet: "<svg …>…</svg>", node };
  assert.equal(childSnippet(c), "<svg …>…</svg>");
  assert.equal(childNode(c), node);
});

test("validateExampleChildren accepts undefined, a string and a well-formed element form", () => {
  assert.equal(validateExampleChildren(undefined), null);
  assert.equal(validateExampleChildren("text"), null);
  assert.equal(validateExampleChildren({ snippet: "<b>3</b>", node: { type: "b" } }), null);
});

test("validateExampleChildren names the defect of a malformed element form", () => {
  assert.match(validateExampleChildren({ snippet: "", node: {} }) ?? "", /snippet/);
  assert.match(validateExampleChildren({ snippet: "<b/>" }) ?? "", /node/);
  assert.match(validateExampleChildren(42) ?? "", /string or \{ snippet, node \}/);
});
