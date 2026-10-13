import type { ReactNode } from "react";

interface AccentButtonProps {
  children: ReactNode;
  tone?: "violet" | "green" | "blue" | "orange";
  onClick?: () => void;
  type?: "button" | "submit";
}

export function AccentButton({ children, tone = "violet", onClick, type = "button" }: AccentButtonProps) {
  return (
    <button type={type} className={`btn-accent btn-accent-${tone}`} onClick={onClick}>
      {children}
    </button>
  );
}

export default AccentButton;
