import React from "react";

// API is RFC §3 exactly (Button.rfc.md, approved 2026-08-14; `current` added
// by the §7 follow-up of 2026-09-16). Hover and focus are CSS states in
// button.css, never props. With `href` the component renders a native <a>
// with identical chrome — link semantics kept deliberately (§4.1). `current`
// emits aria-current="page" on either element: the filled visual in
// button.css keys on that attribute, so the state cannot be shown without
// being announced.
export interface ButtonProps {
  variant?: "primary" | "secondary";
  href?: string;
  type?: "button" | "submit" | "reset";
  current?: boolean;
  onClick?: (e: React.MouseEvent) => void;
  children: React.ReactNode;
}

export function Button({
  variant = "primary",
  href,
  type = "button",
  current = false,
  onClick,
  children,
}: ButtonProps) {
  const className = `ll-button ll-button--${variant}`;
  const ariaCurrent = current ? "page" : undefined;
  if (href !== undefined) {
    return (
      <a className={className} href={href} aria-current={ariaCurrent} onClick={onClick}>
        {children}
      </a>
    );
  }
  return (
    <button className={className} type={type} aria-current={ariaCurrent} onClick={onClick}>
      {children}
    </button>
  );
}
