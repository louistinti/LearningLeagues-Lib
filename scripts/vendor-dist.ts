// Vendors dist/ into a consuming repository at a pinned commit (distribution
// contract phase 1, adapted to a buildless host). Blueprint §8.2 rule: DRY RUN
// by default — printing what it would write and touching nothing; writing
// outside this repository is explicit opt-in (--write --target <path>).
// The pin header names the exact lib commit the artefacts were built from.
// Usage: node scripts/vendor-dist.ts [--write] --target <consuming-repo-path>
import { readFileSync, writeFileSync, mkdirSync, existsSync, statSync } from "node:fs";
import { join } from "node:path";
import { execSync } from "node:child_process";

const args = process.argv.slice(2);
const write = args.includes("--write");
const targetIdx = args.indexOf("--target");
const target = targetIdx >= 0 ? args[targetIdx + 1] : undefined;

const FILES = ["ll-lib.css", "ll-lib.jsx"];
const DEST_DIR = "lib"; // inside the consuming repository

if (!target) {
  console.error("vendor-dist: --target <consuming-repo-path> is required (dry run or not)");
  process.exit(1);
}
if (!existsSync(target) || !statSync(target).isDirectory()) {
  console.error(`vendor-dist: target ${target} is not a directory`);
  process.exit(1);
}
for (const f of FILES)
  if (!existsSync(join("dist", f))) {
    console.error(`vendor-dist: dist/${f} missing — run pnpm dist:build first`);
    process.exit(1);
  }

const dirty = execSync("git status --porcelain", { encoding: "utf8" }).trim();
const sha = execSync("git rev-parse HEAD", { encoding: "utf8" }).trim();
if (dirty && write) {
  console.error(
    "vendor-dist: working tree is dirty — a pin must name a real commit. Commit first.",
  );
  process.exit(1);
}

for (const f of FILES) {
  const dest = join(target, DEST_DIR, f);
  const header = `/* VENDORED from LearningLeagues-Lib @ ${sha} (dist/${f}).
 * GENERATED twice over: by \`pnpm dist:build\`, then pinned here by
 * \`node scripts/vendor-dist.ts --write\`. Never edit in this repository —
 * bump the pin by re-running the vendoring at a new lib commit. */\n\n`;
  const content = header + readFileSync(join("dist", f), "utf8");
  if (write) {
    mkdirSync(join(target, DEST_DIR), { recursive: true });
    writeFileSync(dest, content);
    console.log(`vendor-dist: wrote ${dest} (pin ${sha.slice(0, 7)})`);
  } else {
    console.log(
      `vendor-dist (DRY RUN): would write ${dest} (${content.length} bytes, pin ${sha.slice(0, 7)}${dirty ? "; BLOCKED if --write: dirty tree" : ""})`,
    );
  }
}
if (!write) console.log("vendor-dist: dry run — nothing written. Pass --write to vendor.");
