import { useEffect, useId, useState } from "react";

import { useToast } from "../../context/ToastContext";
import candidatoService from "../../services/candidato.service";
import { mensajeError } from "../../utils/errores";

import "../../styles/estudiante.css";

const MAX = 2000; // límite del backend

interface Props {
  idCandidato: number;
  propuesta?: string | null;
  /** Solo el candidato aprobado, durante la postulación, puede editarla. */
  editable: boolean;
  /** Se llama tras guardar, para recargar la candidatura. */
  onGuardada: () => void | Promise<void>;
}

/** Propuesta del candidato: texto de solo lectura o formulario de edición. */
export function EditorPropuesta({ idCandidato, propuesta, editable, onGuardada }: Props) {
  const toast = useToast();
  const idCampo = useId();
  const [texto, setTexto] = useState(propuesta ?? "");
  const [guardando, setGuardando] = useState(false);

  // Si la candidatura se recarga, el campo refleja lo guardado.
  useEffect(() => {
    setTexto(propuesta ?? "");
  }, [propuesta]);

  if (!editable) {
    return (
      <div>
        <span className="d-block fw-semibold mb-1">Tu propuesta</span>
        <p className={`est-cand-propuesta${propuesta ? "" : " is-vacia"}`}>
          {propuesta || "Todavía no has cargado tu propuesta."}
        </p>
      </div>
    );
  }

  const limpio = texto.trim();
  const cambiado = limpio !== (propuesta ?? "").trim();
  const valida = limpio.length >= 1 && limpio.length <= MAX;

  async function guardar() {
    setGuardando(true);
    try {
      const r = await candidatoService.editarPropuesta(idCandidato, limpio);
      toast.exito(r.message || "Propuesta guardada.");
      await onGuardada();
    } catch (err) {
      toast.error(await mensajeError(err, "No se pudo guardar la propuesta."));
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div>
      <label htmlFor={idCampo} className="form-label fw-semibold">Tu propuesta</label>
      <textarea
        id={idCampo}
        className="form-control"
        rows={6}
        maxLength={MAX}
        value={texto}
        disabled={guardando}
        placeholder="Cuéntales a tus compañeros qué propones."
        onChange={(e) => setTexto(e.target.value)}
      />
      <div className="d-flex justify-content-between align-items-center gap-2 flex-wrap mt-2">
        <small className="text-muted">{texto.length}/{MAX}</small>
        <button type="button" className="btn btn-sm btn-success" disabled={!cambiado || !valida || guardando} onClick={() => void guardar()}>
          {guardando && <span className="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>}
          Guardar propuesta
        </button>
      </div>
    </div>
  );
}

export default EditorPropuesta;