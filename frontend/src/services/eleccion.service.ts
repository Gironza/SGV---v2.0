import api from "./api";
import type { EleccionOut } from "../types/eleccion";

// Se re-exporta para no romper los imports actuales de las páginas.
export type { EleccionOut };

const eleccionService = {
  listar: () => api.get<EleccionOut[]>("/elecciones/").then((r) => r.data),

  // Se reemplaza en la etapa 1A (crear con las 4 fechas y cursos).
  crear: (d: { titulo: string; descripcion?: string; fecha_inicio: string; fecha_fin: string }) =>
    api.post("/elecciones/", d).then((r) => r.data),

  cambiarEstado: (id: number, id_estado_eleccion: number) =>
    api.patch(`/elecciones/${id}/estado`, { id_estado_eleccion }).then((r) => r.data),

  eliminar: (id: number) => api.delete(`/elecciones/${id}`).then((r) => r.data),
};

export default eleccionService;