// Alineado con el openapi.json (v2.0.0).

/** GET /votacion/{id}/estado */
export interface EstadoVotoResponse {
  ya_voto: boolean;
  etapa: string;
  curso_habilitado: boolean;
}

/** GET /votacion/disponibles */
export interface EleccionDisponibleOut {
  id_eleccion: number;
  titulo: string;
  descripcion?: string | null;
  fecha_inicio: string;
  fecha_fin: string;
  etapa: string;
  ya_voto: boolean;
}

/** POST /votacion/votar */
export interface VotoConfirmadoResponse {
  message: string;
  codigo_certificado: string;
  fecha_voto: string;
}

/** GET /votacion/historial: elecciones en las que votó el estudiante. */
export interface HistorialVotoOut {
  id_eleccion: number;
  titulo: string;
  fecha_voto?: string | null;
  codigo_certificado?: string | null;
}

/** GET /candidatos/eleccion/{id}: el tarjetón sale de aquí. */
export interface CandidatoOut {
  id_candidato: number;
  nombre: string;
  apellido: string;
  propuesta?: string | null;
  foto?: string | null;
}