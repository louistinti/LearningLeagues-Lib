// Unit suite for the docs-site real-browser smoke judgement (blueprint
// §5.2.10), run inside gate 10. Every case is a behaviour the smoke gate
// relies on: a healthy page has no findings, and each rule reds exactly on
// its own symptom. Facts are synthetic here — the real ones come from
// collectFacts inside Chromium, proved by the gate's injection rows.
// Run: node --test scripts/lib/docs-smoke.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { judgePage, type Facts } from "./docs-smoke.ts";

const good = (): Facts => ({
  title: "Button — LearningLeagues Lib",
  bodyPainted: true,
  main: { box: { w: 1040, h: 3401 }, text: 3755 },
  h1: { box: { w: 976, h: 54 }, text: 13 },
  stages: [{ visibleChildren: 3 }],
  tiles: [{ name: "ambre", visibleChildren: 1 }],
  hasPanels: false,
  activePanel: null,
});
const rules = (f: Facts, events: string[] = []) => judgePage(f, events).map((x) => x.rule);

test("a healthy page has no findings", () => assert.deepEqual(rules(good()), []));

test("page-events: every collected event is a finding of its own", () => {
  const out = judgePage(good(), ["page error: boom", "request failed: x.css"]);
  assert.deepEqual(
    out.map((f) => f.rule),
    ["page-events", "page-events"],
  );
  assert.ok(out[1].message.includes("x.css"));
});

test("stylesheet: an unpainted body is red", () => {
  assert.deepEqual(rules({ ...good(), bodyPainted: false }), ["stylesheet"]);
});

test("main-content: no <main>, an empty box, or no text — each is red", () => {
  assert.deepEqual(rules({ ...good(), main: null }), ["main-content"]);
  assert.deepEqual(rules({ ...good(), main: { box: { w: 0, h: 0 }, text: 5 } }), ["main-content"]);
  assert.deepEqual(rules({ ...good(), main: { box: { w: 10, h: 10 }, text: 0 } }), [
    "main-content",
  ]);
});

test("heading: no <h1>, an empty box, or no text — each is red", () => {
  assert.deepEqual(rules({ ...good(), h1: null }), ["heading"]);
  assert.deepEqual(rules({ ...good(), h1: { box: { w: 0, h: 54 }, text: 5 } }), ["heading"]);
  assert.deepEqual(rules({ ...good(), h1: { box: { w: 10, h: 10 }, text: 0 } }), ["heading"]);
});

test("demo-stage: a stage with nothing visible is red, and names its position", () => {
  const out = judgePage(
    { ...good(), stages: [{ visibleChildren: 2 }, { visibleChildren: 0 }] },
    [],
  );
  assert.deepEqual(
    out.map((f) => f.rule),
    ["demo-stage"],
  );
  assert.ok(out[0].message.includes("#2"));
});

test("demo-stage: a page without stages (registry, tokens) is not red", () => {
  assert.deepEqual(rules({ ...good(), stages: [] }), []);
});

test("accent-tile: a tile with nothing beyond its name is red, naming the accent", () => {
  const out = judgePage({ ...good(), tiles: [{ name: "jade", visibleChildren: 0 }] }, []);
  assert.deepEqual(
    out.map((f) => f.rule),
    ["accent-tile"],
  );
  assert.ok(out[0].message.includes("jade"));
});

test("tab-panel: panels present but none active, an empty active box, or no table — each is red", () => {
  assert.deepEqual(rules({ ...good(), hasPanels: true, activePanel: null }), ["tab-panel"]);
  assert.deepEqual(
    rules({
      ...good(),
      hasPanels: true,
      activePanel: { id: "primitives", box: { w: 0, h: 0 }, tables: 3 },
    }),
    ["tab-panel"],
  );
  assert.deepEqual(
    rules({
      ...good(),
      hasPanels: true,
      activePanel: { id: "primitives", box: { w: 976, h: 1756 }, tables: 0 },
    }),
    ["tab-panel"],
  );
});

test("tab-panel: a healthy tokens page passes", () => {
  assert.deepEqual(
    rules({
      ...good(),
      hasPanels: true,
      activePanel: { id: "primitives", box: { w: 976, h: 1756 }, tables: 5 },
    }),
    [],
  );
});

test("page-title: an empty or blank title is red", () => {
  assert.deepEqual(rules({ ...good(), title: "" }), ["page-title"]);
  assert.deepEqual(rules({ ...good(), title: "   " }), ["page-title"]);
});

test("never short-circuits: several symptoms are all listed", () => {
  const out = rules({ ...good(), bodyPainted: false, h1: null, stages: [{ visibleChildren: 0 }] }, [
    "page error: x",
  ]);
  assert.deepEqual(out, ["page-events", "stylesheet", "heading", "demo-stage"]);
});
