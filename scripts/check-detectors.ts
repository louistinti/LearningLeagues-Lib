// Gate 10 — detector unit tests (blueprint §5.2, row 10): the gates' own
// detectors behave. Wraps `node --test` over the pure detector suites and
// writes the standard per-gate report; under a red run the report and
// stderr name every failing test BEFORE the truncated raw excerpt
// (scripts/lib/test-output.ts); a detector regression (or a silently
// widened blind spot) goes red in the required job.
// Usage: node scripts/check-detectors.ts  (pnpm gate:detectors)
import { spawnSync } from "node:child_process";
import { writeFileSync, mkdirSync } from "node:fs";
import { failingTests } from "./lib/test-output.ts";

// Every pure detector/check suite. Adding a suite = one line here.
const SUITES = [
  "scripts/lib/detectors.test.ts", // token-lint detectors
  "scripts/lib/a11y-checks.test.ts", // a11y engine — generic keyboard checks
  "scripts/lib/a11y-dom.test.ts", // a11y engine — jsdom + axe plumbing
  "scripts/lib/docs-a11y-checks.test.ts", // docs a11y — structural checks
  "scripts/lib/docs-smoke.test.ts", // docs smoke — pure judgement over browser facts
  "scripts/lib/test-output.test.ts", // gate 10 itself — failing-test names out of node --test output
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

// Under a red run the raw excerpt below is truncated; the names never are.
const failing = ok ? [] : failingTests(output);
const failingSection = ok
  ? ""
  : `\n## Failing tests\n\n${failing.length ? failing.map((n) => `- ${n}`).join("\n") : "(no test line found — a crash before any test ran; see Output)"}\n`;

mkdirSync("reports", { recursive: true });
writeFileSync(
  REPORT,
  `# check-detectors — ${ok ? "PASS" : "FAIL"}\n\nSuites (via \`node --test\`):\n${SUITES.map((s) => `- \`${s}\``).join("\n")}\n${summary ? `\n${summary}\n` : ""}` +
    failingSection +
    (ok ? "" : `\n## Output\n\n\`\`\`\n${output.slice(0, 4000)}\n\`\`\`\n`),
);
if (!ok) {
  console.error(
    `check-detectors: FAIL — see ${REPORT}\n` +
      (failing.length ? failing.map((n) => `  ✖ ${n}`).join("\n") + "\n" : "") +
      output.slice(0, 2000),
  );
  process.exit(1);
}
console.log(`check-detectors: PASS (${summary || "suites green"}) — see ${REPORT}`);
