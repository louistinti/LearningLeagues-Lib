import React from "react";
import { Eyebrow } from "../eyebrow/Eyebrow.tsx";

// API is RFC §3 exactly (MetaStrip.rfc.md, approved 2026-10-13). Three props
// and nothing else: `items`, the facts in reading order; `tone`, the key
// colour for the whole strip forwarded to every key's Eyebrow (§7 Q4); and
// `valueTone`, the value colour for the whole strip — fg/mute by default, or
// the accent (§7, adoption-checkpoint rows 2026-10-14: an option, for the
// role guides). The two tones are independent. No children, size, as,
// separator (§7 Q6), rating (§7 Q5), className or layout prop. A list (§7 Q8): one <ul role="list"> — explicit, because WebKit drops
// list semantics under list-style: none (§4.3) — and one <li> per fact. Each
// key is a real library Eyebrow (§7 Q3), imported in the one accepted form
// (scripts/lib/component-deps.ts); the strip never restates its recipe. A
// value, when present, follows one literal space so the DOM text reads
// "label value" (§3.4, §4.1); the visible gap is the item's column-gap.
// Empty `items` renders nothing, never an empty list (§3.4).
export type MetaStripTone = "dim" | "accent";
export type MetaStripValueTone = "mute" | "accent";

export interface MetaStripItem {
  label: React.ReactNode;
  value?: React.ReactNode;
}

export interface MetaStripProps {
  items: ReadonlyArray<MetaStripItem>;
  tone?: MetaStripTone;
  valueTone?: MetaStripValueTone;
}

export function MetaStrip({ items, tone = "dim", valueTone = "mute" }: MetaStripProps) {
  if (items.length === 0) return null;
  // Default (mute): the value span carries no modifier and inherits the
  // strip's fg/mute — the markup is unchanged from the approved RFC.
  const valueClass =
    valueTone === "accent"
      ? "ll-meta-strip-value ll-meta-strip-value--accent"
      : "ll-meta-strip-value";
  return (
    <ul className="ll-meta-strip" role="list">
      {items.map((item, i) => {
        const hasValue = item.value !== undefined && item.value !== null;
        return (
          // The facts are static content in reading order, never reordered:
          // the index is a stable key.
          <li className="ll-meta-strip-item" key={i}>
            <Eyebrow tone={tone}>{item.label}</Eyebrow>
            {hasValue ? " " : null}
            {hasValue ? <span className={valueClass}>{item.value}</span> : null}
          </li>
        );
      })}
    </ul>
  );
}
