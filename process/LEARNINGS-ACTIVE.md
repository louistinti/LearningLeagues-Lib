# LEARNINGS — ACTIVE

Open lessons: things only a human is catching today. Three lines per entry, no
more. An entry leaves for the archive the day a named test, script or workflow
step goes red on its recurrence — then name that gate in the archive entry.

- **[L01](LEARNINGS-ARCHIVE.md#l01)** — The historical site CSS mixes tokens and hardcoded values freely (e.g. font sizes, letter-spacings inline in class rules).
  - Rule: when extracting a component from the site, every raw value is either mapped to an existing token or flagged as a design gap — never copied.
  - Gate: None yet; token lint (Milestone 3) will cover the library side, nothing covers the extraction judgement.

- **[L02](LEARNINGS-ARCHIVE.md#l02)** — The very first repo-wide text tool (prettier) rewrote the dated blueprint archive on its first run.
  - Rule: every repository-wide scanner or formatter added later (language gate, lint) must carry an explicit `process/archives/` exemption at the moment it is added.
  - Gate: None; the prettier case is covered by `.prettierignore`, but nothing catches the NEXT scanner shipping without the exemption.
