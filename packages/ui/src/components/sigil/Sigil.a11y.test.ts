// Sigil — local behaviour suite (RFC §3.4 / §4, arbitrations §7 Q2, Q11).
// Discovered and run by scripts/check-a11y-engine.ts. Proves what the
// generic checks cannot: the one-root shape with aria-hidden always on, the
// single art slot holding exactly the children, that nothing interactive is
// rendered, and that a real element child passes through untouched.
// Run: node --test packages/ui/src/components/sigil/Sigil.a11y.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { mountComponent } from "../../../../../scripts/lib/a11y-mount.ts";

const DIR = "packages/ui/src/components/sigil";
const art = () =>
  React.createElement(
    "svg",
    { viewBox: "0 0 200 200", fill: "none", stroke: "currentColor" },
    React.createElement("polygon", { points: "100,10 180,55 180,145 100,190 20,145 20,55" }),
  );

test("renders one <div class='ll-sigil' aria-hidden='true'> holding one .ll-sigil-art (§3.4, §4.1)", async () => {
  const { root, unmount } = await mountComponent(
    DIR,
    "Sigil",
    {},
    { snippet: "<svg />", node: art() },
  );
  assert.equal(root.tagName, "DIV");
  assert.equal(root.className, "ll-sigil");
  assert.equal(root.getAttribute("aria-hidden"), "true"); // unconditional (§4.3)
  assert.deepEqual(root.getAttributeNames().sort(), ["aria-hidden", "class"]); // no role, no other aria-*
  assert.equal(root.children.length, 1);
  assert.equal(root.children[0].className, "ll-sigil-art");
  assert.equal(root.parentElement?.children.length, 1); // the div is the only thing rendered
  await unmount();
});

test("the art slot holds exactly the children — an element child passes through untouched (§3.2)", async () => {
  const { root, unmount } = await mountComponent(
    DIR,
    "Sigil",
    {},
    { snippet: "<svg />", node: art() },
  );
  const slot = root.children[0];
  assert.equal(slot.children.length, 1);
  assert.equal(slot.children[0].tagName.toLowerCase(), "svg");
  assert.equal(slot.children[0].getAttribute("viewBox"), "0 0 200 200");
  assert.equal(
    slot.querySelector("polygon")?.getAttribute("points"),
    "100,10 180,55 180,145 100,190 20,145 20,55",
  );
  await unmount();
});

test("nothing interactive is rendered by the component itself (§3.3, §4.2)", async () => {
  const { root, unmount } = await mountComponent(
    DIR,
    "Sigil",
    {},
    { snippet: "<svg />", node: art() },
  );
  assert.equal(root.querySelector("a, button, input, select, textarea, [tabindex]"), null);
  assert.equal(root.getAttribute("tabindex"), null);
  await unmount();
});

test("no text of its own: the frame carries no label (§7 Q11)", async () => {
  const { root, unmount } = await mountComponent(
    DIR,
    "Sigil",
    {},
    { snippet: "<svg />", node: art() },
  );
  assert.equal(root.textContent, "");
  await unmount();
});
