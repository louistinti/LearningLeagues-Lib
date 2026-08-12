# Extract — stage 1 of the token pipeline (agent procedure)

## Why this stage is a procedure, not a script

The Figma Variables REST API requires an Enterprise plan (verified 2026-08-12:
this organisation's plan also caps collections at one mode). Extraction
therefore runs through the Figma MCP in a local agent session, and the raw
export is a **committed artefact** that the CI gates validate and diff. If the
plan ever gains REST variables access, replace this procedure with an
`extract.ts` keyed on `FIGMA_TOKEN` — the downstream stages do not change.

## Required inputs

- Figma MCP connected to the design file named in `process/PROJECT-CONTEXT.md`.
- If the MCP is unreachable: **STOP and report.** Never improvise values.

## Procedure

1. Run the script below via `use_figma` (split into halves if the tool output
   truncates — never transcribe by hand).
2. Write the result to `packages/ui/src/tokens/raw/figma-variables.json` with
   the `$comment`, `source` and `exportedAt` header fields (see the committed
   file for the exact shape).
3. Run `pnpm tokens:build && pnpm validate:theme && pnpm diff:tokens`.
4. Add a dated entry to `packages/ui/src/tokens/PROVENANCE.md`.

```js
const collections = await figma.variables.getLocalVariableCollectionsAsync();
const out = { collections: [], variables: [] };
for (const c of collections) {
  out.collections.push({
    id: c.id,
    name: c.name,
    defaultModeId: c.defaultModeId,
    modes: c.modes.map((m) => ({ modeId: m.modeId, name: m.name })),
  });
  for (const id of c.variableIds) {
    const v = await figma.variables.getVariableByIdAsync(id);
    out.variables.push({
      id: v.id,
      name: v.name,
      variableCollectionId: v.variableCollectionId,
      resolvedType: v.resolvedType,
      scopes: v.scopes,
      codeSyntax: v.codeSyntax || {},
      valuesByMode: v.valuesByMode,
    });
  }
}
return out;
```

## Never

- Never edit the raw export, `tokens.json` or `tokens.css` by hand.
- Never run this stage against a stale base — rebase first (the diff gate's
  verdict is only meaningful against a current base).
