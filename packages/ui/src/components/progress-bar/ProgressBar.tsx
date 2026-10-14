import React from "react";

// API is RFC §3 exactly (ProgressBar.rfc.md, approved 2026-10-13): value,
// max, valueText (required — §7 checkpoint) and exactly one of label /
// labelledBy (§7 Q5). No size, no tone, no decorative mode, no animation, no
// min, no as, no className, no children (§7 Q2–Q5). Always announced:
// role="progressbar" with every aria-value* (§4.1); nothing interactive
// (§4.2).
//
// The fill is drawn as an aria-hidden <svg> whose <rect> carries the length
// as a width ATTRIBUTE (RFC §3.4, §3.5 point 1): the docs page renders the
// examples as static markup, where an inline width style attribute is a static
// style the token lint refuses — an SVG attribute is not a style, and the
// rect is a drawn mark the docs smoke gate counts as content (point 2).
interface ProgressBarBase {
  value: number;
  max: number;
  valueText: string;
}
export type ProgressBarProps = ProgressBarBase &
  ({ label: string; labelledBy?: never } | { labelledBy: string; label?: never });

export function ProgressBar({ value, max, valueText, label, labelledBy }: ProgressBarProps) {
  // Clamp to [0, max] for the fill and aria-valuenow alike (§3.4). A
  // degenerate max (≤ 0 or non-finite) or a non-finite value draws an empty
  // fill and announces 0 (§3.5 point 5, the RFC's first proposal).
  const total = Number.isFinite(max) && max > 0 ? max : 0;
  const now = total > 0 && Number.isFinite(value) ? Math.min(Math.max(value, 0), total) : 0;
  const percent = total > 0 ? (now * 100) / total : 0;
  return (
    <div
      className="ll-progress-bar"
      role="progressbar"
      aria-label={label}
      aria-labelledby={labelledBy}
      aria-valuemin={0}
      aria-valuemax={total}
      aria-valuenow={now}
      aria-valuetext={valueText}
    >
      <svg aria-hidden="true">
        <rect className="ll-progress-bar-fill" width={`${percent}%`} height="100%" />
      </svg>
    </div>
  );
}
