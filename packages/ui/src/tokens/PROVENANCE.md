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

- **2026-08-12** — Contrast arbitration: `neutral/fg-mute` `#6e7a94` → `#7d89a3`
  and `alpha/danger-soft` opacity 14% → 12%, changed in Figma then re-extracted
  (2 variables patched in the raw export, values read back from the file).
  Motivation: 4 computed-contrast failures (fg/mute under 4.5 on soft/surface
  backgrounds; danger-on-danger-soft badge at 4.48). Option chosen by the
  design lead over usage-restriction and allowlist. Decided and delivered by:
  Louis Tinthilier.

- **2026-08-12** — Initial extraction from Figma file `Lib`
  (`6zp7CvEjdiFXzwh6ZGGwB8`), 72 variables across 5 collections. The Figma
  variables were themselves seeded the same day from the site's historical
  `styles.css` (one-time code-to-Figma bootstrap). Delivered by: Louis
  Tinthilier.
