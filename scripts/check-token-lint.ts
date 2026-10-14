// Gate 4 — token lint (blueprint §5.2.4): no hardcoded design value anywhere
// in library source, including inline styles. The detectors are pure functions
// in scripts/lib/detectors.ts; this file is only the walker + reporter.
// Escape hatch: an inline allow(<reason>) comment on the flagged line or the
// one after it — reported as a visible allowed usage, never silent.
// Media-condition rule (since 2026-10-13): a length inside an @media /
// @container condition is legal only when it equals a --ll-breakpoint-*
// token's emitted value AND the same line names that token in a comment —
// `@media (width < 768px) /* --ll-breakpoint-md */ {` — because a custom
// property cannot appear in a media condition. Scope: library source only
// (MEDIA_ROOTS); the docs shell is hand-written chrome whose own layout
// breakpoint is not a design token.
// Usage: node scripts/check-token-lint.ts
import { readFileSync, writeFileSync, mkdirSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, sep } from "node:path";
import { lintLines, type Breakpoints, type Violation } from "./lib/detectors.ts";

const REPORT = "reports/token-lint.md";
const EXTENSIONS = [".ts", ".tsx", ".js", ".jsx", ".css", ".html"];
// Scan surface: library source (and the docs site once it exists). The
// generated tokens directory is excluded by design: tokens.css/raw hold the
// raw values — that is their job — and contrast-pairs.json holds token names.
const ROOTS = ["packages", "docs"];
// docs/assets/lib.css is the generated copy of the token stylesheets, and
// docs/tokens.html is the generated token reference page — displaying raw
// values is their job, like the tokens directory. site.css and every other
// generated HTML page stay scanned.
const EXCLUDED = [
  join("src", "tokens"),
  join("docs", "assets", "lib.css"),
  join("docs", "tokens.html"),
];
// The media-condition rule reads the breakpoint values from the generated
// stylesheet: the value it compares is the one the browser gets.
const TOKENS_CSS = join("packages", "ui", "src", "tokens", "tokens.css");
const MEDIA_ROOTS = ["packages"];
const rootBlock = readFileSync(TOKENS_CSS, "utf8").match(/^:root \{\n([\s\S]*?)\n\}/m);
if (!rootBlock) {
  console.error(`check-token-lint: FAIL — no :root block in ${TOKENS_CSS}`);
  process.exit(1);
}
const breakpoints: Breakpoints = Object.fromEntries(
  [...rootBlock[1].matchAll(/^ {2}(--ll-breakpoint-[a-z0-9-]+): (.+);$/gm)].map((m) => [
    m[1],
    m[2],
  ]),
);
const inMediaScope = (file: string) => MEDIA_ROOTS.some((r) => file.startsWith(r + sep));

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
  const lines = readFileSync(file, "utf8").split("\n");
  for (const v of lintLines(lines, inMediaScope(file) ? breakpoints : null)) {
    if (v.allowed) allowed.push({ file, v });
    else failures.push({ file, v });
  }
}

mkdirSync("reports", { recursive: true });
const verdict = failures.length === 0 ? "PASS" : "FAIL";
const bpList = Object.entries(breakpoints).map(([k, v]) => `\`${k}\` = ${v}`);
const mediaLine = `Media-condition rule under ${MEDIA_ROOTS.map((r) => r + "/").join(", ")} — breakpoint token(s): ${bpList.join(", ") || "none"}.`;
const row = ({ file, v }: { file: string; v: Violation }) =>
  `| ${file}:${v.line} | ${v.rule} | \`${v.excerpt.replace(/\|/g, "\\|")}\` | ${v.allowed ?? ""} |`;
writeFileSync(
  REPORT,
  `# check-token-lint — ${verdict}\n\nScanned ${files.length} file(s).\n\n${mediaLine}\n` +
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
  `check-token-lint: PASS (${files.length} files scanned, ${allowed.length} allowed usage(s), ${bpList.length} breakpoint token(s)) — see ${REPORT}`,
);
