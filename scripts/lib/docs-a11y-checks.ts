// Structural accessibility checks for the generated documentation site
// (blueprint §9.2): skip link first, landmarks, table header scopes, a
// descriptive title. Pure functions over a Document — no I/O — so gate 10
// locks them. They cover the two page rules axe leaves *incomplete* under
// jsdom (landmark-one-main, page-has-heading-one — axe's element-stack code
// needs elementFromPoint, which jsdom lacks) and the three requirements axe
// does not express at all (skip link FIRST, scope on every th, a
// page-specific title). Types are the DOM's; Node strips them.

export interface Finding {
  rule: string;
  message: string;
  html: string; // outer HTML of the element, truncated
}

const FOCUSABLE =
  'a[href], button, input:not([type=hidden]), select, textarea, summary, [tabindex]:not([tabindex="-1"])';
const outer = (el: Element | null | undefined): string => (el ? el.outerHTML.slice(0, 120) : "");

// The page-specific part of <title>: everything before " — <site title>",
// the site title being read from the page's own `.site-title` link (never
// hand-listed). A title equal to the site name has no subject.
export function titleSubject(doc: Document): string {
  const title = (doc.querySelector("title")?.textContent ?? "").trim();
  const site = (doc.querySelector(".site-title")?.textContent ?? "").trim();
  if (site && title.endsWith(site)) {
    const head = title.slice(0, title.length - site.length);
    return head.replace(/[\s—-]+$/, "").trim();
  }
  return title;
}

export function checkSkipLinkFirst(doc: Document): Finding[] {
  const first = doc.querySelector(FOCUSABLE);
  const href = first?.getAttribute("href") ?? "";
  if (!first || first.tagName !== "A" || !href.startsWith("#"))
    return [
      {
        rule: "skip-link-first",
        message: "the first focusable element is not a same-page skip link",
        html: outer(first),
      },
    ];
  const target = doc.getElementById(decodeURIComponent(href.slice(1)));
  if (!target)
    return [
      {
        rule: "skip-link-first",
        message: `skip link target "${href}" does not exist`,
        html: outer(first),
      },
    ];
  if (target.tagName !== "MAIN")
    return [
      {
        rule: "skip-link-first",
        message: `skip link targets <${target.tagName.toLowerCase()}>, not <main>`,
        html: outer(first),
      },
    ];
  return [];
}

export function checkLandmarks(doc: Document): Finding[] {
  const out: Finding[] = [];
  const mains = doc.querySelectorAll("main");
  if (mains.length !== 1)
    out.push({
      rule: "landmarks",
      message: `expected exactly one <main>, found ${mains.length}`,
      html: outer(mains[1]),
    });
  if (!doc.querySelector("header"))
    out.push({ rule: "landmarks", message: "no <header> landmark", html: "" });
  const navs = [...doc.querySelectorAll("nav")];
  if (navs.length === 0) out.push({ rule: "landmarks", message: "no <nav> landmark", html: "" });
  for (const nav of navs) {
    if (nav.getAttribute("aria-label")?.trim()) continue;
    const labelledby = nav.getAttribute("aria-labelledby")?.trim();
    if (!labelledby) {
      out.push({
        rule: "landmarks",
        message: "<nav> without an accessible name (aria-label / aria-labelledby)",
        html: outer(nav),
      });
      continue;
    }
    const ids = labelledby.split(/\s+/);
    const resolved = ids.every((id) => (doc.getElementById(id)?.textContent ?? "").trim());
    if (!resolved)
      out.push({
        rule: "landmarks",
        message: "<nav> aria-labelledby points to a missing or empty element",
        html: outer(nav),
      });
  }
  return out;
}

const SCOPES = new Set(["col", "row", "colgroup", "rowgroup"]);
export function checkTableScopes(doc: Document): Finding[] {
  const out: Finding[] = [];
  for (const table of doc.querySelectorAll("table")) {
    const ths = [...table.querySelectorAll("th")];
    if (ths.length === 0)
      out.push({ rule: "table-scopes", message: "table without any <th>", html: outer(table) });
    for (const th of ths)
      if (!SCOPES.has((th.getAttribute("scope") ?? "").toLowerCase()))
        out.push({
          rule: "table-scopes",
          message: "<th> without a valid scope (col/row/colgroup/rowgroup)",
          html: outer(th),
        });
  }
  return out;
}

export function checkPageTitle(doc: Document): Finding[] {
  const out: Finding[] = [];
  const title = (doc.querySelector("title")?.textContent ?? "").trim();
  const site = (doc.querySelector(".site-title")?.textContent ?? "").trim();
  if (!site)
    out.push({
      rule: "page-title",
      message:
        "no .site-title element — the site name cannot be read from the page, so the title's subject cannot be judged",
      html: "",
    });
  if (!title) out.push({ rule: "page-title", message: "empty <title>", html: "" });
  else if (site && !titleSubject(doc))
    out.push({
      rule: "page-title",
      message: `<title> "${title}" carries no page-specific part before the site name`,
      html: "",
    });
  const h1s = doc.querySelectorAll("h1");
  if (h1s.length !== 1)
    out.push({
      rule: "page-title",
      message: `expected exactly one <h1>, found ${h1s.length}`,
      html: outer(h1s[1] ?? h1s[0]),
    });
  if (!doc.documentElement.getAttribute("lang")?.trim())
    out.push({ rule: "page-title", message: "<html> has no lang attribute", html: "" });
  return out;
}

// Every check on the page — never short-circuits.
export function checkPage(doc: Document): Finding[] {
  return [
    ...checkSkipLinkFirst(doc),
    ...checkLandmarks(doc),
    ...checkTableScopes(doc),
    ...checkPageTitle(doc),
  ];
}
