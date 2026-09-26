# Token provenance log

Every change to the generated token artefacts (`raw/figma-variables.json`,
`tokens.json`, `tokens.css`) must add a dated entry here: export date, source
file reference, and the human who delivered it. The diff gate fails any token
change without one.

**Honesty clause.** This log proves an entry was updated alongside the change;
it cannot prove the change genuinely came from Figma. That guarantee comes from
the human reviewer comparing the entry against the real export before applying
the `token-approved` label.

**Scope.** An entry records export date, source and deliverer. For the design
decision behind a change, point to its RFC arbitration log (§7) — the single
source — rather than restating it here.

## Entries

- **2026-09-26** — Sigil RFC arbitration (§7 Q4, Q9): one Primitives variable
  added in Figma through the MCP then re-extracted — `opacity/ornament` = 25
  (`--ll-opacity-ornament` = `0.25`, the accent ring's opacity inside the
  Sigil frame). Stored as a percentage because Figma reads a float bound to a
  layer's opacity as % (a first write of 0.25 rendered the ring at 0.25 %);
  the transform's unit rule (`scripts/lib/token-units.ts`) divides `opacity/*`
  by 100 — so `tokens.json` carries 25 and `tokens.css` carries 0.25, by
  design, not drift (the token diff reports the `tokens.json` value). Raw
  export patched by script and checksum-verified against the live export
  (djb2 over the full export, `680dd01f`). Decided by: Louis Tinthilier.
  Delivered by: Sigil implementation session (sup. Louis Tinthilier).

- **2026-09-21** — Contrast arbitration on the accent axis: `Primitives/accent/rouge`
  `#c96f6f` → `#d28585`, changed in Figma (variable 4:14) then re-extracted from
  file `Lib` (`6zp7CvEjdiFXzwh6ZGGwB8`). Motivation: the contrast gate now scores
  every pair through `Semantic/accent/default` once per accent (L12) and found
  rouge on `accent/soft` over `surface/default` at 3.99:1 (needs 4.5); the new
  value computes 4.95 there, 6.14 on `surface/default`, 5.63 on `surface/raised`.
  Option chosen by the design lead over a time-boxed allowlist entry and over
  dropping the pair; value chosen among three computed candidates (« Rouge :
  #d28585 », in session). The committed raw export was verified equal to Figma's
  full export by checksum before writing (item-by-item comparison first). Two
  non-design differences ride the same export: the plugin API now returns
  `fontName.variationSettings` on the 8 text styles, and Figma lists
  `type/button` before `type/meta` — no token value changes from either.
  Decided by: Louis Tinthilier. Delivered by: contrast-axis agent session (sup.
  Louis Tinthilier).

- **2026-08-30** — Density axis removed: every product page measured
  `data-density="compact"` (`aere` existed only as an unused definition in the
  historical `styles.css`), so the axis carried no information.
  `Spacing/density/base-compact` renamed to `s` in Figma (the base unit
  survives as the plain `--ll-s` = 8 token — the site's spacing pattern
  multiplies it); `density/base-aere` deleted in Figma (verified un-aliased;
  deletion performed by Louis — the MCP session's destructive call was
  permission-blocked); the Spacing mode renamed `compact` → `Mode 1`. Raw
  export updated by script; `[data-density]` emission, schema-gate
  expectations and the docs density switcher removed in the same change.
  Decided by: Louis Tinthilier (2026-08-30, in session). Delivered by:
  text-style-tokens agent session (sup. Louis Tinthilier).

- **2026-08-30** — Accent axis narrowed: `Primitives/accent/or` deleted in
  Figma (verified un-aliased first; the remaining accents read back:
  ambre/bleu/rouge/violet/jade) and removed from the raw export by script.
  This narrows the 2026-08-14 arbitration ("or stays available as a selectable
  accent"): measured then and still true now, no product page uses `or`; gold
  survives as `tier/challenger` and the `gold-soft` alpha, both untouched.
  Schema gate's expected accent set updated in the same change. Decided by:
  Louis Tinthilier (2026-08-30, in session). Delivered by: text-style-tokens
  agent session (sup. Louis Tinthilier).

- **2026-08-30** — Text-style extraction: the 8 `type/*` text styles exported
  from Figma file `Lib` via the extended stage-1 procedure (variables
  re-exported the same session and verified unchanged — the tokens.json diff
  is additions only). Normalize derives 56 per-property tokens (collection
  `Type`, `--ll-type-<style>-<prop>`); the one judgement — `type/button`
  weight 600 while the Figma face is Bold(700) pending JetBrains Mono
  SemiBold — is a documented transform override, arbitrated in the Figma
  style description and `components/button/Button.rfc.md` §7. Extraction form
  (per-property variables) decided by: Louis Tinthilier (2026-08-30, in
  session). Delivered by: text-style-tokens agent session (sup. Louis
  Tinthilier).

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
