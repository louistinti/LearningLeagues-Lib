# LEARNINGS — ACTIVE

Open lessons: things only a human is catching today. Three lines per entry, no
more. An entry leaves for the archive the day a named test, script or workflow
step goes red on its recurrence — then name that gate in the archive entry.

- **[L01](LEARNINGS-ARCHIVE.md#l01)** — The historical site CSS mixes tokens and hardcoded values freely (e.g. font sizes, letter-spacings inline in class rules).
  - Rule: when extracting a component from the site, every raw value is either mapped to an existing token or flagged as a design gap — never copied.
  - Gate: token lint (`check-token-lint.ts`) now covers the library side; the extraction judgement itself (site → RFC) is still human-only, so the lesson stays active.

- **L04** — Two gate-proof injections silently failed to land (an env assignment placed after the command instead of before; `git checkout --` used to "restore" a file that was never tracked), producing one false red and nearly one false green.
  - Rule: a proof injection is verified to have landed before its verdict is trusted, and untracked fixtures are restored explicitly — `git checkout` restores only tracked files.
  - Gate: None yet; the detector unit-test suite (gate 10, Milestone 4+) is the natural home.

- **L05** — "RFC approved" is enforced at prompt level only: `component-generation.prompt.md` reads the `Status:` line, but nothing mechanical blocks code landing without an approved RFC.
  - Rule: the human reviewer checks the RFC status on every component PR until then.
  - Gate: none yet; the planned promotion script (which owns status semantics) is the natural home.

- **[L02](LEARNINGS-ARCHIVE.md#l02)** — The very first repo-wide text tool (prettier) rewrote the dated blueprint archive on its first run.
  - Rule: every repository-wide scanner or formatter added later (language gate, lint) must carry an explicit `process/archives/` exemption at the moment it is added.
  - Gate: None; the prettier case is covered by `.prettierignore`, but nothing catches the NEXT scanner shipping without the exemption.
