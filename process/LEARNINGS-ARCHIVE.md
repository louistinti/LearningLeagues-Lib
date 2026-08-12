# LEARNINGS — ARCHIVE

Closed lessons, verbatim, each naming the gate that now catches its recurrence.
Nothing is ever deleted; identifiers are stable and shared with the active file.

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
