import { useCallback, useEffect, useState } from "react";

import { useToast } from "../../context/ToastContext";
import { useTituloPagina } from "../../context/PaginaContext";
import resultadoService from "../../services/resultado.service";
import type { EstadisticasEleccionOut, ParticipacionCursoOut, ResultadoEleccionOut } from "../../types/resultado";
import Panel from "../ui/Panel";
import StatCard from "../ui/StatCard";
import DataTable from "../ui/DataTable";
import ProgressBar from "../ui/ProgressBar";
import Alerta from "../feedback/Alerta";
import Cargando from "../feedback/Cargando";
import EstadoVacio from "../feedback/EstadoVacio";
import { urlArchivo } from "../../config/env";
import { descargarArchivo } from "../../utils/descargas";
import { mensajeError } from "../../utils/errores";
import { faseDeEtapa } from "../../utils/etapa";

import "../../styles/resultados.css";

interface Props {
  idEleccion: number;
  /** Ruta del enlace "← Volver" del header (admin o docente). */
  volverA: string;
}

/** Porcentaje del backend (0-100) con un decimal. */
function pct(n: number): string {
  return `${(Math.round(n * 10) / 10).toLocaleString("es-CO")}%`;
}

/** Detalle de resultados de una elección: ganador/empate, votos por
 *  candidato, estadísticas por curso y exportes. Reutilizable por el docente
 *  (solo cambia `volverA`). */
export function ResultadosEleccion({ idEleccion, volverA }: Props) {
  const toast = useToast();
  const [res, setRes] = useState<ResultadoEleccionOut | null>(null);
  const [est, setEst] = useState<EstadisticasEleccionOut | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [exportando, setExportando] = useState<"csv" | "pdf" | null>(null);

  useTituloPagina(res?.titulo_eleccion ?? "Resultados", "Resultados y estadísticas", volverA);

  const cargar = useCallback(
    async (silencioso = false) => {
      if (!silencioso) setCargando(true);
      setError("");
      try {
        const [r, e] = await Promise.all([
          resultadoService.obtener(idEleccion),
          resultadoService.estadisticas(idEleccion),
        ]);
        setRes(r);
        setEst(e);
      } catch (err) {
        setError(await mensajeError(err, "No se pudieron cargar los resultados."));
      } finally {
        setCargando(false);
      }
    },
    [idEleccion]
  );

  useEffect(() => {
    void cargar();
  }, [cargar]);

  async function exportar(formato: "csv" | "pdf") {
    setExportando(formato);
    try {
      await descargarArchivo(`/resultados/${idEleccion}/exportar`, { formato }, `resultados-${idEleccion}.${formato}`);
      toast.exito(`Exportación ${formato.toUpperCase()} lista.`);
    } catch (err) {
      toast.error(await mensajeError(err, "No se pudo exportar."));
    } finally {
      setExportando(null);
    }
  }

  if (cargando) return <div className="panel-box"><Cargando texto="Cargando resultados..." /></div>;

  if (error || !res) {
    return (
      <div className="panel-box">
        <EstadoVacio icono="fa-solid fa-circle-exclamation" titulo="No se pudieron cargar los resultados" descripcion={error}>
          <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => void cargar()}>Reintentar</button>
        </EstadoVacio>
      </div>
    );
  }

  const fase = faseDeEtapa(res.etapa);
  const finalizada = fase === "finalizada";
  const parcial = fase === "votacion";
  const empatados = res.empatados ?? [];
  const nombresGanadores = new Set(empatados.length > 0 ? empatados : res.ganador ? [res.ganador] : []);
  const candidatos = [...res.candidatos].sort((a, b) => b.total_votos - a.total_votos);
  const pctBlancos = est?.porcentaje_blancos;

  return (
    <>
      {/* Aviso / ganador */}
      {parcial && (
        <Alerta tono="info">
          La votación sigue abierta: estos son resultados <strong>parciales</strong>.{" "}
          <button type="button" className="btn btn-sm btn-outline-primary ms-2" onClick={() => void cargar(true)}>Actualizar</button>
        </Alerta>
      )}
      {finalizada && empatados.length > 0 && (
        <div className="res-banner res-banner-empate">
          <i className="fa-solid fa-scale-balanced"></i>
          <div><strong>Empate</strong><span>{empatados.join(", ")}</span></div>
        </div>
      )}
      {finalizada && empatados.length === 0 && res.ganador && (
        <div className="res-banner res-banner-ganador">
          <i className="fa-solid fa-trophy"></i>
          <div><strong>Ganador</strong><span>{res.ganador}</span></div>
        </div>
      )}
      {finalizada && empatados.length === 0 && !res.ganador && (
        <div className="res-banner">
          <i className="fa-solid fa-circle-info"></i>
          <div><strong>Sin ganador</strong><span>No se registraron votos por candidatos.</span></div>
        </div>
      )}

      {/* Métricas */}
      <div className="stat-grid">
        <StatCard icon="fa-solid fa-box-archive" label="Votos emitidos" value={res.total_votos} />
        <StatCard
          icon="fa-solid fa-users"
          label="Participación"
          value={pct(res.participacion.porcentaje)}
          delta={`${res.participacion.votaron} de ${res.participacion.habilitados} habilitados`}
        />
        <StatCard
          icon="fa-regular fa-square"
          label="Votos en blanco"
          value={res.votos_blancos}
          delta={pctBlancos !== undefined ? pct(pctBlancos) : undefined}
        />
      </div>

      {/* Votos por candidato */}
      <Panel title="Votos por candidato">
        {candidatos.length === 0 && res.votos_blancos === 0 ? (
          <EstadoVacio icono="fa-solid fa-chart-simple" titulo="Aún no hay votos" />
        ) : (
          <div className="res-lista">
            {candidatos.map((c) => {
              const nombre = `${c.nombre} ${c.apellido}`;
              const gana = finalizada && nombresGanadores.has(nombre);
              const foto = urlArchivo(c.foto);
              return (
                <div key={c.id_candidato} className={`res-fila${gana ? " is-ganador" : ""}`}>
                  <div className="res-fila-top">
                    {foto ? (
                      <img src={foto} alt="" className="res-avatar" />
                    ) : (
                      <span className="res-avatar res-avatar-vacio" aria-hidden="true">
                        {nombre.charAt(0)}{c.apellido.charAt(0)}
                      </span>
                    )}
                    <strong>{nombre}{gana && <i className="fa-solid fa-trophy ms-2 res-trofeo" title="Ganador"></i>}</strong>
                    <span className="res-votos">{c.total_votos} {c.total_votos === 1 ? "voto" : "votos"} · {pct(c.porcentaje)}</span>
                  </div>
                  <ProgressBar value={c.porcentaje} tone={gana ? "green" : "blue"} />
                </div>
              );
            })}

            <div className="res-fila">
              <div className="res-fila-top">
                <span className="res-avatar res-avatar-vacio" aria-hidden="true"><i className="fa-regular fa-square"></i></span>
                <strong>Voto en blanco</strong>
                <span className="res-votos">
                  {res.votos_blancos} {res.votos_blancos === 1 ? "voto" : "votos"}
                  {pctBlancos !== undefined && <> · {pct(pctBlancos)}</>}
                </span>
              </div>
              <ProgressBar value={pctBlancos ?? 0} tone="orange" />
            </div>
          </div>
        )}
      </Panel>

      {/* Por curso */}
      <Panel title="Participación por curso">
        <DataTable
          columns={[
            { header: "Curso", render: (c: ParticipacionCursoOut) => <strong>{c.curso}</strong> },
            { header: "Habilitados", render: (c: ParticipacionCursoOut) => c.habilitados },
            { header: "Votaron", render: (c: ParticipacionCursoOut) => c.votaron },
            {
              header: "Participación",
              render: (c: ParticipacionCursoOut) => (
                <div className="res-curso-barra">
                  <ProgressBar value={c.porcentaje} tone="violet" />
                  <span>{pct(c.porcentaje)}</span>
                </div>
              ),
            },
          ]}
          rows={est?.por_curso ?? []}
          rowKey={(c) => c.curso}
          emptyMessage="No hay datos de participación por curso."
        />
      </Panel>

      {/* Exportes */}
      <Panel title="Exportar resultados">
        <p className="res-ayuda">
          {finalizada
            ? "Descarga el resultado oficial de la elección."
            : "Los exportes estarán disponibles cuando la elección finalice."}
        </p>
        <div className="res-exportes">
          <button type="button" className="btn btn-outline-secondary" disabled={!finalizada || exportando !== null} onClick={() => void exportar("pdf")}>
            {exportando === "pdf" ? <span className="spinner-border spinner-border-sm me-2" aria-hidden="true"></span> : <i className="fa-solid fa-file-pdf me-2"></i>}
            Descargar PDF
          </button>
          <button type="button" className="btn btn-outline-secondary" disabled={!finalizada || exportando !== null} onClick={() => void exportar("csv")}>
            {exportando === "csv" ? <span className="spinner-border spinner-border-sm me-2" aria-hidden="true"></span> : <i className="fa-solid fa-file-csv me-2"></i>}
            Descargar CSV
          </button>
        </div>
      </Panel>
    </>
  );
}

export default ResultadosEleccion;