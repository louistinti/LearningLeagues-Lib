// Pure colour helpers shared by the gates: token resolution and WCAG 2.x
// contrast math. Ratios are always COMPUTED from resolved tokens — declared
// numbers are never trusted (blueprint §5.1 gate 3).

export interface Token {
  type: string;
  css: string;
  scopes: string[];
  value: string | number | { alias: string };
}
export type TokenMap = Record<string, Token>;

export interface Rgba {
  r: number; // 0-255
  g: number;
  b: number;
  a: number; // 0-1
}

/** Parse the two literal colour formats the normalize stage emits. */
export function parseColor(literal: string): Rgba | null {
  const hex = literal.match(/^#([0-9a-f]{6})$/i);
  if (hex) {
    return {
      r: parseInt(hex[1].slice(0, 2), 16),
      g: parseInt(hex[1].slice(2, 4), 16),
      b: parseInt(hex[1].slice(4, 6), 16),
      a: 1,
    };
  }
  const rgba = literal.match(/^rgba\((\d+), (\d+), (\d+), (0?\.\d+|1|0)\)$/);
  if (rgba) {
    return { r: +rgba[1], g: +rgba[2], b: +rgba[3], a: +rgba[4] };
  }
  return null;
}

/** Follow aliases to the concrete colour literal. Throws on non-colour or dangling. */
export function resolveColor(tokens: TokenMap, key: string, seen: string[] = []): Rgba {
  const t = tokens[key];
  if (!t) throw new Error(`unknown token ${[...seen, key].join(" -> ")}`);
  if (seen.includes(key)) throw new Error(`alias cycle at ${key}`);
  const v = t.value;
  if (typeof v === "object" && v !== null && "alias" in v)
    return resolveColor(tokens, v.alias, [...seen, key]);
  if (t.type !== "color" || typeof v !== "string") throw new Error(`${key} is not a colour token`);
  const parsed = parseColor(v);
  if (!parsed) throw new Error(`${key}: unparseable colour literal ${JSON.stringify(v)}`);
  return parsed;
}

/**
 * Composite a foreground with alpha over an opaque background — a semi-opaque
 * colour has no contrast ratio of its own; only the blended result does.
 */
export function over(fg: Rgba, bg: Rgba): Rgba {
  if (fg.a >= 1) return fg;
  const blend = (f: number, b: number) => Math.round(f * fg.a + b * (1 - fg.a));
  return { r: blend(fg.r, bg.r), g: blend(fg.g, bg.g), b: blend(fg.b, bg.b), a: 1 };
}

/** WCAG 2.x relative luminance. */
export function luminance(c: Rgba): number {
  const lin = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * lin(c.r) + 0.7152 * lin(c.g) + 0.0722 * lin(c.b);
}

/** WCAG 2.x contrast ratio between an (alpha-composited) fg and an opaque bg. */
export function contrastRatio(fg: Rgba, bg: Rgba): number {
  const l1 = luminance(over(fg, bg));
  const l2 = luminance(bg);
  const [hi, lo] = l1 >= l2 ? [l1, l2] : [l2, l1];
  return (hi + 0.05) / (lo + 0.05);
}

/** Minimum ratio per declared usage (WCAG 2.1 AA). */
export const THRESHOLDS: Record<string, number> = {
  "normal-text": 4.5,
  "large-text": 3.0,
  "ui-component": 3.0,
};
