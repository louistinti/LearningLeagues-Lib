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

const DETECTORS = [detectRawColor, detectArbitraryPx, detectInvalidVar, detectStaticInlineStyle];

/** Run every detector over every line, applying the allow(<reason>) escape. */
export function lintLines(lines: string[]): Violation[] {
  const out: Violation[] = [];
  lines.forEach((line, i) => {
    for (const detect of DETECTORS) {
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
