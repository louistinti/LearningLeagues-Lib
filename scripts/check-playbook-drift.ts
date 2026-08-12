// Gate 14 — playbook anti-drift (blueprint §5.2.8): every gate/generator script
// and every prompt file added to the repository must be referenced at least
// once in the playbook. The gate does not check that the prose is correct —
// it makes it impossible for a new script to silently avoid getting an entry.
// Rule: add the playbook row in the same commit as the script.
// Usage: node scripts/check-playbook-drift.ts
import { readdirSync, readFileSync, writeFileSync, mkdirSync, existsSync, statSync } from "node:fs";
import { join } from "node:path";

const SCRIPTS = "scripts";
const PLAYBOOK = "process/PLAYBOOK.md";
const REPORT = "reports/playbook-drift.md";

const errors: string[] = [];
const found: string[] = [];

// Scripts that MUST be referenced in the playbook.
const scriptPatterns = [
  /^check-[a-z-]+\.ts$/, // gates
  /^generate-[a-z-]+\.ts$/, // generators
];
const promptPatterns = [/^[a-z-]+-prompt\.md$/]; // prompts
const allPatterns = [...scriptPatterns, ...promptPatterns];

function walkScripts(dir: string): string[] {
  const files: string[] = [];
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (name === "node_modules" || name === "lib") continue;
    if (statSync(path).isDirectory()) {
      files.push(...walkScripts(path));
    } else if (allPatterns.some((p) => p.test(name))) {
      files.push(name);
    }
  }
  return files;
}

const scripts = walkScripts(SCRIPTS);
const playbook = existsSync(PLAYBOOK) ? readFileSync(PLAYBOOK, "utf8") : "";

for (const script of scripts) {
  if (playbook.includes(script) || playbook.includes(script.replace(/\.ts$/, ""))) {
    found.push(script);
  } else {
    errors.push(`${script}: added to the repository but not referenced in ${PLAYBOOK}`);
  }
}

mkdirSync("reports", { recursive: true });
const verdict = errors.length === 0 ? "PASS" : "FAIL";
writeFileSync(
  REPORT,
  `# check-playbook-drift — ${verdict}\n\nScanned ${scripts.length} script(s) in ${SCRIPTS}/.\n\n` +
    (found.length
      ? `## Referenced (${found.length})\n\n${found.map((s) => `- ${s}`).join("\n")}\n\n`
      : "") +
    (errors.length
      ? `## Failures (${errors.length})\n\n${errors.map((e) => `- ${e}`).join("\n")}\n`
      : ""),
);
if (errors.length) {
  console.error(
    `check-playbook-drift: FAIL (${errors.length}) — see ${REPORT}\n` +
      errors.map((e) => `  - ${e}`).join("\n"),
  );
  process.exit(1);
}
console.log(`check-playbook-drift: PASS (${found.length} script(s) indexed) — see ${REPORT}`);
