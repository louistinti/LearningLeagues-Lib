// Generic keyboard checks for the accessibility engine gate (blueprint §5.1
// row 9, "keyboard suite"). Pure functions over a document + the component's
// CSS text — no I/O — so gate 10 can lock them. They cover what axe cannot
// decide in a simulated DOM (no layout): reachability, tab order, focus
// landing, a styled focus ring, and focusable content hidden from AT.
// Types below are the DOM's; Node strips them at run time (no typecheck).

export interface Finding {
  rule: string;
  message: string;
  html: string; // outer HTML of the element, truncated
}

// What counts as interactive in a rendered fragment. Native controls plus the
// widget roles a component may hand-roll. Disabled elements are excluded:
// WCAG excludes inactive components (blueprint §5.2.3 applies the same rule).
export const INTERACTIVE_SELECTOR = [
  "a[href]",
  "button",
  "input:not([type=hidden])",
  "select",
  "textarea",
  "[role~=button]",
  "[role~=link]",
  "[role~=menuitem]",
  "[role~=tab]",
  "[role~=checkbox]",
  "[role~=radio]",
  "[role~=switch]",
  "[role~=option]",
].join(",");

const NATIVE_FOCUSABLE = /^(a|button|input|select|textarea)$/i;
const outer = (el: Element): string => el.outerHTML.slice(0, 120);
// Class names here are matched as DOM tokens (classList / a raw ".name"
// literal), not as CSS-escaped selectors — "ll:button" vs ".ll\:button" will
// not match. Irrelevant for this library's BEM names, which never need
// escaping, but worth knowing if that ever changes.
const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export function interactiveElements(doc: Document): Element[] {
  return [...doc.querySelectorAll(INTERACTIVE_SELECTOR)].filter((el) => !el.matches(":disabled"));
}

// The rule is keyboard reachability, not a specific tabindex value: a native
// control is reachable without any tabindex, and a roving-tabindex composite
// (APG tablist/menu/radiogroup/listbox — one member tabindex="0", the rest
// "-1") is reachable as a group even though most of its members are not
// individually in the tab order.
export function checkFocusable(el: Element, doc: Document): Finding | null {
  const attr = el.getAttribute("tabindex");
  const tabindex = parseInt(attr ?? "", 10);
  if (tabindex >= 0) return null;
  const isNative = NATIVE_FOCUSABLE.test(el.localName);
  if (isNative && attr === null) return null;

  const role = el.getAttribute("role");
  const inRovingGroup = [...doc.querySelectorAll("*")].some((other) => {
    if (other === el) return false;
    const otherTabindex = parseInt(other.getAttribute("tabindex") ?? "", 10);
    if (!(otherTabindex >= 0)) return false;
    return role !== null
      ? other.getAttribute("role") === role
      : isNative && other.localName === el.localName;
  });
  if (inRovingGroup) return null;

  return {
    rule: "focusable",
    message:
      "not reachable by keyboard: neither in the tab order (tabindex >= 0 or a native control) nor part of a roving group with one member in the tab order",
    html: outer(el),
  };
}

export function checkNoPositiveTabindex(el: Element): Finding | null {
  const t = parseInt(el.getAttribute("tabindex") ?? "", 10);
  return t > 0
    ? {
        rule: "no-positive-tabindex",
        message: `tabindex="${t}" breaks the natural tab order`,
        html: outer(el),
      }
    : null;
}

// jsdom lets focus() succeed on elements that a real browser would refuse —
// hidden, display:none, or behind an inert ancestor — because it does not
// compute layout or inertness. This check is therefore weaker here than in
// a browser: it can only catch elements that are unfocusable for reasons
// jsdom does model (e.g. no tabindex and not natively focusable).
export function checkFocusLands(el: Element, doc: Document): Finding | null {
  (el as HTMLElement).focus();
  return doc.activeElement === el
    ? null
    : {
        rule: "focus-lands",
        message: "focus() does not make the element document.activeElement",
        html: outer(el),
      };
}

export function checkHiddenFocusable(el: Element): Finding | null {
  return el.closest('[aria-hidden="true" i]')
    ? {
        rule: "hidden-focusable",
        message:
          'focusable element inside aria-hidden="true" (axe cannot decide this without layout)',
        html: outer(el),
      }
    : null;
}

// Selectors of every rule mentioning :focus-visible, comments stripped.
export function focusVisibleSelectors(css: string): string[] {
  const clean = css.replace(/\/\*[\s\S]*?\*\//g, "");
  return [...clean.matchAll(/([^{}]+)\{[^{}]*\}/g)]
    .map((m) => m[1].trim())
    .filter((sel) => sel.includes(":focus-visible"));
}

// The subject compound (rightmost) is what the declarations style; :not()
// groups are removed first so :focus:not(:focus-visible) — ring removal —
// never counts as a ring.
export function checkFocusVisibleStyled(el: Element, css: string): Finding | null {
  const classes = [...el.classList];
  // Strip :not(...) groups before matching so a ring explicitly removed via
  // :not(:focus-visible) (e.g. ":focus:not(:focus-visible) { outline: none }")
  // does not count as styling it — ":focus-visible" surviving inside a
  // :not() is a red herring, not coverage.
  const subjects = focusVisibleSelectors(css).flatMap((sel) =>
    sel
      .replace(/:not\([^)]*\)/g, "")
      .split(",")
      .map((branch) => {
        const compounds = branch.trim().split(/\s*[>+~]\s*|\s+/);
        return compounds[compounds.length - 1];
      }),
  );
  const styled = classes.some((c) => {
    const classToken = new RegExp(`\\.${escapeRe(c)}(?![\\w-])`);
    return subjects.some(
      (subject) => classToken.test(subject) && subject.includes(":focus-visible"),
    );
  });
  if (styled) return null;
  return {
    rule: "focus-visible-styled",
    message: classes.length
      ? `no :focus-visible rule targets ${classes.map((c) => `.${c}`).join(" ")}`
      : "element has no class, so no :focus-visible rule can target it",
    html: outer(el),
  };
}

// Every check on every interactive element — never short-circuits.
export function checkFragment(doc: Document, css: string): Finding[] {
  const findings: Finding[] = [];
  for (const el of interactiveElements(doc)) {
    for (const f of [
      checkFocusable(el, doc),
      checkNoPositiveTabindex(el),
      checkFocusLands(el, doc),
      checkHiddenFocusable(el),
      checkFocusVisibleStyled(el, css),
    ])
      if (f) findings.push(f);
  }
  return findings;
}
