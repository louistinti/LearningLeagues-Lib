// Gate 6 — generated-artefact drift orchestrator (blueprint §5.2.7).
// Runs every generator's --check mode and NEVER short-circuits: a chained
// `a && b` hides every check after the first failure. Adding a generator to
// the repository means adding a line to GENERATORS in the same commit.
// Usage: node scripts/check-drift.ts
import { spawnSync } from "node:child_process";
import { writeFileSync, mkdirSync } from "node:fs";

const REPORT = "reports/drift.md";

const GENERATORS: { name: string; args: string[] }[] = [
  { name: "tokens.json (normalize)", args: ["scripts/extract-tokens/normalize.ts", "--check"] },
  { name: "tokens.css (transform)", args: ["scripts/extract-tokens/transform.ts", "--check"] },
  { name: "docs site (generate-docs)", args: ["scripts/generate-docs.ts", "--check"] },
  { name: "consumer dist (generate-dist)", args: ["scripts/generate-dist.ts", "--check"] },
];

const results = GENERATORS.map((g) => {
  const r = spawnSync(process.execPath, g.args, { encoding: "utf8" });
  return { name: g.name, ok: r.status === 0, output: (r.stdout + r.stderr).trim() };
});

mkdirSync("reports", { recursive: true });
const failed = results.filter((r) => !r.ok);
const verdict = failed.length === 0 ? "PASS" : "FAIL";
writeFileSync(
  REPORT,
  `# check-drift — ${verdict}\n\n| Generated artefact | Verdict |\n| --- | --- |\n` +
    results.map((r) => `| ${r.name} | ${r.ok ? "PASS" : "**FAIL**"} |`).join("\n") +
    "\n" +
    (failed.length
      ? `\n## Failures\n\n${failed.map((r) => `### ${r.name}\n\n\`\`\`\n${r.output}\n\`\`\``).join("\n\n")}\n`
      : ""),
);
if (failed.length) {
  console.error(
    `check-drift: FAIL (${failed.length}/${results.length}) — see ${REPORT}\n` +
      failed.map((r) => `  - ${r.name}: ${r.output.split("\n")[0]}`).join("\n"),
  );
  process.exit(1);
}
console.log(
  `check-drift: PASS (${results.length} generated artefact(s) match their sources) — see ${REPORT}`,
);
