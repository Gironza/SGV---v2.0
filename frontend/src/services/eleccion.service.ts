import api from "./api";

export interface EleccionOut {
  id_eleccion: number;
  titulo: string;
  descripcion?: string | null;
  fecha_inicio: string;
  fecha_fin: string;
  id_estado_eleccion: number;
  nombre_estado: string;
}

const eleccionService = {
  listar: () =>
    api.get<EleccionOut[]>("/elecciones").then((r) => r.data),

  crear: (d: { titulo: string; descripcion?: string; fecha_inicio: string; fecha_fin: string }) =>
    api.post("/elecciones", d).then((r) => r.data),

  cambiarEstado: (id: number, id_estado_eleccion: number) =>
    api.patch(`/elecciones/${id}/estado`, { id_estado_eleccion }).then((r) => r.data),

  eliminar: (id: number) =>
    api.delete(`/elecciones/${id}`).then((r) => r.data),
};

export default eleccionService;