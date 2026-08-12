// Gate 3 — computed contrast (blueprint §5.1, §5.2.2–5.2.3).
// Ratios are computed from RESOLVED tokens; declared numbers are never
// trusted. Coverage rule: every Semantic colour token carrying the TEXT_FILL
// scope must appear as `fg` in at least one declared pair — a contrast gate
// that only scores declared pairs proves nothing about a pair nobody declared.
// Escape hatch: time-boxed allowlist (scripts/contrast-allowlist.json).
// Usage: node scripts/check-contrast.ts
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolveColor, contrastRatio, over, THRESHOLDS, type TokenMap } from "./lib/color.ts";
import { loadAllowlist } from "./lib/allowlist.ts";

const TOKENS = "packages/ui/src/tokens/tokens.json";
const PAIRS = "packages/ui/src/tokens/contrast-pairs.json";
const ALLOWLIST = "scripts/contrast-allowlist.json";
const REPORT = "reports/contrast.md";

const tokens: TokenMap = JSON.parse(readFileSync(TOKENS, "utf8")).tokens;
const pairsFile: { pairs: { fg: string; bg: string; base?: string; usage: string }[] } = JSON.parse(
  readFileSync(PAIRS, "utf8"),
);

const today = process.env.GATE_TODAY ?? new Date().toISOString().slice(0, 10);
const allowlist = loadAllowlist(ALLOWLIST, today);

const failures: string[] = [];
const warnings: string[] = [];
const rows: string[] = [];
failures.push(...allowlist.errors);
for (const e of allowlist.expiringSoon)
  warnings.push(
    `allowlist entry "${e.scope}" expires ${e.expires} (within 30 days) — plan the renewal`,
  );

const scopeOf = (p: { fg: string; bg: string; base?: string }) =>
  `${p.fg} on ${p.bg}` + (p.base ? ` over ${p.base}` : "");

for (const pair of pairsFile.pairs) {
  const scope = scopeOf(pair);
  const threshold = THRESHOLDS[pair.usage];
  if (threshold === undefined) {
    failures.push(
      `${scope}: unknown usage "${pair.usage}" (expected ${Object.keys(THRESHOLDS).join(" | ")})`,
    );
    continue;
  }
  let ratio: number;
  try {
    const fg = resolveColor(tokens, pair.fg);
    let bg = resolveColor(tokens, pair.bg);
    if (bg.a < 1) {
      if (!pair.base) {
        failures.push(
          `${scope}: bg resolves to a semi-transparent colour — a "base" is required to composite against`,
        );
        continue;
      }
      const base = resolveColor(tokens, pair.base);
      if (base.a < 1) {
        failures.push(`${scope}: base must resolve to an opaque colour`);
        continue;
      }
      bg = over(bg, base);
    }
    ratio = contrastRatio(fg, bg);
  } catch (e) {
    failures.push(`${scope}: ${(e as Error).message}`);
    continue;
  }
  const pass = ratio >= threshold;
  const allowed = !pass && allowlist.entries.some((e) => e.scope === scope);
  rows.push(
    `| ${scope} | ${pair.usage} | ${ratio.toFixed(2)} | ${threshold} | ${pass ? "PASS" : allowed ? "ALLOWLISTED" : "**FAIL**"} |`,
  );
  if (!pass && !allowed)
    failures.push(`${scope}: computed ${ratio.toFixed(2)}, needs ${threshold} (${pair.usage})`);
  if (!pass && allowed)
    warnings.push(`${scope}: failing at ${ratio.toFixed(2)} under a time-boxed allowlist entry`);
}

// Coverage: every TEXT_FILL Semantic token is declared as fg at least once.
const declaredFg = new Set(pairsFile.pairs.map((p) => p.fg));
for (const [key, t] of Object.entries(tokens)) {
  if (!key.startsWith("Semantic/") || t.type !== "color") continue;
  if (t.scopes.includes("TEXT_FILL") && !declaredFg.has(key))
    failures.push(
      `coverage: ${key} carries TEXT_FILL but appears in no declared pair — undeclared text contrast`,
    );
}

mkdirSync("reports", { recursive: true });
const verdict = failures.length === 0 ? "PASS" : "FAIL";
writeFileSync(
  REPORT,
  `# check-contrast — ${verdict}\n\n| Pair | Usage | Computed | Needs | Verdict |\n| --- | --- | --- | --- | --- |\n${rows.join("\n")}\n` +
    (warnings.length ? `\n## Warnings\n\n${warnings.map((w) => `- ${w}`).join("\n")}\n` : "") +
    (failures.length ? `\n## Failures\n\n${failures.map((f) => `- ${f}`).join("\n")}\n` : ""),
);
if (failures.length) {
  console.error(
    `check-contrast: FAIL (${failures.length}) — see ${REPORT}\n` +
      failures.map((f) => `  - ${f}`).join("\n"),
  );
  process.exit(1);
}
console.log(
  `check-contrast: PASS (${rows.length} pairs)${warnings.length ? ` with ${warnings.length} warning(s)` : ""} — see ${REPORT}`,
);
