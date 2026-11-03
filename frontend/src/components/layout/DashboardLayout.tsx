import type { ReactNode } from "react";
import { useTituloPagina } from "../../context/PaginaContext";

// COMPATIBILIDAD TEMPORAL. El shell (sidebar + header) ahora lo da
// AppLayout. Este componente solo existe para que Admin.tsx, Docente.tsx
// y Estudiante.tsx sigan funcionando hasta que se reemplacen por las
// páginas nuevas: pasa su título al header y renderiza el contenido.
// Se elimina cuando ninguna página lo importe.
interface DashboardLayoutProps {
  titulo: string;
  subtitulo?: string;
  children: ReactNode;
  // Props antiguas: se aceptan para no romper el tipado, ya no se usan.
  rol?: unknown;
  usuario?: unknown;
  institucion?: unknown;
  notificaciones?: unknown;
}

export function DashboardLayout({ titulo, subtitulo, children }: DashboardLayoutProps) {
  useTituloPagina(titulo, subtitulo);
  return <>{children}</>;
}

export default DashboardLayout;