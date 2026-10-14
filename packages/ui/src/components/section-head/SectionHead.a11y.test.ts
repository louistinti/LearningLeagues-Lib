// SectionHead — local behaviour suite (RFC §3.4 / §4, arbitrations §7 Q2,
// Q8–Q11). Discovered and run by scripts/check-a11y-engine.ts. Proves what
// the generic checks cannot: the one-root shape (hidden number, then a body
// holding one h2 and an optional p), the number rendered verbatim and
// aria-hidden outside the heading, the lede left out entirely when omitted,
// the id forwarded to the h2 only, an <em> in the title reaching the DOM
// untouched, and that nothing interactive is rendered.
// Run: node --test packages/ui/src/components/section-head/SectionHead.a11y.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { mountComponent } from "../../../../../scripts/lib/a11y-mount.ts";

const DIR = "packages/ui/src/components/section-head";
const full = { num: "01", title: "Phases", lede: "What you do at each moment of the game." };

test("renders one <div class='ll-section-head'>: the hidden number, then a body with one h2 and one p (§3.4, §4.1)", async () => {
  const { root, unmount } = await mountComponent(DIR, "SectionHead", full);
  assert.equal(root.tagName, "DIV");
  assert.equal(root.className, "ll-section-head");
  assert.deepEqual(root.getAttributeNames(), ["class"]); // no role, no aria-*, no id on the root
  assert.equal(root.parentElement?.children.length, 1); // the div is the only thing rendered
  assert.equal(root.children.length, 2);
  const [num, body] = Array.from(root.children);
  assert.equal(num.tagName, "SPAN");
  assert.equal(num.className, "ll-section-head-num");
  assert.equal(body.tagName, "DIV");
  assert.equal(body.className, "ll-section-head-body");
  assert.deepEqual(
    Array.from(body.children).map((c) => `${c.tagName}.${c.className}`),
    ["H2.ll-section-head-title", "P.ll-section-head-lede"],
  );
  assert.equal(body.children[1].textContent, full.lede);
  await unmount();
});

test("the number is rendered verbatim, aria-hidden, outside the heading (§3.1, §7 Q2, Q9)", async () => {
  const { root, unmount } = await mountComponent(DIR, "SectionHead", { ...full, num: "07" });
  const num = root.querySelector(".ll-section-head-num") as Element;
  assert.equal(num.textContent, "07"); // never formatted by the component
  assert.equal(num.getAttribute("aria-hidden"), "true"); // unconditional (§4.3)
  assert.equal(num.children.length, 0); // text only
  const h2 = root.querySelector("h2") as Element;
  assert.equal(h2.contains(num), false);
  assert.equal(h2.textContent, "Phases"); // the heading's name is the title alone
  await unmount();
});

test("always exactly one h2, whatever the props (§7 Q10)", async () => {
  const { root, unmount } = await mountComponent(DIR, "SectionHead", { num: "02", title: "Wave" });
  assert.equal(root.querySelectorAll("h1, h2, h3, h4, h5, h6").length, 1);
  assert.equal(root.querySelectorAll("h2").length, 1);
  await unmount();
});

test("lede omitted or empty → no <p> at all (§3.1, §7 Q11)", async () => {
  for (const props of [
    { num: "02", title: "Wave management" },
    { num: "02", title: "Wave management", lede: "" },
  ]) {
    const { root, unmount } = await mountComponent(DIR, "SectionHead", props);
    assert.equal(root.querySelector("p"), null);
    assert.equal(root.querySelector(".ll-section-head-body")?.children.length, 1);
    await unmount();
  }
});

test("id given → on the h2 only; omitted → no id attribute anywhere (§3.1)", async () => {
  const withId = await mountComponent(DIR, "SectionHead", { ...full, id: "phases" });
  assert.equal(withId.root.querySelector("h2")?.getAttribute("id"), "phases");
  assert.equal(withId.root.getAttribute("id"), null);
  assert.equal(withId.root.querySelectorAll("[id]").length, 1);
  await withId.unmount();
  const without = await mountComponent(DIR, "SectionHead", full);
  assert.equal(without.root.querySelectorAll("[id]").length, 0);
  assert.equal(without.root.getAttribute("id"), null);
  await without.unmount();
});

test("an <em> in the title reaches the DOM untouched, inside the h2 (§3.4, §7 Q8)", async () => {
  // A real element prop, built with createElement (a .ts file); React
  // resolves to the single root instance the mount bundle also requires.
  const title = React.createElement(
    React.Fragment,
    null,
    "Start with the ",
    React.createElement("em", null, "six."),
  );
  const { root, unmount } = await mountComponent(DIR, "SectionHead", { num: "01", title });
  const h2 = root.querySelector("h2") as Element;
  assert.equal(h2.textContent, "Start with the six.");
  assert.equal(h2.children.length, 1);
  assert.equal(h2.children[0].tagName, "EM");
  assert.equal(h2.children[0].textContent, "six.");
  assert.deepEqual(h2.children[0].getAttributeNames(), []); // untouched: no class, no style
  await unmount();
});

test("nothing interactive is rendered by the component itself (§3.3, §4.2)", async () => {
  const { root, unmount } = await mountComponent(DIR, "SectionHead", { ...full, id: "phases" });
  assert.equal(root.querySelector("a, button, input, select, textarea, [tabindex]"), null);
  assert.equal(root.getAttribute("tabindex"), null);
  await unmount();
});
