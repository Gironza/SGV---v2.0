// Alineado con el openapi.json (v2.0.0).
export type TipoCodigo = "admin" | "docente";

/** GET /codigos-invitacion/. Un código null significa desactivado. */
export interface CodigosInvitacionOut {
  codigo_admin?: string | null;
  codigo_docente?: string | null;
  fecha_actualizacion?: string | null;
}

export interface CodigoRenovadoResponse {
  success: boolean;
  message: string;
  tipo: string;
  codigo: string;
}