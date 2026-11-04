import api from "./api";
import { descargarArchivo } from "../utils/descargas";
import type { MensajeResponse } from "../types/eleccion";
import type {
  CargaMasivaResponse,
  EstadoUsuarioResponse,
  EstudianteCreate,
  FiltrosUsuarios,
  UsuarioCreadoResponse,
  UsuarioListaOut,
  UsuarioOut,
  UsuarioUpdate,
} from "../types/usuario";

const usuarioService = {
  listar: (f: FiltrosUsuarios) =>
    api.get<UsuarioListaOut>("/usuarios/", { params: f }).then((r) => r.data),

  obtener: (id: number) => api.get<UsuarioOut>(`/usuarios/${id}`).then((r) => r.data),

  crearEstudiante: (d: EstudianteCreate) =>
    api.post<UsuarioCreadoResponse>("/usuarios/", d).then((r) => r.data),

  actualizar: (id: number, d: UsuarioUpdate) =>
    api.put<UsuarioOut>(`/usuarios/${id}`, d).then((r) => r.data),

  /** 409 si tiene historial (votos o candidaturas): ofrecer desactivar. */
  eliminar: (id: number) => api.delete<MensajeResponse>(`/usuarios/${id}`).then((r) => r.data),

  cambiarEstado: (id: number, activo: boolean) =>
    api.patch<EstadoUsuarioResponse>(`/usuarios/${id}/estado`, { activo }).then((r) => r.data),

  cambiarCurso: (id: number, curso: string) =>
    api.patch<UsuarioOut>(`/usuarios/${id}/curso`, { curso }).then((r) => r.data),

  /** Plantilla CSV con las columnas que espera la carga masiva. */
  descargarPlantilla: () =>
    descargarArchivo("/usuarios/carga-masiva/plantilla", undefined, "plantilla-usuarios.csv"),

  /** Sube el CSV: FormData con el campo "archivo". */
  cargaMasiva: (archivo: File) => {
    const datos = new FormData();
    datos.append("archivo", archivo);
    return api
      .post<CargaMasivaResponse>("/usuarios/carga-masiva", datos, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((r) => r.data);
  },
};

export default usuarioService;