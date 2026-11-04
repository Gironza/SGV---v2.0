import api from "./api";
import type { EstadisticasEleccionOut, ResultadoEleccionOut } from "../types/resultado";

// Se re-exportan para no romper imports antiguos.
export type { CandidatoResultadoOut, ResultadoEleccionOut } from "../types/resultado";

const resultadoService = {
  obtener: (idEleccion: number) =>
    api.get<ResultadoEleccionOut>(`/resultados/${idEleccion}`).then((r) => r.data),

  estadisticas: (idEleccion: number) =>
    api.get<EstadisticasEleccionOut>(`/resultados/${idEleccion}/estadisticas`).then((r) => r.data),

  // La exportación (CSV/PDF) se descarga con utils/descargas.ts:
  //   descargarArchivo(`/resultados/${id}/exportar`, { formato: "pdf" }, "resultados.pdf")
  // Solo funciona con la elección finalizada.
};

export default resultadoService;