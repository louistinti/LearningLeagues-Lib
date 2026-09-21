// Unit suite for the contrast gate's accent-axis expansion (L12), run inside
// gate 10. Every case is a behaviour the contrast gate relies on: a pair that
// resolves through the axis token is scored once per accent, never once.
import { test } from "node:test";
import assert from "node:assert/strict";
import { AXIS_TOKEN, accentNames, followsAxis, withAccent, expandPairs } from "./contrast-axis.ts";
import { resolveColor, type TokenMap } from "./color.ts";

const color = (value: string | { alias: string }, scopes: string[] = []) => ({
  type: "color",
  css: "--x",
  scopes,
  value,
});

const TOKENS: TokenMap = {
  "Primitives/accent/ambre": color("#e39a3c"),
  "Primitives/accent/rouge": color("#c96f6f"),
  "Primitives/neutral/bg": color("#070a14"),
  "Primitives/alpha/gold-soft": color("rgba(227, 154, 60, 0.12)"),
  [AXIS_TOKEN]: color({ alias: "Primitives/accent/ambre" }, ["TEXT_FILL"]),
  "Semantic/accent/link": color({ alias: AXIS_TOKEN }, ["TEXT_FILL"]),
  "Semantic/accent/soft": color({ alias: "Primitives/alpha/gold-soft" }),
  "Semantic/bg/default": color({ alias: "Primitives/neutral/bg" }),
  "Semantic/fg/default": color("#e7ecf5", ["TEXT_FILL"]),
  "Spacing/s": { type: "number", css: "--ll-s", scopes: [], value: 8 },
};

test("accentNames lists every Primitives/accent/* token, in file order", () => {
  assert.deepEqual(accentNames(TOKENS), ["ambre", "rouge"]);
});

test("followsAxis: the axis token itself and any alias chain through it", () => {
  assert.equal(followsAxis(TOKENS, AXIS_TOKEN), true);
  assert.equal(followsAxis(TOKENS, "Semantic/accent/link"), true);
});

test("followsAxis: a fixed token does not follow — not even one named accent/*", () => {
  assert.equal(followsAxis(TOKENS, "Semantic/fg/default"), false);
  assert.equal(followsAxis(TOKENS, "Semantic/accent/soft"), false); // aliases an alpha primitive
  assert.equal(followsAxis(TOKENS, "Primitives/accent/rouge"), false); // a primitive IS a value
  assert.equal(followsAxis(TOKENS, "Semantic/missing"), false); // unknown: resolveColor reports it
});

test("withAccent re-points the axis token and leaves the input untouched", () => {
  const rouge = withAccent(TOKENS, "rouge");
  assert.deepEqual(resolveColor(rouge, AXIS_TOKEN), { r: 201, g: 111, b: 111, a: 1 });
  assert.deepEqual(resolveColor(rouge, "Semantic/accent/link"), { r: 201, g: 111, b: 111, a: 1 });
  assert.deepEqual(resolveColor(TOKENS, AXIS_TOKEN), { r: 227, g: 154, b: 60, a: 1 });
});

test("withAccent throws on an accent that has no primitive", () => {
  assert.throws(() => withAccent(TOKENS, "or"), /Primitives\/accent\/or/);
});

test("expandPairs: a pair through the axis is scored once per accent — fg, bg or base", () => {
  const asFg = expandPairs(TOKENS, [
    { fg: AXIS_TOKEN, bg: "Semantic/bg/default", usage: "normal-text" },
  ]);
  assert.deepEqual(
    asFg.map((e) => e.accent),
    ["ambre", "rouge"],
  );
  const asBg = expandPairs(TOKENS, [
    { fg: "Semantic/bg/default", bg: "Semantic/accent/link", usage: "normal-text" },
  ]);
  assert.equal(asBg.length, 2);
  const asBase = expandPairs(TOKENS, [
    {
      fg: "Semantic/fg/default",
      bg: "Semantic/accent/soft",
      base: AXIS_TOKEN,
      usage: "normal-text",
    },
  ]);
  assert.equal(asBase.length, 2);
});

test("expandPairs: a pair that never touches the axis is scored once, accent null", () => {
  const fixed = expandPairs(TOKENS, [
    { fg: "Semantic/fg/default", bg: "Semantic/bg/default", usage: "normal-text" },
  ]);
  assert.deepEqual(
    fixed.map((e) => e.accent),
    [null],
  );
});

test("expandPairs: no accent primitive at all is an error, never a silent single score", () => {
  const { [`Primitives/accent/ambre`]: _a, [`Primitives/accent/rouge`]: _r, ...noAccents } = TOKENS;
  assert.throws(
    () =>
      expandPairs(noAccents, [{ fg: AXIS_TOKEN, bg: "Semantic/bg/default", usage: "normal-text" }]),
    /no Primitives\/accent\/\* token/,
  );
});
