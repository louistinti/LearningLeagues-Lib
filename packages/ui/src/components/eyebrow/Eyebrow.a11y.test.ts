// Eyebrow — local behaviour suite (RFC §3.4 / §4, arbitrations §7 Q3, Q4,
// Q10). Discovered and run by scripts/check-a11y-engine.ts. Proves what the
// generic checks cannot: the one-<span> shape with no ARIA and no wrapper,
// the tone → class mapping, that nothing interactive is rendered, that the
// uppercase is CSS only (the DOM keeps the author's casing), and that inline
// children pass through untouched.
// Run: node --test packages/ui/src/components/eyebrow/Eyebrow.a11y.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { mountComponent } from "../../../../../scripts/lib/a11y-mount.ts";

const DIR = "packages/ui/src/components/eyebrow";

test("renders one <span class='ll-eyebrow ll-eyebrow--mute'> by default — no role, no aria-*, no child element (§3.4, §7 Q3–Q4)", async () => {
  const { root, unmount } = await mountComponent(DIR, "Eyebrow", {}, "Rift · Compass");
  assert.equal(root.tagName, "SPAN");
  assert.equal(root.className, "ll-eyebrow ll-eyebrow--mute");
  assert.equal(root.textContent, "Rift · Compass");
  assert.equal(root.getAttribute("role"), null); // RFC §4.1: no ARIA role
  assert.deepEqual(root.getAttributeNames(), ["class"]); // no aria-*, nothing but the classes
  assert.equal(root.children.length, 0); // text only — no wrapper, no glyph
  await unmount();
});

test("tone='accent' → ll-eyebrow--accent, and the mute class is absent (§3.1, §7 Q10)", async () => {
  const { root, unmount } = await mountComponent(DIR, "Eyebrow", { tone: "accent" }, "Mech");
  assert.ok(root.classList.contains("ll-eyebrow"));
  assert.ok(root.classList.contains("ll-eyebrow--accent"));
  assert.ok(!root.classList.contains("ll-eyebrow--mute"));
  await unmount();
});

test("nothing interactive is rendered by the component itself (§3.3, §4.2)", async () => {
  const { root, unmount } = await mountComponent(DIR, "Eyebrow", { tone: "mute" }, "Map");
  assert.equal(root.querySelector("a, button, input, select, textarea, [tabindex]"), null);
  assert.equal(root.getAttribute("tabindex"), null);
  await unmount();
});

test("the DOM text keeps the author's casing — uppercase is CSS only (§3.4, §4.1)", async () => {
  const { root, unmount } = await mountComponent(DIR, "Eyebrow", {}, "Rift compass");
  assert.equal(root.textContent, "Rift compass");
  await unmount();
});

test("inline children are rendered as given, still inside the one span (§3.2)", async () => {
  // mountComponent types children as a string; a real element is forwarded
  // to React.createElement untouched, and React resolves to the single root
  // instance the mount bundle also requires.
  const inline = React.createElement("b", null, "3") as unknown as string;
  const { root, unmount } = await mountComponent(DIR, "Eyebrow", { tone: "accent" }, inline);
  assert.equal(root.tagName, "SPAN");
  assert.equal(root.children.length, 1);
  assert.equal(root.children[0].tagName, "B");
  assert.equal(root.children[0].textContent, "3");
  assert.equal(root.parentElement?.children.length, 1); // the span is the only thing rendered
  await unmount();
});
