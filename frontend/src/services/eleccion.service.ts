import api from "./api";
import type {
  CambioEstadoResponse,
  EleccionCreadaResponse,
  EleccionCreate,
  EleccionOut,
  GraciaResponse,
  MensajeResponse,
} from "../types/eleccion";

// Se re-exporta para no romper los imports actuales de las páginas.
export type { EleccionOut };

const eleccionService = {
  listar: () => api.get<EleccionOut[]>("/elecciones/").then((r) => r.data),

  obtener: (id: number) => api.get<EleccionOut>(`/elecciones/${id}`).then((r) => r.data),

  /** Cursos disponibles para los selectores de postulación y votación. */
  listarCursos: () => api.get<string[]>("/elecciones/cursos").then((r) => r.data),

  crearEleccion: (d: EleccionCreate) =>
    api.post<EleccionCreadaResponse>("/elecciones/", d).then((r) => r.data),

  /** PUT: 409 si la elección ya inició o tiene votos. */
  actualizar: (id: number, d: EleccionCreate) =>
    api.put<MensajeResponse>(`/elecciones/${id}`, d).then((r) => r.data),

  /** DELETE: 409 si tiene votos. */
  eliminar: (id: number) =>
    api.delete<MensajeResponse>(`/elecciones/${id}`).then((r) => r.data),

  /** Extiende el cierre de la postulación (gracia). */
  ampliarPostulacion: (id: number, fecha_fin_inscripcion: string) =>
    api
      .patch<GraciaResponse>(`/elecciones/${id}/gracia`, { fecha_fin_inscripcion })
      .then((r) => r.data),

  /** Reabrir una elección vencida exige `fecha_fin`. */
  cambiarEstado: (id: number, id_estado_eleccion: number, fecha_fin?: string) =>
    api
      .patch<CambioEstadoResponse>(`/elecciones/${id}/estado`, {
        id_estado_eleccion,
        fecha_fin: fecha_fin ?? null,
      })
      .then((r) => r.data),

  /** null = quitar la publicación de resultados. */
  actualizarPublicacion: (id: number, fecha_publicacion_resultados: string | null) =>
    api
      .patch<MensajeResponse>(`/elecciones/${id}/publicacion`, { fecha_publicacion_resultados })
      .then((r) => r.data),

  /** @deprecated Firma vieja (sin fechas de inscripción). La usa Admin.tsx
   *  hasta que el dashboard se reemplace en la etapa 1I. */
  crear: (d: { titulo: string; descripcion?: string; fecha_inicio: string; fecha_fin: string }) =>
    api.post("/elecciones/", d).then((r) => r.data),
};

export default eleccionService;