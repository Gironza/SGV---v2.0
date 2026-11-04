import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router";

import { useTituloPagina } from "../../context/PaginaContext";
import eleccionService from "../../services/eleccion.service";
import type { EleccionOut } from "../../types/eleccion";
import Panel from "../../components/ui/Panel";
import EtapaBadge from "../../components/elecciones/EtapaBadge";
import Alerta from "../../components/feedback/Alerta";
import Cargando from "../../components/feedback/Cargando";
import EstadoVacio from "../../components/feedback/EstadoVacio";
import { faseDe } from "../../utils/etapa";
import { formatearFecha } from "../../utils/fechas";
import { mensajeError } from "../../utils/errores";

import "../../styles/elecciones.css";

type Filtro = "todas" | "votacion" | "finalizada";

/** En votación o en pausa: la elección sigue en curso. */
function enCurso(e: EleccionOut): boolean {
  const f = faseDe(e);
  return f === "votacion" || f === "pausada";
}

/** Selector: elecciones con resultados (en votación o finalizadas). */
function Resultados() {
  useTituloPagina("Resultados", "Estadísticas, reportes y exportes");

  const [elecciones, setElecciones] = useState<EleccionOut[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [filtro, setFiltro] = useState<Filtro>("todas");

  const cargar = useCallback(async () => {
    setCargando(true);
    setError("");
    try {
      const todas = await eleccionService.listar();
      setElecciones(todas.filter((e) => ["votacion", "pausada", "finalizada"].includes(faseDe(e))));
    } catch (err) {
      setError(await mensajeError(err, "No se pudieron cargar las elecciones."));
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const visibles = useMemo(
    () =>
      elecciones
        .filter((e) => filtro === "todas" || (filtro === "votacion" ? enCurso(e) : faseDe(e) === filtro))
        .sort((a, b) => b.fecha_fin.localeCompare(a.fecha_fin)),
    [elecciones, filtro]
  );

  const nVotacion = elecciones.filter(enCurso).length;
  const nFinalizadas = elecciones.length - nVotacion;

  return (
    <Panel title="Elecciones con resultados">
      {error && (
        <Alerta tono="error">
          {error}{" "}
          <button type="button" className="btn btn-sm btn-outline-danger ms-2" onClick={() => void cargar()}>Reintentar</button>
        </Alerta>
      )}

      {cargando ? (
        <Cargando texto="Cargando elecciones..." />
      ) : elecciones.length === 0 && !error ? (
        <EstadoVacio
          icono="fa-solid fa-chart-pie"
          titulo="Aún no hay resultados"
          descripcion="Aparecerán aquí las elecciones que estén en votación o ya hayan finalizado."
        />
      ) : (
        elecciones.length > 0 && (
          <>
            <div className="chips mb-3">
              <button type="button" className={`chip${filtro === "todas" ? " is-on" : ""}`} onClick={() => setFiltro("todas")}>
                Todas <span>{elecciones.length}</span>
              </button>
              <button type="button" className={`chip${filtro === "votacion" ? " is-on" : ""}`} onClick={() => setFiltro("votacion")}>
                En votación <span>{nVotacion}</span>
              </button>
              <button type="button" className={`chip${filtro === "finalizada" ? " is-on" : ""}`} onClick={() => setFiltro("finalizada")}>
                Finalizadas <span>{nFinalizadas}</span>
              </button>
            </div>

            {visibles.length === 0 ? (
              <EstadoVacio icono="fa-solid fa-filter" titulo="Sin elecciones en este filtro" />
            ) : (
              <div className="tabla-scroll">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Elección</th>
                      <th>Etapa</th>
                      <th>Votación</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibles.map((e) => (
                      <tr key={e.id_eleccion}>
                        <td><strong>{e.titulo}</strong></td>
                        <td><EtapaBadge etapa={e.etapa} /></td>
                        <td className="celda-fechas">
                          <span>{formatearFecha(e.fecha_inicio)}</span>
                          <span>{formatearFecha(e.fecha_fin)}</span>
                        </td>
                        <td>
                          <Link to={`/admin/resultados/${e.id_eleccion}`} className="btn btn-sm btn-outline-secondary">
                            Ver resultados
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )
      )}
    </Panel>
  );
}

export default Resultados;