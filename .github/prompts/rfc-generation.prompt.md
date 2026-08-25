# RFC generation — produce an arbitration-ready RFC for one component

## Usage

Call this prompt and provide the inputs below. The agent handles everything
else, starting with Step 0 — never skip ahead. The output is a `draft` RFC
plus a list of closed arbitration questions. It is never an approved RFC:
approval is a human lock (`AGENTS.md`, human locks).

## Required inputs

- **Component name**, PascalCase (mandatory — names the RFC, the manifest row
  and the future component folder).
- **Figma design node** id + link (mandatory — the design source of truth;
  with nothing to cross-reference, there is no RFC to write).
- **Consuming repositories** to measure, as local paths (optional — see
  Step 3 for the mandatory behaviour when absent).

## Step 0 — Read repository context (BLOCKING)

Read, in this order, before writing anything:

1. `process/PROJECT-CONTEXT.md`
2. `AGENTS.md` — wins on conflict with any other document
3. `process/LEARNINGS-ACTIVE.md`
4. `process/ORCHESTRATION.md` — re-consult at each trigger event below
5. `process/PLAYBOOK.md`
6. `packages/ui/src/STATE-MANIFEST.md`

## Step 1 — Claim ownership (BLOCKING)

1. Find the component's row in the state manifest registry. Owned by someone
   else → STOP and report (rule 2). No row → read `Notes` and `conflictsWith`
   first (rule 3).
2. Add or complete the row: component (kebab-case), status `draft`, owner,
   RFC path (Step 2's path).
3. Commit the claim **before** creating the working branch (rule 1). Run
   `git branch --show-current` immediately before that commit.

## Step 2 — Create the RFC from the template

1. Copy `process/templates/RFC-BLANK.md` to
   `packages/ui/src/components/<kebab-name>/<ComponentName>.rfc.md`
   (create the folder — the scaffold, which runs later in the circuit, never
   overwrites existing files).
2. Fill ONLY the blocks marked `AGENT PRE-FILL`: the header (status `draft`),
   §1 Summary, §2 Product usage analysis, §3 API design, §4 Accessibility
   commitment.
3. Leave every `HUMAN ONLY` block (§5, §6) and §7 Arbitration log untouched
   for now.
4. In the same folder, create the honest draft `contract.json` — the a11y
   gate requires one in every component folder, and `draft` + not exported +
   a11y `pending` is its legal pre-scaffold state:
   `{ "status": "draft", "exported": false, "a11y": { "status": "pending",
"notes": "RFC stage — not scaffolded yet." } }`
   (The scaffold never overwrites it later.)

## Step 3 — Product usage analysis, or STOP

- Consuming repositories provided and readable → measure, never estimate:
  grep the matching identifiers, count files and occurrences per product,
  fill the §2 tables from those numbers.
- Not provided, or unreachable → write `source unavailable — reported
<YYYY-MM-DD>` in §2.3 and carry "proceed without usage data?" into Step 4's
  questions. **Never invent metrics** (`AGENTS.md`: STOP and report).

## Step 4 — Cross-reference and STOP (BLOCKING)

1. Compare the design intent (the Figma node) against the measured product
   usage. Every tension becomes a closed question: the options, and the
   consequence of each.
2. STOP. Hand the questions to the human. This prompt never answers them.
3. As the human decides, record each decision **verbatim** in §7 Arbitration
   log — the question as asked, the answer as given, the date.

## Final Summary (mandatory)

- What was produced: RFC path, manifest row, question list.
- **Decisions made autonomously** — every micro-decision an input or a rule
  did not cover. This list is a review checklist; empty is suspicious.
- Open questions / blockers — including the arbitrations awaiting the human.
- The executed gate verdict: quote the `pnpm conformity` summary line.

## Never

- Never fill a `HUMAN ONLY` block.
- Never set the RFC status to `approved` — an approval is an attestation,
  not a computation.
- Never invent a value an unavailable source would have given.
- Never scaffold or implement from this prompt — that is
  `component-generation.prompt.md`, and it requires an approved RFC first.
