# Token provenance log

Every change to the generated token artefacts (`raw/figma-variables.json`,
`tokens.json`, `tokens.css`) must add a dated entry here: export date, source
file reference, and the human who delivered it. The diff gate fails any token
change without one.

**Honesty clause.** This log proves an entry was updated alongside the change;
it cannot prove the change genuinely came from Figma. That guarantee comes from
the human reviewer comparing the entry against the real export before applying
the `token-approved` label.

## Entries

- **2026-08-12** — Initial extraction from Figma file `Lib`
  (`6zp7CvEjdiFXzwh6ZGGwB8`), 72 variables across 5 collections. The Figma
  variables were themselves seeded the same day from the site's historical
  `styles.css` (one-time code-to-Figma bootstrap). Delivered by: Louis
  Tinthilier.
