import api from "./api";
import type {
  CandidatoOut,
  EleccionDisponibleOut,
  EstadoVotoResponse,
  VotoConfirmadoResponse,
} from "../types/votacion";

// Se re-exportan para no romper imports antiguos.
export type { VotoConfirmadoResponse };
export type CandidatoVotacionOut = CandidatoOut;

const votoService = {
  estado: (idEleccion: number) =>
    api.get<EstadoVotoResponse>(`/votacion/${idEleccion}/estado`).then((r) => r.data),

  disponibles: () => api.get<EleccionDisponibleOut[]>("/votacion/disponibles").then((r) => r.data),

  /** id_candidato = null es voto en blanco. */
  votar: (idEleccion: number, idCandidato: number | null) =>
    api
      .post<VotoConfirmadoResponse>("/votacion/votar", { id_eleccion: idEleccion, id_candidato: idCandidato })
      .then((r) => r.data),

  /** @deprecated Ya no existe en el backend; el tarjetón usa
   *  candidatoService.listarPorEleccion. Lo usa solo el Estudiante.tsx viejo. */
  candidatos: (idEleccion: number) =>
    api.get<CandidatoOut[]>(`/votacion/${idEleccion}/candidatos`).then((r) => r.data),
};

export default votoService;