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