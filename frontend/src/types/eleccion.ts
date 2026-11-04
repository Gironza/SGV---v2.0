// Alineado con el openapi.json (v2.0.0).
// Fechas: strings naive, no convertir (ver utils/fechas.ts).
export type Etapa = string; // TODO: confirmar todos los valores (visto: "postulacion")

export interface EleccionOut {
  id_eleccion: number;
  titulo: string;
  descripcion?: string | null;
  fecha_inicio_inscripcion?: string | null;
  fecha_fin_inscripcion?: string | null;
  fecha_inicio: string;
  fecha_fin: string;
  fecha_publicacion_resultados?: string | null;
  etapa: Etapa;
  id_estado_eleccion: number;
  nombre_estado: string; // legado: no usar para decidir pantallas
  cursos_postulacion: string[];
  cursos_votacion: string[];
}

/** Cuerpo de POST /elecciones/ y PUT /elecciones/{id} (EleccionCreate/Update). */
export interface EleccionCreate {
  titulo: string; // 1-150 caracteres
  descripcion?: string | null;
  fecha_inicio_inscripcion: string;
  fecha_fin_inscripcion: string;
  fecha_inicio: string;
  fecha_fin: string;
  cursos_postulacion?: string[] | null;
  cursos_votacion?: string[] | null;
}

export interface EleccionCreadaResponse {
  success: boolean;
  message: string;
  id_eleccion: number;
}

export interface MensajeResponse {
  success: boolean;
  message: string;
}

export interface GraciaResponse extends MensajeResponse {
  fecha_fin_inscripcion: string;
  etapa: string;
}

export interface CambioEstadoResponse extends MensajeResponse {
  etapa: string;
}

// estados_eleccion. Ids tomados del Admin.tsx anterior (1 = Activa,
// 2 = Finalizada). TODO: confirmar con el seed del backend (¿3 = Pendiente?).
export const ESTADO_ELECCION = {
  ACTIVA: 1,
  FINALIZADA: 2,
} as const;