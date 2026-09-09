// Unit suite for the docs-site structural checks (blueprint §9.2), run inside
// gate 10. Every case is a behaviour the docs gate relies on.
// Run: node --test scripts/lib/docs-a11y-checks.test.ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";
import { checkPage, titleSubject } from "./docs-a11y-checks.ts";

const SITE = "LearningLeagues Lib";
const page = (body: string, head = `<title>Button — ${SITE}</title>`) =>
  new JSDOM(`<!doctype html><html lang="en"><head>${head}</head><body>${body}</body></html>`).window
    .document;
const GOOD = `<a class="skip-link" href="#main">Skip to content</a>
<header><a class="site-title" href="./index.html">${SITE}</a></header>
<nav aria-label="Documentation"><a href="./index.html">Registry</a></nav>
<main id="main"><h1>Button</h1>
<table><tr><th scope="col">Prop</th><th scope="col">Type</th></tr><tr><th scope="row">variant</th><td>string</td></tr></table>
</main><footer>f</footer>`;
const rules = (body: string, head?: string) => checkPage(page(body, head)).map((f) => f.rule);

test("a well-formed page has no findings", () => assert.deepEqual(rules(GOOD), []));

test("skip-link-first: the first focusable must be the skip link", () => {
  assert.ok(rules(`<a href="./x.html">Elsewhere</a>` + GOOD).includes("skip-link-first"));
});
test("skip-link-first: a skip link whose target is missing is red", () => {
  assert.ok(rules(GOOD.replace('href="#main"', 'href="#nowhere"')).includes("skip-link-first"));
});
test("skip-link-first: a skip link targeting something other than <main> is red", () => {
  assert.ok(
    rules(
      GOOD.replace(
        '<nav aria-label="Documentation">',
        '<nav id="nav" aria-label="Documentation">',
      ).replace('href="#main"', 'href="#nav"'),
    ).includes("skip-link-first"),
  );
});
test("landmarks: two <main> elements are red", () => {
  assert.ok(rules(GOOD + `<main>again</main>`).includes("landmarks"));
});
test("landmarks: a <nav> without an accessible name is red", () => {
  assert.ok(rules(GOOD.replace(' aria-label="Documentation"', "")).includes("landmarks"));
});
test("landmarks: aria-labelledby counts as a name", () => {
  const body = GOOD.replace(' aria-label="Documentation"', ' aria-labelledby="navh"').replace(
    "<nav",
    '<p id="navh">Docs</p><nav',
  );
  assert.ok(!rules(body).includes("landmarks"));
});
test("landmarks: missing <header> is red", () => {
  assert.ok(rules(GOOD.replace(/<header>.*?<\/header>/, "")).includes("landmarks"));
});
test("table-scopes: a <th> without scope is red", () => {
  assert.ok(
    rules(GOOD.replace('<th scope="col">Prop</th>', "<th>Prop</th>")).includes("table-scopes"),
  );
});
test("table-scopes: a table without any <th> is red", () => {
  assert.ok(rules(GOOD + `<table><tr><td>a</td></tr></table>`).includes("table-scopes"));
});
test("page-title: an empty title is red", () => {
  assert.ok(rules(GOOD, "<title></title>").includes("page-title"));
});
test("page-title: a title that is only the site name is red", () => {
  assert.ok(rules(GOOD, `<title>${SITE}</title>`).includes("page-title"));
});
test("page-title: two <h1> are red; zero <h1> is red", () => {
  assert.ok(rules(GOOD.replace("<h1>Button</h1>", "<h1>A</h1><h1>B</h1>")).includes("page-title"));
  assert.ok(rules(GOOD.replace("<h1>Button</h1>", "")).includes("page-title"));
});
test("page-title: missing html lang is red", () => {
  const doc = new JSDOM(
    `<!doctype html><html><head><title>Button — ${SITE}</title></head><body>${GOOD}</body></html>`,
  ).window.document;
  assert.ok(
    checkPage(doc)
      .map((f) => f.rule)
      .includes("page-title"),
  );
});
test("titleSubject strips the site suffix read from the page", () => {
  assert.equal(titleSubject(page(GOOD)), "Button");
  assert.equal(titleSubject(page(GOOD, `<title>${SITE}</title>`)), "");
});
test("never short-circuits: several defects report every rule", () => {
  const body =
    GOOD.replace('href="#main"', 'href="#nowhere"').replace(
      '<th scope="col">Prop</th>',
      "<th>Prop</th>",
    ) + `<main>again</main>`;
  const r = rules(body);
  for (const rule of ["skip-link-first", "table-scopes", "landmarks"])
    assert.ok(r.includes(rule), rule);
});

test("table-scopes: scope is case-insensitive (COL passes)", () => {
  assert.ok(
    !rules(GOOD.replace('<th scope="col">Prop</th>', '<th scope="COL">Prop</th>')).includes(
      "table-scopes",
    ),
  );
});
test("landmarks: aria-labelledby pointing to a missing id is red", () => {
  assert.ok(
    rules(GOOD.replace(' aria-label="Documentation"', ' aria-labelledby="ghost"')).includes(
      "landmarks",
    ),
  );
});
test("landmarks: no <nav> at all is red", () => {
  assert.ok(rules(GOOD.replace(/<nav[\s\S]*?<\/nav>/, "")).includes("landmarks"));
});
test("page-title: a page without .site-title cannot be judged — red", () => {
  assert.ok(rules(GOOD.replace(' class="site-title"', "")).includes("page-title"));
});
test("page-title: an empty subject before the separator is red", () => {
  assert.ok(rules(GOOD, `<title> — ${SITE}</title>`).includes("page-title"));
});
test("skip-link-first: a <summary> or tabindex=0 element before the skip link is red", () => {
  assert.ok(rules(`<details><summary>x</summary></details>` + GOOD).includes("skip-link-first"));
  assert.ok(rules(`<div tabindex="0">x</div>` + GOOD).includes("skip-link-first"));
});
