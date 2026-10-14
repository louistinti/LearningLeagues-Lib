// Gate 10 — unit suite for the token-lint detectors (blueprint §5.2, row 10).
// Every case is either a behaviour the gates rely on, or a DOCUMENTED
// limitation frozen on purpose (a silent blind spot that widens is a
// regression too). Sources: PROOF-OF-BLOCKING rows and real incidents —
// the TestButton triple-hit line, the JSX-text "12px" blind spot, the
// color-mix "white" keyword.
// Run: node --test scripts/lib/detectors.test.ts (wrapped by check-detectors.ts)
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  detectRawColor,
  detectArbitraryPx,
  detectInvalidVar,
  detectStaticInlineStyle,
  detectMediaLength,
  lintLines,
} from "./detectors.ts";

test("raw-color: hex literals in every length the gate proved", () => {
  assert.equal(detectRawColor('color: "#ff0000"')?.rule, "raw-color");
  assert.equal(detectRawColor("#abc")?.excerpt, "#abc");
  assert.equal(detectRawColor("#AABBCCDD")?.rule, "raw-color");
});

test("raw-color: rgb/rgba/hsl/hsla function heads", () => {
  assert.equal(detectRawColor("background: rgb(255, 0, 0)")?.rule, "raw-color");
  assert.equal(detectRawColor("rgba(0,0,0,.5)")?.rule, "raw-color");
  assert.equal(detectRawColor("hsl(120, 50%, 50%)")?.rule, "raw-color");
  assert.equal(detectRawColor("hsla(")?.rule, "raw-color");
});

test("raw-color: var() consumption is clean", () => {
  assert.equal(detectRawColor("background: var(--ll-accent);"), null);
});

test("raw-color: DOCUMENTED LIMITATION — colour keywords pass (the color-mix case)", () => {
  // button.css derives hover live: color-mix(in oklab, var(--ll-accent) 88%, white)
  // The "white" keyword is deliberate derivation, not a hardcoded colour.
  assert.equal(detectRawColor("color-mix(in oklab, var(--ll-accent) 88%, white)"), null);
});

test("arbitrary-value: bracketed px/rem/em, negatives and decimals", () => {
  assert.equal(detectArbitraryPx("p-[13px]")?.rule, "arbitrary-value");
  assert.equal(detectArbitraryPx("w-[240px]")?.excerpt, "[240px]");
  assert.equal(detectArbitraryPx("m-[1.5rem]")?.rule, "arbitrary-value");
  assert.equal(detectArbitraryPx("mt-[-4px]")?.rule, "arbitrary-value");
  assert.equal(detectArbitraryPx("[12em]")?.rule, "arbitrary-value");
});

test("arbitrary-value: DOCUMENTED LIMITATION — bare px outside brackets passes", () => {
  // The scaffold's old meta.ts "12px" as JSX text was invisible to every
  // detector (2026-08-12 incident); the fixture now uses p-[12px]. If this
  // blind spot is ever closed, update this test AND the scaffold notes.
  assert.equal(detectArbitraryPx("font-size: 12px;"), null);
  assert.equal(detectArbitraryPx("Padding is 12px hardcoded"), null);
});

test("invalid-var-syntax: the always-invalid forms browsers discard", () => {
  assert.equal(detectInvalidVar("var(ll-bg)")?.rule, "invalid-var-syntax");
  assert.equal(detectInvalidVar("var(-ll-bg)")?.rule, "invalid-var-syntax");
  assert.equal(detectInvalidVar("var()")?.rule, "invalid-var-syntax");
});

test("invalid-var-syntax: well-formed var() passes, fallbacks and spaces included", () => {
  assert.equal(detectInvalidVar("var(--ll-bg)"), null);
  assert.equal(detectInvalidVar("var(--ll-bg, #fallback-name)"), null);
  assert.equal(detectInvalidVar("var( --ll-x )"), null);
});

test("inline-style-static: HTML style attribute with content", () => {
  assert.equal(detectStaticInlineStyle('<div style="color: red">')?.rule, "inline-style-static");
  assert.equal(detectStaticInlineStyle('<div style="">'), null);
});

test("inline-style-static: JSX static string and number literals", () => {
  assert.equal(
    detectStaticInlineStyle('style={{ color: "#ff0000" }}')?.rule,
    "inline-style-static",
  );
  assert.equal(detectStaticInlineStyle("style={{ width: 240 }}")?.rule, "inline-style-static");
  assert.equal(detectStaticInlineStyle("style={{ padding: '12px' }}")?.rule, "inline-style-static");
});

test("inline-style-static: genuinely dynamic values pass", () => {
  assert.equal(detectStaticInlineStyle("style={{ width: size }}"), null);
  assert.equal(detectStaticInlineStyle("style={{ width: `${w}px` }}"), null);
});

test("lintLines: one line can hit several detectors (the TestButton line)", () => {
  // Real incident line — scaffold's intentional red produced exactly 3 hits.
  const hits = lintLines(['      style={{ color: "#ff0000", background: "var(ll-background)" }}']);
  const rules = hits.map((v) => v.rule).sort();
  assert.deepEqual(rules, ["inline-style-static", "invalid-var-syntax", "raw-color"]);
  assert.ok(hits.every((v) => v.line === 1 && v.allowed === null));
});

test("lintLines: allow() on the flagged line converts to a visible allowed usage", () => {
  const hits = lintLines(['color: "#ff0000"; /* allow(brand exception, arbitrated) */']);
  assert.equal(hits.length, 1);
  assert.equal(hits[0].allowed, "brand exception, arbitrated");
});

test("lintLines: allow() on the NEXT line also covers the violation", () => {
  const hits = lintLines(['color: "#ff0000";', "// allow(legacy, expires with M6)"]);
  assert.equal(hits[0].allowed, "legacy, expires with M6");
});

test("lintLines: line numbers are 1-indexed", () => {
  const hits = lintLines(["clean line", "var(ll-x)"]);
  assert.equal(hits[0].line, 2);
});

// ── Media-condition rule (2026-10-13, SectionHead breakpoint) ──────────────
const BP = { "--ll-breakpoint-md": "768px" };

test("media-length: the convention passes — token value + token named in a prelude comment", () => {
  assert.equal(detectMediaLength("@media (width < 768px) /* --ll-breakpoint-md */ {", BP), null);
  assert.equal(detectMediaLength("@media (max-width: 768px) /* --ll-breakpoint-md */ {", BP), null);
  assert.equal(
    detectMediaLength("@container (min-width: 768px) /* --ll-breakpoint-md */ {", BP),
    null,
  );
});

test("media-length: a raw length with no comment is a violation", () => {
  const hit = detectMediaLength("@media (max-width: 900px) {", BP);
  assert.equal(hit?.rule, "media-length");
  assert.match(hit?.excerpt ?? "", /^900px — no/);
  assert.equal(detectMediaLength("@media (width < 768px) {", BP)?.rule, "media-length");
});

test("media-length: the token's own value without the comment is still a violation", () => {
  assert.equal(
    detectMediaLength("@media (width < 768px) { /* moved by hand */", BP)?.rule,
    "media-length",
  );
});

test("media-length: a value that differs from the named token is a violation", () => {
  const hit = detectMediaLength("@media (width < 767px) /* --ll-breakpoint-md */ {", BP);
  assert.equal(hit?.rule, "media-length");
  assert.match(hit?.excerpt ?? "", /--ll-breakpoint-md is 768px/);
  // same number, other unit
  assert.equal(
    detectMediaLength("@media (width < 48em) /* --ll-breakpoint-md */ {", BP)?.rule,
    "media-length",
  );
});

test("media-length: an unknown breakpoint token is a violation", () => {
  const hit = detectMediaLength("@media (width < 768px) /* --ll-breakpoint-xl */ {", BP);
  assert.equal(hit?.rule, "media-length");
  assert.match(hit?.excerpt ?? "", /unknown token --ll-breakpoint-xl/);
});

test("media-length: every length in the condition must be covered", () => {
  assert.equal(
    detectMediaLength(
      "@media (768px <= width < 1024px) /* --ll-breakpoint-md */ {",
      BP,
    )?.excerpt.startsWith("1024px"),
    true,
  );
});

test("media-length: a comment outside the prelude does not count", () => {
  assert.equal(
    detectMediaLength("@media (width < 768px) { .a { b: c } } /* --ll-breakpoint-md */", BP)?.rule,
    "media-length",
  );
});

test("media-length: conditions without lengths, and non-media lines, pass", () => {
  assert.equal(detectMediaLength("@media (prefers-reduced-motion: reduce) {", BP), null);
  assert.equal(detectMediaLength("@media print {", BP), null);
  assert.equal(detectMediaLength("  max-width: 768px;", BP), null);
});

test("media-length: DOCUMENTED LIMITATION — a condition continued on the next line is not read", () => {
  // prettier keeps a prelude on one line; a hand-wrapped condition escapes.
  const hits = lintLines(["@media (min-width: 1px) and", "  (max-width: 900px) {"], BP);
  assert.deepEqual(
    hits.map((v) => v.line),
    [1],
  );
});

test("lintLines: the media rule runs only when the walker passes breakpoints", () => {
  assert.equal(lintLines(["@media (max-width: 900px) {"]).length, 0);
  assert.equal(lintLines(["@media (max-width: 900px) {"], BP)[0]?.rule, "media-length");
  // an empty token set reds every length — the rule never passes by absence
  assert.equal(
    lintLines(["@media (width < 768px) /* --ll-breakpoint-md */ {"], {})[0]?.rule,
    "media-length",
  );
});

test("lintLines: allow() covers a media-length violation visibly", () => {
  const hits = lintLines(["@media (max-width: 900px) { /* allow(arbitrated) */"], BP);
  assert.equal(hits[0].allowed, "arbitrated");
});
