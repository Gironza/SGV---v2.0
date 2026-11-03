// Alineado con EleccionOut del openapi.json (v2.0.0).
// Fechas: strings naive, no convertir (ver utils/fechas.ts).
export type Etapa = string; // TODO(openapi): valores exactos de etapa

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