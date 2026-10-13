import { useEffect, useState, type FormEvent } from "react";
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
import AccentButton from "../components/ui/AccentButton";
import { estadoEleccionTone } from "../utils/estado";

// F09/F10/F21: crear, listar, cambiar estado y consultar elecciones.
// Todo lo que se ve aquí viene de GET/POST/PATCH/DELETE /elecciones
// del backend real — no hay datos inventados en este panel.
function Admin() {
  const { usuario } = useAuth();

  const [elecciones, setElecciones] = useState<EleccionOut[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [creando, setCreando] = useState(false);

  function cargarElecciones() {
    setCargando(true);
    eleccionService
      .listar()
      .then(setElecciones)
      .catch(() => setError("No se pudieron cargar las elecciones."))
      .finally(() => setCargando(false));
  }

  useEffect(cargarElecciones, []);

  async function crearEleccion(e: FormEvent) {
    e.preventDefault();
    setError("");
    setCreando(true);
    try {
      await eleccionService.crear({ titulo, descripcion, fecha_inicio: fechaInicio, fecha_fin: fechaFin });
      setTitulo("");
      setDescripcion("");
      setFechaInicio("");
      setFechaFin("");
      cargarElecciones();
    } catch (err: any) {
      setError(err.response?.data?.detail || "No se pudo crear la elección.");
    } finally {
      setCreando(false);
    }
  }

  async function cambiarEstado(id: number, id_estado_eleccion: number) {
    await eleccionService.cambiarEstado(id, id_estado_eleccion);
    cargarElecciones();
  }

  async function eliminarEleccion(id: number) {
    if (!confirm("¿Eliminar esta elección? Esto borra también sus votos y registros.")) return;
    await eleccionService.eliminar(id);
    cargarElecciones();
  }

  const activas = elecciones.filter((e) => e.nombre_estado === "Activa").length;
  const finalizadas = elecciones.filter((e) => e.nombre_estado === "Finalizada").length;
  const pendientes = elecciones.filter((e) => e.nombre_estado === "Pendiente").length;

  const columns: Column<EleccionOut>[] = [
    { header: "ID", render: (e) => e.id_eleccion },
    { header: "Título", render: (e) => e.titulo },
    { header: "Estado", render: (e) => <Badge tone={estadoEleccionTone(e.nombre_estado)}>{e.nombre_estado}</Badge> },
    { header: "Cierra", render: (e) => new Date(e.fecha_fin).toLocaleString() },
    {
      header: "Acciones",
      render: (e) => (
        <div style={{ display: "flex", gap: 8 }}>
          {e.id_estado_eleccion !== 1 && (
            <button className="btn btn-sm btn-outline-success" onClick={() => cambiarEstado(e.id_eleccion, 1)}>
              Activar
            </button>
          )}
          {e.id_estado_eleccion !== 2 && (
            <button className="btn btn-sm btn-outline-secondary" onClick={() => cambiarEstado(e.id_eleccion, 2)}>
              Finalizar
            </button>
          )}
          <button className="btn btn-sm btn-outline-danger" onClick={() => eliminarEleccion(e.id_eleccion)}>
            Eliminar
          </button>
        </div>
      ),
    },
  ];

  return (
    <DashboardLayout
      rol="admin"
      titulo={`¡Bienvenido, ${usuario?.nombre ?? "Administrador"}!`}
      subtitulo="Aquí tienes un resumen general de la actividad en tu institución."
      usuario={{ nombre: `${usuario?.nombre ?? ""} ${usuario?.apellido ?? ""}`.trim(), correo: usuario?.correo ?? "" }}
    >
      <div className="stat-grid">
        <StatCard icon="fa-solid fa-box-ballot" label="Votaciones activas" value={activas} />
        <StatCard icon="fa-solid fa-hourglass-half" label="Pendientes" value={pendientes} />
        <StatCard icon="fa-solid fa-circle-check" label="Finalizadas" value={finalizadas} />
        <StatCard icon="fa-solid fa-list" label="Total de votaciones" value={elecciones.length} />
      </div>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      {/* F09: crear y configurar elección */}
      <Panel title="Crear elección">
        <form onSubmit={crearEleccion} style={{ display: "grid", gap: 12, maxWidth: 560 }}>
          <input
            className="form-control"
            placeholder="Título de la elección"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            required
          />
          <input
            className="form-control"
            placeholder="Descripción (opcional)"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
          />
          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ flex: 1 }}>
              <label className="form-label" style={{ fontSize: 13 }}>Fecha y hora de inicio</label>
              <input
                type="datetime-local"
                className="form-control"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
                required
              />
            </div>
            <div style={{ flex: 1 }}>
              <label className="form-label" style={{ fontSize: 13 }}>Fecha y hora de cierre</label>
              <input
                type="datetime-local"
                className="form-control"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
                required
              />
            </div>
          </div>
          <div>
            <AccentButton tone="violet" type="submit">
              {creando ? "Creando..." : "Crear elección"}
            </AccentButton>
          </div>
        </form>
      </Panel>

      <Panel title="Elecciones de la institución">
        {cargando ? (
          <p style={{ color: "var(--sgv-muted)" }}>Cargando...</p>
        ) : (
          <DataTable columns={columns} rows={elecciones} rowKey={(e) => String(e.id_eleccion)} emptyMessage="Aún no has creado ninguna elección." />
        )}
      </Panel>
    </DashboardLayout>
  );
}

export default Admin;
