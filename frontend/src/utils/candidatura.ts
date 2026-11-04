import { ESTADO_CANDIDATURA } from "../types/candidatura";
import type { EtapaTono } from "./etapa";

// Se decide por id_estado_candidatura, no por nombre_estado.
const INFO: Record<number, { etiqueta: string; tono: EtapaTono }> = {
  [ESTADO_CANDIDATURA.PENDIENTE]: { etiqueta: "Pendiente", tono: "warning" },
  [ESTADO_CANDIDATURA.APROBADA]: { etiqueta: "Aprobada", tono: "success" },
  [ESTADO_CANDIDATURA.RECHAZADA]: { etiqueta: "Rechazada", tono: "danger" },
  [ESTADO_CANDIDATURA.RETIRADA]: { etiqueta: "Retirada", tono: "neutral" },
  [ESTADO_CANDIDATURA.RETIRO_SOLICITADO]: { etiqueta: "Retiro solicitado", tono: "info" },
};

export function infoEstadoCandidatura(id: number, nombreRespaldo = "Desconocido") {
  return INFO[id] ?? { etiqueta: nombreRespaldo, tono: "neutral" as EtapaTono };
}