SYSTEM-BLUEPRINT — replicating an AI-first design-system factory
What this document is. A complete, self-contained specification of the machine that produces and maintains an AI-first component library: its governance, its quality gates, its review protocols, its token pipeline, its orchestration model and its product-adoption playbook.

What it is not. It contains no component code, no public API, no token value, no design specification, no screenshot. Those are the output of the machine. This is the machine.

Who it is for. An AI agent, or a human, with zero prior context, tasked with standing the same system up from nothing for a different organisation. Read top to bottom once, then use section 10 as the operating checklist.

All names are placeholders. See Annex B for the substitution table.

0. How to read this document
Sections 1–9 describe the system as it actually runs, each rule paired with the incident that produced it. Section 10 is the bootstrap kit: an ordered checklist and copyable templates.

Three reading conventions:

Rule — something enforced, by a script or by a stated protocol.
Why — the concrete failure that produced the rule. Every rule in this document has one; none is theoretical.
Copy as-is / Adapt — whether the item transposes unchanged to another organisation, or needs local judgement.
The single most important thing to copy is not any individual gate. It is the relationship between a failure, a rule, and a mechanism that makes the failure impossible again. A system that accumulates rules without mechanisms decays into documentation nobody reads. A system that accumulates mechanisms without recording their motivating failure cannot be maintained, because nobody dares delete a gate whose purpose is unknown.

1. Philosophy and founding principles
1.1 AI-first means two different things at once
Most "AI-first" claims mean only the first of these. This system means both, and the second is what shapes the repository:

Consumed by agents. Product code is written largely by AI sessions. The library must therefore be interpretable: every component ships a machine-readable contract, conventions are explicit rather than idiomatic, and every "obvious" convention is written down, because an agent has no taste to fall back on.
Built by agents. The library itself is built by AI sessions working in parallel, supervised by a small number of humans. That inverts the usual trade-off: the expensive resource is not developer time, it is human attention. Every process decision optimises for spending as little human attention as possible while keeping the humans in control of the decisions only they can make.
Consequence, and the founding insight of the whole system: in a repository read by agents, a stale file is not clutter — it is active misinformation. An agent that finds an outdated prompt, a document contradicting the code, or two locations for the same kind of thing will follow one of them confidently and produce wrong work at full speed. Repository hygiene is therefore a correctness requirement on the same level as a CI gate, and it gets its own recurring, mandatory procedure (§2.6).

1.2 The source of truth is unidirectional: design → code
Rule. Design tokens flow one way only: from the design tool's variables, through an extraction pipeline, into one generated stylesheet. No agent, and no developer, ever writes a token by hand. The library's own components consume tokens; they never define them.

Why. The alternative — a designer changes a colour in the design tool, a developer transcribes it into code — has an unbounded error rate and no way to detect drift. Every transcription is an opportunity for a value to be right in one place and wrong in another, with nothing failing.

Consequence. The generated stylesheet is external input to the repository, like a vendored dependency. It has an owner (a human designer), a provenance log, a code-ownership rule, and a gate that blocks any change to it that is not accompanied by a human attestation (§3.3).

1.3 The culture of proof: executed, never declared
Rule. Every verification must be executed by a script or by CI. An agent declaring that a check passed is not evidence. Every process ends with a generated report; the report, not the agent's summary, is the artefact.

Why. An agent asked "did you verify accessibility?" will answer yes. It is not lying — it genuinely performed a reading that felt like verification. The distinction between having read the code and believed it correct and having run a program that would have failed if it were not is invisible from inside the session, and it is the entire difference between a system that works and one that appears to.

This produces four corollaries that recur throughout the document:

A green gate proves only what it was told to look at. A contrast gate that scores declared colour pairs proves nothing about a pair nobody declared. False green is the dominant failure mode of a gate-based system, and most of §5 exists to close specific instances of it.
A gate is code, and untested code does not work. A gate must be fed a known-bad input and observed going red before it is trusted. Re-reading its logic and concluding it covers the case is exactly how three separate gates in this system shipped while verifying nothing (§5.5).
A red gate is information, never an obstacle. Modifying a gate so it accepts stale data is forbidden. Either migrate the data or fail loudly.
Textual presence is not effect. A class name being present in a source file does not prove the property it names is applied. Where a composition mechanism sits between the source and the rendering — a class-merging utility, a CSS cascade layer, a variant system — only a measurement on the real rendering settles it (§6.5).
1.4 The division of labour: humans hold the locks
The system is explicit about which gestures are never an agent's. This list is short, and it is exhaustive on purpose — anything not on it is delegable.

Human-only gesture	Why it cannot be automated
Pressing merge	The last irreversible step. Also the only place a human necessarily reads the change.
Submitting a formal review approval	An approval is an attestation, not a computation.
Applying the token-approval label	The label attests that the change matches the real design export. No automation can compare against a design tool's actual state on the designer's screen.
Arbitrating a component's API	Which props exist is a product judgement informed by design intent; an agent proposes, a human decides.
Arbitrating any visual value	Sizes, spacings, opacities, thresholds. Never an agent's call.
Setting priority	Ranking work is the design owner's, not derivable from the code.
Validating a visual checkpoint	Nothing in a headless pipeline sees "this looks wrong".
Approving a hygiene-audit deletion plan	Deletions are irreversible in practice; the plan is presented and execution stops until approval.
Signing off a time-boxed exception	Every allowlist entry carries a named approver.
Authorising writes on another author's branch	Default is zero-write (§6.1).
Copy as-is. This table is the backbone of the trust model. An agent that knows exactly which gestures are forbidden can be given very wide latitude on everything else, which is what makes the throughput possible.

1.5 Six non-negotiable axioms
Stated bluntly, because agents follow blunt rules and hedge on nuanced ones.

Never hardcode a design value. Not in a class, not in an inline style, not "just this once". Enforced (§5.2.4).
Never hand-edit a generated file. Regenerate from the source, and commit the artefact in the same commit as its source. Enforced (§5.2.7).
Accessibility conformance is a hard requirement, not best effort. A non-conformant deliverable is never shippable. Enforced (§5.2.1–5.2.3).
Never create a local approximation of a missing library component. File the gap and stop. Not enforceable by any gate — a local fork is invisible to the library — so it is repeated in every contract document that a product-side agent reads.
One writing session per repository at a time. Isolated worktrees, and confirm the current branch immediately before every commit.
A stale file is active misinformation. Recurring hygiene audit, blocking before any major session's pull request.
2. Repository architecture
2.1 Commented tree
<repo root>
├─ AGENTS.md                 # THE operating contract. First read of every session.
├─ LAYOUT.md                 # Shell layout rules (the one place fixed geometry is allowed)
├─ README.md                 # Human entry point; its component list is GENERATED
├─ ROADMAP.json              # State manifest, hand-edited — the anti-collision mechanism
├─ ROADMAP.md                # GENERATED from the above; drift fails CI
├─ index-short.txt           # GENERATED machine entry point (short)
├─ index-full.txt            # GENERATED machine entry point (full)
├─ package.json              # Also the install proxy manifest — see §9.4
│
├─ .github/
│  ├─ CODEOWNERS             # Ownership of the generated stylesheet = the human token lock
│  ├─ PULL_REQUEST_TEMPLATE.md
│  ├─ prompts/*.prompt.md    # ONE location for per-operation executable pipelines
│  └─ workflows/             # CI: one required job + one label-driven token gate
│
├─ process/
│  ├─ PROJECT-CONTEXT.md     # Mission, deadline, team, agent rules — tool-agnostic
│  ├─ ORCHESTRATION.md       # Execution contract INDEXED BY TRIGGER EVENT
│  ├─ PLAYBOOK.md            # Task → command/prompt → checkpoints → exit checks
│  ├─ PRODUCT-IMPLEMENTATION-PLAYBOOK.md   # The consumer-side method (§8)
│  ├─ PRODUCT-IMPLEMENTATION-PLAYBOOK-DEFECTS.md  # Known defects of the above
│  ├─ LEARNINGS-ACTIVE.md    # Open lessons: things only a human is catching
│  ├─ LEARNINGS-ARCHIVE.md   # Closed lessons, verbatim, with the gate that closed each
│  ├─ HYGIENE-AUDIT.md       # The recurring anti-drift procedure
│  ├─ BACKLOG.md             # Identified, not yet actionable — cross-session memory
│  ├─ templates/             # Blank RFC template
│  ├─ artifacts/             # Reusable artefacts shipped TO products (guard tests, fixtures)
│  └─ archives/              # Dated snapshots: history, never instructions
│
├─ scripts/                  # Every gate and every generator, all executable
│  ├─ check-*.ts             # Gates (exit 1 = merge blocked)
│  ├─ generate-*.ts          # Generators (all support --check for drift detection)
│  ├─ validate-theme.ts / diff-tokens.ts
│  ├─ extract-tokens/        # The 4-stage design-tool → stylesheet pipeline
│  ├─ lib/                   # Pure detectors, unit-tested independently of the CLI walkers
│  └─ *-allowlist.json       # Time-boxed, named-approver exceptions
│
├─ packages/<library>/
│  └─ src/
│     ├─ components/<name>/  # <Name>.tsx | .meta.ts | .rfc.md | .spec.json | index.ts
│     ├─ tokens/             # GENERATED stylesheet + PROVENANCE.md + build entrypoint
│     ├─ types/              # The meta contract and the design-spec contract
│     └─ lib/                # Class-merge utility + its test
│
└─ docs/                     # Documentation site, built from the library's own components
   ├─ app/                   # One GENERATED route template for all component pages
   └─ lib/                   # GENERATED registry + GENERATED status manifest
2.2 One file, one role — and the reading order
Rule. Every instruction file has exactly one role. If two files appear to cover the same thing, one of them is wrong — that is a defect to flag, not a redundancy to tolerate.

The contract document opens with a table giving, for every instruction file, its rank in the reading order and its one-sentence role. The mandatory order for a fresh session is:

Project context — mission, deadline, team, workspace layout. Tool-agnostic, so it survives a change of AI tooling.
The operating contract — rules, data contracts, gates, workflows. On conflict with anything else, this wins.
Active learnings — recurring review findings. Read before writing code.
The orchestration contract — indexed by trigger event, re-consulted at each event, not read once.
The playbook — task-oriented routing.
The per-operation prompts.
The touched component's own machine contract.
Why the orchestration contract is separate from the playbook. They answer different questions. The playbook answers "I want to do X, what do I run?". The orchestration contract answers "X just happened to me, what am I now obliged to do?" — you are about to open a pull request, you just renamed a token, someone asked you to review a stranger's work, your CI went red, you are about to add a dependency. Agents are good at the first question and terrible at the second, because the second requires noticing that a threshold was crossed. Indexing by trigger is what makes obligations discoverable at the moment they apply.

It also carries an explicit escape clause: a trigger not listed here is not necessarily covered elsewhere; if you cannot find the answer to "what am I supposed to do now", that is a doctrine gap to flag, not one to fill by improvising.

Copy as-is. Both the single-role rule and the trigger index.

2.3 Generated vs hand-written
Rule. Every file is explicitly one or the other, in a published table. A generated file carries a GENERATED header naming the command that regenerates it. Regenerating happens in the same commit as the source change. Drift between a source and its artefact fails CI.

The generated set typically includes: the human-readable roadmap, both machine index files, the README's component list, the documentation site's component registry, the implementation-status manifest, the icon registry, and every product-side scaffold. The hand-written set includes: the state manifest, every component's machine contract, every process document, and the rendering shells that display generated data.

The subtle case, and it matters. A hand-editable file may render generated data. The rule is then: the shell is editable, but never hand-add an entry to it. A manually added component route is registry drift by construction — it will render, it will look right, and it will silently diverge the next time the registry regenerates.

Why. Two failures produced this. A hand-appended line in a machine index file, correct in content, that the next regeneration silently deleted. And a generator that reconstructed an identifier from a folder slug instead of reading it from the contract — correct for every name tried, wrong for any name starting with an acronym.

2.4 The state manifest: how parallel sessions avoid each other
Rule. A single hand-edited JSON manifest holds, per component: status, owner, branch, latest pull request, priority, per-product adoption state, free-text notes, and an explicit conflictsWith field. Four rules govern it:

Claim ownership before creating a branch. Set your name as owner and commit that change before branching or writing any code.
A component owned by someone else is off-limits — for creation and for modification. Pick another one or ask.
No owner does NOT mean free. Read the notes and the conflictsWith field first: a component can sit unowned while an unreconciled competing branch already exists for it.
Status moves in the same commit as the work. Never out of band, never left stale after a merge.
Why rule 3 exists. Two authors reworked the same component in parallel from different directions; both changes were individually good, neither could be merged into the other, and one was eventually closed unmerged after an arbitration. The manifest had shown "no owner", which read as available. The conflictsWith field turns that trap into data.

Adapt. The schema is arbitrary. The four rules are the substance.

2.5 Naming conventions
Branch: type/scope-in-kebab-case.
Commit title: type(scope): imperative description. Squash-merged, so the pull-request title becomes the commit message.
Component folder: kebab-case; the exported identifier comes from the component's own contract, never reconstructed from the folder name.
Historical branches predating the convention are treated as legacy, not as a valid alternative to imitate — stated explicitly, because an agent that greps the history for examples will otherwise copy the oldest thing it finds.
2.6 The hygiene audit
Rule. After any major session (new pipeline, structural refactor, foundations batch), and at minimum monthly, run a four-step procedure:

Inventory, with evidence. Look for: duplicate locations for the same kind of thing; documents contradicting the actual code; orphaned or obsolete files (checked with file-following history and a reference grep); stale or dangerous agent instructions. Evidence, not memory. List what you examined and deliberately kept, not only what you propose to remove.
Present the plan to a human — merge, delete, move, with a justification per item. STOP.
Wait for explicit approval. Nothing is deleted before it.
Execute — one commit per action type, every reference updated (including generated artefacts and open pull-request descriptions), and executed proof that nothing broke.
Rule. Deletion is outright. Never keep an "archived" copy in the tree — version-control history is the archive, and a readable copy in the tree remains active context for the next agent, which is precisely what the process removes.

Why. The first such audit found a superseded prompt that would have produced components with zero gates, a token document describing a naming scheme that had never existed, and a machine index file carrying a stale copy of the operating contract that contradicted decided conventions. None of these was clutter; each was a loaded gun pointed at the next session.

Rule (exemption). Dated snapshot documents — audits, inventories, logs — are history, not instructions, and are never rewritten to match current naming. This must be stated explicitly, or a diligent agent will "fix" an archive and destroy the record. Rules that scan text repository-wide need a matching exemption for that category.

3. The token pipeline
3.1 The flow
design tool variables/styles
        │  (REST API extraction, keyed by file + credential)
        ▼
  1. extract      → raw export
  2. normalize    → standard interchange format for design tokens
  3. transform    → target-framework stylesheet (themes, utilities, aliases)
  4. sync         → overwrite the library's single stylesheet
        │
        ├─ validate  (schema gate — rejects a malformed file before anything else)
        ├─ diff      (semantic diff vs the version-control baseline)
        └─ build     (compile utilities; copy the stylesheet verbatim to the dist)
The four stages are separate executables on purpose: a defect can then be attributed to a stage, and stage 3 — the only one containing judgement — is the only one that ever needs a documented override (§3.5).

3.2 Format and theming
One namespace-prefixed flat namespace: --<namespace>-<kebab-segments>, with a closed list of allowed namespaces enforced by the schema gate.
Two layers: primitives (raw scale steps) and semantic aliases built on them. Components consume semantic aliases only.
Light/dark by a class on the root element, not by a media query and not by an attribute. The bare root defaults to one mode. This is stated as a host responsibility: if the consuming application does not set the class, every component renders in the default mode regardless of the host's own theme state, silently.
Every semantic token must exist in both modes; parity is enforced.
Where the target framework has no native namespace for a property (gradients, for instance), a named utility block is declared in the same stylesheet. This is the only zone of that generated file an agent may extend — utilities, never token declarations.
3.3 Governance: the human lock
Three mechanisms, deliberately layered, because each alone is insufficient:

A provenance log. Every change to the stylesheet must add a dated entry: export date, source file reference, and the name of the human who delivered it. The diff gate fails any stylesheet change without one.
Code ownership on the stylesheet, so a human review is required.
An approval label on the pull request, applied by a human only.
The honesty clause, and it is the most copyable idea in this section. The provenance log is documented with an explicit statement of what it proves and what it does not: it proves the log was updated alongside the change; it cannot prove the change genuinely came from the design tool. That guarantee comes from the human reviewer comparing the entry against the real export.

Automation makes omission impossible; humans make lies visible.

Copy as-is. Stating a gate's exact scope, including its blind spot, in the gate's own documentation is what prevents a green check from being read as a stronger guarantee than it is. Overstating a gate is worse than not having it, because it stops people looking.

3.4 The token diff gate
Classifies every change as ADDED / VALUE-CHANGED / RENAMED / REMOVED against the base branch, writes a report, and fails until a human applies the approval label. Four implementation details that are the whole value:

No path filter. The workflow runs on every pull request, so it can be a required status check. A required check with a path filter never reports on unrelated pull requests, leaving them eternally pending. On a pull request touching no token it finds nothing, reports pass, and posts nothing.
It listens to label events. Without labeled/unlabeled triggers, applying the approval label triggers nothing — and re-running the workflow by hand replays the original event payload, still without the label. The human gesture the gate exists to require would leave a required check permanently red. unlabeled is the symmetric case: removing the label must restore the red rather than leave a stale green.
It publishes the diff as a sticky comment on the pull request, updated in place on every push. The approver must be able to read the full before/after where they are approving, not dig it out of a build artefact.
It lives in its own workflow, so a change to the gate never re-runs the whole conformity pipeline, and vice versa.
3.5 Known generator pitfalls — stated generically
Every generated-token pipeline meets these. They are listed because each cost real time and each has the same shape: a defect in the design source, or in the transform, that produces valid-looking output.

The recurring source defect. A value in the design tool is systematically wrong in the export (a gradient's handle geometry, for instance) and gets hand-corrected after each export. It came back four times. Rule: correct it in the transform, as a documented override keyed on the token's identity, and add a regression test asserting the corrected value. A post-export hand patch is not a fix; it is a subscription.
Name derivation from a per-variable code-syntax field. A variable with no code-syntax of its own inherits the name of the variable it aliases, silently redeclaring a foreign token and generating a broken utility downstream. Rule: a loud-failure guard on every section that derives names this way — and when you add such a guard to one section, replicate it to every structurally identical section, or the protection covers only the place the bug happened to appear.
Guard parity, proven byte-identically. Any guard added to a transform must be verified behaviour-preserving against the current valid export: replay the transform, diff the affected regions, expect byte-identical output. A guard that also changes output is two changes pretending to be one.
Partial structural scanning. The diff gate scanned three of the stylesheet's four top-level blocks and never saw the block where semantic aliases live. A real, known value change shipped with no provenance entry, and the gate reported "no token changes". Rule: a gate that scans a structured file must explicitly enumerate every structural area the target can appear in — and be tested against an instance in each.
Regeneration from a stale base. Regenerating on a branch that had not been rebased dropped token families added upstream, producing a false "breaking removal". Rule: rebase before regenerating; the diff gate's verdict is only meaningful against a current base.
Comment enumerations that copy a constant. Extending a shared constant without updating the prose lists that restate it elsewhere leaves those comments actively wrong. Rule: after extending a shared constant, grep its old values repository-wide and sync every restatement.
3.6 The mandatory re-audit rule
Rule. After any change that renames, replaces, or alters the resolved value of a colour token, a full contrast audit of every component referencing it is re-run before committing — even for a change that looks minor. This is not a recommendation: it is a pipeline step, executed.

Why. Contrast is a property of a pair, and a token appears in pairs the person changing it has never seen. The only affordable way to make this true is to make the audit cheap enough to always run, which is why the contrast gate computes ratios from resolved tokens rather than trusting declared numbers.

3.7 The distribution contract
Two rules that are invisible until a consumer breaks:

No global CSS reset in the distributed stylesheet. A component library must never impose one: a reset alters form-element defaults that CSS-in-JS frameworks rely on as their implicit base. The documentation site, being an application, imports the framework normally and is unaffected. The host owns its own reset.
Two distribution entry points, and picking wrong is silent. A verbatim copy of the token stylesheet — which contains framework theme directives — and a pre-compiled stylesheet that contains none. A build tool with the framework's plugin installed will re-process the first one, inject the reset, and break every CSS-in-JS style in the host. The rule is stated as a table of host type → entry point, with the consequence of each mistake spelled out, because the failure appears far from its cause.
Corollary, learned the expensive way. Because the library ships no reset, a component may not rely on the host having one. Every element the library renders that has a browser default (buttons, rules, anchors) must be self-defensive about it. And that defence must be structural — on a shared base — not an enumeration of call sites, for the reason in §6.5.6.

4. The component lifecycle
4.1 The circuit
0. Claim ownership in the state manifest ────────────── (before branching)
1. Generate the RFC        ── agent pre-fills, from three independent sources
2. Cross-reference & STOP  ── design intent vs measured product usage
3. Human arbitration       ── recorded verbatim in the RFC's arbitration log
4. Status → approved       ── the human validation checklist gates this
5. Scaffold                ── deterministic; intentionally fails every gate
6. Implement + commit the design spec as machine-checkable proof
7. Fill the machine contract in full (accessibility included)
8. Run the conformity pipeline ─────────────────── executed, quoted, not declared
9. Review rounds, then the human merges
Rule. No code before an approved RFC. The prompt that generates a component refuses to run and reports "RFC not approved" as its first blocking step.

Why. Without it, the API is designed during implementation, by an agent, in private, and the first time a human sees the shape is in review — where changing it is expensive and where "it already works" is a powerful argument for keeping a bad decision.

4.2 The RFC template
Reproduced in full in §10.3-A. Its structure encodes the method:

§	Content	Filled by
Header	Status, author, date, design node, base primitive, category, manifest entry	agent
1	Summary — what, why, why now	agent → human validates
2	Product usage analysis — identifiers, per-product metrics, props actually used with frequency, observed patterns/wrappers/hacks	agent
3	Design analysis — variants (design's names are authoritative), anatomy/slots, sizing, tokens per variant, visual states, known design gaps	agent → human validates
4	Proposed API — interface, per-prop justification with its decision source, composition model, legacy→new migration table	agent proposes → human decides
5	Accessibility — semantics, keyboard, component-specific decisions, contrast pairs	agent → human validates
6	Behaviour — responsive, light/dark, usage rules	6.3 human only
7	Out of scope, with a reason per exclusion	human only
8	Validation checklist, verified before status becomes approved	human only
9	Arbitration log	human only
Three template details worth copying literally:

Every block is marked with who fills it (agent / human). Agents respect an explicit marker and cheerfully invent content into an unmarked blank.
§4.2 requires a decision source per prop — design analysis, measured usage, or an established convention. A prop with no traceable source is a speculative prop, and speculative props are how a library grows an API nobody asked for.
§3.6 "known design gaps" is non-blocking. An RFC can be approved with gaps listed, each carrying a status: planned (design will add it), deferred (not this version), not planned (deliberate omission). Forcing design to be complete before code starts is how RFC processes die.
4.3 The arbitration log — the highest-value artefact
Rule. Every question the agent could not answer alone is recorded in §9 as: Question (what was ambiguous, with the evidence) → Decision (what the human decided, verbatim) → Impact (which sections change) → and, when the decision generalises, an explicit promotion to a library-wide rule.

Follow-ups discovered later are appended, never edited into history. A follow-up may state that an earlier claim was wrong and correct it; the wrong claim stays visible, so the next reader can see what was believed and why.

Why this matters more than the RFC itself. Three distinct returns:

Decisions stop being re-litigated. One arbitration decided that all compound components expose ref forwarding on every sub-part — including where the audit found zero real need for it — because consistency across the library was judged more valuable than per-case optimisation. Promoted to a contract rule the same day. No later component re-opens it.
The "no measured need" finding survives. It is recorded rather than silently dropped, so if the convention is ever revisited, the evidence is still there.
Self-discovered errors are catchable. One follow-up records that the RFC claimed a primitive auto-wired a label to its trigger; it does not. Nothing had shipped, so the correction was free — because the claim had been written down precisely enough to be checked. Vague documentation cannot be wrong, which is why it is worthless.
4.4 The committed design spec
Rule. The design extraction is committed as a structured file next to the component: per variant, the raw source values, their mapping to tokens, and the classes implementing them. A gate cross-checks that file against the token stylesheet and against the component's real classes.

Rule. A chat summary is not proof. An agent reporting "I extracted the design and it matches" is providing no evidence. The committed file is the evidence, and a gate scores it.

Legacy handling, with an automatic exit. Components predating the gate are listed as exempt and reported as unverified — explicitly not as passing. The exemption ends automatically when a component's RFC reaches approved status: the gate reads each component's RFC status line, and an approved RFC means the component is being deliberately rebuilt from design, which is exactly the case the exemption never covered. No manual list edit is needed.

Copy as-is. A legacy list that must be manually pruned never gets pruned. A legacy list whose exit condition is derived from another artefact prunes itself.

4.5 Status, and promotion by script
Two independent status axes, deliberately:

Manifest status (todo → in-progress → in-review → done) — the work.
Contract status (planned / beta / stable / deprecated) — the promise to consumers.
Rules:

A component may not be stable while its accessibility status is not pass. Enforced.
Anything exported to consumers must have a verified accessibility status — pass, or a documented failure covered by a time-boxed allowlist entry. An exported "pending" fails: pending means unverified, and unverified surface must never reach consumers. A freshly scaffolded component is therefore red until its conformance is proven — that is intended.
Never flip the status by hand. A promotion script verifies eligibility (contract status, CI-verified accessibility, no allowlist entry, documentation completeness), flips the contract, regenerates every shared artefact, and fails with a detailed blocker list changing nothing when not eligible. It performs no version-control operation: reviewing and committing stay human.
done means solid, not frozen. A done component receiving an additive, non-breaking contribution stays done. The one legitimate reason to regress it is discovering a real defect.
4.6 Change management
Every change to the published package carries a changeset: a small file declaring the version bump and a consumer-facing description. The bump policy is arbitrated once by the design owner and written down (patch / minor / major, with the ambiguous cases named). If in doubt, flag the choice in the pull-request description rather than deciding silently.

Two rules learned from real changesets:

The opening paragraph must account for every change in the round, not just the headline. A round that mixes an opt-in feature with a not-opt-in fix must state the not-opt-in half in the opener, including any new development warning consumers will see. The point of a changeset is letting a consumer anticipate a visual shift before upgrading, not being defensible on a close reading.
A version-related claim in a changeset is a testable claim. Settle it with a throwaway probe plus a deliberately incompatible control case to prove the probe is not vacuous — then delete the probe and verify the working tree is clean. (The first control chosen in the real case passed for an unrelated reason and would have "proved" nothing.)
5. The quality gates
5.1 Master table
Every gate is a script, exits non-zero on failure, and writes a report. One aggregator runs them all and produces a single per-component pass/fail report; that aggregator is a single required CI step.

#	Gate	Proves	Blocking	Escape hatch
1	Stylesheet schema	Structure, naming schema, no dangling references, colour resolvability, light/dark parity	✅	none
2	Accessibility status	Stable-gate + export-gate consistency	✅	time-boxed allowlist
3	Computed contrast	Ratios computed from resolved tokens, both modes, every gradient stop, per rendered state × variant	✅	two documented exemptions + time-boxed allowlist
4	Token lint	No hardcoded design value anywhere, including inline styles	✅	inline allow(<reason>) comment
5	Design fidelity	Committed spec ↔ tokens ↔ implemented classes	✅	named legacy list with automatic exit
6	Generated-artefact drift	Every generated file matches its source	✅	none
7	Documentation completeness	A stable component has description, example, documented props, design link	✅	none
8	Bundle budget	Tree-shaking preserved; no dependency silently swallowed	✅	deliberate, reviewed ceiling raise
9	Accessibility engine + keyboard suite	Auto-discovered over every component × variant × mode	✅	none
10	Detector unit tests	The gates' own detectors behave	✅	none
11	Language (files)	Repository content is single-language	✅	time-boxed allowlist
12	Language (metadata)	Commit messages + PR title/body — CI-only	✅	none by design
13	Icon single-entry-point	No direct icon-library import, no hand-written vector, outside the generated registry	✅	permanent named exceptions + dated allowlist
14	Playbook anti-drift	Every script and prompt is referenced in the playbook	✅	none
15	Manifest parity	A dependency is declared in both manifests	✅	none
16	Consumer install proof	A real, blank-project install of this exact commit	✅	none
17	Documentation smoke	Every documentation page renders in a real browser engine	✅	none
18	Token diff	Human approval for any token change	✅ expected-red	the human label
5.2 Gate fiches — the incident behind each
5.2.1 Accessibility status gate. Why: a component declared conformant while its own free-text notes admitted, in plain words, an unresolved failure. The numeric gates were green — they only checked declared ratios against computed ones — and no gate ever read the notes field. Two-level root cause: a stale review protocol was followed instead of the current one, and the gates had a structural blind spot on unverified prose. The gate now cross-checks the declared status against contradictions in its own notes.

5.2.2 Computed contrast — gradient stop coverage. Why: a gradient measured and passing at one stop, never declared or checked at another. Rule: every gradient token a component's own classes reference must have every one of its real stops covered by a declared pair. A documented exemption exists for a genuinely decorative gradient — invoked by specific required wording in the notes, so the gate can recognise it — which downgrades the miss to a visible warning. It is a documented opt-out, not a loophole: reusing the exact wording is required precisely so that inventing new phrasing does not silently widen it.

5.2.3 Computed contrast — solid coverage per state. Why: a "selected" state background used in a conditional class and never cross-referenced against the declared pairs. Rule: every colour class the component actually renders needs a declared pair, per rendered state × variant — hover, focus, active, selected, per-variant — not just the resting appearance. Two exemptions: a class reachable only while disabled is permanently exempt (the standard excludes inactive components), and only if every rendered occurrence of that token is disabled-gated; and pre-existing debt gets a time-boxed allowlist entry. New code has no allowlist escape — a new component, or a new class in an old one, is a hard failure. That asymmetry is what stops a retroactive rule from being diluted into a formality.

5.2.4 Token lint. Why: the single most-violated rule in the system. Catches raw colour literals, raw pixel values in arbitrary class syntax, the arbitrary-value syntax where a native class exists, an always-invalid variable syntax that browsers discard without warning, and hardcoded values inside inline style attributes. The last is the interesting one: an inline style is legitimate only when genuinely dynamic at runtime — an identifier, a member or call expression, an interpolating template. A static string, a bare number, or a non-interpolating template is a violation even when it references a valid token, because if a token exists a class exists. Exception: an inline allow(<reason>) comment on the flagged line or the one after it, listed in the report as an allowed usage — visible, not silent.

5.2.5 Language gate, and its metadata half. Why: a repository built by a non-English-speaking team, read by agents that follow whatever they find. Three detection signals: accented characters, a curated word list, and apostrophe elision. Two scan surfaces sharing one detector: repository files, and — CI-only — commit messages plus the pull-request title and body. The metadata half is separate because a pull-request body only exists as CI event context, and gating every commit message only makes sense once, on the final range. Incident: a commit message quoting a reviewer's own instruction verbatim in another language. The gate blocked the merge, correctly, and there was no "translate and regenerate" escape — it needed a history rewrite. Rule: when quoting a human's instruction in a commit message or pull-request body, translate it; never paste it verbatim. Second-order incident: re-running the job after editing the pull-request body replays the original payload — the platform freezes it — so the fix is to push a commit, not to re-run.

5.2.6 Icon single-entry-point. Why: a namespace import with dynamic key access drags an entire icon library into every consumer bundle instead of the mapped subset — measured in the hundreds of kilobytes. Two gates: a source gate (no direct import, no hand-written vector outside the generated registry) and a bundle budget that fails if tree-shaking regresses. The exceptions list is explicitly two-tier: a short, permanent, code-reviewed list for deliberate design decisions, and a dated, expiring list for temporary deviations. Later incident: the hand-written-vector detector had a false negative on a line ending in a bare opening tag (a formatter wrapping a long attribute list), so a generated file was passing by accident rather than by its documented exemption. Found by auditing why it passed, not by a failure.

5.2.7 Generated-artefact drift. Every generator supports a --check mode. The orchestrator runs all sub-checks and continues past a failure — originally they were chained with a short-circuiting operator, which meant one failure hid every check after it. Rule: a gate orchestrator never short-circuits; it reports every failure and exits non-zero if any failed.

5.2.8 Playbook anti-drift. Why: organic accumulation of scripts and prompts with no index — the problem that motivated the whole process effort. The gate mechanically verifies that every gate/generator script and every prompt file is referenced at least once in the playbook. It deliberately does not check that the prose is correct: it makes it impossible for a new script to silently avoid getting an entry. Rule for contributors: add the playbook entry in the same commit as the script.

5.2.9 Manifest parity + consumer install proof. Why: the most expensive incident in the system's history. A dependency of the library lives in two manifests and two lockfiles, and only one of each is visible from any local workflow. Declaring it in the package manifest alone typechecks, builds, lints and passes the entire conformity pipeline — and breaks every consumer install on all three package managers. The default branch was uninstallable for four days with fully green CI. Two gates now: an offline parity check naming the exact missing line, and a CI step that performs a real install of the exact commit under test into a blank project, then imports from it. Both live inside the single required job — a separate job would be advisory until someone edited the branch-protection configuration by hand.

5.2.10 Documentation smoke in a real engine. Why: every other gate and suite runs in a simulated DOM, which parses markup but never lays out or paints. A documentation page shipped blank on screen with every gate green — an empty array in a contract silently deleted a demo section. One browser engine, checking that content is present rather than how it looks. Also inside the required job, for the same reason.

5.3 The allowlist pattern
Four gates use the same shape, and the shape is the copyable part:

{
  "description": "What this allowlist is for, and what it is NOT for.",
  "entries": [{
    "<scope>": "component / file / (component, token) pair",
    "reason":  "Substantive. What fails, measured, and why it is acceptable now.",
    "approvedBy": "<named human>",
    "added":   "YYYY-MM-DD",
    "expires": "YYYY-MM-DD"   // MANDATORY. An expired entry fails CI.
  }]
}
Rules that make it work rather than becoming a dumping ground:

Expiry is mandatory and enforced. An expired entry turns the gate red again. An exception with no end date is a silent rule change.
Every entry is loaded through a validated loader. Date format, blank fields, duplicate keys — all checked on load. Why: an unvalidated allowlist makes a blocking gate non-deterministic and silently bypassable.
A named approver, blank-checked. Why: three sibling loaders type-checked the approver field as a string but never rejected an empty one — including a file whose own header comment cited this exact lesson. Citing a past lesson in a comment is not the same as the code implementing it.
Entries expiring within 30 days are flagged in the pull-request description at every opening, so renewal is planned rather than discovered on the expiry day.
Reasons are substantive. The real entries in this system run to paragraphs: what fails, measured in both modes, why the component remains usable, which mitigation was evaluated and rejected, and what the real resolution is waiting on.
5.4 Expected-red vs needs-fixing-red
Rule. Not every red CI calls for the same reaction, and conflating them is how a human lock gets worked around. A table classifies every gate:

Gate class	Red means	Who clears it
Typecheck / lint / format / build	needs fixing	you, with a code fix
Conformity pipeline	needs fixing (unless a documented allowlist entry covers it)	you
Artefact drift / playbook	needs fixing	you — regenerate and commit
Manifest parity / consumer install	needs fixing — a consumer install is (or would soon be) broken	you
Token diff	expected while the change is real and intentional; the job fails by design until the label is applied	a named human only
Rule. An expected-red gate is not worked around, is not documented as a "false positive", and is never closed by an agent — it waits for the human gesture its design requires. A needs-fixing-red gets fixed. Never present the former as the latter in a report: "CI is red" without saying which of the two is incomplete information.

5.5 Gate anti-patterns
Every one of these shipped in this system and was found by exercising the gate, never by re-reading it.

The substring match. A fidelity gate checked whether an expected class appeared anywhere in the source text. A component removed a border but left a comment explaining the removal — the comment contained the class name, so the gate kept passing against a spec that had gone stale. Rule: match parsed tokens, never raw text; a comment or dead code must never satisfy a gate.
The inverse: over-exact matching. After the fix, a purely cosmetic class edit with zero behavioural change flipped a component from full pass to a real failure, because a variant-prefixed class is one opaque token, not a prefix plus a separately matchable base. Rule: any edit to a literal class string, however cosmetic, must be paired with a grep of the sibling spec file for the exact old string — the same discipline as a token rename.
Partial structural coverage. §3.5.4.
The short-circuiting chain. §5.2.7.
The unread field. A gate scoring numbers while the prose beside them said the opposite. §5.2.1.
The documented-but-unimplemented contract. A validator's docstring promising a stronger contract than the code enforces. §5.3.
Scope narrower than the doc claims. A gate whose documentation implied it covered a file's whole surface while it covered only named blocks.
The rule that generalises all seven: a gate is tested like any other code. Feed it a known-invalid case and watch it turn red. Re-reading its logic and concluding it covers the case is not verification — it is the same act as an agent declaring a check passed.

6. Review and proof protocols
6.1 Rights calibration comes first — before the diff
Rule. The very first step of any review, before reading a single line, is: who authored this?

Your own session's work, or the orchestrating human's → full read-write protocol: commits, comments, thread replies.
Anyone else's → zero write by default. No commit, no posted comment, no submitted review, no reply to any thread. This is the default state, not a suggestion. The only exit is an explicit, named, written authorisation from the author, relayed by a human, and that authorisation:
covers exactly the pull request named at the moment it is given,
never generalises to another pull request by the same author, even one that looks identical in spirit,
expires with the mission that carried it.
When zero-write applies, the deliverable is a report in the conversation only — never reaching the platform in any form, including a "just helpful" suggestion phrased as a comment. Transmitting corrections to the author is a human gesture.

Rule, stated in the protocol itself: do not relax this because the pull request looks trivial, because the fix is obviously correct, or because posting feels faster than reporting and waiting. The cost of a wrong guess — an unwanted commit on someone else's branch — is far higher than one extra conversation turn.

Why this is step one and not step five. An agent that reads the diff first has already formed the intent to fix by the time it considers permissions, and permission checks lose against formed intent.

6.2 The protocol
Rights calibration (above).
Investigation — read the linked arbitration document before the diff: it is the standard the diff is judged against, not your taste. Then the full diff, not the file list. Then: were any generated files hand-edited (a blocking finding regardless of whether the content is correct)? Does the diff contain only what the description announces — an unannounced opportunistic refactor is a scope violation even when it is correct?
Empirical verification — never take a script's word for it. Run sub-checks individually. Rebuild fresh at least once: a stale build output makes a broken build look green. If any token moved, run the cross-repository consumer search for every one, not just the ones that seem load-bearing.
Comment triage (§6.4).
Rebase if behind (§7.6), never an improvised variant.
Verdict: exactly one of COMPLIANT / COMPLIANT WITH RESERVATIONS (every reserve listed) / NON-COMPLIANT (every blocker listed).
Feed the learnings file before the review is considered done (§6.7).
6.3 FIX / DISCUSS / SKIP
FIX — real, unambiguous, verifiable. Verify every claimed replacement name or value against the real source, never from memory. One round, one batched commit, prefixed to mark it as review-driven.
DISCUSS — technically plausible but touching a non-purely-technical decision (API shape, priority, design arbitration). Never act unilaterally; nothing is changed until the owner of that call answers.
SKIP — false positive or out of scope, with a concrete stated reason. A skip with no reason is indistinguishable from an unreviewed comment.
One symptom, one cause. If several comments in different files restate the same wrong fact, check first whether they derive from a single source — a field copied by a generator into several outputs. If so: fix the source once, regenerate, and confirm every symptom disappears together. A file-by-file fix for a single-source problem almost always misses one and re-diverges at the next generation.

Grep the pattern, not the line. A comment about a duplicated constant or a type union is fixed for all occurrences in one pass.

Verify before rejecting. Before rejecting a comment you believe wrong, run the actual command. Never reject on instinct.

6.4 Handling automated reviewers
Three mechanical rules, each from a real miss:

Fetch comments AND reviews. An automated reviewer can produce a review whose body documents a finding it decided not to post inline ("suppressed due to low confidence"). A real, valid finding existed only inside a review body and was completely invisible to anyone reading the comments endpoint. Skipping the reviews endpoint silently misses exactly the class of finding the tool itself flagged as uncertain but real.
Query thread-resolution state through the graph API. The comments endpoint has no resolution field — resolution is a thread concept. Any thread marked resolved with exactly one comment and no reply is a potentially silent resolution: someone marked it resolved with no visible proof a fix happened. Treat it exactly like a live comment — blame the target lines and verify against current code before trusting the flag.
Blame before judging. For each comment, blame the exact lines it targets. A finding on code older than this round is still triaged honestly (a miss is a miss regardless of when it was written) but is routed to the report rather than acted on, if rights forbid writes there.
Never re-run a review on an unchanged commit — it adds a round with zero signal. A clean round is not proof of clean code: coverage is incomplete and non-deterministic.

Never fetch review state by copy-paste from a human. The agent queries the API itself: a relayed paste guarantees neither completeness nor freshness.

6.5 Proof rules
Red before green. A regression test is written to reproduce the defect, observed failing, then fixed. A test that has never been seen red proves only that it compiles. This rule is explicitly exempted from every later effort to reduce process overhead.
Measure the rendering, not the source. A decomposed typography pattern silently never applied its intended weight, across six components and roughly forty cumulative review rounds, because every check — human and automated — stopped at the textual presence of the expected class. On three components the symptom was visible; on the other three the target value coincided with the browser default, so a code read or a screenshot could never distinguish "correct class, effect never applied" from "correct class, effect applied". Only a computed-style measurement on the real rendering settles it. General rule: as soon as a composition mechanism sits between source and rendering — class merging, cascade layers, variant systems — cite a value measured on the rendering.
Byte-identical proof for a change that must not change output. Comment edits, guard additions, generator refactors: replay and diff the affected region; expect byte-identical. §3.5.3.
Bytes served, measured by the gate, quoted once. Bundle impact is the line the budget gate prints — never re-measured by hand, never a before/after table.
The probe with a control. A type- or compatibility-claim is settled with a throwaway probe plus a deliberately incompatible control proving the probe is not vacuous. Delete the probe, verify the tree is clean.
Re-verify your invariant when a rebase brings siblings. Two independently green pull requests, both passing their own full suites, produced a real gap at their intersection: one added new elements of a kind the other was defending by enumerating call sites. Neither diff ever contained the other's new element, and an enumeration-based defence has no mechanism to fail loudly when a new undefended site appears. Rule: a rebase landing new sibling code in a file you touch is a trigger to re-check your own invariant against it — and prefer deriving a defence structurally (a shared base) over enumerating sites. Where enumeration is unavoidable, log it explicitly so the next new site is a known place to check, not a blind spot.
Never trust a prose citation of a computed number. An RFC table transposed two real, correctly computed ratios between rows. The methodology was sound; the hand transcription was not. Re-run the computation, or diff against the gate's own generated report, before citing figures as verified.
6.6 Convergence: the proof cap
Left alone, a proof culture inflates. Proof volume starts competing with proof quality: a reader who must scroll past four re-measurements of an unchanged bundle to find the one arbitration needing their answer stops reading, and an unanswered arbitration is a decision made by default.

Rule — the pull-request body has exactly five sections and nothing else: What / Why / Gate verdict / Known limits / Arbitrations required (empty is a valid and common answer).

Four rules make the cap enforceable:

The gate verdict is ONE LINE. Not a table, not pasted output.
Bundle size is the gate's own output line, quoted once.
A mutation proof is required only when the pull request adds a NEW BLOCKING GATE — showing it go red on a deliberately broken input and green again on revert. For everything else a green run is the proof, and a mutation narrative is theatre.
One verification block, on the final commit. Not per round, not per commit. No verdict without a run: "should be green" is not a verdict.
Capped, not cancelled — the two things that do not move: red-before-fix (§6.5.1), and the final re-verification on the final commit. Only the narration is capped. Reporting a verdict for a run that did not happen is a fabrication, not a summary.

Round convergence. Two to four substantial rounds is the norm on a medium or larger pull request. Roughly nine out of ten round-two-and-later comments concern pre-existing code the reviewer had not seen yet, not what the last fix introduced — so a rising comment count is not a signal of degrading quality. Completion is reached when every comment is either fixed with a traceable commit or answered in writing on its thread.

6.7 The learnings file, and its mechanical retirement rule
Rule. A generalisable lesson from a review — a pattern that would recur elsewhere, not a one-off — is written down before the review is considered done. The bar is "would this bite the next reviewer too".

Rule — the sorting rule, and it is mechanical on purpose: a lesson whose gate is realised leaves the active file for the archive. A lesson belongs in the active file for exactly as long as nothing in the repository would fail on its recurrence. The day a named test, script or workflow step catches it automatically, it stops being something a human must remember: move it to the archive, name the gate that now covers it, and delete it from the active list.

The bar for "realised" is deliberately high: a named test, script or workflow step that goes red on a recurrence. A fix applied in the code with no test locking it is not realised — the next refactor silently undoes it. When in doubt, the lesson stays active.

Nothing is ever deleted. The archive keeps every entry verbatim, with a stable identifier shared between the two files.

Active-entry format — three lines, no more:

- **[Lnn](ARCHIVE#lnn)** — <the pattern, one sentence>
  - Rule: <the operating rule, one sentence>
  - Gate: <the gate that does not exist yet — or "None; <category>, no gate">
Why this format is the whole trick. A learnings file that grows without a retirement rule becomes unreadable and stops being read, at which point the system has a compliance artefact instead of a memory. Making retirement mechanical removes the judgement call about whether a lesson still "feels" relevant. And the third line — the gate that does not exist yet — turns the active file into a prioritised backlog of missing automation, which is a far more useful object than a list of regrets. The file being long is not a failure: it is an honest measure of how much is currently being caught by humans alone.

7. The orchestration model
7.1 Parallel sessions
Several humans and several agent sessions work simultaneously. Four mechanisms keep them apart:

The state manifest with ownership claimed before branching (§2.4).
One writing session per repository at a time. Any change happens in an isolated worktree on its own branch. Never commit on a shared checkout — a foreign commit can land on your branch without warning.
git branch --show-current immediately before every commit, confirming it matches intent. Stated as a literal command because it is the kind of check an agent skips when confident.
Explicit scoping to one repository. Sibling repositories on disk are not an invitation: outside an explicit mission, never touch a product repository.
Why 2 and 3. Two sessions on the same branch from different checkouts left divergent states coexisting in one directory — a fix applied twice in different ways, plus another workstream's scaffold left in the working tree. Nothing was tracked, so nothing was flagged; the next forgotten artefact could be tracked and land unnoticed.

7.2 Self-contained prompts
Rule. Each recurring operation gets one executable prompt file, written to be run by an agent with no prior context, in a fresh session.

Anatomy — copy the shape:

# <Operation> — <one-line purpose>
## Usage — what the caller must provide
## Required inputs — mandatory vs optional, explicitly
## Step 0 — Read repository context (BLOCKING)  ← numbered list of files
## Step 1..N — each step, with:
     - BLOCKING markers where the agent must stop and ask
     - the exact commands to run
     - what constitutes proof for that step
## Self-validation — a numbered checklist the agent runs on its own output
## Final Summary (mandatory) — a fixed output format, including:
     - what was produced
     - **Decisions made autonomously**  ← the single highest-value field
     - Open questions / blockers
     - the executed gate verdict
## Never — the explicit prohibitions for this operation
"Decisions made autonomously" is the highest-value field in the entire system. An agent will always make undocumented micro-decisions; the only question is whether they are visible. Requiring them to be listed converts them from invisible risk into a review checklist. Human reviewers are told to re-read that list before merging.

Rule. A prompt must state what to do when a required input is unavailable — notably when an external tool the pipeline depends on cannot be reached. Without it, an agent facing a missing design extraction will improvise values, which is the exact failure the pipeline exists to prevent. The rule is: STOP and report.

7.3 Session report format
Convention observed in the working relationship, not tracked in the repository.

A session ending reports in three named blocks, in this order:

To understand — what the session found, changed, and why, in the reader's terms. Context, not narration.
To decide — the arbitrations only the human can make, each stated as a closed question with the options and their consequences. Empty is valid.
To paste — the exact literal text the human must place somewhere the agent cannot reach: a pull-request body, a label, a comment, a message to another team.
Why it works. It sorts output by what the reader must do with it, and it makes the human-lock model (§1.4) operational: the "to paste" block is the physical shape of "this gesture is yours". It also makes an unanswered arbitration visible instead of letting it decay into a default decision.

7.4 Pull-request rules
One subject per pull request. An unannounced refactor is a scope violation even when correct.
A fix and its regression test in the same commit. Never a fix now, test later.
One round, one batched review commit (§6.3).
A changeset when the published package is touched (§4.6).
Squash merge, conventional title.
The body follows the five-section template (§6.6).
A pull-request checklist that distinguishes machine-proven from human-only. The template says so explicitly: most conformance is executed, not declared — do not tick, link the CI run. Only genuinely non-automatable items are tick-boxes: a screen-reader pass, whether the focus order is meaningful (not merely present), whether accessible names are meaningful (not merely non-empty), and the visual comparison against the design frame. Why: a checklist of things a machine already proves teaches contributors to tick without reading, which then extends to the four items that actually needed a human.
7.5 Merge sequencing
Merges are sequenced by the human holding the lock; the agent proposes an order and reasons.
On a collision between two parallel workstreams touching the same manifest entry, the documented arbitration is deliberately cheap: first one merged wins; the other rebases. No special coordination protocol. Coordination overhead exceeded the cost of one rebase.
After a merge, the manifest is synced (owner / status / pull request) in a dedicated follow-up, with artefacts regenerated in the same change — otherwise the manifest drifts until the next audit.
7.6 Git flow
An integration branch per consuming product receives design-system work; the product's own default branch is never committed to directly. Work branches target the integration branch; the final promotion to the product's mainline is a human gesture, coordinated with that product's team.
Unidirectional: the library never receives changes from a product repository. A product-side change to the library is out of contract — the fix would not be designed, reviewed or tokenised. File a gap instead (§8.4).
Rebase, never merge, on a library branch — with an eight-step protocol documented as the commands actually executed, not a paraphrase:
git fetch origin — never judge freshness from a local state.
Verify your local branch contains every remote commit before rebasing anything (git merge-base --is-ancestor origin/<branch> HEAD). A multi-author branch may have commits your session never fetched. If this fails, do not rebase — fetch first.
List the commits about to be replayed — this is your "before" proof.
git rebase origin/main — never the reverse, never a merge.
Compare the commit list after the rebase to the list from step 3, commit by commit, by author and message — not just the count.
Regenerate artefacts if the base moved past them; the resulting diff must be exactly what the base introduced, never a hand edit to "fix" an artefact.
Full suite green on the rebased state — a conflict-free rebase does not exempt you; it changes the compilation and generation base.
git push --force-with-lease, never a bare force.
Why steps 2, 3 and 5 exist: rebasing from an incomplete local copy is the exact scenario that silently loses another author's work, and it has erased already-pushed review-fix commits.

The exception, on a product integration branch: merge, never rebase, when the branch may already be deployed to a shared environment.
8. The product adoption playbook
The library is worthless until a product ships it. This is a separate document with a separate audience — a developer with none of the library's context — and it lives in the library repository so it improves with each pilot.

Honesty about cost, and about how well the cost is known. The playbook opens by stating that the first integration in a product is measured in days, not hours, that most of that time is not writing the component, and — critically — that the published breakdown is a reconstruction from milestones, not a measurement, with a large block of elapsed time explicitly undifferentiated. What survives that caveat is the shape: roughly half the time comes before there is an implementation that validates locally, and roughly half comes after — visual verification, style diffing, converging end-to-end tests. That second half is the one every playbook covers worst and where the next pilot will lose its time. Budget for it explicitly instead of treating it as a tail.

Copy as-is. Publishing an honest estimate with its own error bars is what stops the second pilot from being planned as if it were free.

8.1 Phases
Phase	Content	Gate
1. Prerequisites	Read access over HTTPS, a named CI secret, the target branch, a frozen pin	Every check run and reported. If any fails, STOP — do not work around, do not guess, do not proceed partially. Failing mid-pilot after touching product files is far more expensive to unwind than stopping before starting.
0.5. Read the previous pilot's source	Not its playbook — its source (§8.7)	30–45 min, with a stated success criterion
1. Pin	Freeze an exact commit; know it will move	—
2. CI authentication	Enumerate every install site by walking the call graph, not by grepping a directory; then ship a guard test that enumerates both halves of the graph	The guard test is in the product's own suite and green
3–4. Install	The library installs and resolves	A real install
5. Stylesheet + host prerequisites	Import the right entry point (§3.7); host-owned theme class	Inert-class detection
5b. Computed-style diff against the library's own documentation site	Measure, do not eyeball	Every measured value identical, or a named cause
6. Theme bridge	Product theme values derive from generated tokens, never hand-copied	Generated bridge, never hand-edited
6b. Custom-theme audit	The derived-token trap (§8.3)	Compare sets, not substrings
7. Read the component's real API — from the installed artefact, not the docs		
8. Build the product adapter		
9. Delete the code you replaced	Comments included — a comment naming a deleted file is a false statement	grep returns nothing
10. Tests		
11. File what the library is missing (§8.4)		
12. Visual checkpoint — HUMAN-BLOCKING	Run the product for real, both themes, a named screen list	Explicit go before continuing
Push — HUMAN-BLOCKING	No push, even to a dedicated branch, without explicit approval	
Close out	Session log entry, upstream manifest sync, mandatory process feedback	
Two blocking human checkpoints, deliberately. One before the change is finalised (visual), one before it leaves the machine (push). Both are stated as "do not proceed without an explicit go in this conversation".

8.2 The product-side contract
The library generates a scaffold into the consuming repository: an agent-contract file, a component mapping derived from the library's own manifests, a roadmap skeleton, an append-only session log, a state manifest, and a conformity checker.

Rule. Both generators default to a dry run — printing what they would write and touching nothing — unless an explicit opt-in flag is passed. Why: a generator that writes into a sibling repository by default is one careless invocation away from modifying a repository nobody asked it to touch. Writing outside the repository root is explicit opt-in, and there is a test asserting it.

Rule. Regeneration creates but never overwrites the files agents maintain (the roadmap skeleton, the state manifest, the log). Only the derived documents are rewritten.

8.3 Documented deviations — the two-tier mechanism
This is the load-bearing invention of the product playbook, and it is what makes adoption reversible rather than an accumulation of permanent debt.

The vocabulary. Anything temporary written during an integration is a compensation for something the library does not do yet. A compensation is legitimate — a product cannot wait — but only if it carries three things:

a comment saying why it exists,
an entry in the centralised feedback file, so the gap is actually fixed upstream,
an explicit, testable removal condition.
Tier 1 — the one-line marker. Every compensation in the code is reduced to a single marker line:

// DS-WORKAROUND #6: re-derive the brand tint tokens — remove when derived
// tokens follow a subtree override — see <feedback file> #6
Three parts, always: the numbered reference, the one-line what, and the removal condition. Nothing else lives in the source.

Tier 2 — the centralised prose. One file in the consuming repository holds one numbered entry per gap, and every entry has the same five parts:

Part	Content
Needed	What the product genuinely required, in product terms, and why it is real behaviour rather than decoration
Today	What the library actually offers, verified against the installed artefact
Consequence	What the product did instead — the exact code shape, and what breaks silently if the compensation is wrong
Ask	The concrete library change requested, phrased as a component, not as a patch to your case
Removal test	The exact procedure, at a future pin, that proves the compensation can go — with the assertion that must still pass
The file's header states the numbering contract explicitly (marker #N means entry N), the pin it was raised against, the pins it has been re-checked at, and which entries are closed.

Why two tiers. The full rationale, the code shape and the removal test in the source would be five paragraphs of comment on every workaround; the marker alone in the source would drift from its reason within a month. Splitting them, with a numbering contract, gives one place to read and one place to update. A real incident proves the contract is load-bearing: an unrelated change introduced markers reusing an already-taken number for a completely different concern — two things answering to one label, in a convention whose entire purpose is that a marker and its rationale cannot drift apart. They were renamed to a distinct, non-numbered prefix.

Tier 2b — the machine-checkable state manifest. A JSON file alongside, carrying what prose cannot enforce:

wiredFiles — files that must import the generated bridge;
forbiddenPatterns — a regex plus a human-readable reason per entry, typically the old hand-copied values, so a revert is caught mechanically;
migratedZones / notMigrated — the explicit boundary of what was adopted, with the deliberate deferrals named;
knownCaveats — traps that are neither a compensation nor a defect, written at length. Including caveats about the checker itself: one entry documents that a freshness check reports stale in a particular multi-repository layout even though the artefact is fresh, explains the root cause, records how it was proven, and says "do NOT 'fix' this by regenerating" — because someone already did, and it silently reintroduced older values.
A conformity script consumes the manifest and runs before every commit touching a wired file.

8.4 Library feedback is mandatory, not optional
Rule. The product never forks, patches or approximates the library. A missing capability is filed, never worked around inside the library.

Rule. Resist "I'll just tweak the library, it's two lines." A product-side change against the library is out of contract, and the fix would not be designed, reviewed or tokenised.

Rule. Every friction in the playbook itself — a wrong assumption, a prerequisite that did not guarantee what it claimed, a generator producing something surprising — is written into the session log and, if generalisable, proposed as an edit to the playbook or the generators, as its own reviewed change. The playbook is explicitly expected to improve by being run; silently working around a rough edge defeats that.

When a component nearly fits — the four-step argument. The recurring temptation is to reproduce a nearly-right component product-side; its class names are in the shipped stylesheet, so a copy renders correctly today. The playbook gives the argument to make instead:

Establish precisely what does not fit — from the build, not from memory.
State what a copy really costs. Not the first day: the later ones. A copy freezes the library's current internals; a single pin bump changed density and typography, and every copied surface would have silently stayed behind. That debt is invisible, permanent, and grows at every bump.
Write the ask as a component, not as a patch to your case. "Export the menu shell and let the existing component consume it" serves every product and keeps one source of truth. "Add a prop named after my domain" serves one caller and makes the library about someone else's vocabulary.
Then stop and ask. Library evolution or product compensation is not the integrator's decision — it changes the library's roadmap. Present both paths with their costs and let the design owner choose.
And while you wait, do not half-build it. Leaving a working implementation alone is a legitimate state. In the real case the wait was the cheap part: when the proper component landed, the rewrite took under two minutes and measured identical to the documentation site with no product CSS at all.

8.5 The bump → retirement cycle
Rule. A pin bump is its own single-subject change, on its own branch. Its primary success measure is "what did I just delete?", ahead of "what did I gain?". If a bump adds capability but leaves compensations in place, the debt becomes permanent and the next bump is harder.

The exercise:

Re-check every feedback entry against the new pin's source, one removal condition at a time.
For each condition now true: delete the compensation, run its removal test, and record the measured result.
For each still false: say so, and state the condition that remains unmet.
Record both lists in the session log.
Three rules the real removals taught:

Compensations grow tendrils. Removing one deleted a conditional source, a forced dimension, a positional correction, and a component prop that existed only to feed the conditional — which rippled to the call site.
A compensation is removed when the pixels are right, not when the code is gone. One removal left a raw asset rendering at natural size inside a small slot — a crop of its middle. Measured, fixed, re-measured.
Reproduce the original symptom's worst case. Removing a shrink-prevention guard and looking at a normal page proves nothing: the defect only appeared when the list overflowed. Keep the reproduction recipe in the compensation's own comment, so whoever does the bump can run it without rediscovering it.
Two things a bump brings that are easy to miss:

New capability can carry new obligations. A new link prop rendered a plain anchor with no router integration; the product's router ran under a prefixed base path, so adopting it naively would have navigated out of context. Read the new props' documentation properly; do not assume "link" means "router link".
A bump with an empty diff still moves pixels. One carried a typography correction at the generator level: nothing to delete, but rendered text and spacing rhythm both changed. Always re-take the visual checkpoint after a bump, even when your own diff is empty.
The per-token attribution method — offered as a standard step after it was invented under pressure. A plain diff of the old and new generated bridge cannot distinguish a token change from a generator change. So: regenerate the bridge at every intermediate version of the stylesheet in the history since the one it was built from, same generator throughout. That separates the two cleanly, attributes each moved value to the change that moved it, and — joined against the product's own theme wiring — makes the "where will this show" column derived rather than guessed. The final run being byte-identical to the committed artefact proves the attribution chain end to end.

Why it was needed: a bump that brought zero token changes revealed the product had been running a theme built from two-month-old values against a stylesheet shipping current ones. The generated bridge, not the stylesheet, was stale — and the state manifest had recorded that lag as a false positive. It was not.

8.6 Withdrawal conditions and boundaries
When does a compensation leave? When its stated removal test passes at a new pin. Not when it looks unnecessary, not when the library "probably fixed it" — when the test that was written at the time of writing the compensation passes. That is why the removal test is a mandatory part of every entry: it is the withdrawal condition, authored while the context is fresh, by the only person who will ever fully understand the symptom.

When does something belong to the library rather than the product? Three tests, in order, and this is the question the integrator gets asked about every file they add:

Does it know anything about this product? Routes, permissions, feature flags, a storage key, a domain word — if yes, it stays in the product. The library cannot depend on a product's vocabulary.
Would every product write the same thing? If two products would produce the same file byte for byte, it belongs to the library. The evidence is empirical: if the next pilot re-implements it independently, that is the proof.
Does it only exist because the library is missing something? Then the answer is neither: it is debt to delete, not code to promote. Moving a workaround into the library freezes the workaround. File the gap and let the file disappear when the gap closes.
The library owns the widget; the product owns the data, the routes and the state. Anything that exists only to work around the library is debt with a filed gap, not a candidate for promotion.

A published ownership table settles the recurring cases in advance: tokens, component chrome, a component's accessibility semantics and the stacking of portalled surfaces are the library's; menu contents, permissions, routing, state persistence, the theme class on the root element and the sizing of the product's own assets inside library slots are the product's.

8.7 The pilot index
Rule. A table lists every pilot: product, repository and branch, implementation directory, and its feedback file. Every pilot adds its own row, in a change to the library repository, opened alongside the one that ships it. It is item 11 of the final verification checklist, so that forgetting it fails something — and the checklist notes that nothing else in the list fails when you forget it.

The row names a directory, not a change number, on purpose: a number ages out of usefulness the moment the branch merges; a path can be searched.

A mandatory step before any new pilot: read the previous pilot's source, not its playbook. The playbook carries the method; the source carries the answers the method does not predict. A prescribed reading order (host component and its inline comments first, then siblings, then the host stylesheet, then the feedback file, then the log), a stated time budget, and a success criterion: you can name, without looking again, the compensations the previous pilot wrote, the entries it filed, and the traps it dated. If you cannot, you have not read it.

Why the step exists, stated as a cost: the second pilot skipped it and paid with a full checkpoint round trip — three of its four checkpoint findings were already solved in the first pilot's source, in the same collection of repositories, and were rediscovered from scratch. One was delivered wrong to the reviewer before being found.

The standing rule that follows: before solving any integration problem, check the previous pilots. Grep their implementation directory for the symptom. If a pilot solved it, apply its solution and cite it in the comment — two different solutions to the same gap are two things to maintain and two different bug reports. If you deliberately diverge, say why.

The checkpoint loop, framed correctly. The visual checkpoint is not a formality at the end; it is a loop, and it is where design decisions are actually made. One pilot went through four rounds after "it works", including one that undid the previous one. Two rules:

A reversal is cheaper than a regret. The undone version had to exist for anyone to see the alternative read better. Two iterations before merge cost hours; a frozen choice everyone regrets costs a follow-up migration.
Come back with evidence, not opinions. Every round was settled by something measurable — computed styles side by side, a fact read from the build, a live measurement in both states. "It looks close enough" never resolved anything; a concrete measured difference always did.
9. Documentation and distribution
9.1 Three audiences, three artefacts
Audience	Artefact	Rule
Agents	A per-component machine contract file	The contract type is authoritative; if the prose describing it ever diverges, the type wins and the prose is the defect
Humans	A documentation site	Component pages are generated; completeness lives in the contracts
External discovery	Two generated index files (short + full)	On conflict with the in-repository documents, the in-repository documents win
Rule. Component documentation content — description, examples, props, accessibility notes — lives in the contract, then regenerates. Never in the site. A documentation-completeness gate enforces that a stable component has a real description, at least one example, documented props, and a design link.

Rule — no component-workshop tool. Stated as a permanent decision with its consequence: never create story files, never install such a package, and if one appears in the repository, delete it — it is a mistake. The reason is the two-artefact model above: a third documentation location is a third place to drift.

9.2 The documentation site consumes its own components
Rule. The site is built from the library it documents, and obeys the same gates: token lint scans it, and it carries structural accessibility requirements of its own (a skip link as the first focusable element, landmark elements on every page, table header scopes, a unique descriptive title per page).

Why this matters beyond dogfooding. It makes the site a consumer, which means integration defects surface in the team's own repository before a product hits them. Two real defects were found exactly this way — a cascade-layer precedence issue in the site's own base styles that silently defeated a library utility, and a documentation page rendering blank with every gate green.

9.3 Machine exports
Two generated files: a short index (entry points, conventions, component list) and a full one (the complete machine surface). Both are generated, both fail CI on drift, and the site serves them at stable paths through deliberately dumb pass-through routes.

Rule. Where a generated file could contain a stale copy of an instruction document, the precedence is stated explicitly: on conflict, the in-repository documents win. A generated file carrying a stale copy of the operating contract is one of the discovered hygiene failures (§2.6).

9.4 Packaging: private git dependency → registry
The published-registry step is a planned milestone, not a prerequisite. The interim mechanism is a direct dependency on the source repository, pinned to a commit. Making that work uncovered a set of findings that are pure gold for anyone replicating this — every one verified empirically, not guessed:

No package manager can target a subdirectory of a plain git dependency. All of them read the manifest at the cloned repository root as "the package". The root manifest is therefore deliberately maintained as a valid install proxy: mirrored entry points and file list, plus build scripts that run the real build at install time. Consequence: a dependency now lives in two manifests — §5.2.9.
The dependency key must be spelled out explicitly. Installing by URL without naming the package installs it under the monorepo root's own name, silently breaking every import. Verified footgun.
Always pin a commit, never a branch or tag. A branch reference is mutable: the same lockfile could resolve to different code on two different days. Treat any branch-pinned reference found in a product as a defect.
Authentication for a private repository. An HTTPS token is sufficient on its own — verified in an environment with no key material reachable. A consuming project's own default CI token cannot reach a different private repository; cross-repository access always needs an explicit credential. Gotcha: one package manager's console output labels the dependency with a different transport in its warnings even for a pure HTTPS install — a cosmetic canonical form, not the transport used.
The third package manager needs one extra thing, and the root cause is worth knowing. It refuses to fetch a git dependency unless its exact normalised URL is approved in the consumer's own configuration. A wildcard is technically accepted — never do it: it would approve install-time scripts for every git dependency from that host. Least privilege means the exact URL. Separately, that manager detects a git dependency's package manager from its lockfile, in a fixed order, and has no workflow for one of the ecosystems — so the repository ships a root lockfile of the expected kind purely so detection stops before reaching the unsupported fallback, and carries the same build command under two script names because the two ecosystems call different lifecycle hooks. All of it verified by reading the tool's own source rather than inferring from symptoms.
The import surface never changes. Whether a product consumes the library by git dependency or by registry, consumer code imports the same specifiers. No product import path changes when publishing eventually replaces the git dependency.
Rule. The toolchain pin lives in the manifest's engines field rather than the package-manager field — because that field is what broke the third ecosystem — and every workflow sets the version explicitly. The document notes that no gate catches drift between the two, and says to grep by hand when bumping. Stating an unautomated seam is worth more than pretending it is covered.

10. Bootstrap kit
10.1 Day 1 → first merged component
Ordered. Each milestone is a real stopping point.

Milestone 1 — Foundations (day 1)

Pin the toolchain: runtime version file, package-manager version in engines, CI reading the version file (never a hardcoded version).
Create the four instruction documents, even if thin: project context, operating contract, playbook, learnings (active). Write the reading order into the contract on day one.
Set up formatting and a blocking format check. Cheapest possible gate, immediately removes a whole class of review noise.
Decide and write down the human-lock table (§1.4). Before any automation.
Milestone 2 — The token pipeline (days 1–2)
5. Build the extraction → normalise → transform → sync chain as four separate executables.
6. Write the schema gate first: structure, naming schema, no dangling references, resolvability, light/dark parity. A malformed source file must be rejected before anything else happens.
7. Write the diff gate: ADDED / VALUE-CHANGED / RENAMED / REMOVED, with a human approval label, in its own workflow, with no path filter and with label event triggers.
8. Create the provenance log, with its honesty clause. Add code ownership on the generated stylesheet.
9. Test both gates by injecting a violation and observing the exit code. Record the result.

Milestone 3 — The executable gates (days 2–4)
10. Token lint. Highest value per line of code; it enforces the rule that is violated most.
11. Computed contrast from resolved tokens. Never trust declared numbers.
12. The accessibility status gates (stable + export), with the time-boxed allowlist pattern and its validated loader.
13. Generated-artefact drift, with a non-short-circuiting orchestrator.
14. The aggregator producing one per-component report, wired as one required CI job. Put every blocking gate inside it — a separate job is advisory until someone edits branch protection by hand.
15. Prove every gate blocks. Inject a violation per gate, capture exit codes, revert, re-verify green. Publish that table. It is the single most convincing artefact the system produces.

Milestone 4 — The component circuit (days 4–5)
16. Write the RFC template, with agent/human markers on every block.
17. Write the RFC-generation prompt and the component-generation prompt, with their BLOCKING steps and the "Decisions made autonomously" output field.
18. Write the deterministic scaffold. It must fail the gates on creation — a scaffold that passes teaches that passing is the default.
19. Create the state manifest with its four ownership rules.
20. Write the playbook anti-drift gate now, before the script count grows.

Milestone 5 — First component, end to end (days 5–8)
21. Pick a genuinely simple component. The goal is exercising the circuit, not the component.
22. Run it: claim ownership → RFC → arbitration (a real human, really deciding, recorded verbatim) → approve → scaffold → implement → contract → gates.
23. Review it with the full protocol, including rights calibration.
24. Human merges.
25. Run the hygiene audit. Immediately. The first circuit always leaves residue, and establishing the audit as normal at the first opportunity is what makes it survive.
26. Write the first learnings entries — including, for each, the gate that does not exist yet.

Then, and only then: the product playbook, the documentation site, the distribution mechanism. In that order. A library nobody has adopted needs no distribution strategy; a library adopted without a playbook generates permanent compensations.

10.2 Why that order
Tokens before components: a component built before the token pipeline hardcodes values, and retrofitting is more expensive than waiting.
Gates before the first component: gates written after the first component are written to let it pass.
The scaffold red by default: sets the expectation that red is the starting state and green is earned.
The proof-of-blocking table before writing more gates: it is the moment you discover whether your gates measure anything (§5.5).
The hygiene audit at the first opportunity: a process introduced after the mess exists reads as blame; introduced before, it reads as routine.
10.3 Templates
A. Blank RFC
# RFC: {ComponentName}

> **Status:** draft | review | approved | implemented
> **Author:** {name}
> **Date:** {YYYY-MM-DD}
> **Design node:** `{nodeId}` — [link]({url})
> **Base primitive:** `{package}` | none
> **Category:** action | navigation | feedback | input | layout | data-display
> **Manifest entry:** {name in the state manifest}

---
## 1. Summary
<!-- AGENT PRE-FILL → HUMAN VALIDATION
     2-3 sentences: what this component is, what problem it solves, why now. -->

---
## 2. Product usage analysis
<!-- AGENT PRE-FILL → HUMAN VALIDATION. Sources: usage inventory, crosswalk
     table, grep in the consuming repositories. -->

### 2.1 Matching identifiers (legacy libraries)
| Identifier | Source package |
|---|---|

### 2.2 Usage metrics
| Product | Files | Occurrences | Main zones |
|---|---|---|---|

### 2.3 Props actually used in products
<!-- "Cover?" column filled by the HUMAN -->
| Source prop | Approx. frequency | Dominant usage pattern | → Cover? |
|---|---|---|---|

### 2.4 Observed patterns and edge cases
<!-- Recurring patterns, wrappers, hacks, unexpected couplings.
     Agent lists, human judges. -->
-

---
## 3. Design analysis
<!-- AGENT PRE-FILL (design-tool extraction) → HUMAN VALIDATION.
     Design's own naming is the source of truth for variant names. -->

### 3.1 Design variants
| Design variant | Description | Legacy equivalent |
|---|---|---|

### 3.2 Anatomy / slots
| Slot | Required | Description |
|---|---|---|

### 3.3 Sizing
<!-- Never raw values — only existing tokens or native framework classes. -->
| Size | Height | Padding | Typography |
|---|---|---|---|

### 3.4 Color tokens by variant
<!-- Only tokens that exist. A missing token is flagged, NEVER invented. -->
| Variant | Background | Text | Border | Other |
|---|---|---|---|---|

### 3.5 Visual states
| State | Visual change (tokens) |
|---|---|
| default | — |
| hover | |
| active / pressed | |
| focused | standard focus ring |
| disabled | |

### 3.6 Known design gaps
<!-- Expected from product usage but absent from the design source.
     NON-BLOCKING: the RFC can be approved with gaps listed. -->
| Gap | Impact | Status (planned / deferred / not planned) |
|---|---|---|

---
## 4. Proposed API
<!-- AGENT PROPOSAL → HUMAN DECISION. The central decision of this RFC. -->

### 4.1 Interface
<!-- No speculative props — each justified in 4.2. -->

### 4.2 Per-prop justification
| Prop | Decision | Decision source |
|---|---|---|
|  | retained / excluded | design §3.1 / usage §2.3 / convention |

### 4.3 Composition
<!-- standalone | compound (list exposed sub-parts and their articulation) -->

### 4.4 Legacy → new migration table
<!-- Consumed directly by product migration agents. -->
| Legacy usage | New equivalent | Notes |
|---|---|---|

---
## 5. Accessibility
<!-- AGENT PRE-FILL → HUMAN VALIDATION. Do NOT copy general rules.
     ONLY decisions specific to this component. -->
### 5.1 HTML semantics
### 5.2 Keyboard
### 5.3 Specific decisions
### 5.4 Contrast pairs
| ID | Foreground token | Background token | Threshold |
|---|---|---|---|

---
## 6. Behavior
### 6.1 Responsive
### 6.2 Dark / Light
### 6.3 Usage rules   <!-- HUMAN ONLY — pure design judgement, not automatable -->

---
## 7. Out of scope   <!-- HUMAN ONLY — prioritisation -->
| Excluded feature | Reason |
|---|---|

---
## 8. Validation checklist   <!-- HUMAN ONLY — verify BEFORE status "approved" -->
- [ ] Design node accessible and variants complete
- [ ] Props justified by measured usage (§2) + design (§3)
- [ ] All referenced tokens exist
- [ ] No contradiction with the operating contract
- [ ] Contrast pairs cover every variant × mode
- [ ] Migration table covers top product usages
- [ ] Out of scope documented and explicitly excluded
- [ ] Ownership claimed in the state manifest before generation starts

---
## 9. Arbitration log   <!-- HUMAN ONLY — verbatim; append follow-ups, never edit -->

**Arbitration Q1 — <short title>.** Question: <what was ambiguous, with
evidence>. Decision: **<what was decided>**. <Rationale.> → <sections impacted;
promote to a library-wide rule if it generalises>

**Follow-up #1 — <what was discovered later> (<date>).** <What the RFC claimed,
why it was wrong, what changes as a result.> → <sections corrected>
B. Gate workflow (the token gate, as the archetype)
name: Token gate

# NO paths filter, on purpose: this is meant to be a REQUIRED check, and a
# required check that never runs leaves every unrelated PR eternally pending.
# On a PR touching no token the gate finds 0 changes, reports pass, posts nothing.
#
# labeled/unlabeled are NOT decoration: the gate reads the approval label from
# the event payload. Without them, applying the label triggers nothing, and a
# manual re-run replays the ORIGINAL payload — still without the label. The
# human gesture this gate exists to require would leave the check permanently
# red. unlabeled is the symmetric case: removing the label restores the red.
on:
  pull_request:
    types: [opened, synchronize, reopened, labeled, unlabeled]

# One run per PR: a push immediately followed by the label would otherwise race
# two runs into creating two sticky comments.
concurrency:
  group: token-gate-${{ github.event.pull_request.number }}
  cancel-in-progress: true

jobs:
  token-diff:
    runs-on: ubuntu-latest
    permissions: { contents: read, pull-requests: write }
    steps:
      - uses: actions/checkout@v4
        with: { fetch-depth: 0 }        # so the base version resolves
      - <install the pinned package manager, hardcoded version>
      - <set up the runtime from the version file, never a hardcoded version>
      - run: <install, frozen lockfile>

      # Fails until a HUMAN applies the approval label. Never a session:
      # the label attests to a comparison against the real design export,
      # which no automation can perform.
      - name: Token diff against base
        env:
          APPROVED: ${{ contains(github.event.pull_request.labels.*.name, '<approval-label>') }}
        run: <diff command> --base origin/${{ github.base_ref }}

      # The approver must read the before/after where they approve, not dig it
      # out of an artefact. Sticky comment, updated in place on every push.
      # continue-on-error: a fork PR gets a read-only token, and a missing
      # comment must never be the reason a PR goes red.
      - name: Publish the diff on the PR
        if: always()
        continue-on-error: true
        uses: <script action>
        with:
          script: |
            # find a comment carrying a hidden marker; update or create it.
            # if totalChanges === 0: stay silent, but clean up a stale comment.
            # truncate below the platform's comment size cap, pointing at the
            # artefact for the full list.

      - uses: actions/upload-artifact@v4
        if: always()
        with: { name: token-diff-report, path: reports/ }
C. Operating-contract skeleton
# AGENTS.md
For project-wide context read <project context> first.
Use this file as the first context source in every session before making changes.
Every agent must also read <orchestration contract> before opening, reviewing or
merging any change — it indexes rules by TRIGGER EVENT and is meant to be
re-consulted at each event, not read once.

## Mission
## Documentation map — reading order and roles
  | Order | File | Role |     ← one role each; two files covering one thing = a defect
## Repository structure
  ### Generated vs hand-editable      ← the table, and the never-hand-add rule
## Token rules            ← never create/modify a token; provenance; the utility zone
## Framework class rules  ← the wrong/right table; the invalid syntaxes
## Distribution contract  ← no global reset; which entry point for which host type
## Consumers — integrating into a product    ← host responsibilities the lib cannot enforce
## The machine contract   ← the TYPE is authoritative; the prose mirrors it
## State manifest — usage rules              ← the four ownership rules
## Add a new component (required workflow)
## Update tokens
## Local development      ← toolchain pin, and the seams no gate covers
## Accessibility compliance (non-negotiable gate)
  ### STABLE GATE / EXPORT GATE            ← stated as enforced rules, with the script
  ### Contrast rules, exemptions, allowlists
  ### Token changes trigger re-audit
## Process rules — parallel work & hygiene
## Agent behavior rules   ← short, imperative, unhedged
D. Self-contained session prompt
# <Operation> — <one-line purpose>

## Usage
Call this prompt and provide: <inputs>. The agent handles everything else,
starting with Step 0 — never skip ahead.

## Required inputs
- <mandatory> (mandatory — <why>)
- <optional> (optional)

## Step 0 — Read repository context (BLOCKING)
1. Read <operating contract>.
2. Read <active learnings> — recurring pitfalls.
3. Read <the relevant source of truth>.
4. Read <the state manifest> — verify the entry exists; note its notes and conflicts.

## Step 1..N
Each step states: what to do, what is BLOCKING (stop and ask), the exact
commands, and what constitutes proof. Where an external tool is required and
unavailable: **STOP and report** — never improvise the value it would have given.

## Self-validation
| # | Check | Source |
Fix before outputting if any fails.

## Final Summary (mandatory)
**Files created/modified:** | File | Action |
**Executed gate verdict:** <one line, from the real run>
**Decisions made autonomously:**
> Every decision made without explicit instruction. Be specific.
**Open questions / blockers:**
> Anything ambiguous, missing, or assumed.

## Never
- <the explicit prohibitions for this operation>
E. Session report
## To understand
<What was found, changed, and why — in the reader's terms. Context, not narration.>

## To decide
1. <Closed question> — Option A: <consequence>. Option B: <consequence>.
   Recommendation: <A or B, and why>.
(Empty is a valid and common answer.)

## To paste
<Exact literal text the human must place where the agent cannot reach:
a pull-request body, a label, a comment, a message to another team.>
F. Time-boxed allowlist + G. Learnings entry + H. Compensation marker
// F — every gate's exception file shares this shape; expiry is MANDATORY
{ "description": "What this is for, and what it is NOT for.",
  "entries": [{ "<scope>": "...", "reason": "<substantive: what fails, measured>",
                "approvedBy": "<named human>", "added": "YYYY-MM-DD",
                "expires": "YYYY-MM-DD" }] }
<!-- G — active learnings: three lines, no more -->
- **[Lnn](ARCHIVE#lnn)** — <the pattern, one sentence>
  - Rule: <the operating rule, one sentence>
  - Gate: <the gate that does not exist yet — or "None; <category>, no gate">
// H — compensation marker: reference, what, removal condition. Nothing else.
// DS-WORKAROUND #N: <one-line what> — remove when <condition> — see <file> #N
10.4 Ten mistakes not to repeat
Trusting a gate you have not seen go red. Three separate gates shipped verifying nothing.
Substring matching in a gate. A comment satisfies it.
Scanning part of a structured file. The block you skipped is where the interesting tokens live.
Chaining sub-checks with a short-circuiting operator. One failure hides every check after it.
Believing a class name proves an effect. Measure the rendering.
An exception with no expiry. That is a silent rule change.
Declaring a gate stronger than it is. Overstating scope stops people looking where the gate does not.
Building a defence by enumerating call sites. It cannot fail loudly when a new site appears. Derive it structurally; where you cannot, log the enumeration.
Assuming your local pipeline sees what a consumer sees. It does not. Prove the consumer path in CI.
Letting proof volume grow unbounded. An unread pull-request body means an unanswered arbitration, which is a decision made by default.
Two bonus ones, both about documents rather than code, and both expensive: a stale instruction file is a loaded gun, and citing a past lesson in a comment is not the same as the code implementing it — verify the coverage independently of what the comment claims.

10.5 Signals
Working:

Gates go red on real defects and are fixed rather than argued with.
The active learnings file shrinks as entries move to the archive with named gates — the gap between human vigilance and automation is closing.
Arbitration logs are consulted rather than re-litigated.
A pin bump in a consuming product deletes compensations.
New sessions produce conformant work without being told the rules a second time — the contract documents are doing their job.
A pilot reads the previous pilot's source and says so in its comments.
Degrading:

Allowlist entries being renewed rather than resolved.
The active learnings file growing with entries whose "gate" line is always "None".
Pull-request bodies growing back past the five sections.
Two documents describing the same thing differently, and nobody flagging it.
A generated file edited by hand "just this once".
A product compensation with no entry, or an entry with no removal test.
The pilot index missing a row.
A human merging without reading the "Decisions made autonomously" list. This one is invisible until it is expensive.
Annex A — Anonymisation gate
Command executed on the final text:

Annex B — Placeholder table
Placeholder	Stands for
<ORG>	The organisation, its code-hosting organisation, and its domain
<LIB>	The library repository
<LIB-PKG>	The published package name
<LEGACY-LIB-PKG>	The previous in-house component library being replaced
<PRODUCT-A/B/C/D/E>	The consuming products
<DESIGN-LEAD>	The design owner — holds priority, arbitration and every approval label
<DESIGNER>	The second designer
<DEVELOPER> / <REVIEWER>	Reinforcement and review
<PERSON>	Any other named individual
<DESIGN-TOOL>	The design tool. Any variables-capable tool with a REST API and a machine interface works
<DESIGN-FILE-KEY>	The design file identifier
<CI-SECRET>	Any credential: extraction key, repository-read token, CI secret name
<FONT-DISPLAY/BODY/MONO>	The brand typefaces
<TOKEN>	Any token whose name embeds the brand
<BOT-REVIEWER>	The automated review tool
DS-WORKAROUND / ds-migration	Genericised from an internal abbreviation derived from the organisation's name
Deliberate non-substitutions, stated for auditability. Names of third-party open-source technologies (the UI runtime, the CSS framework, the headless primitive library, the icon library, the legacy component framework, the test runners, the accessibility engine, the changeset tool, the package managers) are kept. They identify nothing about the organisation, and removing them would make the blueprint unusable for replication. The design tool is the one exception, because its file URLs and file keys were part of the identifying set.