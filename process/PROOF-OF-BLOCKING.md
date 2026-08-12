# Proof of blocking

Every gate was fed a known-invalid input and observed exiting non-zero, then
restored and observed green (blueprint §5.5: re-reading a gate's logic is not
verification). Injections are verified to have landed before their verdict is
trusted — two broken injections in this repository's history produced a false
red and a false green respectively (L03, L04).

Last full run: 2026-08-12, locally, Node 24.16.0. Re-prove after any change to
a detector or a gate's scan surface.

| Gate                              | Injection                                                              | Red observed                                                        | Restored green                                                             |
| --------------------------------- | ---------------------------------------------------------------------- | ------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| Format                            | unformatted new files                                                  | exit 1                                                              | exit 0 after `pnpm format`                                                 |
| Generated-artefact drift          | hand edit in `tokens.css` AND `tokens.json` simultaneously             | exit 1, **both** artefacts in the report (non-short-circuit §5.2.7) | exit 0                                                                     |
| Generated-artefact drift          | prettier rewriting generated artefacts (real incident, L03)            | exit 1                                                              | exit 0 after `.prettierignore` exemption                                   |
| Stylesheet schema                 | removed `[data-role="mid"]` block                                      | exit 1, names the missing block                                     | exit 0                                                                     |
| Stylesheet schema                 | dangling `var(--ll-does-not-exist)`                                    | exit 1                                                              | exit 0                                                                     |
| Stylesheet schema                 | unexpected `[data-accent="pink"]` block                                | exit 1                                                              | exit 0                                                                     |
| Token lint — raw colour           | `"#ff0000"` in a source fixture                                        | exit 1                                                              | exit 0 after removal                                                       |
| Token lint — arbitrary value      | `p-[13px]`                                                             | exit 1                                                              | exit 0                                                                     |
| Token lint — invalid var syntax   | `var(ll-bg)`                                                           | exit 1                                                              | exit 0                                                                     |
| Token lint — static inline style  | `style={{ width: 240 }}`                                               | exit 1                                                              | exit 0                                                                     |
| Token lint — allow escape         | same `#ff0000` + `allow(<reason>)`                                     | exit 0 **with the usage listed visibly** in the report              | —                                                                          |
| Computed contrast — threshold     | 4 real pairs under 4.5 (fg/mute × 3 backgrounds, danger badge at 4.48) | exit 1, computed ratios in the report                               | exit 0 after the arbitrated Figma fix (fg-mute `#7d89a3`, danger-soft 12%) |
| Computed contrast — coverage      | all `fg/mute` pairs removed from the declaration file                  | exit 1, names the undeclared TEXT_FILL token                        | exit 0 after restore                                                       |
| A11y status — missing contract    | component dir without `contract.json`                                  | exit 1                                                              | exit 0                                                                     |
| A11y status — stable gate         | `stable` + a11y `pending`                                              | exit 1                                                              | exit 0                                                                     |
| A11y status — export gate         | `exported` + a11y `pending`                                            | exit 1                                                              | exit 0                                                                     |
| A11y status — export gate         | `exported` + a11y `fail`, no allowlist entry                           | exit 1                                                              | exit 0                                                                     |
| A11y status — unread field        | declared `pass`, notes admit "keyboard nav still fails"                | exit 1                                                              | exit 0                                                                     |
| A11y status — legal state         | honest draft (`draft`, not exported, `pending`)                        | —                                                                   | exit 0 (correctly green)                                                   |
| Allowlist loader — valid entry    | time-boxed, named, substantive entry covering the failing fixture      | —                                                                   | exit 0, **as a visible warning**                                           |
| Allowlist loader — expiry         | entry expired 2026-08-01                                               | exit 1                                                              | exit 0                                                                     |
| Allowlist loader — blank approver | `approvedBy: "  "`                                                     | exit 1                                                              | exit 0                                                                     |
| Allowlist loader — thin reason    | `reason: "minor issue"`                                                | exit 1                                                              | exit 0                                                                     |
| Aggregator                        | 2 gates red simultaneously (format + contrast)                         | exit 1, **both** listed (no short-circuit)                          | —                                                                          |
| Token diff                        | 72 added tokens, no label                                              | exit 1 (expected-red)                                               | exit 0 with `token-approved` label                                         |
| Token diff — provenance           | value change without a PROVENANCE.md entry                             | exit 1 **even with the label**                                      | exit 0 after restore                                                       |
