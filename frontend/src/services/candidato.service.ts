import api from "./api";
import type { CandidaturaDetalleOut } from "../types/candidatura";
import type { MensajeResponse } from "../types/eleccion";

const candidatoService = {
  // ---- Moderación (admin y docente) ----
  /** Todas las candidaturas de la elección, con su estado y observaciones. */
  listarGestion: (idEleccion: number) =>
    api.get<CandidaturaDetalleOut[]>(`/candidatos/eleccion/${idEleccion}/gestion`).then((r) => r.data),

  /** Cambia el estado (2 aprobar, 3 rechazar). El rechazo solo es posible
   *  antes de que empiece la votación (lo valida el backend). */
  revisar: (idCandidato: number, id_estado_candidatura: number, observaciones?: string) =>
    api
      .patch<MensajeResponse>(`/candidatos/${idCandidato}/revisar`, { id_estado_candidatura, observaciones })
      .then((r) => r.data),

  actualizarObservaciones: (idCandidato: number, observaciones: string) =>
    api.patch<MensajeResponse>(`/candidatos/${idCandidato}/observaciones`, { observaciones }).then((r) => r.data),

  /** Resuelve un retiro solicitado: aprobar = true la retira. */
  resolverRetiro: (idCandidato: number, aprobar: boolean) =>
    api.patch<MensajeResponse>(`/candidatos/${idCandidato}/retiro`, { aprobar }).then((r) => r.data),

  // ---- Estudiante (se reemplaza en la fase 3) ----
  /** @deprecated El backend ya no acepta `propuesta` al inscribir. */
  inscribir: (id_eleccion: number, propuesta?: string) =>
    api.post("/candidatos", { id_eleccion, propuesta }).then((r) => r.data),

  /** @deprecated El retiro ahora es POST /candidatos/{id}/retiro (solicitud). */
  retirar: (id_candidato: number) => api.delete(`/candidatos/${id_candidato}`).then((r) => r.data),
};

export default candidatoService;