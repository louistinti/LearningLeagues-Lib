// Facts + judgement for the docs-site real-browser smoke gate (blueprint
// §5.1 row 17, §5.2.10): "content is present, never how it looks". Two
// halves, kept apart on purpose:
//   - collectFacts() runs INSIDE the page (Playwright page.evaluate) and must
//     stay self-contained — no imports, no outer-scope references, plain
//     data out. Layout facts are getBoundingClientRect boxes and innerText
//     lengths, the two things a simulated DOM can never give (spike
//     2026-09-15: an emptied demo stage keeps a padded box but no text, so
//     the stage and tile rules look at visible descendants AND rendered
//     text; inactive tab panels are 0×0 by design).
//   - judgePage() is pure over those facts plus the browser events the gate
//     collected, so gate 10 locks every rule.
// Types are the DOM's; Node strips them.

export interface Box {
  w: number;
  h: number;
}
export interface Facts {
  title: string;
  bodyPainted: boolean; // computed background-color of <body> is not fully transparent
  main: { box: Box; text: number } | null;
  h1: { box: Box; text: number } | null;
  stages: { visibleDescendants: number; text: number }[]; // every .stage — descendants with a non-zero box, rendered text length
  tiles: { name: string; visibleDescendants: number; text: number }[]; // every .accent-tile — descendants with a non-zero box outside the .accent-name subtree, rendered text length beyond the name
  hasPanels: boolean; // the page carries [role=tabpanel] elements
  activePanel: { id: string; box: Box; tables: number } | null; // the one not hidden
}
export interface Finding {
  rule: string;
  message: string;
}

// Evaluated in the browser: every helper is declared inside, nothing from
// this module's scope is referenced (Playwright serialises the function's
// source text). Chromium reports a transparent background as
// "rgba(0, 0, 0, 0)".
export function collectFacts(): Facts {
  const box = (el: Element): Box => {
    const r = el.getBoundingClientRect();
    return { w: Math.round(r.width), h: Math.round(r.height) };
  };
  const visible = (el: Element): boolean => {
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  };
  const visibleDescendants = (root: Element, skip?: string): number =>
    Array.from(root.querySelectorAll("*")).filter(
      (el) => !(skip && el.closest(skip)) && visible(el),
    ).length;
  const text = (el: Element): number => ((el as HTMLElement).innerText || "").trim().length;
  const main = document.querySelector("main");
  const h1 = document.querySelector("main h1");
  const panels = Array.from(document.querySelectorAll<HTMLElement>("[role=tabpanel]"));
  const active = panels.find((p) => !p.hidden) ?? null;
  return {
    title: document.title,
    bodyPainted: getComputedStyle(document.body).backgroundColor !== "rgba(0, 0, 0, 0)",
    main: main ? { box: box(main), text: text(main) } : null,
    h1: h1 ? { box: box(h1), text: text(h1) } : null,
    stages: Array.from(document.querySelectorAll(".stage")).map((s) => ({
      visibleDescendants: visibleDescendants(s),
      text: text(s),
    })),
    tiles: Array.from(document.querySelectorAll(".accent-tile")).map((t) => {
      // A tile with no .accent-name subtracts nothing — never the whole tile.
      const label = t.querySelector(".accent-name");
      const tileText = text(t) - (label ? text(label) : 0);
      return {
        name: (label?.textContent ?? "").trim(),
        visibleDescendants: visibleDescendants(t, ".accent-name"),
        text: Math.max(0, tileText),
      };
    }),
    hasPanels: panels.length > 0,
    activePanel: active
      ? { id: active.id, box: box(active), tables: active.querySelectorAll("table").length }
      : null,
  };
}

const empty = (b: Box): boolean => b.w === 0 || b.h === 0;

export function judgePage(facts: Facts, events: string[]): Finding[] {
  const out: Finding[] = [];
  for (const e of events) out.push({ rule: "page-events", message: e });
  if (!facts.bodyPainted)
    out.push({
      rule: "stylesheet",
      message: "<body> has no painted background — the site stylesheet did not take effect",
    });
  if (!facts.main) out.push({ rule: "main-content", message: "no <main> element" });
  else if (empty(facts.main.box))
    out.push({ rule: "main-content", message: "<main> has an empty box" });
  else if (facts.main.text === 0)
    out.push({ rule: "main-content", message: "<main> renders no text" });
  if (!facts.h1) out.push({ rule: "heading", message: "no <h1> inside <main>" });
  else if (empty(facts.h1.box)) out.push({ rule: "heading", message: "<h1> has an empty box" });
  else if (facts.h1.text === 0) out.push({ rule: "heading", message: "<h1> renders no text" });
  facts.stages.forEach((s, i) => {
    if (s.visibleDescendants === 0)
      out.push({
        rule: "demo-stage",
        message: `demo stage #${i + 1} renders nothing visible — the blank-demo incident (blueprint §5.2.10)`,
      });
    else if (s.text === 0)
      out.push({
        rule: "demo-stage",
        message: `demo stage #${i + 1} renders no text — a visible box with nothing in it (blueprint §5.2.10)`,
      });
  });
  for (const t of facts.tiles)
    if (t.visibleDescendants === 0)
      out.push({
        rule: "accent-tile",
        message: `accent tile "${t.name}" renders nothing beyond its name`,
      });
    else if (t.text === 0)
      out.push({
        rule: "accent-tile",
        message: `accent tile "${t.name}" renders no text beyond its name`,
      });
  if (facts.hasPanels) {
    if (!facts.activePanel)
      out.push({ rule: "tab-panel", message: "tab panels present but none is visible" });
    else if (empty(facts.activePanel.box))
      out.push({
        rule: "tab-panel",
        message: `active tab panel "${facts.activePanel.id}" has an empty box`,
      });
    else if (facts.activePanel.tables === 0)
      out.push({
        rule: "tab-panel",
        message: `active tab panel "${facts.activePanel.id}" renders no table`,
      });
  }
  if (!facts.title.trim()) out.push({ rule: "page-title", message: "empty <title>" });
  return out;
}
