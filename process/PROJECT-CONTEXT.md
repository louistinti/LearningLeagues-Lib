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
`styles.css` values (code → Figma, a one-time seeding). From that point on the
flow is strictly Figma → code; the historical CSS is reference, not source.

## Design language ("Hextech editorial")

- Single dark palette; no light mode by design.
- Fonts: EB Garamond (display/serif), Inter (body), JetBrains Mono (meta/mono).
- Square corners, 1px rules, corner-bracket ornaments, 8px spacing ladder.
- Theming axes: accent (`or`, `ambre`, `bleu`, `rouge`, `violet`, `jade` — the
  five role guides map onto them) and density (`aere`, `compact`).

## Workspace layout

Sibling checkouts under one parent directory:

- `LearningLeagues/` — the consuming product (never touched outside an explicit
  product-integration mission).
- `LearningLeagues-Lib/` — this repository.

## Deadline

None fixed. Throughput is bounded by human review attention, not calendar.
