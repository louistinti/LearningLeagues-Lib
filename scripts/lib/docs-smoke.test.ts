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
  stages: [{ visibleDescendants: 3, text: 44, graphics: 0 }],
  tiles: [{ name: "ambre", visibleDescendants: 1, text: 20, graphics: 0 }],
  hasPanels: false,
  activePanel: null,
});
const rules = (f: Facts, events: string[] = []) => judgePage(f, events, "other").map((x) => x.rule);
// The first finding's message — so a rule that reds on the wrong branch is caught too.
const message = (f: Facts) => judgePage(f, [], "other")[0].message;

test("a healthy page has no findings", () => assert.deepEqual(rules(good()), []));

test("page-events: every collected event is a finding of its own", () => {
  const out = judgePage(good(), ["page error: boom", "request failed: x.css"], "other");
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
  assert.ok(message({ ...good(), main: null }).includes("no <main>"));
  assert.ok(message({ ...good(), main: { box: { w: 0, h: 0 }, text: 5 } }).includes("empty box"));
  assert.ok(message({ ...good(), main: { box: { w: 10, h: 10 }, text: 0 } }).includes("no text"));
});

test("heading: no <h1>, an empty box, or no text — each is red", () => {
  assert.deepEqual(rules({ ...good(), h1: null }), ["heading"]);
  assert.deepEqual(rules({ ...good(), h1: { box: { w: 0, h: 54 }, text: 5 } }), ["heading"]);
  assert.deepEqual(rules({ ...good(), h1: { box: { w: 10, h: 10 }, text: 0 } }), ["heading"]);
  assert.ok(message({ ...good(), h1: null }).includes("no <h1>"));
  assert.ok(message({ ...good(), h1: { box: { w: 0, h: 54 }, text: 5 } }).includes("empty box"));
  assert.ok(message({ ...good(), h1: { box: { w: 10, h: 10 }, text: 0 } }).includes("no text"));
});

test("demo-stage: a stage with nothing visible is red, and names its position", () => {
  const out = judgePage(
    {
      ...good(),
      stages: [
        { visibleDescendants: 2, text: 30, graphics: 0 },
        { visibleDescendants: 0, text: 0, graphics: 0 },
      ],
    },
    [],
    "other",
  );
  assert.deepEqual(
    out.map((f) => f.rule),
    ["demo-stage"],
  );
  assert.ok(out[0].message.includes("#2"));
});

test("demo-stage: visible descendants but no rendered text and no graphic is red (an empty padded block)", () => {
  const out = judgePage(
    { ...good(), stages: [{ visibleDescendants: 1, text: 0, graphics: 0 }] },
    [],
    "other",
  );
  assert.deepEqual(
    out.map((f) => f.rule),
    ["demo-stage"],
  );
  assert.ok(out[0].message.includes("renders no text and no graphic"));
});

test("demo-stage: a drawn graphic with no text is content — a decorative component passes", () => {
  assert.deepEqual(
    judgePage(
      { ...good(), stages: [{ visibleDescendants: 5, text: 0, graphics: 3 }] },
      [],
      "component",
    ),
    [],
  );
});

test("demo-stage: a page without stages (registry, tokens — kind other) is not red", () => {
  assert.deepEqual(judgePage({ ...good(), stages: [] }, [], "other"), []);
});

test("demo-stage: a component page with no stage at all is red", () => {
  const out = judgePage({ ...good(), stages: [] }, [], "component");
  assert.deepEqual(
    out.map((f) => f.rule),
    ["demo-stage"],
  );
  assert.ok(out[0].message.includes("no demo stage at all"));
});

test("accent-tile: a tile with nothing beyond its name is red, naming the accent", () => {
  const out = judgePage(
    { ...good(), tiles: [{ name: "jade", visibleDescendants: 0, text: 0, graphics: 0 }] },
    [],
    "other",
  );
  assert.deepEqual(
    out.map((f) => f.rule),
    ["accent-tile"],
  );
  assert.ok(out[0].message.includes("jade"));
});

test("accent-tile: visible descendants but no text and no graphic beyond the name is red", () => {
  const out = judgePage(
    { ...good(), tiles: [{ name: "bleu", visibleDescendants: 1, text: 0, graphics: 0 }] },
    [],
    "other",
  );
  assert.deepEqual(
    out.map((f) => f.rule),
    ["accent-tile"],
  );
  assert.ok(out[0].message.includes("no text and no graphic beyond its name"));
});

test("accent-tile: a drawn graphic with no text beyond the name is content — not red", () => {
  assert.deepEqual(
    judgePage(
      { ...good(), tiles: [{ name: "violet", visibleDescendants: 5, text: 0, graphics: 3 }] },
      [],
      "component",
    ),
    [],
  );
});

test("accent-tile: a component page with no tile at all is red; kind other is not", () => {
  const out = judgePage({ ...good(), tiles: [] }, [], "component");
  assert.deepEqual(
    out.map((f) => f.rule),
    ["accent-tile"],
  );
  assert.ok(out[0].message.includes("no accent tile at all"));
  assert.deepEqual(judgePage({ ...good(), tiles: [] }, [], "other"), []);
});

test("component page: no stage AND no tile are both listed, and a healthy component page passes", () => {
  assert.deepEqual(
    judgePage({ ...good(), stages: [], tiles: [] }, [], "component").map((f) => f.rule),
    ["demo-stage", "accent-tile"],
  );
  assert.deepEqual(judgePage(good(), [], "component"), []);
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
  assert.ok(message({ ...good(), hasPanels: true, activePanel: null }).includes("none is visible"));
  assert.ok(
    message({
      ...good(),
      hasPanels: true,
      activePanel: { id: "primitives", box: { w: 0, h: 0 }, tables: 3 },
    }).includes("empty box"),
  );
  assert.ok(
    message({
      ...good(),
      hasPanels: true,
      activePanel: { id: "primitives", box: { w: 976, h: 1756 }, tables: 0 },
    }).includes("no table"),
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
  const out = rules(
    {
      ...good(),
      bodyPainted: false,
      h1: null,
      stages: [{ visibleDescendants: 0, text: 0, graphics: 0 }],
    },
    ["page error: x"],
  );
  assert.deepEqual(out, ["page-events", "stylesheet", "heading", "demo-stage"]);
  assert.deepEqual(
    judgePage(
      { ...good(), bodyPainted: false, h1: null, stages: [] },
      ["page error: x"],
      "component",
    ).map((f) => f.rule),
    ["page-events", "stylesheet", "heading", "demo-stage"],
  );
});
