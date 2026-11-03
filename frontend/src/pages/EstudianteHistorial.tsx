import { useEffect, useState } from "react";
import { useTituloPagina } from "../context/PaginaContext";
import eleccionService, { type EleccionOut } from "../services/eleccion.service";
import resultadoService, { type ResultadoEleccionOut } from "../services/resultado.service";
import Panel from "../components/ui/Panel";
import DataTable from "../components/ui/DataTable";
import AccentButton from "../components/ui/AccentButton";
import { esFinalizada } from "../utils/etapa";
import { formatearFecha } from "../utils/fechas";
import { mensajeError } from "../utils/errores";

// Versión simple del historial: elecciones finalizadas + sus resultados.
// La etapa 3D la reemplaza (certificado PDF, resultados publicados, etc.).
function EstudianteHistorial() {
  useTituloPagina("Mi historial", "Votaciones finalizadas");

  const [elecciones, setElecciones] = useState<EleccionOut[]>([]);
  const [cargando, setCargando] = useState(true);
  const [abierta, setAbierta] = useState<number | null>(null);
  const [resultado, setResultado] = useState<ResultadoEleccionOut | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    eleccionService
      .listar()
      .then((lista) => setElecciones(lista.filter(esFinalizada)))
      .catch(async (err) => setError(await mensajeError(err)))
      .finally(() => setCargando(false));
  }, []);

  async function verResultados(id: number) {
    setError("");
    setResultado(null);
    setAbierta(id);
    try {
      setResultado(await resultadoService.obtener(id));
    } catch (err) {
      setError(await mensajeError(err));
    }
  }

  return (
    <Panel title="Votaciones finalizadas">
      {error && <div className="alert alert-warning" role="alert">{error}</div>}

      {cargando ? (
        <p style={{ color: "var(--sgv-muted)" }}>Cargando...</p>
      ) : elecciones.length === 0 ? (
        <p style={{ color: "var(--sgv-muted)" }}>Aún no hay votaciones finalizadas.</p>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 14 }}>
          {elecciones.map((e) => (
            <div key={e.id_eleccion} className="panel-box" style={{ padding: 16 }}>
              <h4 style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>{e.titulo}</h4>
              <p style={{ fontSize: 13, color: "var(--sgv-muted)", marginBottom: 12 }}>
                Cerró: {formatearFecha(e.fecha_fin)}
              </p>
              <AccentButton tone="blue" onClick={() => verResultados(e.id_eleccion)}>
                Ver resultados
              </AccentButton>
            </div>
          ))}
        </div>
      )}

      {abierta !== null && resultado && (
        <div style={{ marginTop: 24 }}>
          <h4 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>Resultados</h4>
          <DataTable
            columns={[
              { header: "Candidato", render: (c: (typeof resultado.candidatos)[number]) => `${c.nombre} ${c.apellido}` },
              { header: "Votos", render: (c: (typeof resultado.candidatos)[number]) => c.total_votos },
            ]}
            rows={resultado.candidatos}
            rowKey={(c) => String(c.id_candidato)}
          />
          <p style={{ marginTop: 10, fontSize: 13, color: "var(--sgv-muted)" }}>
            Votos en blanco: {resultado.votos_blancos}
          </p>
          {resultado.ganador && (
            <p style={{ marginTop: 6 }}>
              <strong>Ganador:</strong> {resultado.ganador}
            </p>
          )}
        </div>
      )}
    </Panel>
  );
}

export default EstudianteHistorial;