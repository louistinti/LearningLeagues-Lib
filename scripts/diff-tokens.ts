// Token diff gate: classifies every token change vs the base branch as
// ADDED / VALUE-CHANGED / RENAMED / REMOVED, writes a report, and fails until
// a human applies the approval label (CI passes APPROVED=true from the label).
// Expected-red by design: red here is NOT a defect while the change is intentional.
// Usage: node scripts/diff-tokens.ts [--base <git-ref>]
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { execFileSync } from "node:child_process";

const TOKENS = "packages/ui/src/tokens/tokens.json";
const PROVENANCE = "packages/ui/src/tokens/PROVENANCE.md";
const REPORT = "reports/token-diff.md";

const baseIdx = process.argv.indexOf("--base");
const base = baseIdx > -1 ? process.argv[baseIdx + 1] : "origin/main";

interface Token {
  type: string;
  css: string;
  scopes: string[];
  value: string | number | { alias: string };
}
const current: Record<string, Token> = JSON.parse(readFileSync(TOKENS, "utf8")).tokens;
let baseTokens: Record<string, Token> = {};
try {
  baseTokens = JSON.parse(
    execFileSync("git", ["show", `${base}:${TOKENS}`], { encoding: "utf8" }),
  ).tokens;
} catch {
  // tokens.json does not exist at base: first introduction, everything is ADDED.
}

const val = (t: Token) => JSON.stringify(t.value);
const added = Object.keys(current).filter((k) => !(k in baseTokens));
const removed = Object.keys(baseTokens).filter((k) => !(k in current));
const changed = Object.keys(current).filter(
  (k) =>
    k in baseTokens &&
    (val(current[k]) !== val(baseTokens[k]) || current[k].css !== baseTokens[k].css),
);
// RENAMED: a removed and an added token carrying the same css + value are one rename.
const renamed: { from: string; to: string }[] = [];
for (const r of [...removed]) {
  const match = added.find(
    (a) => current[a].css === baseTokens[r].css && val(current[a]) === val(baseTokens[r]),
  );
  if (match) {
    renamed.push({ from: r, to: match });
    removed.splice(removed.indexOf(r), 1);
    added.splice(added.indexOf(match), 1);
  }
}

const total = added.length + removed.length + changed.length + renamed.length;
const lines: string[] = [`# token-diff vs \`${base}\` — ${total} change(s)`, ""];
const table = (title: string, rows: string[]) => {
  if (!rows.length) return;
  lines.push(
    `## ${title} (${rows.length})`,
    "",
    "| Token | Before | After |",
    "| --- | --- | --- |",
    ...rows,
    "",
  );
};
table(
  "ADDED",
  added.map((k) => `| ${k} | — | \`${current[k].css}\` = \`${val(current[k])}\` |`),
);
table(
  "REMOVED",
  removed.map((k) => `| ${k} | \`${baseTokens[k].css}\` = \`${val(baseTokens[k])}\` | — |`),
);
table(
  "VALUE-CHANGED",
  changed.map(
    (k) =>
      `| ${k} | \`${baseTokens[k].css}\` = \`${val(baseTokens[k])}\` | \`${current[k].css}\` = \`${val(current[k])}\` |`,
  ),
);
table(
  "RENAMED",
  renamed.map((r) => `| ${r.from} | — | ${r.to} |`),
);
if (total === 0) lines.push("No token changes. Nothing to approve.");

mkdirSync("reports", { recursive: true });

let provenanceOk = true;
if (total > 0) {
  const provDiff = execFileSync("git", ["diff", base, "--", PROVENANCE], { encoding: "utf8" });
  provenanceOk = provDiff
    .split("\n")
    .some((l) => l.startsWith("+") && !l.startsWith("+++") && l.trim() !== "+");
  if (!provenanceOk)
    lines.push(
      "",
      "**BLOCKING: token changes without a new PROVENANCE.md entry.** Add a dated entry (export date, source file, delivering human).",
    );
  lines.push(
    "",
    "> This log proves the provenance entry was updated alongside the change; it cannot prove the change genuinely came from Figma. That guarantee is the human reviewer comparing this diff against the real export — which is what the approval label attests.",
  );
}
writeFileSync(REPORT, lines.join("\n") + "\n");
console.log(readFileSync(REPORT, "utf8"));

if (total === 0) process.exit(0);
if (!provenanceOk) process.exit(1);
if (process.env.APPROVED === "true") {
  console.log("token-diff: changes approved via label.");
  process.exit(0);
}
console.error(
  `token-diff: ${total} token change(s) awaiting HUMAN approval (expected-red). Apply the 'token-approved' label after comparing against the real Figma export.`,
);
process.exit(1);
