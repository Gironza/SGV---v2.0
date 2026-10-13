import api from "./api";

export interface CandidatoResultadoOut {
  id_candidato: number; nombre: string; apellido: string;
  propuesta?: string | null; foto?: string | null; total_votos: number;
}
export interface ResultadoEleccionOut {
  titulo_eleccion: string; nombre_estado: string;
  candidatos: CandidatoResultadoOut[]; votos_blancos: number;
  total_votos: number; ganador?: string | null;
}

const resultadoService = {
  obtener: (idEleccion: number) =>
    api.get<ResultadoEleccionOut>(`/resultados/${idEleccion}`).then(r => r.data),
};
export default resultadoService;