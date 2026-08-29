// SSR of real library components for the docs generator (blueprint §9.2):
// esbuild bundles the component entry (react/react-dom external), the bundle
// is evaluated as CJS, and react-dom/server renders every contract example.
// Never a local approximation of a component (axiom 4).
import { buildSync } from "esbuild";
import { createRequire } from "node:module";
import { resolve } from "node:path";

const requireFromRoot = createRequire(resolve("package.json"));

export interface Example {
  label: string;
  props: Record<string, unknown>;
  children?: string;
}

export function renderExamples(
  componentDir: string,
  exportName: string,
  examples: Example[],
): string[] {
  const entry = `
const { renderToStaticMarkup } = require("react-dom/server");
const React = require("react");
const mod = require("./index.ts");
module.exports = (examples, exportName) =>
  examples.map((e) => renderToStaticMarkup(React.createElement(mod[exportName], e.props, e.children)));
`;
  const bundle = buildSync({
    stdin: { contents: entry, resolveDir: resolve(componentDir), loader: "ts" },
    bundle: true,
    format: "cjs",
    platform: "node",
    external: ["react", "react-dom"],
    write: false,
    logLevel: "silent",
  });
  const mod = { exports: {} as unknown };
  new Function("module", "exports", "require", bundle.outputFiles[0].text)(
    mod,
    mod.exports,
    requireFromRoot,
  );
  return (mod.exports as (e: Example[], n: string) => string[])(examples, exportName);
}
