import type { ReactNode } from "react";

interface EstadoVacioProps {
  titulo: string;
  descripcion?: string;
  /** Clase FontAwesome, ej. "fa-solid fa-inbox". */
  icono?: string;
  /** Botón o enlace de acción opcional (ej. "Crear elección"). */
  children?: ReactNode;
}

/** Cuando una lista o tabla no tiene datos. */
export function EstadoVacio({ titulo, descripcion, icono = "fa-solid fa-inbox", children }: EstadoVacioProps) {
  return (
    <div className="fb-estado fb-vacio">
      <i className={icono} aria-hidden="true"></i>
      <strong>{titulo}</strong>
      {descripcion && <span>{descripcion}</span>}
      {children}
    </div>
  );
}

export default EstadoVacio;