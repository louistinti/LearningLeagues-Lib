// The conformity aggregator (blueprint §5.1): runs every blocking gate,
// NEVER short-circuits, and produces the single report the one required CI
// job publishes. Every blocking gate lives INSIDE this aggregator — a
// separate CI job is advisory until someone edits branch protection by hand.
// The token diff gate is deliberately NOT here: it is expected-red by design
// and cleared by a human label, so it is its own required job.
// Usage: node scripts/check-conformity.ts
import { spawnSync } from "node:child_process";
import { writeFileSync, mkdirSync } from "node:fs";

const REPORT = "reports/conformity.md";

const GATES: { name: string; command: string; args?: string[]; shell?: boolean }[] = [
  // Shell entries take ONE command string (args + shell would go unescaped).
  { name: "Format", command: "pnpm exec prettier --check .", shell: true },
  { name: "Generated-artefact drift", command: process.execPath, args: ["scripts/check-drift.ts"] },
  { name: "Stylesheet schema", command: process.execPath, args: ["scripts/validate-theme.ts"] },
  { name: "Token lint", command: process.execPath, args: ["scripts/check-token-lint.ts"] },
  { name: "Computed contrast", command: process.execPath, args: ["scripts/check-contrast.ts"] },
  {
    name: "Accessibility status",
    command: process.execPath,
    args: ["scripts/check-a11y-status.ts"],
  },
  {
    name: "Playbook anti-drift",
    command: process.execPath,
    args: ["scripts/check-playbook-drift.ts"],
  },
  {
    name: "Detector unit tests",
    command: process.execPath,
    args: ["scripts/check-detectors.ts"],
  },
];

const results = GATES.map((g) => {
  const r = g.shell
    ? spawnSync(g.command, { encoding: "utf8", shell: true })
    : spawnSync(g.command, g.args ?? [], { encoding: "utf8" });
  const output = ((r.stdout ?? "") + (r.stderr ?? "")).trim();
  return { name: g.name, ok: r.status === 0, output };
});

mkdirSync("reports", { recursive: true });
const failed = results.filter((r) => !r.ok);
const verdict = failed.length === 0 ? "PASS" : "FAIL";
writeFileSync(
  REPORT,
  `# Conformity — ${verdict}\n\n| Gate | Verdict |\n| --- | --- |\n` +
    results.map((r) => `| ${r.name} | ${r.ok ? "PASS" : "**FAIL**"} |`).join("\n") +
    "\n\nPer-gate detail lives in the sibling reports (reports/*.md). Per-component breakdown arrives with the first component.\n" +
    (failed.length
      ? `\n## Failures\n\n${failed.map((r) => `### ${r.name}\n\n\`\`\`\n${r.output.slice(0, 4000)}\n\`\`\``).join("\n\n")}\n`
      : ""),
);
for (const r of results) console.log(`${r.ok ? "PASS" : "FAIL"}  ${r.name}`);
if (failed.length) {
  console.error(
    `\nconformity: FAIL (${failed.length}/${results.length} gate(s) red) — see ${REPORT}`,
  );
  process.exit(1);
}
console.log(`\nconformity: PASS (${results.length} gates) — see ${REPORT}`);
