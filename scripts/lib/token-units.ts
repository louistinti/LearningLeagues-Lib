// The unit rule for FLOAT tokens, in one pure function so it is unit-tested
// (gate 10) and the transform stage carries no inline arithmetic.
//   - Layout/z/*, Type/*/weight and Type/*/line-height are unitless by nature.
//   - */opacity/* is a PERCENTAGE in Figma (a float bound to a layer's
//     opacity reads as %, verified 2026-09-26): emitted as value / 100,
//     unitless — the same mechanical arithmetic the normalise stage applies
//     to a PERCENT line-height.
//   - Everything else is px.
export function emitFloat(key: string, n: number): string {
  if (key.startsWith("Layout/z/")) return String(n);
  if (/^Type\/[a-z0-9-]+\/(weight|line-height)$/.test(key)) return String(n);
  if (/^[^/]+\/opacity\/[^/]+$/.test(key)) return String(Math.round((n / 100) * 1e6) / 1e6);
  return `${n}px`;
}
