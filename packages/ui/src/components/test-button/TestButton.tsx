import React from "react";

export interface TestButtonProps {
  children: React.ReactNode;
}

export function TestButton({ children }: TestButtonProps) {
  return (
    <div
      className="component-test-button"
      style={{ color: "#ff0000", background: "var(ll-background)" }}
    >
      {children}
    </div>
  );
}
