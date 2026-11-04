import { useEffect, useId, useRef, type ReactNode } from "react";

interface ConfirmDialogProps {
  abierto: boolean;
  titulo: string;
  /** Texto o contenido explicativo. */
  mensaje?: ReactNode;
  textoConfirmar?: string;
  textoCancelar?: string;
  /** "danger" para acciones destructivas (eliminar, rechazar...). */
  tono?: "primary" | "danger" | "warning";
  /** Mientras la acción async corre: deshabilita botones y muestra spinner. */
  cargando?: boolean;
  onConfirmar: () => void;
  onCancelar: () => void;
  /** Contenido extra (ej. un campo de fecha_fin al reabrir una elección). */
  children?: ReactNode;
}

/** Reemplaza confirm()/alert() del navegador. Es controlado: la página
 *  decide cuándo se abre y qué pasa al confirmar. Ejemplo:
 *
 *    <ConfirmDialog
 *      abierto={confirmarEliminar}
 *      titulo="Eliminar elección"
 *      mensaje="Esta acción no se puede deshacer."
 *      tono="danger"
 *      textoConfirmar="Eliminar"
 *      cargando={eliminando}
 *      onConfirmar={handleEliminar}
 *      onCancelar={() => setConfirmarEliminar(false)}
 *    />
 */
export function ConfirmDialog({
  abierto,
  titulo,
  mensaje,
  textoConfirmar = "Confirmar",
  textoCancelar = "Cancelar",
  tono = "primary",
  cargando = false,
  onConfirmar,
  onCancelar,
  children,
}: ConfirmDialogProps) {
  const idTitulo = useId();
  const refDialogo = useRef<HTMLDivElement>(null);
  const refCancelar = useRef<HTMLButtonElement>(null);

  // Siempre la versión más reciente de las props, sin re-ejecutar el efecto:
  // si el efecto dependiera de onCancelar (una función nueva en cada render),
  // el foco volvería a "Cancelar" con cada letra escrita en el diálogo.
  const refOnCancelar = useRef(onCancelar);
  const refCargando = useRef(cargando);
  useEffect(() => {
    refOnCancelar.current = onCancelar;
    refCargando.current = cargando;
  });

  // Solo al ABRIR: foco en el primer campo del diálogo si lo hay; si no, en
  // "Cancelar" (un Enter accidental nunca confirma algo destructivo).
  // Escape cierra, salvo mientras carga.
  useEffect(() => {
    if (!abierto) return;
    const campo = refDialogo.current?.querySelector<HTMLElement>("textarea, input, select");
    (campo ?? refCancelar.current)?.focus();
    function tecla(e: KeyboardEvent) {
      if (e.key === "Escape" && !refCargando.current) refOnCancelar.current();
    }
    document.addEventListener("keydown", tecla);
    return () => document.removeEventListener("keydown", tecla);
  }, [abierto]);

  if (!abierto) return null;

  return (
    <div
      className="fb-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !cargando) onCancelar();
      }}
    >
      <div className="fb-dialog" ref={refDialogo} role="dialog" aria-modal="true" aria-labelledby={idTitulo}>
        <h5 id={idTitulo} className="fb-dialog-title">{titulo}</h5>
        {mensaje && <div className="fb-dialog-body">{mensaje}</div>}
        {children}
        <div className="fb-dialog-actions">
          <button
            type="button"
            ref={refCancelar}
            className="fb-btn fb-btn-ghost"
            onClick={onCancelar}
            disabled={cargando}
          >
            {textoCancelar}
          </button>
          <button
            type="button"
            className={`fb-btn fb-btn-${tono}`}
            onClick={onConfirmar}
            disabled={cargando}
          >
            {cargando && <span className="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>}
            {textoConfirmar}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmDialog;