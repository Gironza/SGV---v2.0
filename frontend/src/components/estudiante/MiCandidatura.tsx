import { useCallback, useEffect, useState } from "react";
import { isAxiosError } from "axios";

import { useToast } from "../../context/ToastContext";
import candidatoService from "../../services/candidato.service";
import { ESTADO_CANDIDATURA, type CandidaturaDetalleOut } from "../../types/candidatura";
import Panel from "../ui/Panel";
import Badge from "../ui/Badge";
import Alerta from "../feedback/Alerta";
import Cargando from "../feedback/Cargando";
import ConfirmDialog from "../feedback/ConfirmDialog";
import FotoCandidato from "./FotoCandidato";
import EditorPropuesta from "./EditorPropuesta";
import { infoEstadoCandidatura } from "../../utils/candidatura";
import { mensajeError } from "../../utils/errores";
import type { Fase } from "../../utils/etapa";

import "../../styles/estudiante.css";

interface Props {
  idEleccion: number;
  /** Etapa en la que se muestra el bloque. */
  fase: Extract<Fase, "postulacion" | "moderacion">;
  puedePostular: boolean;
}

/** Bloque "Tu candidatura" del detalle de la elección.
 *  - Postularse: solo en postulación y con curso habilitado.
 *  - Propuesta y foto: solo si la candidatura está aprobada y la etapa es
 *    postulación (en moderación quedan en solo lectura).
 *  - Retiro: solo candidaturas aprobadas, hasta antes de la votación; es una
 *    solicitud que resuelve un admin o docente. */
export function MiCandidatura({ idEleccion, fase, puedePostular }: Props) {
  const toast = useToast();
  const [mia, setMia] = useState<CandidaturaDetalleOut | null>(null);
  const [cargando, setCargando] = useState(true);
  const [ocupado, setOcupado] = useState(false);
  const [confirmarRetiro, setConfirmarRetiro] = useState(false);

  const enPostulacion = fase === "postulacion";

  const cargar = useCallback(async () => {
    try {
      setMia(await candidatoService.miCandidatura(idEleccion));
    } catch (err) {
      // 404 = todavía no me he postulado.
      if (isAxiosError(err) && err.response?.status === 404) setMia(null);
      else toast.error(await mensajeError(err, "No se pudo cargar tu candidatura."));
    } finally {
      setCargando(false);
    }
  }, [idEleccion, toast]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  async function postularme() {
    setOcupado(true);
    try {
      const r = await candidatoService.postularme(idEleccion);
      toast.exito(r.message || "Te postulaste correctamente.");
      await cargar();
    } catch (err) {
      toast.error(await mensajeError(err, "No se pudo registrar tu postulación."));
    } finally {
      setOcupado(false);
    }
  }

  async function solicitarRetiro() {
    if (!mia) return;
    setOcupado(true);
    try {
      const r = await candidatoService.solicitarRetiro(mia.id_candidato);
      toast.exito(r.message || "Solicitud de retiro enviada.");
      setConfirmarRetiro(false);
      await cargar();
    } catch (err) {
      toast.error(await mensajeError(err, "No se pudo solicitar el retiro."));
      setConfirmarRetiro(false);
    } finally {
      setOcupado(false);
    }
  }

  if (cargando) return <Panel title="Tu candidatura"><Cargando /></Panel>;

  // Sin candidatura
  if (!mia) {
    if (!enPostulacion) return null; // en moderación no tiene sentido mostrarlo
    return (
      <Panel title="Tu candidatura">
        {puedePostular ? (
          <div className="est-bloque">
            <p>Aún no te has postulado a esta elección. La postulación es de un clic y luego será revisada.</p>
            <div>
              <button type="button" className="btn-accent btn-accent-green border-0" disabled={ocupado} onClick={() => void postularme()}>
                {ocupado && <span className="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>}
                Postularme
              </button>
            </div>
          </div>
        ) : (
          <Alerta tono="aviso">Tu curso no está habilitado para postularse en esta elección.</Alerta>
        )}
      </Panel>
    );
  }

  // Con candidatura
  const estado = mia.id_estado_candidatura;
  const { etiqueta, tono } = infoEstadoCandidatura(estado, mia.nombre_estado);
  const aprobada = estado === ESTADO_CANDIDATURA.APROBADA;
  const mostrarContenido = aprobada || estado === ESTADO_CANDIDATURA.RETIRO_SOLICITADO;
  const puedeEditar = aprobada && enPostulacion;

  return (
    <Panel title="Tu candidatura" action={<Badge tone={tono}>{etiqueta}</Badge>}>
      <div className="est-bloque">
        {estado === ESTADO_CANDIDATURA.PENDIENTE && (
          <div className="cand-aviso">
            Tu postulación está pendiente de revisión. Cuando la aprueben podrás cargar tu propuesta y tu foto.
          </div>
        )}

        {mostrarContenido && (
          <>
            <FotoCandidato
              idCandidato={mia.id_candidato}
              nombre={mia.nombre}
              apellido={mia.apellido}
              foto={mia.foto}
              editable={puedeEditar}
              onCambio={cargar}
            />
            <EditorPropuesta
              idCandidato={mia.id_candidato}
              propuesta={mia.propuesta}
              editable={puedeEditar}
              onGuardada={cargar}
            />
            {aprobada && !enPostulacion && (
              <div className="cand-aviso">
                La postulación ya cerró: tu candidatura está en moderación y ya no se puede editar.
              </div>
            )}
          </>
        )}

        {mia.observaciones && (
          <div className="cand-obs">
            <span>Observaciones del revisor</span>
            {mia.observaciones}
          </div>
        )}

        {estado === ESTADO_CANDIDATURA.RETIRO_SOLICITADO && (
          <div className="cand-aviso">Solicitaste retirarte. Queda pendiente la respuesta del revisor.</div>
        )}

        {aprobada && (
          <div>
            <button type="button" className="btn btn-sm btn-outline-danger" disabled={ocupado} onClick={() => setConfirmarRetiro(true)}>
              Solicitar retiro
            </button>
          </div>
        )}
      </div>

      <ConfirmDialog
        abierto={confirmarRetiro}
        titulo="Solicitar retiro"
        mensaje="Enviarás una solicitud para retirar tu candidatura. Un revisor deberá aprobarla."
        tono="danger"
        textoConfirmar="Solicitar retiro"
        cargando={ocupado}
        onConfirmar={() => void solicitarRetiro()}
        onCancelar={() => setConfirmarRetiro(false)}
      />
    </Panel>
  );
}

export default MiCandidatura;