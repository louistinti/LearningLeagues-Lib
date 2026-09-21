// Accent-axis expansion for the contrast gate (L12). The stylesheet re-points
// ONE token per axis value — `[data-accent="x"] { --ll-accent: var(--ll-accent-x) }`
// (transform.ts) — so tokens.json only ever holds the default alias (ambre).
// A declared pair that resolves through that token is a different contrast
// under each accent: scoring it once proves one fifth of the claim. Pure
// functions over the token map — no I/O — so gate 10 locks them.
import type { TokenMap } from "./color.ts";

/** The one token the accent axis re-points (tokens.css: --ll-accent). */
export const AXIS_TOKEN = "Semantic/accent/default";
const ACCENT_PREFIX = "Primitives/accent/";

export interface ContrastPair {
  fg: string;
  bg: string;
  base?: string;
  usage: string;
}

export interface ExpandedPair {
  pair: ContrastPair;
  /** The accent this evaluation runs under; null when the pair never touches the axis. */
  accent: string | null;
}

/** Every axis value, derived from the primitives — never a hand-kept list. */
export function accentNames(tokens: TokenMap): string[] {
  return Object.keys(tokens)
    .filter((k) => k.startsWith(ACCENT_PREFIX))
    .map((k) => k.slice(ACCENT_PREFIX.length));
}

/** True when the token's alias chain passes through the axis token. */
export function followsAxis(tokens: TokenMap, key: string, seen: string[] = []): boolean {
  if (key === AXIS_TOKEN) return true;
  const t = tokens[key];
  if (!t || seen.includes(key)) return false; // unknown / cycle: resolveColor reports it
  const v = t.value;
  return typeof v === "object" && v !== null && "alias" in v
    ? followsAxis(tokens, v.alias, [...seen, key])
    : false;
}

/** The token map as the stylesheet resolves it under `[data-accent="<accent>"]`. */
export function withAccent(tokens: TokenMap, accent: string): TokenMap {
  const primitive = ACCENT_PREFIX + accent;
  if (!tokens[primitive]) throw new Error(`unknown accent "${accent}": no ${primitive} token`);
  return { ...tokens, [AXIS_TOKEN]: { ...tokens[AXIS_TOKEN], value: { alias: primitive } } };
}

/** One evaluation per accent for a pair through the axis; one (accent null) otherwise. */
export function expandPairs(tokens: TokenMap, pairs: ContrastPair[]): ExpandedPair[] {
  const accents = accentNames(tokens);
  return pairs.flatMap((pair) => {
    const onAxis = [pair.fg, pair.bg, pair.base].some((k) => k && followsAxis(tokens, k));
    if (!onAxis) return [{ pair, accent: null }];
    if (accents.length === 0)
      throw new Error(
        `${pair.fg} on ${pair.bg} follows the accent axis but no ${ACCENT_PREFIX}* token exists`,
      );
    return accents.map((accent) => ({ pair, accent }));
  });
}
