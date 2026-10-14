// Pure token-lint detectors (blueprint §5.2.4), independent of the CLI walker
// so they can be unit-tested on their own. Each detector takes the lines of a
// file and returns violations; it never reads the filesystem.
//
// Escape hatch: an `allow(<reason>)` comment on the flagged line or the one
// after it converts the violation into a visible "allowed usage" — reported,
// never silent.

export interface Violation {
  line: number; // 1-indexed
  rule: string;
  excerpt: string;
  allowed: string | null; // the allow(<reason>) text when present
}

const ALLOW = /allow\(([^)]+)\)/;

/** Raw colour literals: hex, rgb(a), hsl(a). If a token exists, a var() exists. */
export function detectRawColor(line: string): { rule: string; excerpt: string } | null {
  const m = line.match(/#[0-9a-fA-F]{3,8}\b|(?:rgba?|hsla?)\(/);
  if (!m) return null;
  return { rule: "raw-color", excerpt: m[0] };
}

/** Raw pixel values in arbitrary-value class syntax, e.g. p-[13px], w-[240px]. */
export function detectArbitraryPx(line: string): { rule: string; excerpt: string } | null {
  const m = line.match(/\[-?\d+(?:\.\d+)?(?:px|rem|em)\]/);
  if (!m) return null;
  return { rule: "arbitrary-value", excerpt: m[0] };
}

/**
 * The always-invalid custom-property syntax browsers discard without warning:
 * var(ll-x) or var( --ll-x — a var() whose first argument does not start with
 * a well-formed `--` name.
 */
export function detectInvalidVar(line: string): { rule: string; excerpt: string } | null {
  const m = line.match(/var\((?!\s*--[a-zA-Z0-9-]+\s*[,)])[^)]*\)?/);
  if (!m) return null;
  return { rule: "invalid-var-syntax", excerpt: m[0].slice(0, 40) };
}

/**
 * Hardcoded design values inside inline style attributes. An inline style is
 * legitimate only when genuinely dynamic at runtime (identifier, member/call
 * expression, interpolating template). A static string, bare number, or
 * non-interpolating template is a violation even when it references a token —
 * if a token exists, a class exists.
 */
export function detectStaticInlineStyle(line: string): { rule: string; excerpt: string } | null {
  // HTML-style: style="..."
  const html = line.match(/style="([^"]*)"/);
  if (html && html[1].trim() !== "")
    return { rule: "inline-style-static", excerpt: html[0].slice(0, 60) };
  // JSX-style: style={{ prop: <literal> }} with a static string/number value
  const jsx = line.match(/style=\{\{[^}]*:\s*(?:"[^"]*"|'[^']*'|`[^`$]*`|-?\d)/);
  if (jsx) return { rule: "inline-style-static", excerpt: jsx[0].slice(0, 60) };
  return null;
}

/** Breakpoint tokens as emitted by tokens.css, e.g. { "--ll-breakpoint-md": "768px" }. */
export type Breakpoints = Record<string, string>;

/**
 * Lengths inside an `@media` / `@container` condition. A custom property
 * cannot appear in a media condition, so the breakpoint token is restated
 * as its emitted value — legal ONLY when the same line names the token in a
 * comment inside the prelude and the token emits exactly that length:
 *   @media (width < 768px) /* --ll-breakpoint-md *\/ {
 * Any other length there (no comment, unknown token, value that differs
 * from the token) is a violation. One line only: a condition continued on
 * the next line is not read (prettier keeps a prelude on one line).
 */
export function detectMediaLength(
  line: string,
  breakpoints: Breakpoints,
): { rule: string; excerpt: string } | null {
  const at = line.match(/@(?:media|container)\b([^{]*)/);
  if (!at) return null;
  const prelude = at[1];
  const named = [...prelude.matchAll(/\/\*([\s\S]*?)\*\//g)].flatMap((c) =>
    [...c[1].matchAll(/--ll-breakpoint-[a-z0-9-]+/g)].map((m) => m[0]),
  );
  const condition = prelude.replace(/\/\*[\s\S]*?\*\//g, " ");
  for (const m of condition.matchAll(/(?<![\w.-])-?(?:\d+\.?\d*|\.\d+)(?:px|rem|em)\b/g)) {
    const length = m[0];
    if (named.some((n) => breakpoints[n] === length)) continue;
    const unknown = named.filter((n) => !(n in breakpoints));
    const why = !named.length
      ? "no /* --ll-breakpoint-* */ comment on the line"
      : unknown.length
        ? `unknown token ${unknown.join(", ")}`
        : named.map((n) => `${n} is ${breakpoints[n]}`).join(", ");
    return { rule: "media-length", excerpt: `${length} — ${why}` };
  }
  return null;
}

const DETECTORS = [detectRawColor, detectArbitraryPx, detectInvalidVar, detectStaticInlineStyle];

/**
 * Run every detector over every line, applying the allow(<reason>) escape.
 * `breakpoints` turns on the media-condition rule (detectMediaLength) for
 * this file; null leaves it off — the walker decides the rule's scope.
 */
export function lintLines(lines: string[], breakpoints: Breakpoints | null = null): Violation[] {
  const detectors = breakpoints
    ? [...DETECTORS, (line: string) => detectMediaLength(line, breakpoints)]
    : DETECTORS;
  const out: Violation[] = [];
  lines.forEach((line, i) => {
    for (const detect of detectors) {
      const hit = detect(line);
      if (!hit) continue;
      const allowHere = line.match(ALLOW);
      const allowNext = (lines[i + 1] ?? "").match(ALLOW);
      const allowed = allowHere?.[1] ?? allowNext?.[1] ?? null;
      out.push({ line: i + 1, rule: hit.rule, excerpt: hit.excerpt, allowed });
    }
  });
  return out;
}
