// Page discovery for the docs-site gates (10: accessibility, 17: real-browser
// smoke): every `.html` under a directory, recursively, sorted so reports are
// stable. I/O only — no judgement lives here.
import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";

export function htmlFiles(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir).sort()) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...htmlFiles(p));
    else if (name.endsWith(".html")) out.push(p);
  }
  return out;
}
