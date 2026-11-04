// estados_candidatura (seed del backend). Se decide por id; el nombre
// viene como `nombre_estado` en CandidaturaDetalleOut solo para mostrar.
export const ESTADO_CANDIDATURA = {
  PENDIENTE: 1,
  APROBADA: 2,
  RECHAZADA: 3,
  RETIRADA: 4,
  RETIRO_SOLICITADO: 5,
} as const;

export type EstadoCandidaturaId =
  (typeof ESTADO_CANDIDATURA)[keyof typeof ESTADO_CANDIDATURA];

/** CandidaturaDetalleOut: GET /candidatos/eleccion/{id}/gestion */
export interface CandidaturaDetalleOut {
  id_candidato: number;
  id_eleccion: number;
  nombre: string;
  apellido: string;
  propuesta?: string | null;
  foto?: string | null;
  id_estado_candidatura: number;
  nombre_estado: string;
  observaciones?: string | null;
}