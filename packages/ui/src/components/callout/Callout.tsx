import React from "react";

// API is RFC §3 exactly (Callout.rfc.md, approved 2026-09-11). Key / Pro /
// Trap are editorial types (§7 Q6 — `variant` stays reserved for visual
// styles); `type` is required with no fallback (§7 Q5): an unknown type is a
// compile error, never a silent Pro tip. The tag label comes from the type,
// never from a prop. The optional title is a fixed <h3> under the section's
// <h2> (§7 Q7). The glyph is decorative (§7 Q3): aria-hidden, the label
// carries the meaning. Not interactive: no states.
export type CalloutType = "key" | "pro" | "trap";

export interface CalloutProps {
  type: CalloutType;
  title?: string;
  children: React.ReactNode;
}

const LABELS: Record<CalloutType, string> = {
  key: "Key concept",
  pro: "Pro tip",
  trap: "Trap",
};

export function Callout({ type, title, children }: CalloutProps) {
  return (
    <article className={`ll-callout ll-callout--${type}`}>
      <span className="ll-callout-tag">
        <i className="ll-callout-glyph" aria-hidden="true"></i>
        {LABELS[type]}
      </span>
      {title ? <h3 className="ll-callout-title">{title}</h3> : null}
      <div className="ll-callout-body">{children}</div>
    </article>
  );
}
