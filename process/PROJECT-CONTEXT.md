# PROJECT-CONTEXT

Tool-agnostic context. Rules live in `AGENTS.md`; this file survives a change of
AI tooling.

## Mission

Stand up an AI-first component library ("the machine" described by the
SYSTEM-BLUEPRINT) for LearningLeagues: design tokens flowing one way from Figma,
executable quality gates, an RFC-gated component circuit, and a product-adoption
playbook. Replace the hand-written per-page CSS of the LearningLeagues site with
library components, without visual regression.

## Team

| Role                                    | Person           |
| --------------------------------------- | ---------------- |
| Design lead / owner of every human lock | Louis Tinthilier |
| Agents                                  | AI sessions      |

Single-human team: Louis holds priority, arbitration, reviews, merges and every
approval label.

## Products (consumers)

| Product              | Repository                              | Notes                                             |
| -------------------- | --------------------------------------- | ------------------------------------------------- |
| LearningLeagues site | `github.com/louistinti/LearningLeagues` | Static, buildless (JSX via in-browser transform). |

## Design source

| Item  | Value                                |
| ----- | ------------------------------------ |
| Tool  | Figma (variables + REST API)         |
| File  | `Lib` — key `6zp7CvEjdiFXzwh6ZGGwB8` |
| Owner | Louis Tinthilier                     |

The Figma variables were bootstrapped ONCE from the site's historical
`styles.css` values (code → Figma, a one-time seeding, 2026-08-12). From that
point on the flow is strictly Figma → code; the historical CSS is reference,
not source.

Constraint (verified 2026-08-12): the Figma plan allows **one mode per
variable collection** (`addMode` throws "Limited to 1 modes only"). The accent
axis is therefore modeled as the `Primitives/accent/*` variables; the
transform stage of the token pipeline emits the `[data-accent]` CSS blocks
from them. If the plan ever gains multi-mode, revisit — do not half-migrate.
(The density axis, originally modeled the same way as an explicit variable
pair, was removed 2026-08-30 — every product page measured `compact`; the base
unit survives as the plain `Spacing/s` = 8 token.)

Seeded inventory: Primitives 32 / Semantic 18 (aliases only) / Spacing 12 /
Layout 7 / Typography 3 — 72 variables, every one carrying WEB code syntax in
the `--ll-*` namespace — plus text styles (`type/*`) and 1 effect style
(`shadow/lg`).

Arbitration (Louis, 2026-08-12): the seeded `type/eyebrow` text style was
deleted in Figma — one mono utility style is enough; the eyebrow treatment
(uppercase, wide tracking) is a usage of `type/meta`-family typography, not a
separate style. The site's `.eyebrow` pattern is therefore a candidate design
gap to list in the first RFC that needs it, not a token.

## Design language ("Hextech editorial")

- Single dark palette; no light mode by design.
- Fonts: EB Garamond (display/serif), Inter (body), JetBrains Mono (meta/mono).
- Square corners, 1px rules, corner-bracket ornaments, 8px spacing ladder.
- Theming axis: accent (`ambre`, `bleu`, `rouge`, `violet`, `jade` — the five
  role guides map onto them; `or` removed as an axis value 2026-08-30, gold
  living on as the challenger tier colour and the `gold-soft` alpha). The
  density axis was removed 2026-08-30 (see the mode-constraint note above).

## Workspace layout

Sibling checkouts under one parent directory:

- `LearningLeagues/` — the consuming product (never touched outside an explicit
  product-integration mission).
- `LearningLeagues-Lib/` — this repository.

## Deadline

None fixed. Throughput is bounded by human review attention, not calendar.
