// Mounts a REAL library component with react-dom/client inside a jsdom
// window, for per-component behaviour suites (<Name>.a11y.test.ts). Same
// bundling trick as docs-render.ts: esbuild bundles the component entry with
// react/react-dom external, the CJS bundle is evaluated, React is required
// from the repository root. Never a local approximation (axiom 4).
import { buildSync } from "esbuild";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import { JSDOM, VirtualConsole } from "jsdom";

const requireFromRoot = createRequire(resolve("package.json"));

export interface Mounted {
  window: JSDOM["window"];
  root: Element; // the component's root element
  unmount: () => Promise<void>;
}

export async function mountComponent(
  componentDir: string,
  exportName: string,
  props: Record<string, unknown>,
  children?: string,
): Promise<Mounted> {
  const dom = new JSDOM(
    `<!doctype html><html lang="en"><body><div id="root"></div></body></html>`,
    {
      virtualConsole: new VirtualConsole(), // link clicks try to navigate; jsdom's "not implemented" is not a finding
    },
  );
  const { window } = dom;
  // react-dom reads these at module init and on every render; act() needs the flag.
  Object.defineProperty(globalThis, "window", {
    value: window,
    configurable: true,
    writable: true,
  });
  Object.defineProperty(globalThis, "document", {
    value: window.document,
    configurable: true,
    writable: true,
  });
  Object.defineProperty(globalThis, "IS_REACT_ACT_ENVIRONMENT", {
    value: true,
    configurable: true,
    writable: true,
  });

  const entry = `
const React = require("react");
const { act } = React;
const { createRoot } = require("react-dom/client");
const mod = require("./index.ts");
module.exports = async (container, exportName, props, children) => {
  const root = createRoot(container);
  await act(async () => { root.render(React.createElement(mod[exportName], props, children)); });
  return () => act(async () => { root.unmount(); });
};
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
  const container = window.document.getElementById("root") as Element;
  const unmount = await (
    mod.exports as (
      c: Element,
      n: string,
      p: Record<string, unknown>,
      ch?: string,
    ) => Promise<() => Promise<void>>
  )(container, exportName, props, children);
  const root = container.firstElementChild;
  if (!root) throw new Error(`mountComponent: ${exportName} rendered nothing`);
  return {
    window,
    root,
    unmount: async () => {
      await unmount();
      window.close();
    },
  };
}
