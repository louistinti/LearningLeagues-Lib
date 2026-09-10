// Docs-site accessibility gate (blueprint §9.2): every generated page, as
// shipped (no script executed — the no-JS baseline), audited by axe-core in
// page mode (page-level rules ON, WCAG 2.1 AA + best-practice) plus the four
// structural requirements as explicit checks (lib/docs-a11y-checks.ts). Any
// violation or finding is red; axe incompletes are visible warnings; title
// subjects must be unique across pages. No allowlist. Never short-circuits.
// Report: reports/docs-a11y.md.
// Usage: node scripts/check-docs-a11y.ts  (pnpm gate:docs-a11y)
import { readdirSync, statSync, existsSync, writeFileSync, mkdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { JSDOM, VirtualConsole } from "jsdom";
import { runAxe } from "./lib/a11y-dom.ts";
import { checkPage, titleSubject } from "./lib/docs-a11y-checks.ts";

const DOCS = "docs";
const REPORT = "reports/docs-a11y.md";

function htmlFiles(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir).sort()) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...htmlFiles(p));
    else if (name.endsWith(".html")) out.push(p);
  }
  return out;
}
const posix = (p: string) => p.replace(/\\/g, "/");

const failures: string[] = [];
const warnings: string[] = [];
const rows: string[] = [];
const redPages = new Set<string>(); // pages with at least one failure (per-page or cross-page)
const incompleteById = new Map<string, Set<string>>();
const subjects = new Map<string, string[]>(); // title subject → pages

const pages = existsSync(DOCS) ? htmlFiles(DOCS) : [];
if (pages.length === 0)
  failures.push(`no page under ${DOCS}/ — the site always has at least the registry`);

for (const page of pages) {
  const name = posix(page);
  const problems: string[] = [];
  let axeViolations = 0;
  let findings = 0;
  try {
    const dom = await JSDOM.fromFile(resolve(page), {
      runScripts: "outside-only",
      virtualConsole: new VirtualConsole(),
    });
    const { window } = dom;
    try {
      const axe = await runAxe(window, { page: true });
      if (axe.passes === 0) problems.push("axe ran zero rules — engine misconfigured");
      axeViolations = axe.violations.length;
      for (const v of axe.violations)
        problems.push(
          `axe ${v.id} (${v.impact}) — ${v.help} — \`${v.nodes[0] ?? ""}\`${v.nodes.length > 1 ? ` (+${v.nodes.length - 1} more node(s))` : ""}`,
        );
      for (const inc of axe.incomplete) {
        if (!incompleteById.has(inc.id)) incompleteById.set(inc.id, new Set());
        incompleteById.get(inc.id)!.add(name);
      }
      const f = checkPage(window.document);
      findings = f.length;
      for (const x of f)
        problems.push(`${x.rule} — ${x.message}${x.html ? ` — \`${x.html}\`` : ""}`);
      const subject = titleSubject(window.document);
      if (!subjects.has(subject)) subjects.set(subject, []);
      subjects.get(subject)!.push(name);
    } finally {
      window.close();
    }
  } catch (e) {
    problems.push(`load/engine failed: ${(e as Error).message}`);
  }
  rows.push(`| ${name} | ${axeViolations} | ${findings} | VERDICT |`);
  if (problems.length) redPages.add(name);
  failures.push(...problems.map((p) => `${name}: ${p}`));
}

// Cross-page: title subjects must be unique. An empty subject is skipped here —
// each such page already carries a clearer `page-title` finding of its own.
for (const [subject, where] of subjects)
  if (subject && where.length > 1) {
    failures.push(
      `unique-title — "${subject}" is the title subject of ${where.length} pages: ${where.join(", ")}`,
    );
    for (const name of where) redPages.add(name);
  }
for (let i = 0; i < rows.length; i++)
  rows[i] = rows[i].replace(
    "| VERDICT |",
    redPages.has(posix(pages[i])) ? "| **FAIL** |" : "| PASS |",
  );

const COVERED: Record<string, string> = {
  "color-contrast": "contrast is proved by the contrast gate from resolved tokens",
  "landmark-one-main": "covered by the structural `landmarks` check",
  "page-has-heading-one": "covered by the structural `page-title` check",
};
for (const [id, where] of incompleteById)
  warnings.push(
    `axe "${id}" came back incomplete for ${where.size} page(s) — axe cannot decide it without layout` +
      (COVERED[id]
        ? ` (${COVERED[id]})`
        : " — read the rule and decide; a new incomplete id is information, not a pass"),
  );

mkdirSync("reports", { recursive: true });
const verdict = failures.length === 0 ? "PASS" : "FAIL";
writeFileSync(
  REPORT,
  `# check-docs-a11y — ${verdict}\n\n${pages.length} page(s) under ${DOCS}/; axe page mode (WCAG 2.1 AA + best-practice, page-level rules on) + structural checks (skip link first, landmarks, table scopes, page title) + unique title subjects.\n` +
    (pages.length
      ? `\n| Page | axe violations | Structural findings | Verdict |\n| --- | --- | --- | --- |\n${rows.join("\n")}\n`
      : "") +
    (warnings.length
      ? `\n## Warnings (axe incomplete — visible, never silent)\n\n${warnings.map((w) => `- ${w}`).join("\n")}\n`
      : "") +
    (failures.length ? `\n## Failures\n\n${failures.map((f) => `- ${f}`).join("\n")}\n` : ""),
);
if (failures.length) {
  console.error(
    `check-docs-a11y: FAIL (${failures.length}) — see ${REPORT}\n` +
      failures.map((f) => `  - ${f}`).join("\n"),
  );
  process.exit(1);
}
console.log(
  `check-docs-a11y: PASS (${pages.length} page(s), ${warnings.length} warning(s)) — see ${REPORT}`,
);
