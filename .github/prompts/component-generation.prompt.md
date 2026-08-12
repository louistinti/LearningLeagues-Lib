# Component generation — implement one component from its approved RFC

## Usage

Call this prompt and provide the inputs below. The agent handles everything
else, starting with Step 0 — never skip ahead. This prompt writes code, and
it runs only on an approved RFC: Step 1 refuses anything else.

## Required inputs

- **Component name**, PascalCase (mandatory).
- **RFC path** (mandatory — normally
  `packages/ui/src/components/<kebab-name>/<ComponentName>.rfc.md`).

## Step 0 — Read repository context (BLOCKING)

Read, in this order, before writing anything:

1. `process/PROJECT-CONTEXT.md`
2. `AGENTS.md` — wins on conflict with any other document
3. `process/LEARNINGS-ACTIVE.md`
4. `process/ORCHESTRATION.md` — re-consult at each trigger event below
5. `process/PLAYBOOK.md`
6. `packages/ui/src/STATE-MANIFEST.md`
7. The RFC itself, in full — §3 API and §4 Accessibility are the contract
   you implement; §7 Arbitration log is decisions already made, not open.

## Step 1 — RFC approval check (BLOCKING, before anything else)

Read the RFC's `Status:` line. If it is anything other than `approved`,
refuse: report exactly **"RFC not approved"** with the status found, and
execute nothing else — no scaffold, no code, no manifest change. There is no
override: only a human moves an RFC to `approved`.

## Step 2 — Ownership and branch (BLOCKING)

1. The state manifest row's owner matches this session's author; otherwise
   STOP and report (rules 1–2).
2. Run `git branch --show-current` and confirm it matches intent.

## Step 3 — Scaffold

Run `node scripts/scaffold.ts <ComponentName>`. It never overwrites existing
files — the RFC survives. Fix the intentional red in this order:
token-lint → contrast → contract.json. The RFC is a precondition the
scaffold never touches, not a violation to fix afterwards.

## Step 4 — Implement to the RFC

- The API is RFC §3, exactly — names, types, defaults, events. If
  implementation reveals the API must change, STOP: the change goes back to
  arbitration (§7), never in silently.
- Tokens are consumed, never defined: classes over `var(--ll-*)`; no
  hardcoded design value, not "just this once" (axiom 1).
- A needed library component that does not exist is a gap to file, not a
  local approximation to write (axiom 4).

## Step 5 — Machine contract

Fill `contract.json` in full: status stays `draft`; the a11y block restates
RFC §4 as checkable facts (semantic structure, keyboard interaction,
component-specific decisions) — never `pass` by assertion. Fill
`<ComponentName>.meta.ts` with the real variant grid.

## Step 6 — Gates, executed

Run `pnpm conformity` and quote the executed summary line. Red gates are
classified, never worked around: needs-fixing-red → fix it here;
expected-red (token diff awaiting the human label) → report and wait.

## Final Summary (mandatory)

- What was produced: files, manifest/contract state, gate reports.
- **Decisions made autonomously** — every micro-decision an input, the RFC
  or a rule did not cover. This list is a review checklist.
- Open questions / blockers.
- The executed gate verdicts, quoted — a summary sentence is not evidence.

## Never

- Never proceed past Step 1 without `Status: approved`.
- Never edit the RFC's agent-filled or arbitration content while
  implementing — deviations go back to arbitration.
- Never write a token by hand or hardcode a design value.
- Never add an allowlist entry — every one carries a named human approver.
- Never flip a status (manifest or contract) beyond what this session's
  executed gates prove.
