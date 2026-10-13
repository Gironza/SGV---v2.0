import type { Rol } from "../types";

export interface NavItem {
  key: string;
  label: string;
  icon: string; // clase FontAwesome
  path: string;
}

// Un solo lugar para definir qué ve cada rol en su sidebar.
// IMPORTANTE: por ahora cada rol solo tiene UNA ruta realmente
// implementada (el dashboard). Los demás ítems quedan aquí como
// mapa de navegación "objetivo" para cuando existan esas páginas/
// endpoints — no son enlaces rotos por descuido, es a propósito,
// para que el sidebar coincida con el mockup mientras se construye
// el resto del sistema.
export const NAV_BY_ROLE: Record<Rol, NavItem[]> = {
  admin: [
    { key: "dashboard", label: "Dashboard", icon: "fa-solid fa-chart-line", path: "/admin" },
    { key: "votaciones", label: "Votaciones", icon: "fa-solid fa-box-ballot", path: "/admin" },
    { key: "usuarios", label: "Usuarios", icon: "fa-solid fa-users", path: "/admin" },
    { key: "resultados", label: "Resultados", icon: "fa-solid fa-chart-pie", path: "/admin" },
  ],
  docente: [
    { key: "inicio", label: "Inicio", icon: "fa-solid fa-house", path: "/docente" },
    { key: "votaciones", label: "Votaciones", icon: "fa-solid fa-box-ballot", path: "/docente" },
    { key: "candidaturas", label: "Candidaturas", icon: "fa-solid fa-id-card", path: "/docente" },
  ],
  estudiante: [
    { key: "inicio", label: "Inicio", icon: "fa-solid fa-house", path: "/estudiante" },
    { key: "votaciones", label: "Mis votaciones", icon: "fa-solid fa-box-ballot", path: "/estudiante" },
  ],
};

export const ROL_ACCENT: Record<Rol, "violet" | "green" | "blue"> = {
  admin: "violet",
  docente: "green",
  estudiante: "blue",
};
