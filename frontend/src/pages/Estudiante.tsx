import { useEffect, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "@fortawesome/fontawesome-free/css/all.min.css";
import "../styles/styles.css";
import "../styles/app-shell.css";

import { useAuth } from "../context/AuthContext";
import eleccionService, { type EleccionOut } from "../services/eleccion.service";
import votoService, { type CandidatoVotacionOut } from "../services/voto.service";
import resultadoService, { type ResultadoEleccionOut } from "../services/resultado.service";
import candidatoService from "../services/candidato.service";

import DashboardLayout from "../components/layout/DashboardLayout";
import StatCard from "../components/ui/StatCard";
import Panel from "../components/ui/Panel";
import DataTable from "../components/ui/DataTable";
import Badge from "../components/ui/Badge";
import AccentButton from "../components/ui/AccentButton";
import { estadoEleccionTone } from "../utils/estado";

// F17-F20: emitir voto único con confirmación (RN14/RN21).
// F13/F16: inscribir/retirar candidatura — aquí mismo, porque un
// Candidato ES un Estudiante (no hay rol aparte, ver types/index.ts).
function Estudiante() {
  const { usuario } = useAuth();

  const [elecciones, setElecciones] = useState<EleccionOut[]>([]);
  const [cargando, setCargando] = useState(true);
  const [seleccion, setSeleccion] = useState<EleccionOut | null>(null);
  const [candidatos, setCandidatos] = useState<CandidatoVotacionOut[]>([]);
  const [yaVoto, setYaVoto] = useState(false);
  const [resultado, setResultado] = useState<ResultadoEleccionOut | null>(null);
  const [mensaje, setMensaje] = useState("");

  // clave: id_eleccion, valor: id_candidato — solo dura la sesión porque
  // el backend todavía no expone "mis candidaturas", solo inscribir/retirar.
  const [misCandidaturas, setMisCandidaturas] = useState<Record<number, number>>({});

  useEffect(() => {
    eleccionService
      .listar()
      .then(setElecciones)
      .finally(() => setCargando(false));
  }, []);

  async function abrirEleccion(e: EleccionOut) {
    setSeleccion(e);
    setResultado(null);
    setMensaje("");
    const estado = await votoService.estado(e.id_eleccion);
    setYaVoto(estado.ya_voto);
    if (estado.ya_voto) {
      resultadoService.obtener(e.id_eleccion).then(setResultado);
    } else {
      votoService.candidatos(e.id_eleccion).then(setCandidatos);
    }
  }

  async function votar(idCandidato: number | null) {
    if (!seleccion) return;
    try {
      const r = await votoService.votar(seleccion.id_eleccion, idCandidato);
      setMensaje(`Voto registrado. Certificado: ${r.codigo_certificado}`);
      setYaVoto(true);
      resultadoService.obtener(seleccion.id_eleccion).then(setResultado);
    } catch (err: any) {
      setMensaje(err.response?.data?.detail || "Error al votar.");
    }
  }

  async function postularme(idEleccion: number) {
    try {
      const r: any = await candidatoService.inscribir(idEleccion);
      setMisCandidaturas((prev) => ({ ...prev, [idEleccion]: r.id_candidato }));
    } catch (err: any) {
      alert(err.response?.data?.detail || "No se pudo inscribir la candidatura.");
    }
  }

  async function retirarCandidatura(idEleccion: number) {
    const idCandidato = misCandidaturas[idEleccion];
    try {
      await candidatoService.retirar(idCandidato);
      setMisCandidaturas((prev) => {
        const copia = { ...prev };
        delete copia[idEleccion];
        return copia;
      });
    } catch (err: any) {
      alert(err.response?.data?.detail || "No se pudo retirar (¿ya tiene votos?).");
    }
  }

  const activas = elecciones.filter((e) => e.nombre_estado === "Activa").length;

  return (
    <DashboardLayout
      rol="estudiante"
      titulo={`¡Hola, ${usuario?.nombre ?? "Estudiante"}!`}
      subtitulo="Participa en las votaciones de tu institución."
      usuario={{ nombre: `${usuario?.nombre ?? ""} ${usuario?.apellido ?? ""}`.trim(), correo: usuario?.correo ?? "" }}
    >
      <div className="stat-grid">
        <StatCard icon="fa-solid fa-box-ballot" label="Votaciones activas" value={activas} />
        <StatCard icon="fa-solid fa-list" label="Total de votaciones" value={elecciones.length} />
      </div>

      {!seleccion && (
        <Panel title="Votaciones de tu institución">
          {cargando ? (
            <p style={{ color: "var(--sgv-muted)" }}>Cargando...</p>
          ) : elecciones.length === 0 ? (
            <p style={{ color: "var(--sgv-muted)" }}>Todavía no hay votaciones creadas.</p>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 14 }}>
              {elecciones.map((e) => (
                <div key={e.id_eleccion} className="panel-box" style={{ padding: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 8 }}>
                    <h4 style={{ fontSize: 15, fontWeight: 700 }}>{e.titulo}</h4>
                    <Badge tone={estadoEleccionTone(e.nombre_estado)}>{e.nombre_estado}</Badge>
                  </div>
                  <p style={{ fontSize: 13, color: "var(--sgv-muted)", marginBottom: 12 }}>
                    Cierra: {new Date(e.fecha_fin).toLocaleString()}
                  </p>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <AccentButton tone="blue" onClick={() => abrirEleccion(e)}>
                      Ver / Votar
                    </AccentButton>
                    {misCandidaturas[e.id_eleccion] ? (
                      <button className="btn btn-sm btn-outline-danger" onClick={() => retirarCandidatura(e.id_eleccion)}>
                        Retirar candidatura
                      </button>
                    ) : (
                      <button className="btn btn-sm btn-outline-success" onClick={() => postularme(e.id_eleccion)}>
                        Postularme
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>
      )}

      {seleccion && (
        <Panel
          title={seleccion.titulo}
          action={
            <button className="btn btn-sm btn-outline-secondary" onClick={() => setSeleccion(null)}>
              ← Volver
            </button>
          }
        >
          {mensaje && (
            <div className="alert alert-info" role="alert">
              {mensaje}
            </div>
          )}

          {!yaVoto && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 14 }}>
              {candidatos.map((c) => (
                <div key={c.id_candidato} className="panel-box" style={{ padding: 16 }}>
                  <h5 style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>
                    {c.nombre} {c.apellido}
                  </h5>
                  <p style={{ fontSize: 13, color: "var(--sgv-muted)", marginBottom: 12 }}>{c.propuesta || "Sin propuesta cargada."}</p>
                  <AccentButton tone="green" onClick={() => votar(c.id_candidato)}>
                    Votar
                  </AccentButton>
                </div>
              ))}
              <div className="panel-box" style={{ padding: 16 }}>
                <h5 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Voto en blanco</h5>
                <button className="btn btn-outline-secondary" onClick={() => votar(null)}>
                  Votar en blanco
                </button>
              </div>
            </div>
          )}

          {yaVoto && resultado && (
            <div>
              <h4 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>Resultados ({resultado.nombre_estado})</h4>
              <DataTable
                columns={[
                  { header: "Candidato", render: (c: (typeof resultado.candidatos)[number]) => `${c.nombre} ${c.apellido}` },
                  { header: "Votos", render: (c: (typeof resultado.candidatos)[number]) => c.total_votos },
                ]}
                rows={resultado.candidatos}
                rowKey={(c) => String(c.id_candidato)}
              />
              <p style={{ marginTop: 10, fontSize: 13, color: "var(--sgv-muted)" }}>Votos en blanco: {resultado.votos_blancos}</p>
              {resultado.ganador && (
                <p style={{ marginTop: 6 }}>
                  <strong>Ganador:</strong> {resultado.ganador}
                </p>
              )}
            </div>
          )}
        </Panel>
      )}
    </DashboardLayout>
  );
}

export default Estudiante;
