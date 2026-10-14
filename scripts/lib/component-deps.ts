// Library-internal component dependencies (design lead, 2026-10-13: MetaStrip
// renders a real LL.Eyebrow — the first component-to-component dependency).
// One import form, and only one, lets a component render another library
// component:
//
//   import { Eyebrow } from "../eyebrow/Eyebrow.tsx";
//
// — the sibling's folder slug, its `${meta.name}.tsx` file with the explicit
// extension, and exactly one binding: the sibling's meta.name, unaliased.
// esbuild (docs renderer, a11y engine mount) resolves it by bundling; the
// dist generator DROPS the line, because every component already shares the
// one classic-script scope of dist/ll-lib.jsx — which is why the binding
// must be the plain global name (an alias or a second binding would dangle).
// Node never loads a component .tsx (ERR_UNKNOWN_FILE_EXTENSION, verified
// 2026-10-13), so this form is never read by Node's type stripping.
// Pure functions, no I/O — locked by component-deps.test.ts (gate 10).

export const LIBRARY_IMPORT_FORM = 'import { <Name> } from "../<slug>/<Name>.tsx";';

// Every module statement at the start of a line: `import … from "x"`,
// `export … from "x"`, or a bare `import "x"`. Component sources are
// prettier-formatted, so top-level statements start at column 0.
const STATEMENT =
  /^(import|export)\b([^;"']*?)\s*\bfrom\s*(["'])([^"'\n]+)\3|^import\s*(["'])([^"'\n]+)\5/gm;
const SPECIFIER = /^\.\.\/([a-z0-9]+(?:-[a-z0-9]+)*)\/([A-Za-z][A-Za-z0-9]*)\.tsx$/;
const CLAUSE = /^\{\s*([A-Za-z_$][\w$]*)\s*\}$/;

export interface LibraryImports {
  deps: string[]; // validated sibling slugs, sorted, deduplicated
  errors: string[];
}

/**
 * Library dependencies of one component source. `names` maps the slug of
 * every IMPLEMENTED component (a *.meta.ts exists — never an RFC-stage
 * folder) to its meta.name; the component's own slug may be in it.
 * Non-relative imports (react) are not this helper's concern.
 */
export function libraryImports(
  slug: string,
  source: string,
  names: Record<string, string>,
): LibraryImports {
  const deps = new Set<string>();
  const errors: string[] = [];
  for (const m of source.matchAll(STATEMENT)) {
    const keyword = m[1] ?? "import";
    const clause = (m[2] ?? "").trim();
    const spec = m[4] ?? m[6];
    if (!spec.startsWith(".")) continue;
    const where = `"${spec}"`;
    const form = SPECIFIER.exec(spec);
    if (!form) {
      errors.push(`${where}: a library import has exactly the form ${LIBRARY_IMPORT_FORM}`);
      continue;
    }
    const [, dep, file] = form;
    if (dep === slug) {
      errors.push(`${where}: a component cannot import itself`);
      continue;
    }
    if (!Object.hasOwn(names, dep)) {
      errors.push(
        `${where}: no implemented component "${dep}" (unknown folder, or RFC stage — no *.meta.ts)`,
      );
      continue;
    }
    const name = names[dep];
    if (file !== name) {
      errors.push(`${where}: the file is ${name}.tsx — the component's meta.name`);
      continue;
    }
    const binding = CLAUSE.exec(clause);
    if (keyword !== "import" || !binding || binding[1] !== name) {
      errors.push(
        `${where}: only \`import { ${name} }\` is allowed — the dist drops this line, so any other binding, alias or re-export would dangle`,
      );
      continue;
    }
    deps.add(dep);
  }
  return { deps: [...deps].sort(), errors };
}

export interface LibraryGraph {
  deps: Record<string, string[]>; // direct, validated edges per slug
  errors: Record<string, string[]>; // per slug; a slug absent here is clean
}

/**
 * The validated dependency graph of every implemented component, cycles
 * rejected (every slug on a cycle carries the error). `sources` maps each
 * slug of `names` to its `${meta.name}.tsx` text.
 */
export function libraryGraph(
  names: Record<string, string>,
  sources: Record<string, string>,
): LibraryGraph {
  const deps: Record<string, string[]> = {};
  const errors: Record<string, string[]> = {};
  const err = (slug: string, msg: string) => (errors[slug] ??= []).push(msg);
  const slugs = Object.keys(names).sort();
  for (const slug of slugs) {
    const r = libraryImports(slug, sources[slug] ?? "", names);
    deps[slug] = r.deps;
    r.errors.forEach((e) => err(slug, e));
  }
  // Depth-first, slug order: deterministic cycle reports.
  const state = new Map<string, "open" | "done">();
  const reported = new Set<string>();
  const visit = (slug: string, path: string[]) => {
    state.set(slug, "open");
    for (const dep of deps[slug] ?? []) {
      if (state.get(dep) === "open") {
        const cycle = [...path.slice(path.indexOf(dep)), dep];
        const key = [...cycle.slice(0, -1)].sort().join(",");
        if (!reported.has(key)) {
          reported.add(key);
          for (const s of new Set(cycle)) err(s, `dependency cycle: ${cycle.join(" → ")}`);
        }
      } else if (!state.has(dep)) visit(dep, [...path, dep]);
    }
    state.set(slug, "done");
  };
  for (const slug of slugs) if (!state.has(slug)) visit(slug, [slug]);
  return { deps, errors };
}

/**
 * Every library component `slug` renders, transitively, sorted by slug —
 * the order dist/ll-lib.css concatenates stylesheets in, so a page built
 * from the closure cascades like the shipped stylesheet. Excludes `slug`.
 */
export function dependencyClosure(slug: string, deps: Record<string, string[]>): string[] {
  const seen = new Set<string>();
  const walk = (s: string) => {
    for (const d of deps[s] ?? [])
      if (!seen.has(d)) {
        seen.add(d);
        walk(d);
      }
  };
  walk(slug);
  seen.delete(slug);
  return [...seen].sort();
}

/**
 * Drops the validated library-import lines from esbuild's transformed output
 * (one per dependency, `import { Name } from "../slug/Name.tsx";`) — the
 * dist's single script scope already holds every component. Any other
 * import is left in place for the caller's residual check to refuse.
 */
export function dropLibraryImports(code: string, deps: { slug: string; name: string }[]): string {
  let out = code;
  for (const { slug, name } of deps)
    out = out.replace(
      new RegExp(`^import \\{ ${name} \\} from "\\.\\./${slug}/${name}\\.tsx";\\n`, "m"),
      "",
    );
  return out;
}
