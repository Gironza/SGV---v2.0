import type { ReactNode } from "react";

type BadgeTone = "success" | "warning" | "danger" | "neutral" | "info";

interface BadgeProps {
  children: ReactNode;
  tone?: BadgeTone;
}

const TONE_CLASS: Record<BadgeTone, string> = {
  success: "badge-tone-success",
  warning: "badge-tone-warning",
  danger: "badge-tone-danger",
  neutral: "badge-tone-neutral",
  info: "badge-tone-info",
};

/** Pastilla de estado. Un único componente para no repetir estilos de
 * "Activa/Finalizada/Pendiente/Aprobada/Rechazada" en cada tabla. */
export function Badge({ children, tone = "neutral" }: BadgeProps) {
  return <span className={`badge-pill ${TONE_CLASS[tone]}`}>{children}</span>;
}

export default Badge;
