// Alineado con el openapi.json (v2.0.0).
export interface ParticipacionOut {
  habilitados: number;
  votaron: number;
  porcentaje: number;
}

export interface CandidatoResultadoOut {
  id_candidato: number;
  nombre: string;
  apellido: string;
  propuesta?: string | null;
  foto?: string | null;
  total_votos: number;
  porcentaje: number;
}

/** GET /resultados/{id}. Con empate, `ganador` es null y `empatados` lista los nombres. */
export interface ResultadoEleccionOut {
  titulo_eleccion: string;
  etapa: string;
  candidatos: CandidatoResultadoOut[];
  votos_blancos: number;
  total_votos: number;
  participacion: ParticipacionOut;
  ganador?: string | null;
  empatados?: string[];
  /** Campo del backend anterior; solo lo lee el Estudiante.tsx viejo. */
  nombre_estado?: string;
}

export interface ParticipacionCursoOut extends ParticipacionOut {
  curso: string;
}

/** GET /resultados/{id}/estadisticas */
export interface EstadisticasEleccionOut {
  titulo_eleccion: string;
  etapa: string;
  participacion: ParticipacionOut;
  por_curso: ParticipacionCursoOut[];
  total_votos: number;
  votos_validos: number;
  votos_blancos: number;
  porcentaje_blancos: number;
}