import api from "./api";
import type { MensajeResponse } from "../types/eleccion";
import type { CodigoRenovadoResponse, CodigosInvitacionOut, TipoCodigo } from "../types/institucion";

const institucionService = {
  verCodigos: () => api.get<CodigosInvitacionOut>("/codigos-invitacion/").then((r) => r.data),

  /** Genera un código nuevo; el anterior deja de servir. */
  renovar: (tipo: TipoCodigo) =>
    api.post<CodigoRenovadoResponse>(`/codigos-invitacion/${tipo}/renovar`).then((r) => r.data),

  /** Desactiva el código: nadie podrá registrarse con él hasta renovarlo. */
  desactivar: (tipo: TipoCodigo) =>
    api.delete<MensajeResponse>(`/codigos-invitacion/${tipo}`).then((r) => r.data),
};

export default institucionService;