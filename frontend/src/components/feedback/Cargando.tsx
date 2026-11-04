interface CargandoProps {
  texto?: string;
}

/** Estado de carga centrado para paneles y tablas. */
export function Cargando({ texto = "Cargando..." }: CargandoProps) {
  return (
    <div className="fb-estado" role="status" aria-live="polite">
      <span className="spinner-border spinner-border-sm" aria-hidden="true"></span>
      <span>{texto}</span>
    </div>
  );
}

export default Cargando;