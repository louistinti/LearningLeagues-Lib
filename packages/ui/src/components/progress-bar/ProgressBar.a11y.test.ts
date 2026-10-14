// ProgressBar — local behaviour suite (RFC §3.4 / §4, arbitrations §7 Q4,
// Q5 and the checkpoint rows). Discovered and run by
// scripts/check-a11y-engine.ts. Proves what the generic checks cannot: the
// one-root progressbar shape with every aria-value* always set, the name
// from exactly one of label / labelledBy, the clamp, the fill drawn as an
// SVG attribute (never a style), that nothing interactive or textual is
// rendered, and — L10 — that axe's aria-progressbar-name really fires on a
// nameless bar under the gate's own configuration.
// Run: node --test packages/ui/src/components/progress-bar/ProgressBar.a11y.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { mountComponent } from "../../../../../scripts/lib/a11y-mount.ts";
import { createWindow, runAxe } from "../../../../../scripts/lib/a11y-dom.ts";

const DIR = "packages/ui/src/components/progress-bar";
const base = { value: 8, max: 10, valueText: "8 of 10 validated" };

const fillOf = (root: Element) => root.querySelector("rect.ll-progress-bar-fill");

test("renders one <div class='ll-progress-bar' role='progressbar'> with every aria-value* (§3.4, §4.1)", async () => {
  const { root, unmount } = await mountComponent(DIR, "ProgressBar", {
    ...base,
    label: "Ranked readiness",
  });
  assert.equal(root.tagName, "DIV");
  assert.equal(root.className, "ll-progress-bar");
  assert.equal(root.getAttribute("role"), "progressbar");
  assert.equal(root.getAttribute("aria-label"), "Ranked readiness");
  assert.equal(root.getAttribute("aria-valuemin"), "0");
  assert.equal(root.getAttribute("aria-valuemax"), "10");
  assert.equal(root.getAttribute("aria-valuenow"), "8");
  assert.equal(root.getAttribute("aria-valuetext"), "8 of 10 validated"); // required (§7 checkpoint)
  assert.deepEqual(root.getAttributeNames().sort(), [
    "aria-label",
    "aria-valuemax",
    "aria-valuemin",
    "aria-valuenow",
    "aria-valuetext",
    "class",
    "role",
  ]);
  assert.equal(root.parentElement?.children.length, 1); // the div is the only thing rendered
  await unmount();
});

test("labelledBy names the bar through aria-labelledby, and never adds aria-label (§3.1)", async () => {
  const { root, unmount } = await mountComponent(DIR, "ProgressBar", {
    ...base,
    labelledBy: "ranked-heading",
  });
  assert.equal(root.getAttribute("aria-labelledby"), "ranked-heading");
  assert.equal(root.getAttribute("aria-label"), null);
  await unmount();
});

test("the fill is one aria-hidden <svg> holding one rect whose width attribute is value / max — no style anywhere (§3.4, §3.5 point 1)", async () => {
  const { root, unmount } = await mountComponent(DIR, "ProgressBar", {
    ...base,
    label: "Ranked readiness",
  });
  assert.equal(root.children.length, 1);
  const svg = root.children[0];
  assert.equal(svg.tagName.toLowerCase(), "svg");
  assert.equal(svg.getAttribute("aria-hidden"), "true");
  assert.equal(svg.children.length, 1);
  const fill = fillOf(root);
  assert.ok(fill, "rect.ll-progress-bar-fill");
  assert.equal(fill.getAttribute("width"), "80%");
  assert.equal(fill.getAttribute("height"), "100%");
  // The docs page renders examples as static markup, and the token lint
  // reds any non-empty HTML style attribute there (inline-style-static).
  assert.equal(/\bstyle=/.test(root.outerHTML), false);
  await unmount();
});

test("value is clamped to [0, max] for the fill and aria-valuenow alike (§3.4)", async () => {
  for (const [value, now, width] of [
    [-3, "0", "0%"],
    [0, "0", "0%"],
    [15, "10", "100%"],
    [10, "10", "100%"],
    [2.5, "2.5", "25%"],
  ] as const) {
    const { root, unmount } = await mountComponent(DIR, "ProgressBar", {
      ...base,
      value,
      label: "Ranked readiness",
    });
    assert.equal(root.getAttribute("aria-valuenow"), now, `value ${value}`);
    assert.equal(fillOf(root)?.getAttribute("width"), width, `value ${value}`);
    await unmount();
  }
});

test("a degenerate max (≤ 0, non-finite) or a non-finite value renders an empty fill and aria-valuenow 0 (§3.5 point 5)", async () => {
  for (const [value, max] of [
    [5, 0],
    [5, -4],
    [5, Number.NaN],
    [Number.NaN, 10],
    [Number.POSITIVE_INFINITY, 10],
  ]) {
    const { root, unmount } = await mountComponent(DIR, "ProgressBar", {
      value,
      max,
      valueText: "n/a",
      label: "Degenerate",
    });
    assert.equal(root.getAttribute("aria-valuenow"), "0", `value ${value}, max ${max}`);
    assert.match(root.getAttribute("aria-valuemax") ?? "", /^\d+(\.\d+)?$/, `max ${max}`);
    assert.equal(fillOf(root)?.getAttribute("width"), "0%", `value ${value}, max ${max}`);
    await unmount();
  }
});

test("nothing interactive and no text of its own (§3.2, §3.3, §4.2)", async () => {
  const { root, unmount } = await mountComponent(DIR, "ProgressBar", {
    ...base,
    label: "Ranked readiness",
  });
  assert.equal(root.querySelector("a, button, input, select, textarea, [tabindex]"), null);
  assert.equal(root.getAttribute("tabindex"), null);
  assert.equal(root.textContent, "");
  await unmount();
});

// L10: the gate relies on axe's aria-progressbar-name to red a nameless bar
// (RFC §4.3, "The name is enforced twice"). Locked here, under the gate's
// own configuration (createWindow + runAxe in fragment mode, WCAG tags).
test("axe under the gate's configuration reds a nameless bar with aria-progressbar-name, and passes a named one (§4.3, L10)", async () => {
  const markup = async (props: Record<string, unknown>) => {
    const { root, unmount } = await mountComponent(DIR, "ProgressBar", props);
    const html = root.outerHTML;
    await unmount();
    return html;
  };
  const ids = async (html: string) => {
    const window = createWindow({ html, css: "", accent: "ambre" });
    try {
      return (await runAxe(window)).violations.map((v) => v.id);
    } finally {
      window.close();
    }
  };
  // A nameless bar is refused by the type; a JavaScript caller can still render one.
  assert.deepEqual(await ids(await markup({ ...base })), ["aria-progressbar-name"]);
  assert.deepEqual(await ids(await markup({ ...base, label: "Ranked readiness" })), []);
});
