// MetaStrip — local behaviour suite (RFC §3.4 / §4, arbitrations §7 Q3, Q4,
// Q5, Q6, Q8). Discovered and run by scripts/check-a11y-engine.ts. Proves
// what the generic checks cannot: the one <ul role="list"> shape with one
// <li> per fact and no wrapper, that every key is a real Eyebrow carrying the
// strip's tone, the literal space between key and value (and its absence for
// a key alone), that empty items renders nothing, and that nothing
// interactive or ARIA beyond role="list" is rendered.
// Run: node --test packages/ui/src/components/meta-strip/MetaStrip.a11y.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { mountComponent } from "../../../../../scripts/lib/a11y-mount.ts";
import { renderExamples } from "../../../../../scripts/lib/docs-render.ts";

const DIR = "packages/ui/src/components/meta-strip";
const facts = [
  { label: "Read time", value: "~15 min" },
  { label: "Patch", value: "26.12" },
  { label: "Patch-stable" },
];

test("renders one <ul class='ll-meta-strip' role='list'> with one <li> per fact, in order — nothing else (§3.4, §4.1, §7 Q8)", async () => {
  const { root, unmount } = await mountComponent(DIR, "MetaStrip", { items: facts });
  assert.equal(root.tagName, "UL");
  assert.equal(root.className, "ll-meta-strip");
  assert.equal(root.getAttribute("role"), "list"); // explicit: WebKit drops it under list-style: none (§4.3)
  assert.deepEqual(root.getAttributeNames().sort(), ["class", "role"]); // no aria-*, no name
  assert.equal(root.parentElement?.children.length, 1); // the ul is the only thing rendered
  assert.equal(root.childNodes.length, 3); // no text, no separator between two li (§7 Q6)
  for (const li of Array.from(root.children)) {
    assert.equal(li.tagName, "LI");
    assert.deepEqual(li.getAttributeNames(), ["class"]);
    assert.equal(li.className, "ll-meta-strip-item");
  }
  assert.deepEqual(
    Array.from(root.children).map((li) => li.textContent),
    ["Read time ~15 min", "Patch 26.12", "Patch-stable"],
  );
  await unmount();
});

test("every key is a real Eyebrow, dim by default (§3.4, §7 Q3, Q4)", async () => {
  const { root, unmount } = await mountComponent(DIR, "MetaStrip", { items: facts });
  for (const li of Array.from(root.children)) {
    const key = li.children[0];
    assert.equal(key.tagName, "SPAN");
    assert.equal(key.className, "ll-eyebrow ll-eyebrow--dim");
  }
  await unmount();
});

test("tone='accent' → every key ll-eyebrow--accent, none dim (§3.1, §7 Q4)", async () => {
  const { root, unmount } = await mountComponent(DIR, "MetaStrip", {
    items: facts,
    tone: "accent",
  });
  const keys = Array.from(root.querySelectorAll(".ll-eyebrow"));
  assert.equal(keys.length, 3);
  for (const key of keys) {
    assert.ok(key.classList.contains("ll-eyebrow--accent"));
    assert.ok(!key.classList.contains("ll-eyebrow--dim"));
  }
  await unmount();
});

test("a value follows one literal space; a key alone has no space and no value span (§3.4, §4.1)", async () => {
  const { root, unmount } = await mountComponent(DIR, "MetaStrip", { items: facts });
  const [withValue, , keyAlone] = Array.from(root.children);
  // key span, the " " text node, the value span
  assert.equal(withValue.childNodes.length, 3);
  assert.equal(withValue.childNodes[1].nodeType, 3); // TEXT_NODE
  assert.equal(withValue.childNodes[1].textContent, " ");
  const value = withValue.childNodes[2] as Element;
  assert.equal(value.tagName, "SPAN");
  assert.deepEqual(value.getAttributeNames(), ["class"]);
  assert.equal(value.className, "ll-meta-strip-value");
  assert.equal(value.textContent, "~15 min");
  // key alone: the Eyebrow and nothing else
  assert.equal(keyAlone.childNodes.length, 1);
  assert.equal(keyAlone.querySelector(".ll-meta-strip-value"), null);
  assert.equal(keyAlone.textContent, "Patch-stable");
  await unmount();
});

test("a null value counts as absent — no space, no value span (§3.4)", async () => {
  const { root, unmount } = await mountComponent(DIR, "MetaStrip", {
    items: [{ label: "Patch-stable", value: null }],
  });
  const li = root.children[0];
  assert.equal(li.childNodes.length, 1);
  assert.equal(li.textContent, "Patch-stable");
  await unmount();
});

test("the DOM keeps the author's casing — the key's uppercase is the Eyebrow's CSS (§4.1)", async () => {
  const { root, unmount } = await mountComponent(DIR, "MetaStrip", { items: facts });
  assert.equal(root.querySelector(".ll-eyebrow")?.textContent, "Read time");
  await unmount();
});

test("element content in label and value passes through untouched (§3.1, §3.2)", async () => {
  const items = [
    {
      label: React.createElement("b", null, "25"),
      value: React.createElement("em", null, "fundamentals"),
    },
  ];
  const { root, unmount } = await mountComponent(DIR, "MetaStrip", { items });
  const li = root.children[0];
  assert.equal(li.querySelector(".ll-eyebrow > b")?.textContent, "25");
  assert.equal(li.querySelector(".ll-meta-strip-value > em")?.textContent, "fundamentals");
  assert.equal(li.textContent, "25 fundamentals");
  await unmount();
});

test("nothing interactive and no ARIA beyond role='list' (§3.4, §4.2)", async () => {
  const { root, unmount } = await mountComponent(DIR, "MetaStrip", {
    items: facts,
    tone: "accent",
  });
  assert.equal(root.querySelector("a, button, input, select, textarea, [tabindex]"), null);
  for (const el of [root, ...Array.from(root.querySelectorAll("*"))])
    assert.deepEqual(
      el.getAttributeNames().filter((n) => n.startsWith("aria-") || (n === "role" && el !== root)),
      [],
    );
  await unmount();
});

test("empty items renders nothing — never an empty list (§3.4)", () => {
  const [html] = renderExamples(DIR, "MetaStrip", [{ label: "empty", props: { items: [] } }]);
  assert.equal(html, "");
});
