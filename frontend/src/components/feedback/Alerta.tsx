import type { ReactNode } from "react";

type Tono = "exito" | "error" | "aviso" | "info";

const CLASE: Record<Tono, string> = {
  exito: "alert-success",
  error: "alert-danger",
  aviso: "alert-warning",
  info: "alert-info",
};

interface AlertaProps {
  tono?: Tono;
  children: ReactNode;
  /** Si se pasa, aparece una "x" para cerrarla. */
  onCerrar?: () => void;
}

/** Mensaje en línea (dentro de un formulario o panel). Para avisos
 *  momentáneos de éxito/error tras una acción usa useToast(). */
export function Alerta({ tono = "info", children, onCerrar }: AlertaProps) {
  return (
    <div
      className={`alert ${CLASE[tono]} d-flex justify-content-between align-items-start gap-3`}
      role={tono === "error" ? "alert" : "status"}
    >
      <div>{children}</div>
      {onCerrar && (
        <button type="button" className="btn-close" aria-label="Cerrar" onClick={onCerrar}></button>
      )}
    </div>
  );
}

export default Alerta;