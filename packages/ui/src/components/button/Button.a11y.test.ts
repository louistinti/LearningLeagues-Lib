// Button — local keyboard/behaviour suite (RFC §4, design record 2026-09-09
// §4). Discovered and run by scripts/check-a11y-engine.ts. Proves what the
// generic checks cannot: the two renderings and the forwarded onClick.
// Enter/Space activation is deliberately NOT simulated: it is native browser
// behaviour jsdom cannot prove; RFC §4.2 commits to no custom key handling,
// which is a review-of-source fact.
// Run: node --test packages/ui/src/components/button/Button.a11y.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { mountComponent } from "../../../../../scripts/lib/a11y-mount.ts";

const DIR = "packages/ui/src/components/button";
const click = (window: { MouseEvent: typeof MouseEvent }, el: Element) =>
  el.dispatchEvent(new window.MouseEvent("click", { bubbles: true, cancelable: true }));

test('no href: native <button type="button">, focusable, onClick fires on click', async () => {
  let clicks = 0;
  const { window, root, unmount } = await mountComponent(
    DIR,
    "Button",
    { onClick: () => clicks++ },
    "Start",
  );
  assert.equal(root.tagName, "BUTTON");
  assert.equal(root.getAttribute("role"), null); // RFC §4.1: no ARIA role override
  assert.equal(root.getAttribute("type"), "button");
  (root as HTMLElement).focus();
  assert.equal(window.document.activeElement, root);
  click(window, root);
  assert.equal(clicks, 1);
  await unmount();
});

test("href: native <a href>, type ignored, focusable, onClick fires on click", async () => {
  let clicks = 0;
  const { window, root, unmount } = await mountComponent(
    DIR,
    "Button",
    { href: "/rules", type: "submit", onClick: () => clicks++ },
    "View the rules",
  );
  assert.equal(root.tagName, "A");
  assert.equal(root.getAttribute("role"), null); // RFC §4.1: no ARIA role override
  assert.equal(root.getAttribute("href"), "/rules");
  assert.equal(root.getAttribute("type"), null);
  (root as HTMLElement).focus();
  assert.equal(window.document.activeElement, root);
  click(window, root);
  assert.equal(clicks, 1);
  await unmount();
});

test("type is honoured on the button rendering (submit)", async () => {
  const { root, unmount } = await mountComponent(DIR, "Button", { type: "submit" }, "Send");
  assert.equal(root.getAttribute("type"), "submit");
  await unmount();
});

test("label reaches the accessible name as authored (uppercase is CSS only)", async () => {
  const { root, unmount } = await mountComponent(DIR, "Button", {}, "Start a league");
  assert.equal(root.textContent, "Start a league");
  await unmount();
});

// current (RFC §3.1 / §4.1, 2026-09-16): the one ARIA attribute the component
// emits, on either rendering — the filled visual keys on it in button.css, so
// there is no way to show the state without announcing it.
test('current: <a href> carries aria-current="page"', async () => {
  const { root, unmount } = await mountComponent(
    DIR,
    "Button",
    { variant: "secondary", href: "/quiz", current: true },
    "Role quiz",
  );
  assert.equal(root.tagName, "A");
  assert.equal(root.getAttribute("aria-current"), "page");
  await unmount();
});

test('current: <button> carries aria-current="page" too (valid on any element)', async () => {
  const { root, unmount } = await mountComponent(DIR, "Button", { current: true }, "Here");
  assert.equal(root.tagName, "BUTTON");
  assert.equal(root.getAttribute("aria-current"), "page");
  await unmount();
});

test("without current, neither rendering carries aria-current", async () => {
  const a = await mountComponent(DIR, "Button", { href: "/rules" }, "Rules");
  assert.equal(a.root.getAttribute("aria-current"), null);
  await a.unmount();
  const b = await mountComponent(DIR, "Button", { current: false }, "Start");
  assert.equal(b.root.getAttribute("aria-current"), null);
  await b.unmount();
});
