// Unit suite for the FLOAT unit rule (gate 10). Locks: px by default,
// unitless by name (z/*, type weight and line-height), and the opacity
// family emitted as a percentage divided by 100 (Figma reads a float bound
// to a layer's opacity as %, verified 2026-09-26 — Sigil design record §3).
import { test } from "node:test";
import assert from "node:assert/strict";
import { emitFloat } from "./token-units.ts";

test("a Spacing float is emitted in px", () => {
  assert.equal(emitFloat("Spacing/s-15", 12), "12px");
});

test("a Layout float other than z/* is emitted in px", () => {
  assert.equal(emitFloat("Layout/nav-h", 64), "64px");
});

test("Layout/z/* is unitless", () => {
  assert.equal(emitFloat("Layout/z/base", 1), "1");
});

test("Type weight and line-height are unitless; size is not", () => {
  assert.equal(emitFloat("Type/body/weight", 400), "400");
  assert.equal(emitFloat("Type/body/line-height", 1.5), "1.5");
  assert.equal(emitFloat("Type/body/size", 16), "16px");
});

test("an opacity token is a percentage: value / 100, unitless", () => {
  assert.equal(emitFloat("Primitives/opacity/ornament", 25), "0.25");
  assert.equal(emitFloat("Primitives/opacity/ornament", 100), "1");
  assert.equal(emitFloat("Primitives/opacity/ornament", 12.5), "0.125");
});

test("the opacity rule matches any depth under opacity/", () => {
  assert.equal(emitFloat("Primitives/opacity/ornament/strong", 25), "0.25");
});

test("the opacity rule keys on the family segment, not on a name prefix", () => {
  assert.equal(emitFloat("Primitives/opacityx/foo", 25), "25px");
  assert.equal(emitFloat("Spacing/opacity", 25), "25px");
});

test("the opacity rule is free on the collection name", () => {
  assert.equal(emitFloat("Semantic/opacity/x", 25), "0.25");
});
