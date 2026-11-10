import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router";

import { useAuth } from "../../context/AuthContext";
import { useTituloPagina } from "../../context/PaginaContext";
import eleccionService from "../../services/eleccion.service";
import usuarioService from "../../services/usuario.service";
import candidatoService from "../../services/candidato.service";
import resultadoService from "../../services/resultado.service";
import type { EleccionOut } from "../../types/eleccion";
import { ESTADO_CANDIDATURA } from "../../types/candidatura";
import Panel from "../../components/ui/Panel";
import StatCard from "../../components/ui/StatCard";
import Badge from "../../components/ui/Badge";
import ProgressBar from "../../components/ui/ProgressBar";
import Alerta from "../../components/feedback/Alerta";
import Cargando from "../../components/feedback/Cargando";
import EstadoVacio from "../../components/feedback/EstadoVacio";
import { faseDe, infoFase, type Fase } from "../../utils/etapa";
import { mensajeError } from "../../utils/errores";

import "../../styles/dashboard.css";

interface Pendiente {
  eleccion: EleccionOut;
  pendientes: number;
  retiros: number;
}

interface Participacion {
  eleccion: EleccionOut;
  votaron: number;
  habilitados: number;
  porcentaje: number;
}

interface Datos {
  elecciones: EleccionOut[];
  totalUsuarios: number | null;
  usuariosActivos: number | null;
  pendientes: Pendiente[];
  participacion: Participacion[];
}

const ORDEN_FASES: Fase[] = ["antes", "postulacion", "moderacion", "votacion", "pausada", "finalizada", "desconocida"];
// Fases donde hay candidaturas por moderar / votación en curso.
const CON_CANDIDATURAS: Fase[] = ["postulacion", "moderacion", "votacion", "pausada"];
const EN_CURSO: Fase[] = ["votacion", "pausada"];

function Dashboard() {
  const { usuario } = useAuth();
  useTituloPagina(`¡Bienvenido, ${usuario?.nombre ?? "Administrador"}!`, "Resumen de tu plataforma de votaciones");

  const [datos, setDatos] = useState<Datos | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  // No hay endpoint de resumen: se arma con varias consultas. Las que fallan
  // de forma aislada no tumban el dashboard.
  const cargar = useCallback(async () => {
    setCargando(true);
    setError("");
    try {
      const [elecciones, total, activos] = await Promise.all([
        eleccionService.listar(),
        usuarioService.listar({ pagina: 1, tamano: 1 }).catch(() => null),
        usuarioService.listar({ activo: true, pagina: 1, tamano: 1 }).catch(() => null),
      ]);

      const conFase = elecciones.map((e) => ({ e, fase: faseDe(e) }));

      const pendientesRes = await Promise.allSettled(
        conFase
          .filter((x) => CON_CANDIDATURAS.includes(x.fase))
          .map(async ({ e }): Promise<Pendiente> => {
            const lista = await candidatoService.listarGestion(e.id_eleccion);
            return {
              eleccion: e,
              pendientes: lista.filter((c) => c.id_estado_candidatura === ESTADO_CANDIDATURA.PENDIENTE).length,
              retiros: lista.filter((c) => c.id_estado_candidatura === ESTADO_CANDIDATURA.RETIRO_SOLICITADO).length,
            };
          })
      );

      const participacionRes = await Promise.allSettled(
        conFase
          .filter((x) => EN_CURSO.includes(x.fase))
          .map(async ({ e }): Promise<Participacion> => {
            const r = await resultadoService.obtener(e.id_eleccion);
            return { eleccion: e, ...r.participacion };
          })
      );

      setDatos({
        elecciones,
        totalUsuarios: total?.total ?? null,
        usuariosActivos: activos?.total ?? null,
        pendientes: pendientesRes
          .flatMap((r) => (r.status === "fulfilled" ? [r.value] : []))
          .filter((p) => p.pendientes > 0 || p.retiros > 0),
        participacion: participacionRes.flatMap((r) => (r.status === "fulfilled" ? [r.value] : [])),
      });
    } catch (err) {
      setError(await mensajeError(err, "No se pudo cargar el resumen."));
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  if (cargando) return <div className="panel-box"><Cargando texto="Cargando resumen..." /></div>;

  if (error || !datos) {
    return (
      <div className="panel-box">
        <EstadoVacio icono="fa-solid fa-circle-exclamation" titulo="No se pudo cargar el resumen" descripcion={error}>
          <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => void cargar()}>Reintentar</button>
        </EstadoVacio>
      </div>
    );
  }

  const { elecciones, totalUsuarios, usuariosActivos, pendientes, participacion } = datos;

  const porFase = new Map<Fase, number>();
  for (const e of elecciones) porFase.set(faseDe(e), (porFase.get(faseDe(e)) ?? 0) + 1);
  const n = (f: Fase) => porFase.get(f) ?? 0;

  const totalPorModerar = pendientes.reduce((s, p) => s + p.pendientes + p.retiros, 0);

  return (
    <>
      <div className="stat-grid">
        <StatCard icon="fa-solid fa-check-to-slot" label="Elecciones" value={elecciones.length} />
        <StatCard icon="fa-solid fa-box-archive" label="En votación" value={n("votacion") + n("pausada")}
          delta={n("pausada") > 0 ? `${n("pausada")} en pausa` : undefined} />
        <StatCard icon="fa-solid fa-hand" label="Postulación y moderación" value={n("postulacion") + n("moderacion")} />
        <StatCard icon="fa-solid fa-users" label="Usuarios" value={totalUsuarios ?? "—"}
          delta={usuariosActivos !== null ? `${usuariosActivos} activos` : undefined} />
      </div>

      {totalPorModerar > 0 && (
        <Alerta tono="aviso">
          Tienes <strong>{totalPorModerar}</strong> {totalPorModerar === 1 ? "candidatura" : "candidaturas"} esperando tu revisión.
        </Alerta>
      )}

      <div className="dash-grid">
        <Panel title="Pendientes por moderar">
          {pendientes.length === 0 ? (
            <EstadoVacio icono="fa-solid fa-circle-check" titulo="Todo al día" descripcion="No hay candidaturas ni retiros pendientes." />
          ) : (
            <ul className="dash-lista">
              {pendientes.map((p) => (
                <li key={p.eleccion.id_eleccion}>
                  <div className="dash-item-info">
                    <strong>{p.eleccion.titulo}</strong>
                    <div className="dash-badges">
                      {p.pendientes > 0 && <Badge tone="warning">{p.pendientes} {p.pendientes === 1 ? "pendiente" : "pendientes"}</Badge>}
                      {p.retiros > 0 && <Badge tone="info">{p.retiros} {p.retiros === 1 ? "retiro solicitado" : "retiros solicitados"}</Badge>}
                    </div>
                  </div>
                  <Link to={`/admin/elecciones/${p.eleccion.id_eleccion}?tab=candidaturas`} className="btn btn-sm btn-outline-secondary">
                    Moderar
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Participación en votaciones abiertas">
          {participacion.length === 0 ? (
            <EstadoVacio icono="fa-solid fa-chart-simple" titulo="No hay votaciones abiertas" />
          ) : (
            <ul className="dash-lista">
              {participacion.map((p) => (
                <li key={p.eleccion.id_eleccion} className="dash-participacion">
                  <div className="dash-item-info">
                    <strong>{p.eleccion.titulo}</strong>
                    <small>
                      {p.votaron} de {p.habilitados} habilitados · {(Math.round(p.porcentaje * 10) / 10).toLocaleString("es-CO")}%
                    </small>
                    <ProgressBar value={p.porcentaje} tone="green" />
                  </div>
                  <Link to={`/admin/resultados/${p.eleccion.id_eleccion}`} className="btn btn-sm btn-outline-secondary">
                    Ver
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <Panel title="Elecciones por etapa" action={<Link to="/admin/elecciones" className="btn btn-sm btn-outline-secondary">Ver todas</Link>}>
        {elecciones.length === 0 ? (
          <EstadoVacio icono="fa-solid fa-check-to-slot" titulo="Aún no hay elecciones" descripcion="Crea la primera desde Elecciones." />
        ) : (
          <div className="dash-etapas">
            {ORDEN_FASES.filter((f) => n(f) > 0).map((f) => {
              const { etiqueta, tono } = infoFase(f);
              return (
                <div key={f} className="dash-etapa">
                  <Badge tone={tono}>{etiqueta}</Badge>
                  <strong>{n(f)}</strong>
                </div>
              );
            })}
          </div>
        )}
      </Panel>
    </>
  );
}

export default Dashboard;