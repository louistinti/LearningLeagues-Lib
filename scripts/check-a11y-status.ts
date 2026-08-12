// Gate 2 — accessibility status (blueprint §5.2.1): stable-gate + export-gate
// consistency, read from each component's machine contract.
//   - a component may not be `stable` while its a11y status is not `pass`
//   - anything exported must be `pass`, or a documented `fail` covered by a
//     time-boxed allowlist entry; an exported `pending` FAILS (unverified
//     surface must never reach consumers — a fresh scaffold is red by design)
//   - a declared `pass` is cross-checked against contradictions in its own
//     notes (the unread-field lesson: numbers green, prose admitting failure)
// Contract shape expected at packages/ui/src/components/<name>/contract.json:
//   { "status": "draft"|"stable", "exported": boolean,
//     "a11y": { "status": "pending"|"pass"|"fail", "notes": string } }
// Usage: node scripts/check-a11y-status.ts
import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync, statSync } from "node:fs";
import { join } from "node:path";
import { loadAllowlist } from "./lib/allowlist.ts";

const COMPONENTS = "packages/ui/src/components";
const ALLOWLIST = "scripts/a11y-allowlist.json";
const REPORT = "reports/a11y-status.md";

const today = process.env.GATE_TODAY ?? new Date().toISOString().slice(0, 10);
const allowlist = loadAllowlist(ALLOWLIST, today);
const failures: string[] = [...allowlist.errors];
const warnings: string[] = [];
for (const e of allowlist.expiringSoon)
  warnings.push(
    `allowlist entry "${e.scope}" expires ${e.expires} (within 30 days) — plan the renewal`,
  );

// Prose contradiction signals for a declared pass (word-boundary matched).
const CONTRADICTION = /\b(fail(s|ing|ed)?|unresolved|broken|not accessible|todo|fixme)\b/i;

const rows: string[] = [];
const dirs = existsSync(COMPONENTS)
  ? readdirSync(COMPONENTS).filter((d) => statSync(join(COMPONENTS, d)).isDirectory())
  : [];

for (const name of dirs) {
  const contractPath = join(COMPONENTS, name, "contract.json");
  if (!existsSync(contractPath)) {
    failures.push(
      `${name}: no contract.json — a component without a machine contract is unverified surface`,
    );
    rows.push(`| ${name} | — | — | — | **FAIL** (no contract) |`);
    continue;
  }
  let c: { status?: string; exported?: boolean; a11y?: { status?: string; notes?: string } };
  try {
    c = JSON.parse(readFileSync(contractPath, "utf8"));
  } catch (e) {
    failures.push(`${name}: unparseable contract.json (${(e as Error).message})`);
    continue;
  }
  const status = c.status ?? "?";
  const a11y = c.a11y?.status ?? "?";
  const notes = c.a11y?.notes ?? "";
  const exported = c.exported === true;
  const problems: string[] = [];
  if (!["draft", "stable"].includes(status)) problems.push(`invalid status "${status}"`);
  if (!["pending", "pass", "fail"].includes(a11y)) problems.push(`invalid a11y status "${a11y}"`);
  if (status === "stable" && a11y !== "pass") problems.push(`stable while a11y is "${a11y}"`);
  if (exported && a11y === "pending")
    problems.push(`exported while a11y is unverified ("pending")`);
  if (exported && a11y === "fail") {
    if (allowlist.entries.some((e) => e.scope === name))
      warnings.push(
        `${name}: exported with a documented failure under a time-boxed allowlist entry`,
      );
    else problems.push(`exported with a11y "fail" and no allowlist entry`);
  }
  if (a11y === "pass" && CONTRADICTION.test(notes))
    problems.push(
      `declared "pass" but its own notes contradict it: ${JSON.stringify(notes.slice(0, 80))}`,
    );
  rows.push(
    `| ${name} | ${status} | ${exported ? "yes" : "no"} | ${a11y} | ${problems.length ? "**FAIL**" : "PASS"} |`,
  );
  failures.push(...problems.map((p) => `${name}: ${p}`));
}

mkdirSync("reports", { recursive: true });
const verdict = failures.length === 0 ? "PASS" : "FAIL";
writeFileSync(
  REPORT,
  `# check-a11y-status — ${verdict}\n\n${dirs.length} component(s) found.\n` +
    (rows.length
      ? `\n| Component | Status | Exported | A11y | Verdict |\n| --- | --- | --- | --- | --- |\n${rows.join("\n")}\n`
      : "\nNo components yet — the gate passes vacuously and will bite from the first scaffold.\n") +
    (warnings.length ? `\n## Warnings\n\n${warnings.map((w) => `- ${w}`).join("\n")}\n` : "") +
    (failures.length ? `\n## Failures\n\n${failures.map((f) => `- ${f}`).join("\n")}\n` : ""),
);
if (failures.length) {
  console.error(
    `check-a11y-status: FAIL (${failures.length}) — see ${REPORT}\n` +
      failures.map((f) => `  - ${f}`).join("\n"),
  );
  process.exit(1);
}
console.log(`check-a11y-status: PASS (${dirs.length} component(s)) — see ${REPORT}`);
