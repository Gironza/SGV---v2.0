// Las pantallas se deciden por la ETAPA de la elección, no por nombre_estado.
//
// Fases del ciclo de vida:
//   antes       -> aún no inicia la postulación
//   postulacion -> los estudiantes pueden postularse
//   gracia      -> terminó la postulación, aún no inicia la votación
//                  (candidaturas definidas; se pueden ver)
//   votacion    -> votación abierta
//   finalizada  -> terminó (pasa al historial)
//
// TODO: el contrato no lista los valores de `etapa` (visto: "postulacion").
// faseDeEtapa() es tolerante con variantes; si una etapa no se reconoce se
// muestra su texto crudo en neutro para poder detectarla.

export type EtapaTono = "success" | "warning" | "neutral" | "info" | "danger";

export interface EtapaInfo {
  etiqueta: string;
  tono: EtapaTono;
}

export type Fase = "antes" | "postulacion" | "gracia" | "votacion" | "finalizada" | "desconocida";

const FASES: Record<Exclude<Fase, "desconocida">, EtapaInfo> = {
  antes: { etiqueta: "Próximamente", tono: "neutral" },
  postulacion: { etiqueta: "Postulación", tono: "info" },
  gracia: { etiqueta: "Periodo de gracia", tono: "warning" },
  votacion: { etiqueta: "En votación", tono: "success" },
  finalizada: { etiqueta: "Finalizada", tono: "neutral" },
};

export function normalizarEtapa(etapa: string): string {
  return etapa
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function faseDeEtapa(etapa: string): Fase {
  const n = normalizarEtapa(etapa);
  if (!n) return "desconocida";
  if (n.includes("finaliz") || n.includes("cerrad") || n.includes("termin")) return "finalizada";
  if (n.includes("gracia")) return "gracia";
  if (n.includes("votaci") || n === "activa") return "votacion";
  if (n.includes("postul") || n.includes("inscrip")) return "postulacion";
  if (n.includes("pendiente") || n.includes("program") || n.includes("borrador") || n.includes("antes")) return "antes";
  return "desconocida";
}

/** Fase de una elección: por su etapa y, si no se reconoce, por el
 *  nombre_estado (Activa = votación, Finalizada). "Pendiente" por sí solo no
 *  basta para saber si es postulación o gracia. */
export function faseDe(e: { etapa: string; nombre_estado?: string }): Fase {
  const f = faseDeEtapa(e.etapa);
  if (f !== "desconocida") return f;
  const n = normalizarEtapa(e.nombre_estado ?? "");
  if (n === "finalizada") return "finalizada";
  if (n === "activa") return "votacion";
  return "desconocida";
}

/** Etiqueta y color de badge. Si la etapa no se reconoce, muestra el texto
 *  crudo en neutro (nunca rompe la pantalla). */
export function infoEtapa(etapa: string): EtapaInfo {
  const f = faseDeEtapa(etapa);
  return f === "desconocida" ? { etiqueta: etapa, tono: "neutral" } : FASES[f];
}

export function infoFase(fase: Fase): EtapaInfo {
  return fase === "desconocida" ? { etiqueta: "—", tono: "neutral" } : FASES[fase];
}

/** ¿La elección ya terminó? */
export function esFinalizada(e: { etapa: string; nombre_estado?: string }): boolean {
  return faseDe(e) === "finalizada";
}