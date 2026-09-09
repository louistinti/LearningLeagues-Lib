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
  "[role=button]",
  "[role=link]",
  "[role=menuitem]",
  "[role=tab]",
  "[role=checkbox]",
  "[role=radio]",
  "[role=switch]",
  "[role=option]",
].join(",");

const NATIVE_FOCUSABLE = /^(A|BUTTON|INPUT|SELECT|TEXTAREA)$/;
const outer = (el: Element): string => el.outerHTML.slice(0, 120);
const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export function interactiveElements(doc: Document): Element[] {
  return [...doc.querySelectorAll(INTERACTIVE_SELECTOR)].filter(
    (el) => !el.hasAttribute("disabled"),
  );
}

export function checkFocusable(el: Element): Finding | null {
  const tabindex = el.getAttribute("tabindex");
  if (tabindex === "0") return null;
  if (NATIVE_FOCUSABLE.test(el.tagName) && tabindex !== "-1") return null;
  return {
    rule: "focusable",
    message: 'interactive element is neither natively focusable nor tabindex="0"',
    html: outer(el),
  };
}

export function checkNoPositiveTabindex(el: Element): Finding | null {
  const t = Number(el.getAttribute("tabindex") ?? "0");
  return t > 0
    ? {
        rule: "no-positive-tabindex",
        message: `tabindex="${t}" breaks the natural tab order`,
        html: outer(el),
      }
    : null;
}

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
  return el.closest('[aria-hidden="true"]')
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

export function checkFocusVisibleStyled(el: Element, css: string): Finding | null {
  const classes = [...el.classList];
  const selectors = focusVisibleSelectors(css);
  const styled = classes.some((c) => {
    const token = new RegExp(`\\.${escapeRe(c)}(?![\\w-])`);
    return selectors.some((sel) => token.test(sel));
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
      checkFocusable(el),
      checkNoPositiveTabindex(el),
      checkFocusLands(el, doc),
      checkHiddenFocusable(el),
      checkFocusVisibleStyled(el, css),
    ])
      if (f) findings.push(f);
  }
  return findings;
}
