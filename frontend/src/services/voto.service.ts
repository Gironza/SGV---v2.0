import api from "./api";

export interface CandidatoVotacionOut {
  id_candidato: number;
  nombre: string;
  apellido: string;
  propuesta?: string | null;
  foto?: string | null;
}
export interface VotoConfirmadoResponse {
  message: string;
  codigo_certificado: string;
  fecha_voto: string;
}

const votoService = {
  candidatos: (idEleccion: number) =>
    api.get<CandidatoVotacionOut[]>(`/votacion/${idEleccion}/candidatos`).then(r => r.data),
  estado: (idEleccion: number) =>
    api.get<{ ya_voto: boolean }>(`/votacion/${idEleccion}/estado`).then(r => r.data),
  votar: (idEleccion: number, idCandidato: number | null) =>
    api.post<VotoConfirmadoResponse>("/votacion/votar", { id_eleccion: idEleccion, id_candidato: idCandidato }).then(r => r.data),
};
export default votoService;