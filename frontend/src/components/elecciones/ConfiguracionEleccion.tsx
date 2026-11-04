import { useEffect, useState } from "react";

import { useToast } from "../../context/ToastContext";
import eleccionService from "../../services/eleccion.service";
import { ESTADO_ELECCION, type EleccionCreate, type EleccionOut } from "../../types/eleccion";
import Panel from "../ui/Panel";
import ConfirmDialog from "../feedback/ConfirmDialog";
import Cargando from "../feedback/Cargando";
import FormularioEleccion from "./FormularioEleccion";
import { faseDe, infoEtapa } from "../../utils/etapa";
import { aInputFecha, deInputFecha, formatearFecha } from "../../utils/fechas";
import { mensajeError } from "../../utils/errores";

import "../../styles/elecciones.css";

interface Props {
  eleccion: EleccionOut;
  /** Vuelve a leer la elección tras un cambio. */
  onActualizada: () => Promise<void>;
  onEliminada: () => void;
}

type Dialogo = null | "activar" | "pausar" | "reanudar" | "finalizar" | "eliminar";

/** Pestaña "Configuración": editar, gracia, estado, publicación y eliminar.
 *  El que decide si una acción procede es el backend (409/403): aquí se
 *  muestra su mensaje tal cual con un toast. */
export function ConfiguracionEleccion({ eleccion, onActualizada, onEliminada }: Props) {
  const toast = useToast();
  const id = eleccion.id_eleccion;
  const fase = faseDe(eleccion);
  const finalizada = fase === "finalizada";
  const pausada = fase === "pausada";
  const enVotacion = fase === "votacion";

  const [ocupado, setOcupado] = useState(false);
  const [dialogo, setDialogo] = useState<Dialogo>(null);

  // Edición
  const [editando, setEditando] = useState(false);
  const [cursos, setCursos] = useState<string[]>([]);
  const [cargandoCursos, setCargandoCursos] = useState(false);

  // Gracia, reapertura, publicación
  const [nuevaFinInsc, setNuevaFinInsc] = useState("");
  const [fechaReapertura, setFechaReapertura] = useState("");
  const [fechaPub, setFechaPub] = useState(aInputFecha(eleccion.fecha_publicacion_resultados));

  useEffect(() => {
    setFechaPub(aInputFecha(eleccion.fecha_publicacion_resultados));
  }, [eleccion.fecha_publicacion_resultados]);

  /** Ejecuta una acción del backend, avisa y recarga. Devuelve si salió bien. */
  async function ejecutar(accion: () => Promise<{ message?: string }>, exito: string): Promise<boolean> {
    setOcupado(true);
    try {
      const r = await accion();
      toast.exito(r.message || exito);
      await onActualizada();
      return true;
    } catch (err) {
      toast.error(await mensajeError(err));
      return false;
    } finally {
      setOcupado(false);
    }
  }

  // ---- Editar ----
  async function empezarEdicion() {
    setEditando(true);
    if (cursos.length > 0) return;
    setCargandoCursos(true);
    try {
      setCursos(await eleccionService.listarCursos());
    } catch (err) {
      toast.aviso(await mensajeError(err, "No se pudieron cargar los cursos."));
    } finally {
      setCargandoCursos(false);
    }
  }

  async function guardar(datos: EleccionCreate) {
    const ok = await ejecutar(() => eleccionService.actualizar(id, datos), "Elección actualizada.");
    if (ok) setEditando(false);
  }

  // Cursos del selector: los del backend + los ya guardados en la elección.
  const cursosSelector = [...new Set([...cursos, ...eleccion.cursos_postulacion, ...eleccion.cursos_votacion])].sort();

  // ---- Gracia ----
  async function ampliar() {
    if (!nuevaFinInsc) {
      toast.aviso("Elige la nueva fecha de cierre de la postulación.");
      return;
    }
    const actual = (eleccion.fecha_fin_inscripcion ?? "").slice(0, 16);
    if (actual && nuevaFinInsc <= actual) {
      toast.aviso("La nueva fecha debe ser posterior al cierre actual.");
      return;
    }
    const ok = await ejecutar(
      () => eleccionService.ampliarPostulacion(id, deInputFecha(nuevaFinInsc)),
      "Postulación ampliada."
    );
    if (ok) setNuevaFinInsc("");
  }

  // ---- Estado ----
  async function confirmarEstado() {
    if (dialogo === "activar") {
      if (finalizada && !fechaReapertura) {
        toast.aviso("Indica la nueva fecha de cierre para reabrir la elección.");
        return;
      }
      const ok = await ejecutar(
        () =>
          eleccionService.cambiarEstado(
            id,
            ESTADO_ELECCION.ACTIVA,
            finalizada ? deInputFecha(fechaReapertura) : undefined
          ),
        finalizada ? "Elección reabierta." : "Elección activada."
      );
      if (ok) {
        setDialogo(null);
        setFechaReapertura("");
      }
    } else if (dialogo === "pausar" || dialogo === "reanudar") {
      // Pausar = estado Pendiente (3); reanudar = estado Activa (1).
      const pausar = dialogo === "pausar";
      const ok = await ejecutar(
        () => eleccionService.cambiarEstado(id, pausar ? ESTADO_ELECCION.PENDIENTE : ESTADO_ELECCION.ACTIVA),
        pausar ? "Votación en pausa." : "Votación reanudada."
      );
      if (ok) setDialogo(null);
    } else if (dialogo === "finalizar") {
      const ok = await ejecutar(
        () => eleccionService.cambiarEstado(id, ESTADO_ELECCION.FINALIZADA),
        "Elección finalizada."
      );
      if (ok) setDialogo(null);
    }
  }

  // ---- Publicación ----
  async function publicar() {
    if (!fechaPub) {
      toast.aviso("Elige la fecha de publicación de los resultados.");
      return;
    }
    await ejecutar(
      () => eleccionService.actualizarPublicacion(id, deInputFecha(fechaPub)),
      "Fecha de publicación guardada."
    );
  }

  async function quitarPublicacion() {
    await ejecutar(() => eleccionService.actualizarPublicacion(id, null), "Resultados despublicados.");
  }

  // ---- Eliminar (no recarga: la elección deja de existir) ----
  async function eliminar() {
    setOcupado(true);
    try {
      const r = await eleccionService.eliminar(id);
      toast.exito(r.message || "Elección eliminada.");
      onEliminada();
    } catch (err) {
      toast.error(await mensajeError(err, "No se pudo eliminar la elección."));
      setDialogo(null);
      setOcupado(false);
    }
  }

  const valoresIniciales: Partial<EleccionCreate> = {
    titulo: eleccion.titulo,
    descripcion: eleccion.descripcion,
    fecha_inicio_inscripcion: eleccion.fecha_inicio_inscripcion ?? undefined,
    fecha_fin_inscripcion: eleccion.fecha_fin_inscripcion ?? undefined,
    fecha_inicio: eleccion.fecha_inicio,
    fecha_fin: eleccion.fecha_fin,
    cursos_postulacion: eleccion.cursos_postulacion,
    cursos_votacion: eleccion.cursos_votacion,
  };

  return (
    <>
      {/* DATOS */}
      <Panel
        title="Datos de la elección"
        action={
          !editando && (
            <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => void empezarEdicion()}>
              <i className="fa-solid fa-pen me-2"></i>Editar
            </button>
          )
        }
      >
        {editando ? (
          cargandoCursos ? (
            <Cargando texto="Cargando cursos..." />
          ) : (
            <>
              <p className="selector-cursos-ayuda mb-3">
                Solo se puede editar antes de que la elección inicie y mientras no tenga votos.
              </p>
              <FormularioEleccion
                valoresIniciales={valoresIniciales}
                cursosDisponibles={cursosSelector}
                enviando={ocupado}
                textoEnviar="Guardar cambios"
                enviarCursosVacios
                onSubmit={(d) => void guardar(d)}
                onCancelar={() => setEditando(false)}
              />
            </>
          )
        ) : (
          <p className="selector-cursos-ayuda m-0">
            Cambia el título, las fechas o los cursos habilitados. Solo es posible antes de que la
            elección inicie y mientras no tenga votos.
          </p>
        )}
      </Panel>

      {/* GRACIA */}
      <Panel title="Ampliar postulación">
        <div className="config-seccion">
          <p>
            Cierre actual: <strong>{formatearFecha(eleccion.fecha_fin_inscripcion)}</strong>. Úsalo para dar más
            tiempo a las candidaturas.
          </p>
          <div className="config-fila">
            <div className="form-campo">
              <label htmlFor="cfg-gracia">Nuevo cierre de postulación</label>
              <input id="cfg-gracia" type="datetime-local" className="form-control" value={nuevaFinInsc}
                onChange={(e) => setNuevaFinInsc(e.target.value)} />
            </div>
            <button type="button" className="fb-btn fb-btn-primary" disabled={ocupado} onClick={() => void ampliar()}>
              Ampliar postulación
            </button>
          </div>
        </div>
      </Panel>

      {/* ESTADO */}
      <Panel title="Estado de la elección">
        <div className="config-seccion">
          <p>
            Etapa actual: <strong>{infoEtapa(eleccion.etapa).etiqueta}</strong>.{" "}
            {pausada && "La votación está en pausa: los estudiantes no pueden votar hasta que la reanudes."}
            {finalizada && "Puedes reabrirla indicando una nueva fecha de cierre."}
          </p>
          <div className="config-acciones">
            {enVotacion && (
              <button type="button" className="fb-btn fb-btn-warning" disabled={ocupado} onClick={() => setDialogo("pausar")}>
                <i className="fa-solid fa-pause me-2"></i>Pausar votación
              </button>
            )}
            {pausada && (
              <button type="button" className="fb-btn fb-btn-primary" disabled={ocupado} onClick={() => setDialogo("reanudar")}>
                <i className="fa-solid fa-play me-2"></i>Reanudar votación
              </button>
            )}
            {(fase === "antes" || fase === "postulacion" || fase === "moderacion" || finalizada) && (
              <button type="button" className="fb-btn fb-btn-primary" disabled={ocupado} onClick={() => setDialogo("activar")}>
                {finalizada ? "Reabrir elección" : "Abrir votación ahora"}
              </button>
            )}
            {!finalizada && (
              <button type="button" className="fb-btn fb-btn-danger" disabled={ocupado} onClick={() => setDialogo("finalizar")}>
                Finalizar elección
              </button>
            )}
          </div>
        </div>
      </Panel>

      {/* PUBLICACIÓN */}
      <Panel title="Publicación de resultados">
        <div className="config-seccion">
          <p>
            Publicación actual: <strong>{formatearFecha(eleccion.fecha_publicacion_resultados)}</strong>. Los
            estudiantes ven los resultados a partir de esa fecha.
          </p>
          <div className="config-fila">
            <div className="form-campo">
              <label htmlFor="cfg-pub">Fecha de publicación</label>
              <input id="cfg-pub" type="datetime-local" className="form-control" value={fechaPub}
                onChange={(e) => setFechaPub(e.target.value)} />
            </div>
            <button type="button" className="fb-btn fb-btn-primary" disabled={ocupado} onClick={() => void publicar()}>
              Guardar fecha
            </button>
            {eleccion.fecha_publicacion_resultados && (
              <button type="button" className="fb-btn fb-btn-ghost" disabled={ocupado} onClick={() => void quitarPublicacion()}>
                Quitar publicación
              </button>
            )}
          </div>
        </div>
      </Panel>

      {/* ELIMINAR */}
      <div className="zona-peligro">
        <div className="config-seccion">
          <strong>Eliminar elección</strong>
          <p>Borra la elección y sus candidaturas. No se puede deshacer y no es posible si ya tiene votos.</p>
          <div className="config-acciones">
            <button type="button" className="fb-btn fb-btn-danger" disabled={ocupado} onClick={() => setDialogo("eliminar")}>
              <i className="fa-solid fa-trash me-2"></i>Eliminar elección
            </button>
          </div>
        </div>
      </div>

      {/* DIÁLOGOS */}
      <ConfirmDialog
        abierto={dialogo === "activar"}
        titulo={finalizada ? "Reabrir elección" : "Abrir votación ahora"}
        mensaje={
          finalizada
            ? "La elección volverá a estar activa. Indica hasta cuándo seguirá abierta la votación."
            : "Si la elección aún no ha empezado, la votación se abrirá ahora mismo. ¿Quieres continuar?"
        }
        textoConfirmar={finalizada ? "Reabrir" : "Abrir votación"}
        cargando={ocupado}
        onConfirmar={() => void confirmarEstado()}
        onCancelar={() => setDialogo(null)}
      >
        {finalizada && (
          <div className="form-campo mb-2">
            <label htmlFor="cfg-reapertura">Nuevo cierre de la votación *</label>
            <input id="cfg-reapertura" type="datetime-local" className="form-control" value={fechaReapertura}
              onChange={(e) => setFechaReapertura(e.target.value)} />
          </div>
        )}
      </ConfirmDialog>

      <ConfirmDialog
        abierto={dialogo === "pausar"}
        titulo="Pausar votación"
        mensaje="Los estudiantes no podrán votar mientras esté en pausa. Podrás reanudarla cuando quieras."
        tono="warning"
        textoConfirmar="Pausar"
        cargando={ocupado}
        onConfirmar={() => void confirmarEstado()}
        onCancelar={() => setDialogo(null)}
      />

      <ConfirmDialog
        abierto={dialogo === "reanudar"}
        titulo="Reanudar votación"
        mensaje="La votación se abrirá de nuevo y los estudiantes podrán votar."
        textoConfirmar="Reanudar"
        cargando={ocupado}
        onConfirmar={() => void confirmarEstado()}
        onCancelar={() => setDialogo(null)}
      />

      <ConfirmDialog
        abierto={dialogo === "finalizar"}
        titulo="Finalizar elección"
        mensaje="La votación se cerrará y los resultados quedarán disponibles para exportar. ¿Quieres continuar?"
        tono="warning"
        textoConfirmar="Finalizar"
        cargando={ocupado}
        onConfirmar={() => void confirmarEstado()}
        onCancelar={() => setDialogo(null)}
      />

      <ConfirmDialog
        abierto={dialogo === "eliminar"}
        titulo="Eliminar elección"
        mensaje={`Vas a eliminar «${eleccion.titulo}». Esta acción no se puede deshacer.`}
        tono="danger"
        textoConfirmar="Eliminar"
        cargando={ocupado}
        onConfirmar={() => void eliminar()}
        onCancelar={() => setDialogo(null)}
      />
    </>
  );
}

export default ConfiguracionEleccion;