import { useEffect, useId, useRef, type ReactNode } from "react";

import "../../styles/usuarios.css";

interface ModalProps {
  abierto: boolean;
  titulo: string;
  onCerrar: () => void;
  /** Mientras se guarda: no se puede cerrar con Escape ni clic afuera. */
  bloqueado?: boolean;
  children: ReactNode;
}

/** Ventana modal para formularios (a diferencia de ConfirmDialog, que es
 *  solo para confirmar). El foco va al primer campo SOLO al abrir. */
export function Modal({ abierto, titulo, onCerrar, bloqueado = false, children }: ModalProps) {
  const idTitulo = useId();
  const refDialogo = useRef<HTMLDivElement>(null);
  const refCerrar = useRef(onCerrar);
  const refBloqueado = useRef(bloqueado);

  useEffect(() => {
    refCerrar.current = onCerrar;
    refBloqueado.current = bloqueado;
  });

  useEffect(() => {
    if (!abierto) return;
    refDialogo.current?.querySelector<HTMLElement>("input, select, textarea")?.focus();
    function tecla(e: KeyboardEvent) {
      if (e.key === "Escape" && !refBloqueado.current) refCerrar.current();
    }
    document.addEventListener("keydown", tecla);
    return () => document.removeEventListener("keydown", tecla);
  }, [abierto]);

  if (!abierto) return null;

  return (
    <div
      className="fb-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !bloqueado) onCerrar();
      }}
    >
      <div className="fb-dialog fb-dialog-ancho" ref={refDialogo} role="dialog" aria-modal="true" aria-labelledby={idTitulo}>
        <h5 id={idTitulo} className="fb-dialog-title">{titulo}</h5>
        {children}
      </div>
    </div>
  );
}

export default Modal;