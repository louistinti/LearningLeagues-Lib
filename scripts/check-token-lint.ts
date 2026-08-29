// Gate 4 — token lint (blueprint §5.2.4): no hardcoded design value anywhere
// in library source, including inline styles. The detectors are pure functions
// in scripts/lib/detectors.ts; this file is only the walker + reporter.
// Escape hatch: an inline allow(<reason>) comment on the flagged line or the
// one after it — reported as a visible allowed usage, never silent.
// Usage: node scripts/check-token-lint.ts
import { readFileSync, writeFileSync, mkdirSync, readdirSync, statSync, existsSync } from "node:fs";
import { join } from "node:path";
import { lintLines, type Violation } from "./lib/detectors.ts";

const REPORT = "reports/token-lint.md";
const EXTENSIONS = [".ts", ".tsx", ".js", ".jsx", ".css", ".html"];
// Scan surface: library source (and the docs site once it exists). The
// generated tokens directory is excluded by design: tokens.css/raw hold the
// raw values — that is their job — and contrast-pairs.json holds token names.
const ROOTS = ["packages", "docs"];
// docs/assets/lib.css is the generated copy of the token stylesheets — raw
// values are its job, like the tokens directory. site.css and the generated
// HTML stay scanned.
const EXCLUDED = [join("src", "tokens"), join("docs", "assets", "lib.css")];

function* walk(dir: string): Generator<string> {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (name === "node_modules" || name === "dist") continue;
    if (EXCLUDED.some((ex) => path.includes(ex))) continue;
    if (statSync(path).isDirectory()) yield* walk(path);
    else if (EXTENSIONS.some((e) => path.endsWith(e))) yield path;
  }
}

const files: string[] = [];
for (const root of ROOTS) if (existsSync(root)) files.push(...walk(root));

const failures: { file: string; v: Violation }[] = [];
const allowed: { file: string; v: Violation }[] = [];
for (const file of files) {
  for (const v of lintLines(readFileSync(file, "utf8").split("\n"))) {
    if (v.allowed) allowed.push({ file, v });
    else failures.push({ file, v });
  }
}

mkdirSync("reports", { recursive: true });
const verdict = failures.length === 0 ? "PASS" : "FAIL";
const row = ({ file, v }: { file: string; v: Violation }) =>
  `| ${file}:${v.line} | ${v.rule} | \`${v.excerpt.replace(/\|/g, "\\|")}\` | ${v.allowed ?? ""} |`;
writeFileSync(
  REPORT,
  `# check-token-lint — ${verdict}\n\nScanned ${files.length} file(s).\n` +
    (failures.length
      ? `\n## Violations (${failures.length})\n\n| Location | Rule | Excerpt | |\n| --- | --- | --- | --- |\n${failures.map(row).join("\n")}\n`
      : "") +
    (allowed.length
      ? `\n## Allowed usages (${allowed.length}) — visible, not silent\n\n| Location | Rule | Excerpt | Reason |\n| --- | --- | --- | --- |\n${allowed.map(row).join("\n")}\n`
      : ""),
);
if (failures.length) {
  console.error(
    `check-token-lint: FAIL (${failures.length}) — see ${REPORT}\n` +
      failures.map(({ file, v }) => `  - ${file}:${v.line} [${v.rule}] ${v.excerpt}`).join("\n"),
  );
  process.exit(1);
}
console.log(
  `check-token-lint: PASS (${files.length} files scanned, ${allowed.length} allowed usage(s)) — see ${REPORT}`,
);
