import React from "react";

// API is RFC §3 exactly (SectionHead.rfc.md, approved 2026-10-13). One
// layout, no variant, no state (§7 Q1): the number in its own column beside
// an h2 title and an optional lede, the title on the number's baseline; under
// --ll-breakpoint-md the number and title share one row and the lede runs
// full width below (§7 adoption-checkpoint row, 2B / 5B — CSS only; the body
// div stays bare: it is display: contents there). `num` is required and rendered verbatim,
// hidden from assistive technology unconditionally (§7 Q2, Q9) — it sits
// outside the heading, so the h2's accessible name is the title alone. The
// heading is always an h2 (§7 Q10); `id` goes on the h2, never on the root
// (§3.1). `lede` omitted → no <p> at all (§7 Q11). Not interactive (§4.2).
export interface SectionHeadProps {
  num: string;
  title: React.ReactNode;
  lede?: React.ReactNode;
  id?: string;
}

export function SectionHead({ num, title, lede, id }: SectionHeadProps) {
  return (
    <div className="ll-section-head">
      <span className="ll-section-head-num" aria-hidden="true">
        {num}
      </span>
      <div className="ll-section-head-body">
        <h2 className="ll-section-head-title" id={id}>
          {title}
        </h2>
        {lede !== undefined && lede !== null && lede !== false && lede !== "" ? (
          <p className="ll-section-head-lede">{lede}</p>
        ) : null}
      </div>
    </div>
  );
}
