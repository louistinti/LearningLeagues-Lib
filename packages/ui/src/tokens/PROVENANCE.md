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

- **2026-08-14** — Default accent arbitration: `Semantic accent/default`
  realiased from `accent/or` to `accent/ambre` in Figma, then re-extracted.
  Measured motivation: the landing and 5 other pages run `data-accent="ambre"`;
  no page uses `or` as its accent. `or` stays available as a selectable accent
  and tier colour; `accent/soft` deliberately keeps the gold-fixed alias
  (matches the site's `--gold-soft`). Contrast gate re-run: PASS (21 pairs).
  Decision verbatim in `components/button/Button.rfc.md` §7. Decided by:
  Louis Tinthilier. Delivered by: M5 agent session (sup. Louis Tinthilier).

- **2026-08-14** — Button RFC arbitration: two Spacing variables added in
  Figma then re-extracted — `s-275` = 22 (`--ll-s-275`, button padding-x) and
  `s-125` = 10 (`--ll-s-125`, icon-label gap). The site's button one-offs
  (22px/10px) canonised on the existing naming arithmetic (2.75×8, 1.25×8);
  decision recorded verbatim in `components/button/Button.rfc.md` §7. Decided
  by: Louis Tinthilier. Delivered by: M5 agent session (sup. Louis
  Tinthilier).

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
