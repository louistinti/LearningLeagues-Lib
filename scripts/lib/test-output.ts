// Failing test names out of `node --test` output, in both reporters Node
// emits: spec (`✖ name (1.2ms)`, the default under Node 24 even when piped)
// and tap (`not ok 3 - name`). Pure — gate 10 (check-detectors.ts) prints the
// result BEFORE its truncated raw excerpt, so a red suite always names its
// red tests whatever the excerpt cuts off. Deduped in order of first
// appearance: spec repeats every red test under its "✖ failing tests:"
// section, and that header is not a test. A suite line (`✖ group`) counts —
// a suite holding a red test is red. Two red tests sharing a name under
// different `describe` groups are deduped to one entry; the group lines
// still name each group, so the run remains distinguishable from context.
// The spec reporter always appends its own `(N.Nms)` duration to the line,
// so the optional trailing duration group is safe to strip even when a
// test's own name ends in something that looks like `(…ms)`: the real
// duration is the last such group on the line.
const SPEC = /^\s*✖ (.+?)(?: \(\d+(?:\.\d+)?ms\))?$/;
const TAP = /^\s*not ok \d+ - (.+?)(?: # (TODO|SKIP)\b.*)?$/;
const SPEC_HEADER = "failing tests:";

export function failingTests(output: string): string[] {
  const seen = new Set<string>();
  const names: string[] = [];
  for (const line of output.split(/\r?\n/)) {
    const m = SPEC.exec(line) ?? TAP.exec(line);
    if (!m) continue;
    if (m[2] === "TODO") continue;
    const name = m[1].trim();
    if (name === SPEC_HEADER || seen.has(name)) continue;
    seen.add(name);
    names.push(name);
  }
  return names;
}
