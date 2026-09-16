# Button `current` State Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Return the filed selected / `aria-current` ask as a `current` prop on the stable Button — attribute emitted on either rendering, secondary shows the site's measured filled state — with contract, docs, dist, RFC and Figma variant updated, then adopt it on the site's nav CTA.

**Architecture:** `Button.tsx` emits `aria-current="page"` from `current`; `button.css` keys the visual on that attribute (secondary only, hover inert). The contract (`Button.meta.ts`, `contract.json`) declares the state and an example; the docs generator learns attribute-driven states (`meta.states[].attribute` → the attribute is set on the forced example instead of a mirror class). Docs and dist regenerate in the same commits as their sources. One Figma write adds `Style=Secondary, State=Current`.

**Tech Stack:** Node 24 native `.ts`, React 19 (SSR via esbuild in the generators), `node:test` + jsdom (a11y suites), Playwright (gate 17 renders the result), Figma Plugin API via `use_figma` (main session only).

**Design record:** `process/archives/2026-09-16-button-current-state-design.md`. Branch: `feat/button-current-state` (exists; first commit ec26100 claimed the manifest row — pushed).

**Binding rules** (`AGENTS.md`, `ORCHESTRATION.md`): `git branch --show-current` before every commit; English in every file (RFC §7 quotes stay verbatim in French, as the existing rows do); `pnpm format` before committing hand-written files; regenerate `docs/**` and `dist/**` (`pnpm docs:build`, `pnpm dist:build`) in the SAME commit as any source they derive from — never hand-edit them; re-run `pnpm gate:contrast` when a colour rule is touched; `pnpm conformity` executed and quoted before the PR; commits end with `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`. Never `git push | grep` in a `&&` chain; never a `;` before `gh pr create`. Visual values are Louis's: the Figma variant and the docs page get his checkpoint before the PR.

---

## File structure

| File                                                        | Responsibility                                                                                          |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `packages/ui/src/components/button/Button.tsx` (modify)     | `current` prop → `aria-current="page"` on `<a>` and `<button>`.                                         |
| `packages/ui/src/components/button/button.css` (modify)     | `.ll-button--secondary[aria-current="page"]` filled state, hover inert.                                 |
| `packages/ui/src/components/button/Button.a11y.test.ts` (modify) | Three cases on the attribute.                                                                      |
| `scripts/lib/docs-html.ts` (modify)                         | `states[].attribute` type; `withForcedState` sets the attribute; generic States prose.                  |
| `scripts/generate-docs.ts` (modify)                         | Validates `attribute` shape on states.                                                                  |
| `packages/ui/src/components/button/Button.meta.ts` (modify) | New state (with `attribute`), example, guidelines.                                                      |
| `packages/ui/src/components/button/contract.json` (modify)  | `current` prop; a11y semantic sentence.                                                                 |
| `packages/ui/src/components/button/Button.rfc.md` (modify)  | §3.1 row, §4.1 sentence, §5 limitation, §7 row.                                                         |
| `packages/ui/src/STATE-MANIFEST.md` (modify)                | Button notes (delivered, adoption pending); owner/branch cleared after merge.                            |
| `docs/**`, `dist/**` (regenerate)                           | `pnpm docs:build`, `pnpm dist:build`.                                                                   |
| Figma set 16:18 (write, main session)                       | Variant `Style=Secondary, State=Current`.                                                               |
| `../LearningLeagues` (after merge)                          | Re-vendored dist, `current` on the nav CTA.                                                             |

---

### Task 1: The prop, the attribute, the CSS (TDD)

**Files:**

- Modify: `packages/ui/src/components/button/Button.a11y.test.ts` (append three tests)
- Modify: `packages/ui/src/components/button/Button.tsx`
- Modify: `packages/ui/src/components/button/button.css`
- Regenerate: `dist/ll-lib.css`, `dist/ll-lib.jsx` (`pnpm dist:build`), `docs/**` (`pnpm docs:build`)

- [ ] **Step 1: Append the failing tests** to `Button.a11y.test.ts` (after the last test):

```ts
// current (RFC §3.1 / §4.1, 2026-09-16): the one ARIA attribute the component
// emits, on either rendering — the filled visual keys on it in button.css, so
// there is no way to show the state without announcing it.
test('current: <a href> carries aria-current="page"', async () => {
  const { root, unmount } = await mountComponent(
    DIR,
    "Button",
    { variant: "secondary", href: "/quiz", current: true },
    "Role quiz",
  );
  assert.equal(root.tagName, "A");
  assert.equal(root.getAttribute("aria-current"), "page");
  await unmount();
});

test('current: <button> carries aria-current="page" too (valid on any element)', async () => {
  const { root, unmount } = await mountComponent(DIR, "Button", { current: true }, "Here");
  assert.equal(root.tagName, "BUTTON");
  assert.equal(root.getAttribute("aria-current"), "page");
  await unmount();
});

test("without current, neither rendering carries aria-current", async () => {
  const a = await mountComponent(DIR, "Button", { href: "/rules" }, "Rules");
  assert.equal(a.root.getAttribute("aria-current"), null);
  await a.unmount();
  const b = await mountComponent(DIR, "Button", { current: false }, "Start");
  assert.equal(b.root.getAttribute("aria-current"), null);
  await b.unmount();
});
```

- [ ] **Step 2: Run the suite to see the two new reds**

Run: `node --test packages/ui/src/components/button/Button.a11y.test.ts`
Expected: `tests 7, pass 5, fail 2` — the two `current:` tests fail (`aria-current` is `null`); the "without current" test passes already.

- [ ] **Step 3: Implement the prop** — `Button.tsx` becomes:

```tsx
import React from "react";

// API is RFC §3 exactly (Button.rfc.md, approved 2026-08-14; `current` added
// by the §7 follow-up of 2026-09-16). Hover and focus are CSS states in
// button.css, never props. With `href` the component renders a native <a>
// with identical chrome — link semantics kept deliberately (§4.1). `current`
// emits aria-current="page" on either element: the filled visual in
// button.css keys on that attribute, so the state cannot be shown without
// being announced.
export interface ButtonProps {
  variant?: "primary" | "secondary";
  href?: string;
  type?: "button" | "submit" | "reset";
  current?: boolean;
  onClick?: (e: React.MouseEvent) => void;
  children: React.ReactNode;
}

export function Button({
  variant = "primary",
  href,
  type = "button",
  current = false,
  onClick,
  children,
}: ButtonProps) {
  const className = `ll-button ll-button--${variant}`;
  const ariaCurrent = current ? "page" : undefined;
  if (href !== undefined) {
    return (
      <a className={className} href={href} aria-current={ariaCurrent} onClick={onClick}>
        {children}
      </a>
    );
  }
  return (
    <button className={className} type={type} aria-current={ariaCurrent} onClick={onClick}>
      {children}
    </button>
  );
}
```

- [ ] **Step 4: Run the suite — green**

Run: `node --test packages/ui/src/components/button/Button.a11y.test.ts`
Expected: `tests 7, pass 7, fail 0`.

- [ ] **Step 5: The CSS** — append to `button.css` after the `.ll-button--secondary:hover` rule (before the focus-ring comment):

```css
/* Current — "you are here" (RFC §3.1 / §4.1, §7 2026-09-16): the site's
   measured filled state, keyed on the semantic attribute so the visual never
   exists without it. Hover is inert on a current button: the state is
   stable, not an invitation. Primary + current: attribute only (RFC §5). */
.ll-button--secondary[aria-current="page"],
.ll-button--secondary[aria-current="page"]:hover {
  background: var(--ll-accent);
  color: var(--ll-bg);
  border-color: var(--ll-accent);
}
```

- [ ] **Step 6: Gates that read the CSS and the component**

Run: `pnpm gate:lint-tokens` → `PASS`; `pnpm gate:contrast` → `PASS (21 pairs)` (a colour rule was touched — ORCHESTRATION); `pnpm gate:a11y-engine` → `PASS` (7 suite tests now).

- [ ] **Step 7: Regenerate the artefacts in the same commit**

Run: `pnpm dist:build` then `pnpm docs:build`, then `pnpm tokens:check` → `PASS` (drift green). `git status --short` shows `dist/ll-lib.css`, `dist/ll-lib.jsx`, `docs/assets/lib.css` (the mirror rules follow the CSS) and the three source files. `grep -c 'aria-current="page"' docs/assets/lib.css` → `1` (the forced-state derivation ignores attribute selectors — the `:hover` half of the new rule is mirrored as `.ll-button--secondary[aria-current="page"].ll-docs-force-hover`, which is correct and harmless).

- [ ] **Step 8: Format and commit**

```bash
pnpm format
git branch --show-current
git add packages/ui/src/components/button/Button.tsx packages/ui/src/components/button/button.css packages/ui/src/components/button/Button.a11y.test.ts dist/ docs/
git commit -m "feat(button): current prop — aria-current=\"page\" on either rendering, secondary filled state keyed on the attribute

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 2: Docs generator — attribute-driven states

**Files:**

- Modify: `scripts/lib/docs-html.ts` (`ComponentDoc.meta.states` type at line 12; `withForcedState` at lines 64–69; the States call at line 291; the States prose at line 341)
- Modify: `scripts/generate-docs.ts` (states validation, lines 68–74)
- Regenerate: `docs/**` (no visible change yet — Task 3 adds the state; the drift gate proves the generator is deterministic)

- [ ] **Step 1: The type** — in `ComponentDoc.meta`, replace

```ts
    states?: { state: string; note: string }[];
```

with

```ts
    // A state is held in the docs either by a docs-only mirror of its
    // pseudo-class rules (hover, focus-visible, active) or — when `attribute`
    // is declared — by setting that attribute on the example, so the
    // component's real CSS applies and the visual never appears without its
    // semantic (design record 2026-09-16 §2.7).
    states?: { state: string; note: string; attribute?: { name: string; value: string } }[];
```

- [ ] **Step 2: `withForcedState`** — replace the function with:

```ts
// Hold a rendered example in a state. Pseudo-class states get a docs-only
// class (the mirror rules in the generated lib.css target it); attribute
// states get the attribute itself on the root element — the component's real
// CSS applies. An example already carrying the attribute is left alone.
function withForcedState(
  html: string,
  state: string,
  attribute?: { name: string; value: string },
): string {
  if (state === "default") return html;
  if (attribute) {
    if (html.includes(` ${attribute.name}=`)) return html;
    return html.replace(/^<([a-zA-Z][\w-]*)/, `<$1 ${attribute.name}="${esc(attribute.value)}"`);
  }
  return html.replace(/class="/, `class="ll-docs-force-${state} `);
}
```

(`esc` is already defined above in the file.)

- [ ] **Step 3: The call site** — in the `states` map, change `withForcedState(html, s.state)` to `withForcedState(html, s.state, s.attribute)`.

- [ ] **Step 4: The prose** — replace the States intro paragraph

```
<p>Hover and focus-visible are CSS states, never props (RFC §3). Each stage below shows the examples held in that exact state via docs-only mirror rules derived from the component's own stylesheet.</p>
```

with

```
<p>Each stage below holds the examples in that state. Pseudo-class states (hover, focus-visible) are never props — they are mirrored by docs-only rules derived from the component's own stylesheet. An attribute state is set on the example exactly as the component emits it from its props, so the real stylesheet applies.</p>
```

- [ ] **Step 5: Validation in `generate-docs.ts`** — replace the states block with:

```ts
  if (meta?.states !== undefined) {
    if (!Array.isArray(meta.states)) fail(`${slug}: meta.states must be an array`);
    else
      for (const s of meta.states) {
        if (typeof s?.state !== "string" || !s.state || typeof s?.note !== "string" || !s.note)
          fail(`${slug}: every meta.states entry needs a state name and a note (vs default)`);
        if (s?.attribute !== undefined) {
          const a = s.attribute;
          if (
            typeof a?.name !== "string" ||
            !/^[a-z][a-z0-9-]*$/.test(a.name) ||
            typeof a?.value !== "string" ||
            !a.value
          )
            fail(
              `${slug}: state "${s?.state}" attribute must be { name: /^[a-z][a-z0-9-]*$/, value: non-empty string }`,
            );
        }
      }
  }
```

- [ ] **Step 6: Prove the validation red/green without committing a fixture**

Temporarily add `attribute: { name: "Aria-Current", value: "" }` to Button's `hover` state in `Button.meta.ts`; run `node scripts/generate-docs.ts` → exits 1 naming `state "hover" attribute must be …`. Revert that edit (`git checkout -- packages/ui/src/components/button/Button.meta.ts` — confirm with `git status --short` that the file had no other change). Run `pnpm docs:build` → OK, and `node scripts/generate-docs.ts --check` → OK (no output change: no state declares an attribute yet).

- [ ] **Step 7: Format and commit**

```bash
pnpm format
git branch --show-current
git status --short
git add scripts/lib/docs-html.ts scripts/generate-docs.ts docs/
git commit -m "feat(docs): attribute-driven states — a meta.states entry may name the attribute the docs set on the forced example

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

(If `docs/` shows no change, omit it from `git add`.)

---

### Task 3: Contract, RFC, manifest, regenerated site

**Files:**

- Modify: `packages/ui/src/components/button/Button.meta.ts`, `contract.json`, `Button.rfc.md`, `packages/ui/src/STATE-MANIFEST.md`
- Regenerate: `docs/**`, `dist/**`

- [ ] **Step 1: `Button.meta.ts`**

Append to `states` (after the `focus-visible` entry):

```ts
    {
      state: "current",
      attribute: { name: "aria-current", value: "page" },
      note: 'Versus default (secondary): accent fill, bg-coloured label, accent border; hover inert; the focus ring is unchanged. Emitted by the current prop as aria-current="page" — the CSS keys on the attribute, so the visual never exists without the semantic (RFC §3.1). Primary: attribute only, no visual (RFC §5).',
    },
```

Append to `examples`:

```ts
    {
      label: "Current — you are here (secondary, href)",
      props: { variant: "secondary", href: "#", current: true },
      children: "Role quiz",
    },
```

Append to `guidelines.golden`:

```ts
      {
        rule: "Current says where you are, not what you chose",
        detail:
          'current marks the navigation target the reader is on (aria-current="page"); a pressed or toggled control is aria-pressed — a different state, out of scope (RFC §7, 2026-09-16).',
      },
```

Append to `do`: `"Set current on the one Button that leads to the page being viewed — the site's nav CTA on the Quiz page."`
Append to `dont`: `"Don't use current as a toggle or a selection — that is aria-pressed, not aria-current."`

- [ ] **Step 2: `contract.json`** — add after the `type` prop:

```json
    "current": {
      "type": "boolean",
      "default": "false",
      "note": "emits aria-current=\"page\" on either rendering; secondary shows the filled state, primary only the attribute (RFC §5)"
    },
```

and change `a11y.semanticStructure` to end with: `… AT reads the author's casing. current adds aria-current=\"page\" (valid on both elements) — the one ARIA attribute the component emits.`

- [ ] **Step 3: `Button.rfc.md`**

§3.1 table — add a row after `type`:

```
| current | `boolean`                         | `false`     | no       | Marks the you-are-here target: emits `aria-current="page"` on either rendering; secondary renders the filled state, primary only the attribute (§5). Returned via §7, 2026-09-16. |
```

§4.1 — append the sentence: `The one ARIA attribute the component emits is \`aria-current="page"\` when \`current\` is set — valid on both elements, and the filled visual keys on it (§3.1), so the state cannot be shown without being announced.`

§5 (the HUMAN ONLY block, currently only the comment) — add under the comment:

```
- `current` on `primary` has no visual: no product usage was measured (the
  only measured you-are-here control is the outlined nav CTA); the attribute
  is still emitted. Arbitrated 2026-09-16 (§7).
```

§7 — append one row (verbatim quotes; keep the table's column alignment for prettier):

```
| 2026-09-16 | (follow-up of the 2026-08-31 filed ask) Four closed questions on the selected / aria-current state: (1) API — prop `current` → aria-current="page" on either rendering, CSS keyed on the attribute / prop `selected` + class / `current` limited to `<a href>`; (2) visual — secondary only, the site's `.nav-cta.is-active` recipe / both variants; (3) Figma — the variant only, now / variant + refresh Docs / Button / no write; (4) site adoption in this session after the merge / library only. | (1) "Prop `current` → aria-current=\"page\" (Recommended)"; (2) "Secondary seul, recette du site (Recommended)" — primary + current emits the attribute with no visual (§5); (3) "Variante seule, maintenant (Recommended)" — `Docs / Button` (54:3) lags by one state until the next Button write; (4) "Oui, après le merge lib (Recommended)" — the push to the product repository stays Louis's. | Louis Tinthilier |
```

- [ ] **Step 4: Manifest** — in the `button` row's Notes, replace `**In progress 2026-09-16:** the filed selected/aria-current ask returns as the \`current\` prop (design record \`process/archives/2026-09-16-button-current-state-design.md\`); site adoption follows the merge.` with `**\`current\` state delivered 2026-09-16** (the selected/aria-current ask filed at adoption; design record \`process/archives/2026-09-16-button-current-state-design.md\`): \`aria-current="page"\` on either rendering, secondary filled. Site adoption of the nav CTA follows the merge (pin to record).` Owner and branch stay claimed until the merge.

- [ ] **Step 5: Regenerate and run everything**

Run: `pnpm docs:build && pnpm dist:build && pnpm conformity`
Expected: `conformity: PASS (11 gates)`. In `reports/a11y-engine.md` the Button block now has 4 examples × 5 accents, all PASS. `grep -c 'aria-current="page"' docs/components/button.html` ≥ 5 (the live example + the four examples forced in the `current` stage). `pnpm gate:docs-smoke` (inside conformity) still PASS.

- [ ] **Step 6: Format and commit**

```bash
pnpm format
git branch --show-current
git status --short
git add packages/ui/src/components/button/Button.meta.ts packages/ui/src/components/button/contract.json packages/ui/src/components/button/Button.rfc.md packages/ui/src/STATE-MANIFEST.md docs/ dist/
git commit -m "docs(button): current state in the contract, RFC §3/§4/§5/§7 follow-up, docs and dist regenerated

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 4: Figma variant + visual checkpoint (main session)

- [ ] `use_figma` (skill `figma-use` loaded), page `Button`, set 16:18: `const src = await figma.getNodeByIdAsync("16:10"); const v = src.clone(); set.appendChild(v); v.name = "Style=Secondary, State=Current"; v.x = 24; v.y = 408;` then bind: `v.fills = [figma.variables.setBoundVariableForPaint({ type: "SOLID", color: {r:0,g:0,b:0} }, "color", accentVar)]`, `v.strokes = [setBoundVariableForPaint(strokeClone, "color", accentVar)]`, label TEXT (`v.query('TEXT').first()`, font loaded via `getStyledTextSegments(['fontName'])`) fill re-bound to `bg/default`, icon VECTOR (`v.query('VECTOR').first()`) stroke re-bound to `bg/default`. Variables found by name via `figma.variables.getLocalVariablesAsync("COLOR")` (`accent/default`, `bg/default` in the Semantic collection). Return the ids; `await v.screenshot()`.
- [ ] Verify with `get_metadata` on 16:18 (7 variants) and the returned screenshot; the `State` property now lists `Current`.
- [ ] Louis's visual checkpoint (human lock): the Figma variant and the docs Button page (`docs/components/button.html` — Examples stage + `current` stage), opened in the browser pane. Flag the pre-existing white fill on the icon frames (all variants) — his call, not changed here.

---

### Task 5: PR (main session)

- [ ] Push (own line). `pnpm conformity` on the pushed tree; quote the verdict.
- [ ] `gh pr create` with the five-section body (What / Why / How verified / Decisions for the human / Follow-ups), ending with `🤖 Generated with [Claude Code](https://claude.com/claude-code)`.
- [ ] Louis merges. Post-merge: fast-forward `main`, delete the branch, clear owner/branch on the manifest row in the site-adoption PR (or a one-line follow-up commit) — never leave a claimed row after the merge.

---

### Task 6: Site adoption (main session, after merge)

- [ ] In `../LearningLeagues`: `git fetch`, `git status -sb` on `origin/main` (L09), `git switch -c feat/nav-cta-current`.
- [ ] `node scripts/vendor-dist.ts --target ../LearningLeagues` (dry run, page wiring OK), then `--write` at the merged pin; note the pin.
- [ ] `components.jsx`: the nav CTA becomes `<LL.Button variant="secondary" href="Quiz.html" current={activeKey === "quiz"}>` and its comment: `{/* Library Button since 2026-08-30; its current (you-are-here) state since <date> — the ask filed at adoption, delivered as the library's current prop (lib pin <pin>). .nav-cta-wrap is product layout: mobile hiding. */}`. `styles.css` `.nav-cta-wrap` comment: replace `The filled active state retired with it (arbitrated; selected-state = library ask).` with `The filled you-are-here state returned <date> as the library's current prop.`
- [ ] Open `Quiz.html` and another page in the browser pane: the CTA is filled on Quiz only, `aria-current="page"` present there only (read the DOM, not a screenshot).
- [ ] One commit on the site branch; Louis pushes (human lock) — give him the command.

---

## Self-review

- **Spec coverage:** API + CSS + tests (T1); attribute-driven states in the generator (T2 ↔ design §2.7); contract, RFC, manifest, regeneration (T3 ↔ §2.3–§2.6); Figma (T4 ↔ §3); PR (T5); site (T6 ↔ §5). Out-of-scope list untouched.
- **Placeholders:** `<date>` / `<pin>` in T6 are filled at execution from the merge (the plan cannot know the squash SHA).
- **Type consistency:** `attribute: { name, value }` spelled the same in docs-html, generate-docs, meta.ts and the design record; `current` boolean everywhere; `aria-current="page"` literal everywhere.
