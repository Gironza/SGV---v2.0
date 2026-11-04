import api from "./api";
import type { CandidaturaDetalleOut } from "../types/candidatura";
import type { CandidatoOut } from "../types/votacion";
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

  // ---- Estudiante ----
  /** Candidaturas visibles de la elección (para ver candidatos y el tarjetón). */
  listarPorEleccion: (idEleccion: number) =>
    api.get<CandidatoOut[]>(`/candidatos/eleccion/${idEleccion}`).then((r) => r.data),

  /** Mi candidatura en la elección. Si no tengo, el backend responde 404. */
  miCandidatura: (idEleccion: number) =>
    api.get<CandidaturaDetalleOut>(`/candidatos/mia/${idEleccion}`).then((r) => r.data),

  /** Postulación de un clic. */
  postularme: (id_eleccion: number) =>
    api.post<{ message: string; id_candidato: number }>("/candidatos/", { id_eleccion }).then((r) => r.data),

  /** El retiro es una solicitud: queda "Retiro solicitado" hasta que el
   *  admin o docente la resuelva. */
  solicitarRetiro: (idCandidato: number) =>
    api.post<MensajeResponse>(`/candidatos/${idCandidato}/retiro`).then((r) => r.data),

  // ---- Antiguos (los usa el Estudiante.tsx viejo; se pueden borrar con él) ----
  /** @deprecated El backend ya no acepta `propuesta` al inscribir. */
  inscribir: (id_eleccion: number, propuesta?: string) =>
    api.post("/candidatos", { id_eleccion, propuesta }).then((r) => r.data),

  /** @deprecated El retiro ahora es POST /candidatos/{id}/retiro (solicitud). */
  retirar: (id_candidato: number) => api.delete(`/candidatos/${id_candidato}`).then((r) => r.data),
};

export default candidatoService;