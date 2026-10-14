// Unit suite (gate 10) for the library-dependency helper: the one import
// form a component uses to render another library component, its
// rejections, the cycle check, the transitive closure the a11y engine
// injects CSS from, and the line the dist generator drops.
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  libraryImports,
  libraryGraph,
  dependencyClosure,
  dropLibraryImports,
} from "./component-deps.ts";

const NAMES = { button: "Button", eyebrow: "Eyebrow", "meta-strip": "MetaStrip" };
const src = (...lines: string[]) => ['import React from "react";', ...lines, ""].join("\n");

test("a component importing only React has no library dependency", () => {
  assert.deepEqual(libraryImports("button", src("export function Button() {}"), NAMES), {
    deps: [],
    errors: [],
  });
});

test("the documented form is accepted, deduplicated and sorted", () => {
  const r = libraryImports(
    "meta-strip",
    src(
      'import { Eyebrow } from "../eyebrow/Eyebrow.tsx";',
      'import { Button } from "../button/Button.tsx";',
      'import { Eyebrow } from "../eyebrow/Eyebrow.tsx";',
    ),
    NAMES,
  );
  assert.deepEqual(r, { deps: ["button", "eyebrow"], errors: [] });
});

test("an unknown or RFC-stage slug is rejected", () => {
  const r = libraryImports("meta-strip", src('import { Badge } from "../badge/Badge.tsx";'), NAMES);
  assert.deepEqual(r.deps, []);
  assert.match(r.errors[0], /no implemented component "badge".*RFC stage/);
});

test("a file or binding that is not the sibling's meta.name is rejected", () => {
  const file = libraryImports(
    "meta-strip",
    src('import { Eyebrow } from "../eyebrow/Label.tsx";'),
    NAMES,
  );
  assert.match(file.errors[0], /the file is Eyebrow\.tsx/);
  for (const clause of [
    "{ Label }",
    "{ Eyebrow as E }",
    "{ Eyebrow, EyebrowTone }",
    "Eyebrow",
    "* as E",
    "type { Eyebrow }",
  ]) {
    const r = libraryImports(
      "meta-strip",
      src(`import ${clause} from "../eyebrow/Eyebrow.tsx";`),
      NAMES,
    );
    assert.deepEqual(r.deps, [], clause);
    assert.match(r.errors[0], /only `import \{ Eyebrow \}` is allowed/, clause);
  }
});

test("a re-export of a sibling is rejected", () => {
  const r = libraryImports(
    "meta-strip",
    src('export { Eyebrow } from "../eyebrow/Eyebrow.tsx";'),
    NAMES,
  );
  assert.match(r.errors[0], /only `import \{ Eyebrow \}` is allowed/);
});

test("any other relative specifier is rejected with the one allowed form", () => {
  for (const spec of [
    "../eyebrow/Eyebrow",
    "../eyebrow",
    "../eyebrow/index.ts",
    "./parts.tsx",
    "../eyebrow/eyebrow.css",
  ]) {
    const r = libraryImports("meta-strip", src(`import { Eyebrow } from "${spec}";`), NAMES);
    assert.match(r.errors[0] ?? "", /exactly the form import \{ <Name> \}/, spec);
  }
  const bare = libraryImports("meta-strip", src('import "../eyebrow/eyebrow.css";'), NAMES);
  assert.match(bare.errors[0] ?? "", /exactly the form/);
});

test("a self-import is rejected", () => {
  const r = libraryImports(
    "eyebrow",
    src('import { Eyebrow } from "../eyebrow/Eyebrow.tsx";'),
    NAMES,
  );
  assert.match(r.errors[0], /cannot import itself/);
});

test("libraryGraph rejects a cycle on every slug it crosses, once", () => {
  const g = libraryGraph(
    { a: "A", b: "B", c: "C", d: "D" },
    {
      a: src('import { B } from "../b/B.tsx";'),
      b: src('import { C } from "../c/C.tsx";'),
      c: src('import { A } from "../a/A.tsx";'),
      d: src('import { A } from "../a/A.tsx";'),
    },
  );
  for (const s of ["a", "b", "c"])
    assert.deepEqual(g.errors[s], ["dependency cycle: a → b → c → a"]);
  assert.equal(g.errors.d, undefined);
});

test("libraryGraph keeps an acyclic graph clean", () => {
  const g = libraryGraph(NAMES, {
    button: src(),
    eyebrow: src(),
    "meta-strip": src('import { Eyebrow } from "../eyebrow/Eyebrow.tsx";'),
  });
  assert.deepEqual(g.errors, {});
  assert.deepEqual(g.deps, { button: [], eyebrow: [], "meta-strip": ["eyebrow"] });
});

test("dependencyClosure is transitive, slug-sorted and excludes the component", () => {
  const deps = { outer: ["inner", "button"], inner: ["eyebrow"], eyebrow: [], button: [] };
  assert.deepEqual(dependencyClosure("outer", deps), ["button", "eyebrow", "inner"]);
  assert.deepEqual(dependencyClosure("eyebrow", deps), []);
});

test("dropLibraryImports removes exactly the validated lines", () => {
  const code = [
    'import { Eyebrow } from "../eyebrow/Eyebrow.tsx";',
    'import { Other } from "./other";',
    "export function MetaStrip() {}",
    "",
  ].join("\n");
  assert.equal(
    dropLibraryImports(code, [{ slug: "eyebrow", name: "Eyebrow" }]),
    'import { Other } from "./other";\nexport function MetaStrip() {}\n',
  );
});
