import { useRef, useState, type ChangeEvent } from "react";

import { urlArchivo } from "../../config/env";
import { useToast } from "../../context/ToastContext";
import candidatoService from "../../services/candidato.service";
import { mensajeError } from "../../utils/errores";

import "../../styles/candidaturas.css";
import "../../styles/estudiante.css";

const TIPO_PERMITIDO = "image/jpeg";
const MAX_BYTES = 2 * 1024 * 1024; // 2 MB, límite del backend

interface Props {
  idCandidato: number;
  nombre: string;
  apellido: string;
  foto?: string | null;
  /** Solo el candidato aprobado, durante la postulación, puede cambiarla. */
  editable: boolean;
  /** Se llama tras subir o quitar la foto, para recargar la candidatura. */
  onCambio: () => void | Promise<void>;
}

/** Foto del candidato con (si es editable) subir, cambiar y quitar.
 *  El backend valida el JPEG, el peso y las dimensiones: si rechaza el
 *  archivo, se muestra su mensaje. */
export function FotoCandidato({ idCandidato, nombre, apellido, foto, editable, onCambio }: Props) {
  const toast = useToast();
  const entrada = useRef<HTMLInputElement>(null);
  const [ocupado, setOcupado] = useState(false);
  // Evita que el navegador muestre la foto anterior si la ruta no cambia.
  const [version, setVersion] = useState(0);

  const ruta = urlArchivo(foto);
  const src = ruta && version > 0 ? `${ruta}?v=${version}` : ruta;
  const iniciales = `${nombre.charAt(0)}${apellido.charAt(0)}`.toUpperCase();

  async function alElegirArchivo(e: ChangeEvent<HTMLInputElement>) {
    const archivo = e.target.files?.[0];
    e.target.value = ""; // permite elegir de nuevo el mismo archivo
    if (!archivo) return;
    if (archivo.type !== TIPO_PERMITIDO) {
      toast.error("La foto debe ser un archivo JPEG (.jpg).");
      return;
    }
    if (archivo.size > MAX_BYTES) {
      toast.error("La foto no puede pesar más de 2 MB.");
      return;
    }
    setOcupado(true);
    try {
      const r = await candidatoService.subirFoto(idCandidato, archivo);
      toast.exito(r.message || "Foto actualizada.");
      setVersion((v) => v + 1);
      await onCambio();
    } catch (err) {
      toast.error(await mensajeError(err, "No se pudo subir la foto."));
    } finally {
      setOcupado(false);
    }
  }

  async function quitar() {
    setOcupado(true);
    try {
      const r = await candidatoService.quitarFoto(idCandidato);
      toast.exito(r.message || "Foto eliminada.");
      setVersion((v) => v + 1);
      await onCambio();
    } catch (err) {
      toast.error(await mensajeError(err, "No se pudo quitar la foto."));
    } finally {
      setOcupado(false);
    }
  }

  return (
    <div className="d-flex align-items-center gap-3 flex-wrap">
      {src ? (
        <img src={src} alt={`Foto de ${nombre} ${apellido}`} className="cand-foto" />
      ) : (
        <span className="cand-foto cand-foto-vacia" aria-hidden="true">{iniciales}</span>
      )}

      {editable ? (
        <div className="d-flex flex-column gap-1">
          <div className="d-flex gap-2 flex-wrap">
            <button type="button" className="btn btn-sm btn-outline-primary" disabled={ocupado} onClick={() => entrada.current?.click()}>
              {ocupado && <span className="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>}
              {src ? "Cambiar foto" : "Subir foto"}
            </button>
            {src && (
              <button type="button" className="btn btn-sm btn-outline-danger" disabled={ocupado} onClick={() => void quitar()}>
                Quitar
              </button>
            )}
          </div>
          <small className="text-muted">Archivo JPEG, máximo 2 MB.</small>
          <input ref={entrada} type="file" accept={TIPO_PERMITIDO} hidden onChange={(e) => void alElegirArchivo(e)} />
        </div>
      ) : (
        !src && <small className="text-muted">Sin foto.</small>
      )}
    </div>
  );
}

export default FotoCandidato;