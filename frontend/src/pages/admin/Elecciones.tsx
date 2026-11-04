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
import { formatearFecha } from "../../utils/fechas";
import { infoEtapa, normalizarEtapa } from "../../utils/etapa";
import { mensajeError } from "../../utils/errores";

import "../../styles/elecciones.css";

function resumenCursos(cursos: string[]): string {
  if (cursos.length === 0) return "—";
  return cursos.length <= 3 ? cursos.join(", ") : `${cursos.slice(0, 3).join(", ")} +${cursos.length - 3}`;
}

function Elecciones() {
  useTituloPagina("Elecciones", "Configura y modera tus votaciones");

  const [elecciones, setElecciones] = useState<EleccionOut[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [filtro, setFiltro] = useState("todas");
  const [busqueda, setBusqueda] = useState("");

  const cargar = useCallback(async () => {
    setCargando(true);
    setError("");
    try {
      setElecciones(await eleccionService.listar());
    } catch (err) {
      setError(await mensajeError(err, "No se pudieron cargar las elecciones."));
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  // Chips de filtro construidos con las etapas que realmente existen.
  const etapas = useMemo(() => {
    const m = new Map<string, { etapa: string; n: number }>();
    for (const e of elecciones) {
      const k = normalizarEtapa(e.etapa);
      m.set(k, { etapa: e.etapa, n: (m.get(k)?.n ?? 0) + 1 });
    }
    return [...m.entries()].sort((a, b) =>
      infoEtapa(a[1].etapa).etiqueta.localeCompare(infoEtapa(b[1].etapa).etiqueta)
    );
  }, [elecciones]);

  const visibles = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return elecciones
      .filter((e) => filtro === "todas" || normalizarEtapa(e.etapa) === filtro)
      .filter((e) => !q || e.titulo.toLowerCase().includes(q))
      .sort((a, b) => b.id_eleccion - a.id_eleccion);
  }, [elecciones, filtro, busqueda]);

  const botonNueva = (
    <Link to="/admin/elecciones/nueva" className="btn-accent btn-accent-violet" style={{ textDecoration: "none" }}>
      <i className="fa-solid fa-plus me-2"></i>Nueva elección
    </Link>
  );

  return (
    <Panel title="Listado de elecciones" action={botonNueva}>
      {error && (
        <Alerta tono="error">
          {error}{" "}
          <button type="button" className="btn btn-sm btn-outline-danger ms-2" onClick={() => void cargar()}>
            Reintentar
          </button>
        </Alerta>
      )}

      {cargando ? (
        <Cargando texto="Cargando elecciones..." />
      ) : elecciones.length === 0 && !error ? (
        <EstadoVacio
          icono="fa-solid fa-check-to-slot"
          titulo="Aún no hay elecciones"
          descripcion="Crea la primera para empezar a recibir candidaturas."
        >
          {botonNueva}
        </EstadoVacio>
      ) : (
        elecciones.length > 0 && (
          <>
            <div className="filtros-eleccion">
              <div className="chips">
                <button type="button" className={`chip${filtro === "todas" ? " is-on" : ""}`} onClick={() => setFiltro("todas")}>
                  Todas <span>{elecciones.length}</span>
                </button>
                {etapas.map(([clave, { etapa, n }]) => (
                  <button key={clave} type="button" className={`chip${filtro === clave ? " is-on" : ""}`} onClick={() => setFiltro(clave)}>
                    {infoEtapa(etapa).etiqueta} <span>{n}</span>
                  </button>
                ))}
              </div>
              <input
                type="search"
                className="form-control filtros-buscar"
                placeholder="Buscar por título..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                aria-label="Buscar por título"
              />
            </div>

            {visibles.length === 0 ? (
              <EstadoVacio icono="fa-solid fa-magnifying-glass" titulo="Sin resultados" descripcion="Prueba con otro filtro o búsqueda." />
            ) : (
              <div className="tabla-scroll">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Elección</th>
                      <th>Etapa</th>
                      <th>Postulación</th>
                      <th>Votación</th>
                      <th>Cursos</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibles.map((e) => (
                      <tr key={e.id_eleccion}>
                        <td><strong>{e.titulo}</strong></td>
                        <td><EtapaBadge etapa={e.etapa} /></td>
                        <td className="celda-fechas">
                          <span>{formatearFecha(e.fecha_inicio_inscripcion)}</span>
                          <span>{formatearFecha(e.fecha_fin_inscripcion)}</span>
                        </td>
                        <td className="celda-fechas">
                          <span>{formatearFecha(e.fecha_inicio)}</span>
                          <span>{formatearFecha(e.fecha_fin)}</span>
                        </td>
                        <td className="celda-cursos">
                          <span title={e.cursos_postulacion.join(", ")}>Postulan: {resumenCursos(e.cursos_postulacion)}</span>
                          <span title={e.cursos_votacion.join(", ")}>Votan: {resumenCursos(e.cursos_votacion)}</span>
                        </td>
                        <td>
                          <Link to={`/admin/elecciones/${e.id_eleccion}`} className="btn btn-sm btn-outline-secondary">
                            Gestionar
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

export default Elecciones;