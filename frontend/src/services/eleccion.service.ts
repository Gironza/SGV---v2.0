import api from "./api";
import type { EleccionCreadaResponse, EleccionCreate, EleccionOut } from "../types/eleccion";

// Se re-exporta para no romper los imports actuales de las páginas.
export type { EleccionOut };

const eleccionService = {
  listar: () => api.get<EleccionOut[]>("/elecciones/").then((r) => r.data),

  obtener: (id: number) => api.get<EleccionOut>(`/elecciones/${id}`).then((r) => r.data),

  /** Cursos disponibles para los selectores de postulación y votación. */
  listarCursos: () => api.get<string[]>("/elecciones/cursos").then((r) => r.data),

  crearEleccion: (d: EleccionCreate) =>
    api.post<EleccionCreadaResponse>("/elecciones/", d).then((r) => r.data),

  /** @deprecated Firma vieja (sin fechas de inscripción). La usa Admin.tsx
   *  hasta que el dashboard se reemplace en la etapa 1I. */
  crear: (d: { titulo: string; descripcion?: string; fecha_inicio: string; fecha_fin: string }) =>
    api.post("/elecciones/", d).then((r) => r.data),

  cambiarEstado: (id: number, id_estado_eleccion: number) =>
    api.patch(`/elecciones/${id}/estado`, { id_estado_eleccion }).then((r) => r.data),

  eliminar: (id: number) => api.delete(`/elecciones/${id}`).then((r) => r.data),
};

export default eleccionService;