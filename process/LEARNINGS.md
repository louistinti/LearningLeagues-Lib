# LEARNINGS

One file, two sections. **Active**: open lessons only a human is catching
today — three lines per entry, no more. An entry moves to **Archive** the day
a named test, script or workflow step goes red on its recurrence — then name
that gate in the archived entry, verbatim, never rewritten. Identifiers are
stable across the move.

## Active

- **L01** — The historical site CSS mixes tokens and hardcoded values freely (e.g. font sizes, letter-spacings inline in class rules).
  - Rule: when extracting a component from the site, every raw value is either mapped to an existing token or flagged as a design gap — never copied.
  - Gate: token lint (`check-token-lint.ts`) now covers the library side; the extraction judgement itself (site → RFC) is still human-only, so the lesson stays active.

- **L02** — The very first repo-wide text tool (prettier) rewrote the dated blueprint archive on its first run.
  - Rule: every repository-wide scanner or formatter added later (language gate, lint) must carry an explicit `process/archives/` exemption at the moment it is added.
  - Gate: None; the prettier case is covered by `.prettierignore`, but nothing catches the NEXT scanner shipping without the exemption.

- **L04** — Two gate-proof injections silently failed to land (an env assignment placed after the command instead of before; `git checkout --` used to "restore" a file that was never tracked), producing one false red and nearly one false green.
  - Rule: a proof injection is verified to have landed before its verdict is trusted, and untracked fixtures are restored explicitly — `git checkout` restores only tracked files.
  - Gate: `pnpm gate:detectors` (since 2026-08-25) locks detector behaviour and their documented blind spots; the injection-landed discipline itself remains procedural, so the lesson stays active.

- **L05** — "RFC approved" is enforced at prompt level only: `component-generation.prompt.md` reads the `Status:` line, but nothing mechanical blocks code landing without an approved RFC.
  - Rule: the human reviewer checks the RFC status on every component PR until then.
  - Gate: none yet; the planned promotion script (which owns status semantics) is the natural home.

- **L06** — The test-button scaffold's intentional red lived inside the required CI job, making it permanently red: the first PR it blocked was the one shipping the circuit itself (arbitrated 2026-08-12: fixture deleted, evidence kept in PROOF-OF-BLOCKING).
  - Rule: an intentional red is proved by injection-then-revert, never by a committed fixture the required job scans.
  - Gate: the required job's green-on-merge requirement is itself the gate, now that no permanent red is committed.

- **L07** — Stacked PRs (#10 on #9's branch, #11 on #10's) were merged into their stacked bases; only #9 reached main, and the work sat invisible on intermediate branches until noticed.
  - Rule: a stacked PR is retargeted to `main` the moment its base merges — before pressing its own merge; "merged" means merged-to-main, verified on `main`'s log, not on the PR badge.
  - Gate: none; candidate is a repo check that flags merged PRs whose base was not `main`.

## Archive (closed, verbatim)

<a id="l03"></a>

- **L03** (2026-08-12, retired same day) — Prettier reformatted the generated
  `tokens.css`/`tokens.json` at commit time, making the committed artefact drift
  from its generator's exact bytes; the drift gate then stayed red after a
  restore, and a gate-proof injection silently failed to match the reformatted
  text (validating a gate requires verifying the injection actually landed).
  - Rule: a generated file's bytes are owned by its generator — every generated
    artefact is added to `.prettierignore` (and to any future formatter's
    ignore) the moment it is introduced.
  - Gate: `pnpm tokens:check` in the required CI job goes red if any formatter
    (or hand) rewrites the token artefacts.
