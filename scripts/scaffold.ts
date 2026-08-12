// Deterministic scaffold for a new component (Milestone 4). Emits a shell that
// FAILS the gates intentionally — proving that passing is not the default but
// something earned. Each violation is documented so the implementer knows
// exactly what to fix.
// Usage: node scripts/scaffold.ts <ComponentName>
// Creates: packages/ui/src/components/<component-name>/
//   - index.ts (exports the component)
//   - <ComponentName>.tsx (the component shell, intentionally red)
//   - <ComponentName>.meta.ts (variant grid, intentionally red)
//   - contract.json (machine contract, required by a11y gate; status: draft, a11y: pending)
//   - <ComponentName>.rfc.md (RFC stub, points to templates/RFC-BLANK.md)
import { writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";

const [, , name] = process.argv;
if (!name || !/^[A-Z][a-zA-Z0-9]*$/.test(name))
  throw new Error(`Usage: node scripts/scaffold.ts <ComponentName> (PascalCase, e.g. Button)`);

const kebab = name
  .replace(/([A-Z])/g, "-$1")
  .toLowerCase()
  .slice(1);
const dir = join("packages/ui/src/components", kebab);
mkdirSync(dir, { recursive: true });

// Never overwrite: the RFC (approved BEFORE scaffolding, blueprint §4.1) and
// any implementer edit must survive a re-run. Skips are printed, not silent.
function writeIfAbsent(path: string, content: string): void {
  if (existsSync(path)) {
    console.log(`  skipped (exists): ${path}`);
    return;
  }
  writeFileSync(path, content);
}

// index.ts — entry point
writeIfAbsent(
  join(dir, "index.ts"),
  `export { ${name} } from "./${name}";
export type { ${name}Props } from "./${name}";
`,
);

// ComponentName.tsx — intentionally red
// Violations: token-lint (var(ll-background) is invalid syntax),
// token-lint (inline style with hardcoded #ff0000),
// contrast (red text on red background, ratio ~1).
writeIfAbsent(
  join(dir, `${name}.tsx`),
  `import React from "react";

export interface ${name}Props {
  children: React.ReactNode;
}

export function ${name}({ children }: ${name}Props) {
  return (
    <div
      className="component-${kebab}"
      style={{ color: "#ff0000", background: "var(ll-background)" }}
    >
      {children}
    </div>
  );
}
`,
);

// ComponentName.meta.ts — intentionally red
// Violation: token-lint (arbitrary pixel value instead of a token).
// This file scaffolds no variants yet; the implementer must define them.
writeIfAbsent(
  join(dir, `${name}.meta.ts`),
  `export const meta = {
  name: "${name}",
  description:
    "TODO: describe what ${name} does and what problem it solves.",
  variants: [],
  notes: "Scaffold is intentionally red (token-lint, contrast). Fix violations in ${name}.tsx, add variants, then promote to draft.",
};

// Intentional violation: arbitrary pixel value instead of a spacing token.
export const exampleRedClass = "p-[12px]";
`,
);

// contract.json — required by a11y gate; intentionally pending
writeIfAbsent(
  join(dir, "contract.json"),
  JSON.stringify(
    {
      status: "draft",
      exported: false,
      a11y: {
        status: "pending",
        notes:
          "Pending accessibility review. Check: semantic structure (ARIA roles, labels), keyboard interaction (all interactive states reachable without pointer), component-specific decisions (e.g. disabled state behaviour).",
      },
    },
    null,
    2,
  ) + "\n",
);

// ComponentName.rfc.md — stub pointing to the blank template
writeIfAbsent(
  join(dir, `${name}.rfc.md`),
  `# RFC: ${name}

> **Status:** draft
> **Author:** _fill in your name_
> **Date:** _fill in YYYY-MM-DD_
> **Design node:** _add your Figma node ID and link_
> **Base primitive:** none
> **Category:** _action | navigation | feedback | input | layout | data-display_
> **Manifest entry:** ${kebab}

---

See \`process/templates/RFC-BLANK.md\` for the full template.

## Summary

_2–3 sentences: what this component is, what problem it solves, why now._

(Fill in the RFC following the template. The scaffold is intentionally minimal — it proves that gates are not passing by default.)
`,
);

console.log(`✓ scaffold: ${name} (${kebab}) — intentionally red
  Violations: token-lint (invalid var syntax, hardcoded #ff0000, arbitrary p-[12px]), contrast (~1.0 on red/red)
  Fix in: ${name}.tsx
  Variants in: ${name}.meta.ts
  Accessibility: review contract.json, fill RFC
  Promote: run gates locally, fix violations, set status to 'stable' when gates pass
`);
