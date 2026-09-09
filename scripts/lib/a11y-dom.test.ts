// Smoke suite for the jsdom + axe runner (gate 9 plumbing): proves axe-core
// really executes inside a jsdom window on this Node, that the fragment
// rule list keeps a healthy fragment green, and that a real defect is red.
// Run: node --test scripts/lib/a11y-dom.test.ts (wrapped by check-detectors.ts)
import { test } from "node:test";
import assert from "node:assert/strict";
import axe from "axe-core";
import { createWindow, runAxe, FRAGMENT_DISABLED_RULES, WCAG_TAGS } from "./a11y-dom.ts";

const CSS = ".ll-button:focus-visible { outline: 2px solid var(--ll-accent); }";

test("healthy button + link fragment: zero violations under the fragment rule list", async () => {
  const window = createWindow({
    html: `<button class="ll-button" type="button">Start</button><a class="ll-button" href="/x">Open</a>`,
    css: CSS,
    accent: "ambre",
  });
  const r = await runAxe(window);
  window.close();
  assert.deepEqual(r.violations, []);
  assert.ok(r.passes > 0);
});

test("empty button label is an axe violation (button-name)", async () => {
  const window = createWindow({
    html: `<button type="button"></button>`,
    css: CSS,
    accent: "ambre",
  });
  const r = await runAxe(window);
  window.close();
  assert.deepEqual(
    r.violations.map((v) => v.id),
    ["button-name"],
  );
});

test("page-level rules are the documented four and are off for fragments", async () => {
  assert.deepEqual(FRAGMENT_DISABLED_RULES, [
    "region",
    "bypass",
    "landmark-one-main",
    "page-has-heading-one",
  ]);
  // Without the list, a bare fragment fails `region` (spike 2026-09-09).
  const window = createWindow({
    html: `<button type="button">Go</button>`,
    css: "",
    accent: "bleu",
  });
  const r = await runAxe(window);
  window.close();
  assert.ok(!r.violations.some((v) => FRAGMENT_DISABLED_RULES.includes(v.id)));
});

test("DOCUMENTED LIMITATION — color-contrast comes back incomplete, never a violation, in jsdom", async () => {
  const window = createWindow({
    html: `<button type="button">Go</button>`,
    css: "",
    accent: "jade",
  });
  const r = await runAxe(window);
  window.close();
  assert.ok(r.incomplete.some((v) => v.id === "color-contrast"));
  assert.ok(!r.violations.some((v) => v.id === "color-contrast"));
});

test("createWindow contract: data-accent, lang, and the style block land verbatim", () => {
  const window = createWindow({
    html: `<button type="button">Go</button>`,
    css: CSS,
    accent: "ambre",
  });
  assert.equal(window.document.documentElement.getAttribute("data-accent"), "ambre");
  assert.equal(window.document.documentElement.getAttribute("lang"), "en");
  assert.equal(window.document.querySelector("style")?.textContent, CSS);
  window.close();
});

test("createWindow guards: accent and css are rejected loudly, not interpolated", () => {
  assert.throws(() => createWindow({ html: "", css: "", accent: 'x" data-foo="1' }));
  assert.throws(() =>
    createWindow({ html: "", css: "</style><script>1</script>", accent: "bleu" }),
  );
});

test("every WCAG tag the gate passes selects at least one axe rule (a typo would drop a level silently)", () => {
  for (const tag of WCAG_TAGS)
    assert.ok(axe.getRules([tag]).length > 0, `tag ${tag} selects no rule`);
});
