// Callout — local behaviour suite (RFC §3.4 / §4, arbitrations §7 Q3, Q5,
// Q7). Discovered and run by scripts/check-a11y-engine.ts. Proves what the
// generic checks cannot: the type → label mapping, the optional <h3>, the
// decorative glyph, and that nothing interactive is rendered.
// Run: node --test packages/ui/src/components/callout/Callout.a11y.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { mountComponent } from "../../../../../scripts/lib/a11y-mount.ts";

const DIR = "packages/ui/src/components/callout";

test("renders <article> with the tag first, then the <h3>, then the body", async () => {
  const { root, unmount } = await mountComponent(
    DIR,
    "Callout",
    { type: "key", title: "Shove, then leave" },
    "Fast-push the wave.",
  );
  assert.equal(root.tagName, "ARTICLE");
  assert.equal(root.getAttribute("role"), null); // RFC §4.1: no ARIA role override
  const [tag, h3, body] = [...root.children];
  assert.equal(tag.className, "ll-callout-tag");
  assert.equal(h3.tagName, "H3");
  assert.equal(h3.textContent, "Shove, then leave");
  assert.equal(body.className, "ll-callout-body");
  assert.equal(body.textContent, "Fast-push the wave.");
  await unmount();
});

test("the label comes from the type, never from a prop (§7 Q5)", async () => {
  for (const [type, label] of [
    ["key", "Key concept"],
    ["pro", "Pro tip"],
    ["trap", "Trap"],
  ] as const) {
    const { root, unmount } = await mountComponent(DIR, "Callout", { type }, "Body.");
    const tag = root.querySelector(".ll-callout-tag");
    assert.equal(tag?.textContent, label, type);
    assert.ok(root.classList.contains(`ll-callout--${type}`));
    await unmount();
  }
});

test("no title → no heading element at all (§7 Q7)", async () => {
  const { root, unmount } = await mountComponent(DIR, "Callout", { type: "pro" }, "Body.");
  assert.equal(root.querySelector("h1, h2, h3, h4, h5, h6"), null);
  assert.equal(root.children.length, 2);
  await unmount();
});

test("the glyph is decorative: aria-hidden and empty (§7 Q3)", async () => {
  const { root, unmount } = await mountComponent(DIR, "Callout", { type: "trap" }, "Body.");
  const glyph = root.querySelector(".ll-callout-glyph");
  assert.equal(glyph?.getAttribute("aria-hidden"), "true");
  assert.equal(glyph?.textContent, "");
  await unmount();
});

test("nothing interactive is rendered by the component itself", async () => {
  const { root, unmount } = await mountComponent(
    DIR,
    "Callout",
    { type: "key", title: "T" },
    "Body.",
  );
  assert.equal(root.querySelector("a, button, input, select, textarea, [tabindex]"), null);
  await unmount();
});
