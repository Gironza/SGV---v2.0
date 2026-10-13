import { useEffect, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "@fortawesome/fontawesome-free/css/all.min.css";
import "../styles/styles.css";
import "../styles/app-shell.css";

import { useAuth } from "../context/AuthContext";
import eleccionService, { type EleccionOut } from "../services/eleccion.service";

import DashboardLayout from "../components/layout/DashboardLayout";
import StatCard from "../components/ui/StatCard";
import Panel from "../components/ui/Panel";
import DataTable, { type Column } from "../components/ui/DataTable";
import Badge from "../components/ui/Badge";
import { estadoEleccionTone } from "../utils/estado";

// GET /elecciones no exige rol específico (solo estar autenticado), así
// que el Docente ya puede ver las elecciones de su institución hoy mismo.
// Lo que SÍ falta en el backend es la parte de F26 (gestionar candidaturas
// como docente) y la creación de votaciones desde este rol — por ahora
// crear_eleccion en el backend exige requerir_rol(1), solo Administrador.
function Docente() {
  const { usuario } = useAuth();
  const [elecciones, setElecciones] = useState<EleccionOut[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    eleccionService
      .listar()
      .then(setElecciones)
      .finally(() => setCargando(false));
  }, []);

  const activas = elecciones.filter((e) => e.nombre_estado === "Activa").length;

  const columns: Column<EleccionOut>[] = [
    { header: "Votación", render: (e) => e.titulo },
    { header: "Estado", render: (e) => <Badge tone={estadoEleccionTone(e.nombre_estado)}>{e.nombre_estado}</Badge> },
    { header: "Cierra", render: (e) => new Date(e.fecha_fin).toLocaleString() },
  ];

  return (
    <DashboardLayout
      rol="docente"
      titulo={`¡Bienvenido, ${usuario?.nombre ?? "Docente"}!`}
      subtitulo="Consulta las votaciones activas en tu institución."
      usuario={{ nombre: `${usuario?.nombre ?? ""} ${usuario?.apellido ?? ""}`.trim(), correo: usuario?.correo ?? "" }}
    >
      <div className="stat-grid">
        <StatCard icon="fa-solid fa-box-ballot" label="Votaciones activas" value={activas} />
        <StatCard icon="fa-solid fa-list" label="Total de votaciones" value={elecciones.length} />
      </div>

      <Panel title="Votaciones de la institución">
        {cargando ? (
          <p style={{ color: "var(--sgv-muted)" }}>Cargando...</p>
        ) : (
          <DataTable columns={columns} rows={elecciones} rowKey={(e) => String(e.id_eleccion)} emptyMessage="Aún no hay votaciones creadas." />
        )}
      </Panel>

      <Panel title="Gestión de candidaturas">
        <p style={{ color: "var(--sgv-muted)" }}>
          Esta sección corresponde a F26 (aprobar/rechazar candidaturas). El backend
          todavía no tiene un endpoint para eso — hoy los estudiantes se inscriben
          directamente como candidatos sin pasar por aprobación docente. Cuando se
          agregue esa ruta en el backend, este panel es el único lugar que hay que
          conectar.
        </p>
      </Panel>
    </DashboardLayout>
  );
}

export default Docente;
