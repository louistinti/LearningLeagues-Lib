import React from "react";

// API is RFC §3 exactly (Sigil.rfc.md, approved 2026-09-26). One slot and
// nothing else: no label (§7 Q11), no size, no tone, no ornament, no `as`,
// no className — the parent grid sizes the square. Decorative by
// construction: aria-hidden is unconditional (§4.1, §4.3); the art is the
// page's, rendered inside the slot square (§3.2); nothing interactive (§4.2).
export interface SigilProps {
  children: React.ReactNode;
}

export function Sigil({ children }: SigilProps) {
  return (
    <div className="ll-sigil" aria-hidden="true">
      <div className="ll-sigil-art">{children}</div>
    </div>
  );
}
