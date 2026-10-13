import type { ReactNode } from "react";

interface PanelProps {
  title: string;
  action?: ReactNode; // ej: botón "Ver todas" o "Agregar usuario"
  children: ReactNode;
  className?: string;
}

/** Caja blanca con encabezado, usada para envolver tablas, gráficos y
 * listas en todos los paneles (antes era .card / .table-box / .chart-box
 * repetidos con marcados ligeramente distintos). */
export function Panel({ title, action, children, className = "" }: PanelProps) {
  return (
    <div className={`panel-box ${className}`}>
      <div className="panel-box-header">
        <h4>{title}</h4>
        {action}
      </div>
      <div className="panel-box-body">{children}</div>
    </div>
  );
}

export default Panel;
