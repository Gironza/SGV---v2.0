import { useCallback, useEffect, useMemo, useState } from "react";

import { useToast } from "../../context/ToastContext";
import candidatoService from "../../services/candidato.service";
import { ESTADO_CANDIDATURA, type CandidaturaDetalleOut } from "../../types/candidatura";
import { infoEstadoCandidatura } from "../../utils/candidatura";
import { mensajeError } from "../../utils/errores";
import CandidaturaCard from "./CandidaturaCard";
import ConfirmDialog from "../feedback/ConfirmDialog";
import Alerta from "../feedback/Alerta";
import Cargando from "../feedback/Cargando";
import EstadoVacio from "../feedback/EstadoVacio";

import "../../styles/candidaturas.css";

interface Props {
  idEleccion: number;
}

type Accion =
  | { tipo: "rechazar"; c: CandidaturaDetalleOut }
  | { tipo: "observaciones"; c: CandidaturaDetalleOut }
  | { tipo: "retiro"; c: CandidaturaDetalleOut; aprobar: boolean }
  | null;

// Orden de los filtros: primero lo que requiere atención.
const ORDEN_FILTROS = [
  ESTADO_CANDIDATURA.PENDIENTE,
  ESTADO_CANDIDATURA.RETIRO_SOLICITADO,
  ESTADO_CANDIDATURA.APROBADA,
  ESTADO_CANDIDATURA.RECHAZADA,
  ESTADO_CANDIDATURA.RETIRADA,
];

/** Vista de moderación de candidaturas de una elección. Reutilizable por
 *  admin y docente: los permisos los decide el backend (403). */
export function ModeracionCandidaturas({ idEleccion }: Props) {
  const toast = useToast();
  const [lista, setLista] = useState<CandidaturaDetalleOut[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [filtro, setFiltro] = useState<number | "todas">("todas");
  const [ocupado, setOcupado] = useState(false);
  const [accion, setAccion] = useState<Accion>(null);
  const [texto, setTexto] = useState("");

  const cargar = useCallback(
    async (silencioso = false) => {
      if (!silencioso) setCargando(true);
      setError("");
      try {
        setLista(await candidatoService.listarGestion(idEleccion));
      } catch (err) {
        setError(await mensajeError(err, "No se pudieron cargar las candidaturas."));
      } finally {
        setCargando(false);
      }
    },
    [idEleccion]
  );

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const conteo = useMemo(() => {
    const m = new Map<number, number>();
    for (const c of lista) m.set(c.id_estado_candidatura, (m.get(c.id_estado_candidatura) ?? 0) + 1);
    return m;
  }, [lista]);

  const porModerar =
    (conteo.get(ESTADO_CANDIDATURA.PENDIENTE) ?? 0) + (conteo.get(ESTADO_CANDIDATURA.RETIRO_SOLICITADO) ?? 0);

  const visibles = lista.filter((c) => filtro === "todas" || c.id_estado_candidatura === filtro);

  /** Ejecuta una acción del backend, avisa y recarga. */
  async function ejecutar(fn: () => Promise<{ message?: string }>, exito: string): Promise<boolean> {
    setOcupado(true);
    try {
      const r = await fn();
      toast.exito(r.message || exito);
      await cargar(true);
      return true;
    } catch (err) {
      toast.error(await mensajeError(err));
      return false;
    } finally {
      setOcupado(false);
    }
  }

  function aprobar(c: CandidaturaDetalleOut) {
    void ejecutar(() => candidatoService.revisar(c.id_candidato, ESTADO_CANDIDATURA.APROBADA), "Candidatura aprobada.");
  }

  function abrirRechazo(c: CandidaturaDetalleOut) {
    setTexto("");
    setAccion({ tipo: "rechazar", c });
  }

  function abrirObservaciones(c: CandidaturaDetalleOut) {
    setTexto(c.observaciones ?? "");
    setAccion({ tipo: "observaciones", c });
  }

  async function confirmar() {
    if (!accion) return;
    let ok = false;
    if (accion.tipo === "rechazar") {
      ok = await ejecutar(
        () => candidatoService.revisar(accion.c.id_candidato, ESTADO_CANDIDATURA.RECHAZADA, texto.trim() || undefined),
        "Candidatura rechazada."
      );
    } else if (accion.tipo === "observaciones") {
      ok = await ejecutar(
        () => candidatoService.actualizarObservaciones(accion.c.id_candidato, texto.trim()),
        "Observaciones guardadas."
      );
    } else {
      ok = await ejecutar(
        () => candidatoService.resolverRetiro(accion.c.id_candidato, accion.aprobar),
        accion.aprobar ? "Retiro aprobado." : "La candidatura se mantiene."
      );
    }
    if (ok) setAccion(null);
  }

  if (cargando) return <div className="panel-box"><Cargando texto="Cargando candidaturas..." /></div>;

  if (error) {
    return (
      <div className="panel-box">
        <Alerta tono="error">
          {error}{" "}
          <button type="button" className="btn btn-sm btn-outline-danger ms-2" onClick={() => void cargar()}>
            Reintentar
          </button>
        </Alerta>
      </div>
    );
  }

  const nombreAccion = accion ? `${accion.c.nombre} ${accion.c.apellido}` : "";

  return (
    <div className="panel-box">
      {porModerar > 0 && (
        <Alerta tono="aviso">
          Tienes <strong>{porModerar}</strong> {porModerar === 1 ? "candidatura" : "candidaturas"} por moderar.
        </Alerta>
      )}

      {lista.length === 0 ? (
        <EstadoVacio
          icono="fa-solid fa-user-check"
          titulo="Aún no hay candidaturas"
          descripcion="Aparecerán aquí cuando los estudiantes se postulen."
        />
      ) : (
        <>
          <div className="chips mb-3">
            <button type="button" className={`chip${filtro === "todas" ? " is-on" : ""}`} onClick={() => setFiltro("todas")}>
              Todas <span>{lista.length}</span>
            </button>
            {ORDEN_FILTROS.filter((id) => conteo.has(id)).map((id) => (
              <button key={id} type="button" className={`chip${filtro === id ? " is-on" : ""}`} onClick={() => setFiltro(id)}>
                {infoEstadoCandidatura(id).etiqueta} <span>{conteo.get(id)}</span>
              </button>
            ))}
          </div>

          {visibles.length === 0 ? (
            <EstadoVacio icono="fa-solid fa-filter" titulo="Sin candidaturas en este filtro" />
          ) : (
            <div className="cand-grid">
              {visibles.map((c) => (
                <CandidaturaCard
                  key={c.id_candidato}
                  c={c}
                  ocupado={ocupado}
                  onAprobar={() => aprobar(c)}
                  onRechazar={() => abrirRechazo(c)}
                  onObservaciones={() => abrirObservaciones(c)}
                  onResolverRetiro={(ap) => setAccion({ tipo: "retiro", c, aprobar: ap })}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Rechazar / observaciones (con texto) */}
      <ConfirmDialog
        abierto={accion?.tipo === "rechazar" || accion?.tipo === "observaciones"}
        titulo={accion?.tipo === "rechazar" ? `Rechazar a ${nombreAccion}` : `Observaciones de ${nombreAccion}`}
        mensaje={
          accion?.tipo === "rechazar"
            ? "Explica el motivo para que el candidato pueda corregirlo. Solo se puede rechazar antes de que empiece la votación."
            : "El candidato verá estas observaciones en su candidatura."
        }
        tono={accion?.tipo === "rechazar" ? "danger" : "primary"}
        textoConfirmar={accion?.tipo === "rechazar" ? "Rechazar" : "Guardar"}
        cargando={ocupado}
        onConfirmar={() => void confirmar()}
        onCancelar={() => setAccion(null)}
      >
        <div className="form-campo mb-1">
          <label htmlFor="cand-obs">Observaciones{accion?.tipo === "rechazar" ? " (recomendado)" : ""}</label>
          <textarea id="cand-obs" className="form-control" rows={4} maxLength={1000} value={texto}
            onChange={(e) => setTexto(e.target.value)} />
          <small className="text-muted align-self-end">{texto.length}/1000</small>
        </div>
      </ConfirmDialog>

      {/* Retiro solicitado */}
      <ConfirmDialog
        abierto={accion?.tipo === "retiro"}
        titulo={accion?.tipo === "retiro" && accion.aprobar ? "Aprobar retiro" : "Mantener candidatura"}
        mensaje={
          accion?.tipo === "retiro" && accion.aprobar
            ? `${nombreAccion} quedará retirado de esta elección.`
            : `${nombreAccion} seguirá como candidato y se descarta su solicitud de retiro.`
        }
        tono={accion?.tipo === "retiro" && accion.aprobar ? "danger" : "primary"}
        textoConfirmar={accion?.tipo === "retiro" && accion.aprobar ? "Aprobar retiro" : "Mantener"}
        cargando={ocupado}
        onConfirmar={() => void confirmar()}
        onCancelar={() => setAccion(null)}
      />
    </div>
  );
}

export default ModeracionCandidaturas;