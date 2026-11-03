import type { Rol } from "../types";

export interface NavItem {
  key: string;
  label: string;
  icon: string; // clase FontAwesome (versión gratis)
  path: string;
  /** true = solo activo en la ruta exacta (para el inicio de cada panel). */
  end?: boolean;
}

// Cada ítem tiene su propia ruta. Las páginas aún no construidas muestran
// un placeholder hasta su etapa correspondiente.
export const NAV_BY_ROLE: Record<Rol, NavItem[]> = {
  admin: [
    { key: "dashboard", label: "Dashboard", icon: "fa-solid fa-chart-line", path: "/admin", end: true },
    { key: "elecciones", label: "Elecciones", icon: "fa-solid fa-check-to-slot", path: "/admin/elecciones" },
    { key: "usuarios", label: "Usuarios", icon: "fa-solid fa-users", path: "/admin/usuarios" },
    { key: "resultados", label: "Resultados", icon: "fa-solid fa-chart-pie", path: "/admin/resultados" },
    { key: "institucion", label: "Institución", icon: "fa-solid fa-building-columns", path: "/admin/institucion" },
  ],
  docente: [
    { key: "inicio", label: "Inicio", icon: "fa-solid fa-house", path: "/docente", end: true },
    { key: "elecciones", label: "Elecciones", icon: "fa-solid fa-check-to-slot", path: "/docente/elecciones" },
    { key: "estudiantes", label: "Estudiantes", icon: "fa-solid fa-user-graduate", path: "/docente/estudiantes" },
    { key: "resultados", label: "Resultados", icon: "fa-solid fa-chart-pie", path: "/docente/resultados" },
  ],
  estudiante: [
    { key: "inicio", label: "Inicio", icon: "fa-solid fa-house", path: "/estudiante", end: true },
    { key: "elecciones", label: "Elecciones", icon: "fa-solid fa-check-to-slot", path: "/estudiante/elecciones" },
    { key: "historial", label: "Mi historial", icon: "fa-solid fa-clock-rotate-left", path: "/estudiante/historial" },
  ],
};

export const ROL_ACCENT: Record<Rol, "violet" | "green" | "blue"> = {
  admin: "violet",
  docente: "green",
  estudiante: "blue",
};

/** Página de inicio de cada rol. */
export const ROL_HOME: Record<Rol, string> = {
  admin: "/admin",
  docente: "/docente",
  estudiante: "/estudiante",
};

export const RUTA_CUENTA = "/cuenta";