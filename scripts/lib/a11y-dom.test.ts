// Smoke suite for the jsdom + axe runner (gate 9 plumbing): proves axe-core
// really executes inside a jsdom window on this Node, that the fragment
// rule list keeps a healthy fragment green, and that a real defect is red.
// Run: node --test scripts/lib/a11y-dom.test.ts (wrapped by check-detectors.ts)
import { test } from "node:test";
import assert from "node:assert/strict";
import { createWindow, runAxe, FRAGMENT_DISABLED_RULES } from "./a11y-dom.ts";

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
