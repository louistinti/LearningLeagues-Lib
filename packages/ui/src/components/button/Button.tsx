import React from "react";

// API is RFC §3 exactly (Button.rfc.md, approved 2026-08-14). Hover and focus
// are CSS states in button.css, never props. With `href` the component renders
// a native <a> with identical chrome — link semantics kept deliberately (§4.1).
export interface ButtonProps {
  variant?: "primary" | "secondary";
  href?: string;
  type?: "button" | "submit" | "reset";
  onClick?: (e: React.MouseEvent) => void;
  children: React.ReactNode;
}

export function Button({
  variant = "primary",
  href,
  type = "button",
  onClick,
  children,
}: ButtonProps) {
  const className = `ll-button ll-button--${variant}`;
  if (href !== undefined) {
    return (
      <a className={className} href={href} onClick={onClick}>
        {children}
      </a>
    );
  }
  return (
    <button className={className} type={type} onClick={onClick}>
      {children}
    </button>
  );
}
