// Docs-site real-browser smoke gate (blueprint §5.1 row 17, §5.2.10): every
// generated page is rendered by Playwright's PINNED Chromium (headless,
// file://, one fresh context per page) and checked for CONTENT PRESENT —
// never how it looks: no console/page error, no failed asset, a painted
// body, a non-empty <main> and <h1>, every demo stage and accent tile
// visibly non-empty, the active tab panel rendered. Facts are collected 250
// ms after load; a component page (docs/components/) must carry at least
// one stage and one tile. Facts are collected inside the page and judged by
// lib/docs-smoke.ts (pure, locked by gate 10).
// No allowlist. A missing browser binary is RED with the install command —
// never green by absence. Never short-circuits. Report: reports/docs-smoke.md.
// Usage: node scripts/check-docs-smoke.ts  (pnpm gate:docs-smoke)
import { existsSync, writeFileSync, mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { chromium, type Browser, type BrowserContext } from "playwright";
import { htmlFiles } from "./lib/docs-files.ts";
import { collectFacts, judgePage, type Finding, type PageKind } from "./lib/docs-smoke.ts";

const DOCS = "docs";
const REPORT = "reports/docs-smoke.md";
const VIEWPORT = { width: 1280, height: 800 };
// Judgement window: facts are collected SETTLE_MS after `load`, so an error
// thrown asynchronously inside that window is judged. The docs pages run only
// synchronous script today — this is insurance, not a wait for anything.
const SETTLE_MS = 250;
// docs/components/*.html are component pages: at least one demo stage and
// one accent tile expected (registry and tokens pages have none by design).
const COMPONENT_PAGES = `${DOCS}/components/`;
const INSTALL = "pnpm exec playwright install chromium";
const PW_VERSION: string = createRequire(import.meta.url)("playwright/package.json").version;
const posix = (p: string) => p.replace(/\\/g, "/");
const firstLine = (e: unknown) => String((e as Error)?.message || e).split("\n")[0];

const failures: string[] = [];
const rows: string[] = [];
let engine = "not launched";

const pages = existsSync(DOCS) ? htmlFiles(DOCS) : [];
if (pages.length === 0)
  failures.push(`no page under ${DOCS}/ — the site always has at least the registry`);

let browser: Browser | null = null;
try {
  browser = await chromium.launch();
  engine = `Playwright ${PW_VERSION} / Chromium ${browser.version()}`;
} catch (e) {
  const msg = firstLine(e);
  failures.push(
    /Executable doesn't exist/i.test(msg)
      ? `browser binary missing — run: ${INSTALL}`
      : `browser launch failed: ${msg}`,
  );
}

if (browser)
  for (const page of pages) {
    const name = posix(page);
    const kind: PageKind = name.startsWith(COMPONENT_PAGES) ? "component" : "other";
    const events: string[] = [];
    let findings: Finding[] = [];
    let context: BrowserContext | null = null;
    try {
      context = await browser.newContext({ viewport: VIEWPORT });
      const tab = await context.newPage();
      tab.on("console", (m) => {
        if (m.type() === "error") events.push(`console error: ${m.text()}`);
      });
      tab.on("pageerror", (e) => events.push(`page error: ${e.message}`));
      tab.on("requestfailed", (r) =>
        events.push(`request failed: ${r.url()} (${r.failure()?.errorText ?? "unknown"})`),
      );
      tab.on("response", (r) => {
        if (r.status() >= 400) events.push(`http ${r.status()}: ${r.url()}`);
      });
      await tab.goto(pathToFileURL(resolve(page)).href, { waitUntil: "load" });
      await tab.waitForTimeout(SETTLE_MS);
      const facts = await tab.evaluate(collectFacts);
      findings = judgePage(facts, events, kind);
    } catch (e) {
      findings = [{ rule: "load", message: `load/engine failed: ${firstLine(e)}` }];
    } finally {
      await context?.close();
    }
    rows.push(
      `| ${name} | ${events.length} | ${findings.length} | ${findings.length ? "**FAIL**" : "PASS"} |`,
    );
    failures.push(...findings.map((f) => `${name}: ${f.rule} — ${f.message}`));
  }
await browser?.close();

mkdirSync("reports", { recursive: true });
const verdict = failures.length === 0 ? "PASS" : "FAIL";
writeFileSync(
  REPORT,
  `# check-docs-smoke — ${verdict}\n\n${pages.length} page(s) under ${DOCS}/ rendered by ${engine} (headless, file://, ${VIEWPORT.width}×${VIEWPORT.height}); content present — browser events (until load + ${SETTLE_MS} ms), painted body, <main> and <h1>, demo stages, accent tiles (component pages: at least one of each), active tab panel.\n` +
    (rows.length
      ? `\n| Page | Browser events | Findings | Verdict |\n| --- | --- | --- | --- |\n${rows.join("\n")}\n`
      : "") +
    (failures.length ? `\n## Failures\n\n${failures.map((f) => `- ${f}`).join("\n")}\n` : ""),
);
if (failures.length) {
  console.error(
    `check-docs-smoke: FAIL (${failures.length}) — see ${REPORT}\n` +
      failures.map((f) => `  - ${f}`).join("\n"),
  );
  process.exit(1);
}
console.log(`check-docs-smoke: PASS (${pages.length} page(s), ${engine}) — see ${REPORT}`);
