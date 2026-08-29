# Design — documentation site v1 (approved 2026-08-29)

Approved by Louis Tinthilier (design lead) in session, 2026-08-29. Scope:
the component showcase interface named by the blueprint
(`process/archives/2026-08-12-system-blueprint.md` §9), delivered as two PRs.
Louis will review the rendered result and decide afterwards whether new Figma
mockups are needed; a tokens/foundations page is the agreed next mission after
this one.

## Decisions taken (with their arbitration)

| Decision                                                                 | Choice                                                                                    | Decided by |
| ------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------- | ---------- |
| Rendering architecture                                                   | Static site generation: generator script renders real components to committed static HTML | Louis      |
| Showing the six accents side by side                                     | Widen the theme contract: axis selectors become element-scoped (`[data-accent]`)          | Louis      |
| v1 scope                                                                 | Index (registry) + Button page; tokens page is the next mission, not this one             | Louis      |
| Scope the density axis too (`[data-density]` element-scoped, symmetry)   | Yes — same mechanism, same commit as the accent change                                    | agent (flagged) |

## PR 1 — element-scoped theme axes

`scripts/extract-tokens/transform.ts` currently emits `:root[data-accent="…"]`,
`:root[data-role="…"]`, `:root[data-density="…"]`. It will emit the same blocks
without the `:root` prefix, so any element can carry the attribute and theme its
subtree by inheritance; the bare-root defaults on `:root` are unchanged.
Token *values* do not change — the diff gate should stay green; CODEOWNERS on
the generated stylesheet routes the review to Louis regardless. Regenerated
`tokens.css` lands in the same commit as the transform change (axiom 2), and
`pnpm gate:contrast` is re-run per the ORCHESTRATION trigger table.

Why products want this beyond the docs site: role cards — several accents on
one page — are a measured product pattern (the five role guides map onto the
accent axis).

## PR 2 — the site (based on PR 1's branch)

### Layout (adaptation of blueprint §2.1, which invites it)

```
docs/
├─ index.html               # GENERATED — component registry page
├─ components/<name>.html   # GENERATED — one page per component, single template
└─ assets/
   ├─ lib.css               # GENERATED — tokens.css + every component css, concatenated
   ├─ site.css              # hand-written — site chrome, token values only
   └─ site.js               # hand-written — accent/density switchers (vanilla JS, sets data-* on :root)
```

Every GENERATED file carries a header comment naming `pnpm docs:build`.
`site.css` / `site.js` are editable shells that never contain a registry entry
(blueprint §2.3). The site, being an application, owns a minimal reset in
`site.css`; the library still ships none (distribution contract).

### Generator — `scripts/build-docs.ts` (`pnpm docs:build`)

1. Discovers components by glob `packages/ui/src/components/*/contract.json`,
   **sorted by name** (deterministic output).
2. Loads `contract.json` and dynamically imports the component's `*.meta.ts`
   (plain TS — Node 24 runs it). Validates required fields (name, description,
   variants, examples; contract props/a11y) and **fails loudly** on a missing
   one — the precursor of the blueprint's documentation-completeness gate.
3. Renders the real component: esbuild transforms the `.tsx`,
   `react-dom/server.renderToStaticMarkup` produces demo markup. No local
   approximation, ever (axiom 4).
4. Copies/concatenates the library stylesheets into `docs/assets/lib.css` so
   `docs/` is self-contained (a static host serving only `docs/` — e.g. GitHub
   Pages — never reaches `packages/`). All URLs relative.
5. Emits `index.html` + `components/<name>.html` from one template. Output is
   byte-deterministic: no timestamps, stable ordering.

New root devDependencies: `react`, `react-dom`, `esbuild` (build-time only,
nothing enters the consumer path; bump policy flagged in the PR per
ORCHESTRATION).

### Content contract: `meta.ts` gains `examples`

Blueprint §9.1 requires "at least one example" to live in the contract.
`Button.meta.ts` gains `examples: [{ label, props, children? }]` and the
generator derives every demo from it — this scales to childless components
(future inputs, icons) where "render each variant with generic children" would
not. Flagged as a decision made autonomously; content stays in the contract,
never in the site.

Known limitation, accepted: `renderToStaticMarkup` shows a component's default
state. Hover/focus-visible work live (real CSS is loaded); components with
scripted open/close states will need a future enhancement — file the gap when
the first such component lands, not before (YAGNI).

### Pages

**Index**: header (site title, ×6 accent switcher, ×2 density switcher) + the
component registry table — component, status, variants, a11y status, page link —
generated from the contracts.

**Button page**: description/notes from `meta.ts`; status badge, RFC link,
Figma node link from `contract.json`; live variants (primary, ghost); a
six-tile grid `<div data-accent="…">` proving the scoped axis from PR 1; a
states section stating that hover/focus-visible are CSS states, never props
(RFC §3), experienced live; props table from `contract.json.props`; a11y
section from `contract.json.a11y` with its honest `pending` status.

Visual chrome: the existing Hextech editorial language (single dark palette,
square corners, 1px rules, sparing corner brackets, EB Garamond / Inter /
JetBrains Mono), consuming only `--ll-*` tokens.

### Structural accessibility (blueprint §9.2) and language

Skip link as first focusable, landmarks on every page, `scope="col"` on table
headers, a unique descriptive `<title>` per page, `lang="en"`. All site content
in English (repository language rule). The executable a11y-structure gate is
listed as planned, not invented ahead of its milestone.

### Process wiring — same commit as the generator

- `build-docs` added to `GENERATORS` in `scripts/check-drift.ts` → stale docs
  become a drift red. Changed gate surface ⇒ red/green re-proof +
  `process/PROOF-OF-BLOCKING.md` entry.
- Generated docs HTML and `docs/assets/lib.css` added to `.prettierignore`
  (LEARNINGS L02/L03: generated bytes are owned by their generator).
- `check-token-lint.ts` scan surface verified to cover `docs/assets/site.css`;
  extended (and re-proved) if not.
- PLAYBOOK rows for `pnpm docs:build` in the same commit (playbook gate).

### Verification

`pnpm conformity` verdict quoted in each PR; drift proof (edit `meta.ts` →
stale docs → red → regenerate → green) recorded; the site served locally for
Louis's visual checkpoint — a human lock, never the pipeline's call.

## Addendum — visual checkpoint feedback (Louis, 2026-08-29)

Layout reworked to MUI-docs-style navigation: a sticky left sidebar lists the
components; the current component's entry expands (details/summary, no-JS) into
a submenu of in-page anchors — Examples, Accents, one entry per **state**
("default", "hover", "focus-visible"), Props, Accessibility. States are contract
data: `meta.ts` gains an optional `states: string[]`; the submenu and the page's
per-state blocks are generated from it (never hand-listed in the shell). One
`sections()` function feeds both the submenu and the headings so they cannot
drift. The component page now surfaces status, variants, description, props and
accessibility as Louis described. Louis may still produce new Figma mockups
after seeing this pass.

## Scalability review (performed 2026-08-29, amendments folded in above)

1. `examples` in the contract instead of variant-derived demos — survives
   childless components.
2. Byte-deterministic generation + prettier exemption — survives the drift
   gate and any future formatter.
3. Self-contained `docs/` via generated `lib.css` — survives static hosting of
   the `docs/` folder alone, and N components (concat order = sorted names).
4. Loud generator validation of contract fields — turns "page renders blank
   with every gate green" (a blueprint-documented failure) into a red at
   generation time.
