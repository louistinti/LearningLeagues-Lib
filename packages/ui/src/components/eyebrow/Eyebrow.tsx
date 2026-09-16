import React from "react";

// API is RFC §3 exactly (Eyebrow.rfc.md, approved 2026-09-17). `tone` names a
// colour and nothing else (§7 Q10): mute by default (§7 Q3) or accent, which
// follows the accent axis through --ll-accent. One <span> and no `as` prop
// (§7 Q4); no glyph (§7 Q5), no chip (§7 Q6), no size (§7 Q7): the component
// is inline text laid out by its parent (§7 Q8). Not interactive: no states,
// no ARIA, no role (§4). The uppercase is CSS (text-transform) — children
// pass through untouched, so assistive tech reads the author's casing (§4.1).
export type EyebrowTone = "mute" | "accent";

export interface EyebrowProps {
  tone?: EyebrowTone;
  children: React.ReactNode;
}

export function Eyebrow({ tone = "mute", children }: EyebrowProps) {
  return <span className={`ll-eyebrow ll-eyebrow--${tone}`}>{children}</span>;
}
