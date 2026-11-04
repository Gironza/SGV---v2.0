import { useRef, useState } from "react";

import { useToast } from "../../context/ToastContext";
import usuarioService from "../../services/usuario.service";
import type { CargaMasivaResponse } from "../../types/usuario";
import Modal from "../feedback/Modal";
import Alerta from "../feedback/Alerta";
import { extraerErrorCarga, type ErrorCarga } from "../../utils/cargaMasiva";
import { mensajeError } from "../../utils/errores";

import "../../styles/usuarios.css";

interface Props {
  abierto: boolean;
  onCerrar: () => void;
  /** Se llama tras una carga exitosa para recargar el listado. */
  onCompletada: () => void;
}

/** Carga masiva de estudiantes desde un CSV, con plantilla y tabla de
 *  errores por fila. */
export function CargaMasivaUsuarios({ abierto, onCerrar, onCompletada }: Props) {
  const toast = useToast();
  const refInput = useRef<HTMLInputElement>(null);
  const [archivo, setArchivo] = useState<File | null>(null);
  const [subiendo, setSubiendo] = useState(false);
  const [resultado, setResultado] = useState<CargaMasivaResponse | null>(null);
  const [errorCarga, setErrorCarga] = useState<ErrorCarga | null>(null);

  function cerrar() {
    setArchivo(null);
    setResultado(null);
    setErrorCarga(null);
    onCerrar();
  }

  async function plantilla() {
    try {
      await usuarioService.descargarPlantilla();
    } catch (err) {
      toast.error(await mensajeError(err, "No se pudo descargar la plantilla."));
    }
  }

  async function subir() {
    if (!archivo) return;
    setSubiendo(true);
    setErrorCarga(null);
    setResultado(null);
    try {
      const r = await usuarioService.cargaMasiva(archivo);
      setResultado(r);
      toast.exito(r.message || `${r.creados} usuarios creados.`);
      onCompletada();
    } catch (err) {
      setErrorCarga(extraerErrorCarga(err));
    } finally {
      setSubiendo(false);
    }
  }

  return (
    <Modal abierto={abierto} titulo="Carga masiva de estudiantes" onCerrar={cerrar} bloqueado={subiendo}>
      <div className="usr-form">
        <p className="usr-carga-ayuda">
          Sube un archivo <strong>CSV</strong> con los estudiantes. Descarga la plantilla para ver las columnas exactas.
        </p>

        <div>
          <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => void plantilla()}>
            <i className="fa-solid fa-file-csv me-2"></i>Descargar plantilla
          </button>
        </div>

        <div className="form-campo">
          <label htmlFor="usr-csv">Archivo CSV</label>
          <input
            id="usr-csv"
            ref={refInput}
            type="file"
            accept=".csv,text/csv"
            className="form-control"
            disabled={subiendo}
            onChange={(e) => {
              setArchivo(e.target.files?.[0] ?? null);
              setResultado(null);
              setErrorCarga(null);
            }}
          />
        </div>

        {resultado && (
          <Alerta tono="exito">
            <strong>{resultado.creados}</strong> {resultado.creados === 1 ? "usuario creado" : "usuarios creados"} en{" "}
            {resultado.duracion_segundos.toLocaleString("es-CO", { maximumFractionDigits: 2 })} s.
          </Alerta>
        )}

        {errorCarga && (
          <>
            <Alerta tono="error">{errorCarga.mensaje}</Alerta>
            {errorCarga.filas.length > 0 && (
              <div className="usr-errores">
                <table className="data-table">
                  <thead>
                    <tr><th>Fila</th><th>Error</th></tr>
                  </thead>
                  <tbody>
                    {errorCarga.filas.map((f, i) => (
                      <tr key={i}>
                        <td>{f.fila ?? "—"}</td>
                        <td>{f.mensaje}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        <div className="form-acciones">
          <button type="button" className="fb-btn fb-btn-ghost" onClick={cerrar} disabled={subiendo}>
            {resultado ? "Cerrar" : "Cancelar"}
          </button>
          <button type="button" className="fb-btn fb-btn-primary" disabled={!archivo || subiendo || resultado !== null} onClick={() => void subir()}>
            {subiendo && <span className="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>}
            Subir archivo
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default CargaMasivaUsuarios;