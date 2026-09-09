// Unit suite for the generic keyboard checks of the accessibility engine gate
// (gate 9), run inside gate 10 (check-detectors.ts). Every case is a behaviour
// the gate relies on or a DOCUMENTED limitation frozen on purpose.
// Run: node --test scripts/lib/a11y-checks.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { JSDOM } from "jsdom";
import { checkFragment, focusVisibleSelectors, interactiveElements } from "./a11y-checks.ts";

const CSS =
  ".ll-button:focus-visible { outline: 2px solid var(--ll-accent); outline-offset: 3px; }";
const doc = (body: string) =>
  new JSDOM(`<!doctype html><html lang="en"><body>${body}</body></html>`).window.document;
const rules = (body: string, css = CSS) => checkFragment(doc(body), css).map((f) => f.rule);

test("clean native button and link: no findings", () => {
  assert.deepEqual(
    rules(
      `<button class="ll-button" type="button">Go</button><a class="ll-button" href="/x">Open</a>`,
    ),
    [],
  );
});

test("focusable: a role=button span without tabindex is unreachable (and focus cannot land)", () => {
  const r = rules(`<span class="ll-button" role="button">Go</span>`);
  assert.ok(r.includes("focusable"));
  assert.ok(r.includes("focus-lands"));
});

test('focusable: tabindex="0" makes a role=button span reachable', () => {
  assert.deepEqual(rules(`<span class="ll-button" role="button" tabindex="0">Go</span>`), []);
});

test("no-positive-tabindex: tabindex > 0 is red even on a native button", () => {
  assert.ok(
    rules(`<button class="ll-button" type="button" tabindex="3">Go</button>`).includes(
      "no-positive-tabindex",
    ),
  );
});

test("hidden-focusable: a focusable element inside aria-hidden is red (axe leaves it incomplete in jsdom)", () => {
  assert.ok(
    rules(
      `<div aria-hidden="true"><button class="ll-button" type="button">Go</button></div>`,
    ).includes("hidden-focusable"),
  );
});

test("focus-visible-styled: no :focus-visible rule for the element's class is red", () => {
  assert.deepEqual(rules(`<button class="ll-card" type="button">Go</button>`), [
    "focus-visible-styled",
  ]);
});

test("focus-visible-styled: class match is token-bound (`.ll` does not cover `.ll-button`)", () => {
  const css = ".ll:focus-visible { outline: 1px solid red; }";
  assert.deepEqual(rules(`<button class="ll-button" type="button">Go</button>`, css), [
    "focus-visible-styled",
  ]);
});

test("focus-visible-styled: an element without any class cannot be styled — red", () => {
  assert.deepEqual(rules(`<button type="button">Go</button>`), ["focus-visible-styled"]);
});

test("focusVisibleSelectors: comments are stripped, only :focus-visible selectors come back", () => {
  const css =
    "/* .ll-fake:focus-visible in a comment */ .a:hover{} .ll-button:focus-visible, .ll-x:focus-visible {outline:0}";
  assert.deepEqual(focusVisibleSelectors(css), [".ll-button:focus-visible, .ll-x:focus-visible"]);
});

test("disabled elements are skipped entirely (WCAG excludes inactive components)", () => {
  assert.deepEqual(interactiveElements(doc(`<button type="button" disabled>Go</button>`)), []);
});

test("an anchor without href is not interactive — skipped, not red", () => {
  assert.deepEqual(rules(`<a class="ll-button">Not a link</a>`), []);
});

test("DOCUMENTED LIMITATION — a <div> acting as a button is invisible to the generic checks", () => {
  // Static markup carries no event handlers (React emits none), so a div
  // with an onClick in source looks inert here. Behaviour is proved by the
  // component's local <Name>.a11y.test.ts suite; the RFC's native-element
  // commitment is the reviewer's check. If this blind spot is ever closed,
  // update this test AND the design record.
  assert.deepEqual(rules(`<div class="ll-button">Go</div>`), []);
});

test("real Button: both renderings with the real button.css pass every check", () => {
  const css = readFileSync("packages/ui/src/components/button/button.css", "utf8");
  assert.deepEqual(
    rules(
      `<button class="ll-button ll-button--primary" type="button">Start</button><a class="ll-button ll-button--secondary" href="/rules">Rules</a>`,
      css,
    ),
    [],
  );
});

test("never short-circuits: two defective elements report every finding, in document order", () => {
  const f = checkFragment(
    doc(
      `<span class="ll-a" role="button">One</span><button class="ll-b" type="button" tabindex="2">Two</button>`,
    ),
    "",
  );
  assert.deepEqual(
    f.map((x) => x.rule),
    [
      "focusable",
      "focus-lands",
      "focus-visible-styled",
      "no-positive-tabindex",
      "focus-visible-styled",
    ],
  );
});

test("focusable: a roving tablist (one tab in the tab order, the rest tabindex=-1) passes", () => {
  const css = ".ll-tab:focus-visible { outline: 2px solid var(--ll-accent); }";
  assert.deepEqual(
    rules(
      `<div role="tablist"><button class="ll-tab" role="tab" tabindex="0">A</button><button class="ll-tab" role="tab" tabindex="-1">B</button><button class="ll-tab" role="tab" tabindex="-1">C</button></div>`,
      css,
    ),
    [],
  );
});

test("focusable: a lone tabindex=-1 control with no roving sibling is unreachable", () => {
  assert.ok(
    rules(`<button class="ll-button" type="button" tabindex="-1">Go</button>`).includes(
      "focusable",
    ),
  );
});

test("focus-visible-styled: removing the ring via :not(:focus-visible) does not count as styling it", () => {
  const css = ".ll-button:focus:not(:focus-visible) { outline: none; }";
  assert.deepEqual(rules(`<button class="ll-button" type="button">Go</button>`, css), [
    "focus-visible-styled",
  ]);
});

test("focus-visible-styled: a rule targeting a descendant of the focused element does not count", () => {
  const css = ".ll-button:focus-visible .icon { opacity: 1; }";
  assert.deepEqual(rules(`<button class="ll-button" type="button">Go</button>`, css), [
    "focus-visible-styled",
  ]);
});

test("focus-visible-styled: modifier-only class is not covered by the base class rule (realistic direction)", () => {
  assert.deepEqual(rules(`<button class="ll-button--primary" type="button">Go</button>`), [
    "focus-visible-styled",
  ]);
});

test("disabled: a control inside <fieldset disabled> is skipped; <a href disabled> is not", () => {
  assert.deepEqual(
    interactiveElements(doc(`<fieldset disabled><button type="button">Go</button></fieldset>`)),
    [],
  );
  assert.equal(interactiveElements(doc(`<a href="/x" disabled>Go</a>`)).length, 1);
});
