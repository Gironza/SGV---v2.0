import { useEffect, useState } from "react";

import { useToast } from "../../context/ToastContext";
import candidatoService from "../../services/candidato.service";
import votoService from "../../services/voto.service";
import type { CandidatoOut, EstadoVotoResponse, VotoConfirmadoResponse } from "../../types/votacion";
import Panel from "../ui/Panel";
import Alerta from "../feedback/Alerta";
import Cargando from "../feedback/Cargando";
import EstadoVacio from "../feedback/EstadoVacio";
import ConfirmDialog from "../feedback/ConfirmDialog";
import TarjetaCandidato from "./TarjetaCandidato";
import { descargarArchivo } from "../../utils/descargas";
import { formatearFecha } from "../../utils/fechas";
import { mensajeError } from "../../utils/errores";

import "../../styles/estudiante.css";

type Seleccion = number | "blanco" | null;

/** Tarjetón de votación: candidatos con su información, voto en blanco y
 *  confirmación antes de emitir (el voto es irreversible). */
export function Tarjeton({ idEleccion }: { idEleccion: number }) {
  const toast = useToast();
  const [estado, setEstado] = useState<EstadoVotoResponse | null>(null);
  const [candidatos, setCandidatos] = useState<CandidatoOut[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [seleccion, setSeleccion] = useState<Seleccion>(null);
  const [confirmando, setConfirmando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [recibo, setRecibo] = useState<VotoConfirmadoResponse | null>(null);

  useEffect(() => {
    let activo = true;
    Promise.all([votoService.estado(idEleccion), candidatoService.listarPorEleccion(idEleccion)])
      .then(([est, lista]) => {
        if (!activo) return;
        setEstado(est);
        setCandidatos(lista);
      })
      .catch(async (err) => activo && setError(await mensajeError(err, "No se pudo cargar el tarjetón.")))
      .finally(() => activo && setCargando(false));
    return () => {
      activo = false;
    };
  }, [idEleccion]);

  async function emitirVoto() {
    if (seleccion === null) return;
    setEnviando(true);
    try {
      const r = await votoService.votar(idEleccion, seleccion === "blanco" ? null : seleccion);
      setRecibo(r);
      setEstado((e) => (e ? { ...e, ya_voto: true } : e));
      setConfirmando(false);
      toast.exito(r.message || "Voto registrado.");
    } catch (err) {
      toast.error(await mensajeError(err, "No se pudo registrar el voto."));
      setConfirmando(false);
    } finally {
      setEnviando(false);
    }
  }

  async function certificado() {
    try {
      await descargarArchivo(`/votacion/${idEleccion}/certificado`, undefined, `certificado-voto-${idEleccion}.pdf`);
    } catch (err) {
      toast.error(await mensajeError(err, "No se pudo descargar el certificado."));
    }
  }

  if (cargando) return <Panel title="Tarjetón"><Cargando texto="Cargando tarjetón..." /></Panel>;
  if (error || !estado) return <Panel title="Tarjetón"><Alerta tono="error">{error || "No se pudo cargar el tarjetón."}</Alerta></Panel>;

  // Ya votó (ahora o antes)
  if (estado.ya_voto) {
    return (
      <Panel title="Tu voto">
        <div className="est-voto-ok">
          <i className="fa-solid fa-circle-check"></i>
          <strong>Ya votaste en esta elección</strong>
          {recibo && (
            <span>
              Código del certificado: <code>{recibo.codigo_certificado}</code> · {formatearFecha(recibo.fecha_voto)}
            </span>
          )}
          <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => void certificado()}>
            <i className="fa-solid fa-file-pdf me-2"></i>Descargar certificado
          </button>
        </div>
      </Panel>
    );
  }

  if (!estado.curso_habilitado) {
    return (
      <Panel title="Tarjetón">
        <Alerta tono="aviso">Tu curso no está habilitado para votar en esta elección.</Alerta>
      </Panel>
    );
  }

  const elegido = typeof seleccion === "number" ? candidatos.find((c) => c.id_candidato === seleccion) : undefined;
  const textoElegido =
    seleccion === "blanco" ? "voto en blanco" : elegido ? `${elegido.nombre} ${elegido.apellido}` : "";

  return (
    <Panel title="Tarjetón">
      <p className="est-ayuda">Elige un candidato o el voto en blanco. Antes de emitir tu voto te pediremos confirmación.</p>

      {candidatos.length === 0 ? (
        <EstadoVacio icono="fa-solid fa-user-slash" titulo="No hay candidatos en esta elección" descripcion="Aún puedes votar en blanco." />
      ) : (
        <div className="est-cand-grid">
          {candidatos.map((c) => (
            <TarjetaCandidato
              key={c.id_candidato}
              c={c}
              seleccionable
              seleccionado={seleccion === c.id_candidato}
              onSeleccionar={() => setSeleccion(c.id_candidato)}
            />
          ))}
        </div>
      )}

      <button
        type="button"
        className={`est-blanco${seleccion === "blanco" ? " is-on" : ""}`}
        aria-pressed={seleccion === "blanco"}
        onClick={() => setSeleccion("blanco")}
      >
        <i className={`fa-solid ${seleccion === "blanco" ? "fa-circle-check" : "fa-circle"} me-2`}></i>
        Voto en blanco
      </button>

      <div className="est-barra-voto">
        <span>{seleccion === null ? "Aún no has elegido una opción." : <>Elegiste: <strong>{textoElegido}</strong></>}</span>
        <button type="button" className="btn-accent btn-accent-green border-0" disabled={seleccion === null} onClick={() => setConfirmando(true)}>
          Emitir voto
        </button>
      </div>

      <ConfirmDialog
        abierto={confirmando}
        titulo="Confirmar tu voto"
        mensaje={<>Vas a emitir tu voto por <strong>{textoElegido}</strong>. Esta acción no se puede deshacer.</>}
        textoConfirmar="Confirmar voto"
        cargando={enviando}
        onConfirmar={() => void emitirVoto()}
        onCancelar={() => setConfirmando(false)}
      />
    </Panel>
  );
}

export default Tarjeton;