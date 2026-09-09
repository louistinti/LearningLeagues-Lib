// Promotion script — the ONLY legal way to change a component's status
// (STATE-MANIFEST: "status is never flipped by hand"). It verifies every
// promotion criterion, reports the FULL blocker list (never short-circuits),
// and only with --write flips contract.json + the manifest row, regenerates
// the docs site, and commits the change as one unit.
// The human gestures stay human: the §6 ratification checkboxes in the RFC
// are the design lead's attestation — this script refuses while they are
// unticked, it never ticks them.
// The a11y status is flipped pending → pass here too, only when the
// accessibility engine gate executed green for the component in the same run.
// Usage: node scripts/promote.ts <component> <stable|exported> [--write]
import { readFileSync, writeFileSync, existsSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { spawnSync } from "node:child_process";
import { loadAllowlist } from "./lib/allowlist.ts";

const COMPONENTS = "packages/ui/src/components";
const MANIFEST = "packages/ui/src/STATE-MANIFEST.md";

const [name, target] = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const write = process.argv.includes("--write");
if (!name || !["stable", "exported"].includes(target ?? "")) {
  console.error("usage: node scripts/promote.ts <component> <stable|exported> [--write]");
  process.exit(1);
}

const dir = join(COMPONENTS, name);
if (!existsSync(dir)) {
  console.error(`promote: no component "${name}" under ${COMPONENTS}`);
  process.exit(1);
}
const blockers: string[] = [];
const checks: string[] = [];
const check = (label: string, ok: boolean, why?: string) => {
  checks.push(`${ok ? "PASS" : "FAIL"}  ${label}${ok || !why ? "" : ` — ${why}`}`);
  if (!ok) blockers.push(`${label}${why ? ` — ${why}` : ""}`);
};

// ── Contract, meta, RFC, manifest row ───────────────────────────────────────
const contractPath = join(dir, "contract.json");
const contract = JSON.parse(readFileSync(contractPath, "utf8"));
const metaFile = readdirSync(dir).find((n) => n.endsWith(".meta.ts"));
const { meta } = metaFile
  ? await import(pathToFileURL(resolve(dir, metaFile)).href)
  : { meta: undefined };
const rfcPath = join(dir, contract.rfc ?? "");
const rfc = existsSync(rfcPath) ? readFileSync(rfcPath, "utf8") : "";
const manifest = readFileSync(MANIFEST, "utf8");
const rowRe = new RegExp(`^\\| ${name}\\s*\\|([^|]*)\\|([\\s\\S]*?)$`, "m");
const row = manifest.split("\n").find((l) => l.startsWith(`| ${name} `));

// ── Criteria (draft → stable; exported adds its own) ───────────────────────
// 1. Every blocking gate green, executed now — a summary is not evidence.
//    The start time gates the engine report below: only a report written by
//    THIS run counts (never a stale file from an earlier session).
const runStartedAt = Date.now() - 1000; // clock-granularity margin
const conf = spawnSync(process.execPath, ["scripts/check-conformity.ts"], { encoding: "utf8" });
check(
  "gates green (pnpm conformity, executed)",
  conf.status === 0,
  conf.status === 0 ? undefined : "conformity FAILED — fix before promoting",
);

// 1b. Accessibility engine green for THIS component, read from the JSON the
//     engine gate wrote during the conformity run above.
const ENGINE_JSON = "reports/a11y-engine.json";
type EngineReport = {
  generatedAt: string;
  components: Record<string, { verdict: "PASS" | "FAIL" }>;
};
const engine: EngineReport | undefined = existsSync(ENGINE_JSON)
  ? JSON.parse(readFileSync(ENGINE_JSON, "utf8"))
  : undefined;
const engineFresh = !!engine && Date.parse(engine.generatedAt) >= runStartedAt;
const engineRow = engineFresh ? engine?.components?.[name] : undefined;
check(
  "accessibility engine green for this component (reports/a11y-engine.json, this run)",
  engineRow?.verdict === "PASS",
  !engineFresh
    ? "no engine report from this run — the engine gate did not execute"
    : !engineRow
      ? "component absent from the engine report"
      : `engine verdict ${engineRow.verdict} — see reports/a11y-engine.md`,
);

// 2. RFC approved + design sign-off attestation (§6 checkboxes, human-ticked).
check('RFC status "approved"', /^> \*\*Status:\*\* approved/m.test(rfc));
const sect6 = rfc.split(/^## 6\./m)[1]?.split(/^## /m)[0] ?? "";
const unticked = [...sect6.matchAll(/^- \[ \] (.+)$/gm)].map((m) => m[1].trim());
const ticked = [...sect6.matchAll(/^- \[x\] (.+)$/gm)].length;
check(
  "ratification checklist §6 fully ticked (design lead's attestation)",
  unticked.length === 0 && ticked > 0,
  unticked.length ? `unticked: ${unticked.join("; ")}` : "no ticked boxes found",
);

// 3. Documentation complete.
check(
  "design link in the contract",
  typeof contract.designNode === "string" && contract.designNode.length > 0,
);
check("documented props in the contract", contract.props && Object.keys(contract.props).length > 0);
check(
  "contract examples (meta.examples ≥ 1)",
  Array.isArray(meta?.examples) && meta.examples.length > 0,
);

// 4. Product adoption recorded in the manifest row.
check(
  "product adoption recorded in the manifest row",
  !!row && /adopted by/i.test(row),
  row ? 'row notes carry no "Adopted by …" statement' : "no registry row",
);

// 5. Post-flip gate prediction: stable requires a11y "pass" (check-a11y-status
//    would red the repository right after the flip otherwise). A "pending"
//    status with the engine green is flipped to "pass" by --write — the only
//    legal way that status changes (design record 2026-09-09).
const a11yStatus: string | undefined = contract.a11y?.status;
const a11yFlip = a11yStatus === "pending" && engineRow?.verdict === "PASS";
check(
  'a11y status "pass" — or "pending" with the engine green (flipped by --write)',
  a11yStatus === "pass" || a11yFlip,
  `currently "${a11yStatus}"${a11yStatus === "pending" ? " and the engine is not green for it" : ""}`,
);

if (target === "exported") {
  check(
    'status already "stable" (or promoted in this run)',
    contract.status === "stable" || blockers.length === 0,
  );
  const today = new Date().toISOString().slice(0, 10);
  const allow = loadAllowlist("scripts/a11y-allowlist.json", today);
  const covered =
    a11yStatus === "pass" ||
    a11yFlip ||
    (a11yStatus === "fail" && allow.entries.some((e) => e.scope === name));
  check('a11y "pass" or time-boxed allowlisted "fail" (export gate)', covered);
}

// ── Verdict ────────────────────────────────────────────────────────────────
console.log(`promote ${name} → ${target}${write ? "" : " (verify only — pass --write to flip)"}\n`);
for (const c of checks) console.log("  " + c);
if (blockers.length) {
  console.error(`\npromote: BLOCKED (${blockers.length}) — nothing changed.`);
  process.exit(1);
}
if (!write) {
  console.log(
    "\npromote: READY — every criterion holds. Re-run with --write to flip, regenerate and commit.",
  );
  process.exit(0);
}

// ── Flip + regenerate + commit, one unit ───────────────────────────────────
const branch = spawnSync("git", ["branch", "--show-current"], { encoding: "utf8" }).stdout.trim();
if (!branch || branch === "main") {
  console.error(
    `promote: refusing to commit on "${branch || "detached HEAD"}" — use a branch (main is push-protected).`,
  );
  process.exit(1);
}
if (target === "stable") contract.status = "stable";
if (target === "exported") {
  contract.status = "stable";
  contract.exported = true;
}
if (a11yFlip) contract.a11y.status = "pass"; // verified by execution above, never by hand
writeFileSync(contractPath, JSON.stringify(contract, null, 2) + "\n");
writeFileSync(
  MANIFEST,
  manifest.replace(rowRe, (line) =>
    line.replace(
      /^(\| [^|]+\|) [a-z]+(\s+)\|/,
      `$1 ${target === "exported" ? "stable" : target}$2|`,
    ),
  ),
);
// The manifest table must stay prettier-formatted or the format gate reds.
spawnSync(
  process.execPath,
  [join("node_modules", "prettier", "bin", "prettier.cjs"), "--write", MANIFEST, contractPath],
  { stdio: "inherit" },
);
const docs = spawnSync(process.execPath, ["scripts/generate-docs.ts"], {
  encoding: "utf8",
  stdio: "inherit",
});
if (docs.status !== 0) {
  console.error("promote: docs regeneration failed after the flip — resolve before committing");
  process.exit(1);
}
console.log(`\non branch: ${branch}`);
const add = spawnSync("git", ["add", contractPath, MANIFEST, "docs"], { stdio: "inherit" });
const commit = spawnSync(
  "git",
  [
    "commit",
    "-m",
    `feat(${name}): promote to ${target} — criteria verified by scripts/promote.ts` +
      (a11yFlip ? " (a11y pending → pass by the accessibility engine gate)" : ""),
  ],
  { stdio: "inherit" },
);
if (add.status !== 0 || commit.status !== 0) {
  console.error("promote: commit failed");
  process.exit(1);
}
console.log(`promote: ${name} is ${target} — committed on ${branch}.`);
