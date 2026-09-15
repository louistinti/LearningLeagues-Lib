# Design — docs-site real-browser smoke gate (approved 2026-09-15)

Approved by Louis Tinthilier (design lead) in session, 2026-09-15. Scope: the
executable gate for blueprint §5.1 row 17 / §5.2.10 — "every other gate and
suite runs in a simulated DOM, which parses markup but never lays out or
paints. A documentation page shipped blank on screen with every gate green
[…]. One browser engine, checking that content is present rather than how it
looks. Also inside the required job." Deferred by the a11y-engine design
record (2026-09-09, "arrives with gate 17's engine if ever") and the docs
a11y design record (2026-09-10, out of scope: "real-browser smoke").

## Decisions taken (with their arbitration)

| Decision                        | Choice                                                                                                                                                                                                                      | Decided by      |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------- |
| Priority for this session       | Gate 17 over the Button selected state and the third component — the one candidate that needs no Figma write or arbitration to land                                                                                         | Louis           |
| Engine and dependency           | Playwright with ITS pinned Chromium build (`playwright` 1.63.0, exact pin, root devDependency like axe/jsdom) — not the system Chrome channel: an unpinned browser is an external input the gate would go red on without a repo change | Louis           |
| Scope of the checks             | Strict blueprint: content present, never how it looks — no `site.js` exercise, no axe in the browser, one viewport, one engine                                                                                              | Louis           |
| Missing browser binary          | Red, with the install command in the report and on stderr — never green by absence (agent default, no escape hatch)                                                                                                         | agent (flagged) |
| Page loading                    | `file://` URLs, one fresh browser context per page, `waitUntil: "load"` — no static server, no shared state between pages                                                                                                   | agent           |
| Escape hatch                    | None (same as gates 9 and 10)                                                                                                                                                                                               | Louis           |

## 1. Spike (2026-09-15, repo root, Playwright 1.63.0 / Chromium 153.0.8010.12, build 1243)

The four generated pages under `file://`, headless, 1280×800: launch 242 ms,
every page under 70 ms, 920 ms in total. Zero console errors, zero page
errors, zero failed requests. Facts that shape the checks:

- An emptied `.stage` keeps a 66 px box (padding) but an empty rendered text —
  height alone does not detect the blueprint's blank-demo incident; the
  check must look INSIDE the surface (a visible descendant).
- The tokens page's inactive `.tok-panel`s have a 0×0 box by design (the tabs
  script hides them) — only the active tab panel is a surface to measure.
- `document.styleSheets[i].cssRules` throws under `file://` (opaque origin),
  but the stylesheet takes effect (body painted `rgb(7, 10, 20)`, font Inter).
  Stylesheet loading is therefore proved by the network events (a missing
  asset is a `requestfailed`) and by the painted body, not by rule counts.

## 2. The gate — `scripts/check-docs-smoke.ts` (`pnpm gate:docs-smoke`)

- Discovery: every `.html` under `docs/`, recursively, sorted — the same
  `htmlFiles` as gate 10, lifted to `scripts/lib/docs-files.ts` and shared by
  both docs gates. Zero pages is a failure.
- Engine: `chromium.launch()` from `playwright` (headless). A launch failure
  whose message names a missing executable is reported as
  `browser binary missing — run: pnpm exec playwright install chromium`; any
  other launch failure is reported verbatim. Both are red.
- Per page: a fresh browser context (viewport 1280×800), listeners for
  `console` (type `error`), `pageerror`, `requestfailed` and `response`
  (status ≥ 400) collected as `events`; `page.goto(pathToFileURL(page))`
  with `waitUntil: "load"`; then `collectFacts` evaluated inside the page.
- `collectFacts` (runs in the browser, returns plain data):

| Fact             | How                                                                                          |
| ---------------- | -------------------------------------------------------------------------------------------- |
| `title`          | `document.title`                                                                             |
| `bodyPainted`    | `getComputedStyle(document.body).backgroundColor` is not fully transparent                   |
| `main`           | `{ box, text }` of `main` — `getBoundingClientRect` width/height, `innerText` trimmed length |
| `h1`             | same, for `main h1`                                                                          |
| `stages`         | for each `.stage`: `{ visibleChildren }` — descendants with a non-zero box                   |
| `tiles`          | for each `.accent-tile`: `{ name, visibleChildren }` beyond the `.accent-name` label         |
| `activePanel`    | the `[role=tabpanel]` not hidden, if any: `{ box, tables }`; `null` when the page has none   |

- `judgePage(facts, events)` — pure, in `scripts/lib/docs-smoke.ts`, locked by
  `docs-smoke.test.ts` in gate 10 — returns findings `{ rule, message }`:

| Rule           | Red when                                                                                          |
| -------------- | ------------------------------------------------------------------------------------------------- |
| `page-events`  | Any collected event (console error, page error, failed request, HTTP ≥ 400) — one finding per event |
| `stylesheet`   | `bodyPainted` is false — the site's stylesheet did not take effect                                |
| `main-content` | No `main`, or its box is empty, or its rendered text is empty                                     |
| `heading`      | No `main h1`, or its box is empty, or its rendered text is empty                                  |
| `demo-stage`   | A `.stage` with zero visible descendants — the blueprint's blank-demo incident                    |
| `accent-tile`  | An `.accent-tile` with nothing visible beyond its name                                            |
| `tab-panel`    | A page with tab panels whose active panel has an empty box or no table                            |
| `page-title`   | Empty `document.title`                                                                            |

- Report `reports/docs-smoke.md`: engine line (Playwright + Chromium
  versions), per-page table (events, findings, verdict), then the failures.
  Never short-circuits: every page is visited, every finding listed.
- Wiring, same commit: `GATES` entry "Docs smoke" after "Docs accessibility";
  `package.json` script `gate:docs-smoke`; PLAYBOOK row; `SUITES` line in
  `check-detectors.ts`; README gate count 10 → 11; PROOF rows.

## 3. Dependency and CI

- `playwright` 1.63.0 as a root devDependency, exact pin (dev-only, outside
  the consumer path — `packages/ui` has no devDependencies). Bump policy: the
  same open question as axe/jsdom, flagged in the PR.
- `ci.yml`, before the aggregator: cache `~/.cache/ms-playwright` keyed on the
  Playwright version read from `package.json`, then
  `pnpm exec playwright install --with-deps chromium`. The step runs on every
  PR (no paths filter — the aggregator is the required check).
- Locally: `pnpm exec playwright install chromium` once (≈150 MB); the gate's
  own red names this command when the binary is missing.

## 4. Proofs (red/green, injection verified, restore only tracked files)

Injections land in a generated page (tracked, restored with `git checkout --`
after confirming no other uncommitted work on it — L08; the drift gate reds
the hand-edited page too, recorded honestly as a co-red in the aggregator
proof):

| Injection                                                                  | Expected red                                  |
| -------------------------------------------------------------------------- | --------------------------------------------- |
| The first `.stage` of `docs/components/button.html` emptied                | `demo-stage`                                  |
| `href="../assets/lib.css"` misspelled on the Button page                   | `page-events` (`requestfailed`) + `stylesheet` |
| `<script>throw new Error("smoke")</script>` appended before `</body>`      | `page-events` (`pageerror`)                   |
| `<main id="main">` emptied on `docs/index.html`                            | `main-content` + `heading`                    |
| Two injections at once, report deleted beforehand                          | both listed, report rewritten (no short-circuit) |
| `PLAYWRIGHT_BROWSERS_PATH` pointed at an empty directory                   | `browser binary missing — run: …`, exit 1     |
| Aggregator with one of the above                                           | `FAIL  Docs smoke` + drift co-red             |
| Detector suite: `judgePage` made blind to `demo-stage`                     | gate 10 red, naming the test                  |

Green: the committed site, every page PASS, the engine line in the report.

## Out of scope (deliberately)

- Exercising `site.js` in the browser (accent switchers, tabs, scrollspy) —
  "scripted states are a later concern" (docs a11y design record).
- axe in the real browser to settle jsdom's three incomplete ids — would
  double gate 10 and the contrast gate on the same rules; arbitrate first.
- A second viewport or a second engine — the blueprint asks for one.
- Real-browser keyboard activation of components (Enter/Space) — the natural
  next use of this engine, a separate design.
- The Button selected / `aria-current` state and the third component —
  the other open candidates, untouched.
