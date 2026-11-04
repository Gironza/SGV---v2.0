import { useCallback, useEffect, useState } from "react";

import resultadoService from "../../services/resultado.service";
import type { ResultadoEleccionOut } from "../../types/resultado";
import ProgressBar from "../ui/ProgressBar";
import Alerta from "../feedback/Alerta";
import Cargando from "../feedback/Cargando";
import EstadoVacio from "../feedback/EstadoVacio";
import { urlArchivo } from "../../config/env";
import { mensajeError } from "../../utils/errores";
import { faseDeEtapa } from "../../utils/etapa";
import { formatearFecha } from "../../utils/fechas";

import "../../styles/resultados.css";

interface Props {
  idEleccion: number;
  /** Para avisar cuándo se publican, si el backend aún no las muestra. */
  fechaPublicacion?: string | null;
}

/** Porcentaje del backend (0-100) con un decimal. */
function pct(n: number): string {
  return `${(Math.round(n * 10) / 10).toLocaleString("es-CO")}%`;
}

/** Resultados sin estadísticas ni exportes (esas rutas son del admin):
 *  ganador o empate, votos por candidato, blancos y participación.
 *  Si el backend aún no los publica (403), muestra su mensaje. */
export function ResultadosResumen({ idEleccion, fechaPublicacion }: Props) {
  const [res, setRes] = useState<ResultadoEleccionOut | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const cargar = useCallback(async () => {
    setCargando(true);
    setError("");
    try {
      setRes(await resultadoService.obtener(idEleccion));
    } catch (err) {
      setError(await mensajeError(err, "No se pudieron cargar los resultados."));
    } finally {
      setCargando(false);
    }
  }, [idEleccion]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  if (cargando) return <Cargando texto="Cargando resultados..." />;

  if (error || !res) {
    return (
      <EstadoVacio
        icono="fa-solid fa-lock"
        titulo="Resultados no disponibles"
        descripcion={fechaPublicacion ? `${error} Publicación: ${formatearFecha(fechaPublicacion)}.` : error}
      >
        <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => void cargar()}>Reintentar</button>
      </EstadoVacio>
    );
  }

  const fase = faseDeEtapa(res.etapa);
  const finalizada = fase === "finalizada";
  const empatados = res.empatados ?? [];
  const nombresGanadores = new Set(empatados.length > 0 ? empatados : res.ganador ? [res.ganador] : []);
  const candidatos = [...res.candidatos].sort((a, b) => b.total_votos - a.total_votos);

  return (
    <div className="d-flex flex-column gap-3">
      {fase === "votacion" && (
        <Alerta tono="info">La votación sigue abierta: estos son resultados <strong>parciales</strong>.</Alerta>
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

      <p className="res-ayuda">
        Participación: <strong>{pct(res.participacion.porcentaje)}</strong> ({res.participacion.votaron} de{" "}
        {res.participacion.habilitados} habilitados) · {res.total_votos} {res.total_votos === 1 ? "voto emitido" : "votos emitidos"}.
      </p>

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
              <span className="res-votos">{res.votos_blancos} {res.votos_blancos === 1 ? "voto" : "votos"}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ResultadosResumen;