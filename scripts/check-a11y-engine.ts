// Gate 9 — accessibility engine + keyboard suite (blueprint §5.1 row 9),
// auto-discovered over every component × contract example × accent value.
//   - HTML: the SSR render of every contract example (docs-render.ts) —
//     the real component, never an approximation (axiom 4)
//   - engine: axe-core inside a jsdom window carrying tokens.css + the
//     component's own CSS and <html data-accent> (lib/a11y-dom.ts)
//   - keyboard: the generic checks (lib/a11y-checks.ts)
//   - behaviour: an optional <Name>.a11y.test.ts next to the component, run
//     with `node --test`
// Every violation and finding is red; every axe "incomplete" is a visible
// warning. No allowlist (blueprint: escape hatch "none"). Reports:
// reports/a11y-engine.md (humans) and reports/a11y-engine.json (promote.ts).
// Usage: node scripts/check-a11y-engine.ts  (pnpm gate:a11y-engine)
import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { spawnSync } from "node:child_process";
import { renderExamples, type Example } from "./lib/docs-render.ts";
import {
  createWindow,
  runAxe,
  FRAGMENT_DISABLED_RULES,
  WCAG_TAGS,
  type AxeOutcome,
} from "./lib/a11y-dom.ts";
import { checkFragment, type Finding } from "./lib/a11y-checks.ts";

const COMPONENTS = "packages/ui/src/components";
const TOKENS_JSON = "packages/ui/src/tokens/tokens.json";
const TOKENS_CSS = "packages/ui/src/tokens/tokens.css";
const REPORT = "reports/a11y-engine.md";
const REPORT_JSON = "reports/a11y-engine.json";

export interface ComponentVerdict {
  verdict: "PASS" | "FAIL";
  renders: number;
  violations: number;
  findings: number;
  suite: "PASS" | "FAIL" | "none";
}

const startedAt = new Date().toISOString();
const failures: string[] = [];
const warnings: string[] = [];
const rows: string[] = [];
const components: Record<string, ComponentVerdict> = {};
const incompleteById = new Map<string, Set<string>>();

// Accent values come from tokens.json — never hand-listed (same rule as docs).
const tokens = JSON.parse(readFileSync(TOKENS_JSON, "utf8")).tokens as Record<string, unknown>;
const accents = Object.keys(tokens)
  .filter((k) => k.startsWith("Primitives/accent/"))
  .map((k) => k.split("/").pop() as string);
const tokensCss = readFileSync(TOKENS_CSS, "utf8");

const dirs = existsSync(COMPONENTS)
  ? readdirSync(COMPONENTS)
      .filter((d) => statSync(join(COMPONENTS, d)).isDirectory())
      .sort()
  : [];

for (const slug of dirs) {
  const dir = join(COMPONENTS, slug);
  const problems: string[] = [];
  const v: ComponentVerdict = {
    verdict: "PASS",
    renders: 0,
    violations: 0,
    findings: 0,
    suite: "none",
  };
  components[slug] = v;

  const metaFile = readdirSync(dir).find((n) => n.endsWith(".meta.ts"));
  if (!existsSync(join(dir, "contract.json")) || !metaFile) {
    problems.push("no contract.json / *.meta.ts — unverified surface");
  } else {
    const { meta } = await import(pathToFileURL(resolve(dir, metaFile)).href);
    const examples = (Array.isArray(meta?.examples) ? meta.examples : []) as Example[];
    if (examples.length === 0) {
      problems.push("no contract examples — nothing rendered, so nothing is verified");
    } else {
      const componentCss = readdirSync(dir)
        .filter((n) => n.endsWith(".css"))
        .sort()
        .map((n) => readFileSync(join(dir, n), "utf8"))
        .join("\n");
      // One broken component must not abort the report for the others
      // (never short-circuit): a render/window failure is this component's
      // problem and the loop continues.
      try {
        const htmls = renderExamples(dir, meta.name, examples);
        for (const accent of accents) {
          for (const [i, html] of htmls.entries()) {
            const label = examples[i].label;
            const window = createWindow({ html, css: `${tokensCss}\n${componentCss}`, accent });
            let axe: AxeOutcome;
            let findings: Finding[];
            try {
              axe = await runAxe(window);
              findings = checkFragment(window.document, componentCss);
            } finally {
              window.close();
            }
            v.renders++;
            v.violations += axe.violations.length;
            v.findings += findings.length;
            // Refuse a vacuous green: a fragment with real markup always
            // passes at least some rules (the Button passes dozens). Zero
            // means axe ran zero rules — a typo in the tag list resolves
            // silently to zero results otherwise.
            if (axe.passes === 0)
              problems.push(
                `[${accent}] "${label}": axe ran zero rules on a non-empty fragment — engine misconfigured (unknown tag?)`,
              );
            for (const iss of axe.violations)
              problems.push(
                `[${accent}] "${label}": axe ${iss.id} (${iss.impact}) — ${iss.help} — ${iss.nodes[0] ?? ""}`,
              );
            for (const f of findings)
              problems.push(`[${accent}] "${label}": ${f.rule} — ${f.message} — ${f.html}`);
            for (const inc of axe.incomplete) {
              if (!incompleteById.has(inc.id)) incompleteById.set(inc.id, new Set());
              incompleteById.get(inc.id)!.add(slug);
            }
            const red = axe.violations.length + findings.length > 0;
            rows.push(
              `| ${slug} | ${accent} | ${label} | ${axe.violations.length} | ${findings.length} | ${red ? "**FAIL**" : "PASS"} |`,
            );
          }
        }
      } catch (e) {
        problems.push(`render failed: ${(e as Error).message}`);
      }
    }
    // Optional local behaviour suite — discovered, never listed by hand.
    const suite = readdirSync(dir).find((n) => n.endsWith(".a11y.test.ts"));
    if (suite) {
      const r = spawnSync(process.execPath, ["--test", join(dir, suite)], { encoding: "utf8" });
      v.suite = r.status === 0 ? "PASS" : "FAIL";
      if (r.status !== 0)
        problems.push(
          `local suite ${suite} red:\n${((r.stdout ?? "") + (r.stderr ?? "")).trim().slice(0, 1500)}`,
        );
    }
  }
  if (problems.length) v.verdict = "FAIL";
  failures.push(...problems.map((p) => `${slug}: ${p}`));
}

for (const [id, slugs] of incompleteById)
  warnings.push(
    `axe "${id}" came back incomplete for ${[...slugs].join(", ")} — axe cannot decide it without layout` +
      (id === "color-contrast"
        ? " (contrast is proved by the contrast gate from resolved tokens)"
        : " — read the rule and decide; a new incomplete id is information, not a pass"),
  );

mkdirSync("reports", { recursive: true });
const verdict = failures.length === 0 ? "PASS" : "FAIL";
writeFileSync(
  REPORT_JSON,
  JSON.stringify(
    {
      gate: "check-a11y-engine",
      verdict,
      startedAt,
      generatedAt: new Date().toISOString(),
      accents,
      wcagTags: WCAG_TAGS,
      disabledRules: FRAGMENT_DISABLED_RULES,
      components,
    },
    null,
    2,
  ) + "\n",
);
writeFileSync(
  REPORT,
  `# check-a11y-engine — ${verdict}\n\n${dirs.length} component(s) found; accents: ${accents.join(", ")}; axe tags: ${WCAG_TAGS.join(", ")}; page-level rules off for fragments: ${FRAGMENT_DISABLED_RULES.join(", ")}.\n` +
    (dirs.length
      ? `\n## Components\n\n| Component | Renders | axe violations | Keyboard findings | Local suite | Verdict |\n| --- | --- | --- | --- | --- | --- |\n` +
        Object.entries(components)
          .map(
            ([s, c]) =>
              `| ${s} | ${c.renders} | ${c.violations} | ${c.findings} | ${c.suite} | ${c.verdict === "PASS" ? "PASS" : "**FAIL**"} |`,
          )
          .join("\n") +
        `\n\n## Renders\n\n| Component | Accent | Example | axe violations | Keyboard findings | Verdict |\n| --- | --- | --- | --- | --- | --- |\n${rows.join("\n")}\n`
      : "\nNo components yet — the gate passes vacuously and will bite from the first scaffold.\n") +
    (warnings.length
      ? `\n## Warnings (axe incomplete — visible, never silent)\n\n${warnings.map((w) => `- ${w}`).join("\n")}\n`
      : "") +
    (failures.length ? `\n## Failures\n\n${failures.map((f) => `- ${f}`).join("\n")}\n` : ""),
);
if (failures.length) {
  console.error(
    `check-a11y-engine: FAIL (${failures.length}) — see ${REPORT}\n` +
      failures.map((f) => `  - ${f}`).join("\n"),
  );
  process.exit(1);
}
console.log(
  `check-a11y-engine: PASS (${dirs.length} component(s), ${rows.length} render(s), ${warnings.length} warning(s)) — see ${REPORT}`,
);
