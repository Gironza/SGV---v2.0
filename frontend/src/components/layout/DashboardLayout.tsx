import type { ReactNode } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { NAV_BY_ROLE, ROL_ACCENT } from "../../config/navigation";
import type { Rol } from "../../types";

interface DashboardLayoutProps {
  rol: Rol;
  titulo: string;
  subtitulo: string;
  usuario: { nombre: string; correo: string; avatarUrl?: string };
  institucion?: string;
  notificaciones?: number;
  children: ReactNode;
}

/**
 * Punto único de entrada para armar cualquier panel del sistema.
 *
 * Antes: Admin.tsx, Docente.tsx y Estudiante.tsx repetían el mismo <div className="dashboard">
 * con sidebar + topbar escritos a mano, y Docente.tsx usaba una estructura
 * de página completamente distinta (sin sidebar). Ahora los 4 roles comparten
 * el mismo esqueleto visual y solo cambian su `rol`, título y contenido.
 *
 * Uso:
 *   <DashboardLayout rol="docente" titulo="Panel Docente" ...>
 *     ...contenido propio del panel...
 *   </DashboardLayout>
 */
export function DashboardLayout({
  rol,
  titulo,
  subtitulo,
  usuario,
  institucion,
  notificaciones,
  children,
}: DashboardLayoutProps) {
  return (
    <div className="app-shell">
      <Sidebar items={NAV_BY_ROLE[rol]} accent={ROL_ACCENT[rol]} rol={rol} />
      <div className="app-main">
        <Topbar
          titulo={titulo}
          subtitulo={subtitulo}
          institucion={institucion}
          notificaciones={notificaciones}
          usuario={usuario}
        />
        <div className="app-content">{children}</div>
      </div>
    </div>
  );
}

export default DashboardLayout;
