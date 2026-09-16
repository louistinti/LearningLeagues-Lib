// Unit suite for the failing-test extraction gate 10 prints under a red run
// (design record process/archives/2026-09-16-gate17-follow-ups-design.md).
// The samples are the verbatim shapes Node 24's spec and tap reporters
// produce on a synthetic red suite (one green test, one red test, one red
// test nested in a describe) — captured 2026-09-16.
// Run: node --test scripts/lib/test-output.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { failingTests } from "./test-output.ts";

const SPEC = `✔ green one (0.8791ms)
✖ red one: names (its) position (2.5216ms)
▶ group
  ✖ red nested (13.0531ms)
✖ group (13.35ms)
ℹ tests 3
ℹ suites 1
ℹ pass 1
ℹ fail 2
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 114.5426
✖ failing tests:
test at red.test.mjs:4:1
✖ red one: names (its) position (2.5216ms)
  AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:

  1 !== 2

test at red.test.mjs:5:27
✖ red nested (13.0531ms)
  AssertionError [ERR_ASSERTION]: The expression evaluated to a falsy value:
`;

const TAP = `TAP version 13
# Subtest: green one
ok 1 - green one
  ---
  duration_ms: 0.837
  type: 'test'
  ...
# Subtest: red one: names (its) position
not ok 2 - red one: names (its) position
  ---
  duration_ms: 0.9066
  failureType: 'testCodeFailure'
  error: |-
    Expected values to be strictly equal:
  ...
# Subtest: group
    # Subtest: red nested
    not ok 1 - red nested
      ---
      duration_ms: 3.6522
      ...
    1..1
not ok 3 - group
  ---
  duration_ms: 4.1
  type: 'suite'
  ...
1..3
# tests 3
# suites 1
# pass 1
# fail 2
`;

test("spec reporter: red names in order of first appearance, nested included, header and repeats dropped", () => {
  assert.deepEqual(failingTests(SPEC), ["red one: names (its) position", "red nested", "group"]);
});

test("tap reporter: not-ok names in order, nested included", () => {
  assert.deepEqual(failingTests(TAP), ["red one: names (its) position", "red nested", "group"]);
});

test("a green run and an empty output yield nothing", () => {
  assert.deepEqual(failingTests("✔ green one (0.8ms)\nℹ tests 1\nℹ pass 1\nℹ fail 0\n"), []);
  assert.deepEqual(failingTests(""), []);
});

test("a suite line counts: a suite holding a red test is red", () => {
  assert.deepEqual(failingTests("▶ group\n  ✖ inner (1ms)\n✖ group (2ms)\n"), [
    "inner",
    "group",
  ]);
});

test("the duration is stripped, the name keeps its own parentheses", () => {
  assert.deepEqual(failingTests("✖ names (its) position (2.5ms)"), ["names (its) position"]);
  assert.deepEqual(failingTests("✖ no duration at all"), ["no duration at all"]);
});
