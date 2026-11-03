// Las pantallas se deciden por `etapa`, no por `nombre_estado`.
// TODO(openapi): el contrato no lista los valores de `etapa`.
// Confirmar con un GET /elecciones en Swagger y ajustar ETAPAS.

export type EtapaTono = "success" | "warning" | "neutral" | "info" | "danger";

export interface EtapaInfo {
  etiqueta: string;
  tono: EtapaTono;
}

const ETAPAS: Record<string, EtapaInfo> = {
  // clave = etapa normalizada (minúsculas, sin tildes)
  pendiente: { etiqueta: "Pendiente", tono: "neutral" },
  postulacion: { etiqueta: "Postulación", tono: "info" },
  inscripcion: { etiqueta: "Inscripción", tono: "info" },
  votacion: { etiqueta: "En votación", tono: "success" },
  activa: { etiqueta: "En votación", tono: "success" },
  finalizada: { etiqueta: "Finalizada", tono: "warning" },
};

export function normalizarEtapa(etapa: string): string {
  return etapa
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

/** Etiqueta y color de badge. Si la etapa no está mapeada, muestra el
 *  texto crudo en neutro (nunca rompe la pantalla). */
export function infoEtapa(etapa: string): EtapaInfo {
  return ETAPAS[normalizarEtapa(etapa)] ?? { etiqueta: etapa, tono: "neutral" };
}