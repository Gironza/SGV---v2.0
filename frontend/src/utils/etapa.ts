// Las pantallas se deciden por la ETAPA que calcula el backend, no por
// nombre_estado. Valores de `etapa` según el contrato del backend:
//   publicada   -> la elección existe, aún no abre la postulación
//   postulacion -> los estudiantes pueden postularse
//   moderacion  -> cerró la postulación; docentes y admin moderan; los
//                  estudiantes ya ven candidatos y tarjetón (sin votar)
//   votacion    -> votación abierta
//   finalizada  -> terminó (pasa al historial)
//   pausada     -> votación en pausa (estado Pendiente puesto por el admin)
//
// faseDeEtapa() primero busca el valor exacto; si el backend trae una
// variante, intenta reconocerla. Lo que no se reconoce se muestra con su
// texto crudo en neutro para poder detectarlo.

export type EtapaTono = "success" | "warning" | "neutral" | "info" | "danger";

export interface EtapaInfo {
  etiqueta: string;
  tono: EtapaTono;
}

export type Fase =
  | "antes"
  | "postulacion"
  | "moderacion"
  | "votacion"
  | "finalizada"
  | "pausada"
  | "desconocida";

type FaseConocida = Exclude<Fase, "desconocida">;

const FASES: Record<FaseConocida, EtapaInfo> = {
  antes: { etiqueta: "Próximamente", tono: "neutral" },
  postulacion: { etiqueta: "Postulación", tono: "info" },
  moderacion: { etiqueta: "Moderación", tono: "warning" },
  votacion: { etiqueta: "En votación", tono: "success" },
  finalizada: { etiqueta: "Finalizada", tono: "neutral" },
  pausada: { etiqueta: "En pausa", tono: "warning" },
};

/** Valor exacto de `etapa` (ya normalizado) -> fase. */
const ETAPA_EXACTA: Record<string, FaseConocida> = {
  publicada: "antes",
  postulacion: "postulacion",
  moderacion: "moderacion",
  votacion: "votacion",
  finalizada: "finalizada",
  pausada: "pausada",
};

export function normalizarEtapa(etapa: string): string {
  return etapa
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

export function faseDeEtapa(etapa: string): Fase {
  const n = normalizarEtapa(etapa);
  if (!n) return "desconocida";
  const exacta = ETAPA_EXACTA[n];
  if (exacta) return exacta;
  // Variantes tolerantes
  if (n.includes("finaliz") || n.includes("cerrad") || n.includes("termin")) return "finalizada";
  if (n.includes("paus")) return "pausada";
  if (n.includes("modera") || n.includes("gracia")) return "moderacion";
  if (n.includes("votaci") || n === "activa") return "votacion";
  if (n.includes("postul") || n.includes("inscrip")) return "postulacion";
  if (n.includes("publicad") || n.includes("pendiente") || n.includes("program") || n.includes("borrador") || n.includes("antes")) return "antes";
  return "desconocida";
}

/** Fase de una elección: por su etapa y, si no se reconoce, por el
 *  nombre_estado (Activa = votación, Finalizada). */
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