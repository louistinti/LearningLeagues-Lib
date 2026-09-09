// Gate 10 — detector unit tests (blueprint §5.2, row 10): the gates' own
// detectors behave. Wraps `node --test` over the pure detector suites and
// writes the standard per-gate report; a detector regression (or a silently
// widened blind spot) goes red in the required job.
// Usage: node scripts/check-detectors.ts  (pnpm gate:detectors)
import { spawnSync } from "node:child_process";
import { writeFileSync, mkdirSync } from "node:fs";

// Every pure detector/check suite. Adding a suite = one line here.
const SUITES = [
  "scripts/lib/detectors.test.ts", // token-lint detectors
  "scripts/lib/a11y-checks.test.ts", // a11y engine — generic keyboard checks
  "scripts/lib/a11y-dom.test.ts", // a11y engine — jsdom + axe plumbing
];
const REPORT = "reports/detectors.md";

const r = spawnSync(process.execPath, ["--test", ...SUITES], { encoding: "utf8" });
const output = ((r.stdout ?? "") + (r.stderr ?? "")).trim();
const ok = r.status === 0;
// Spec reporter summary lines look like "ℹ tests 15" / "ℹ pass 15" / "ℹ fail 0".
const summary = output
  .split("\n")
  .map((l) => l.trim())
  .filter((l) => /^[ℹ#] (tests|pass|fail) \d+$/.test(l))
  .map((l) => l.replace(/^[ℹ#] /, ""))
  .join(", ");

mkdirSync("reports", { recursive: true });
writeFileSync(
  REPORT,
  `# check-detectors — ${ok ? "PASS" : "FAIL"}\n\nSuites (via \`node --test\`):\n${SUITES.map((s) => `- \`${s}\``).join("\n")}\n${summary ? `\n${summary}\n` : ""}` +
    (ok ? "" : `\n## Output\n\n\`\`\`\n${output.slice(0, 4000)}\n\`\`\`\n`),
);
if (!ok) {
  console.error(`check-detectors: FAIL — see ${REPORT}\n${output.slice(0, 2000)}`);
  process.exit(1);
}
console.log(`check-detectors: PASS (${summary || "suites green"}) — see ${REPORT}`);
