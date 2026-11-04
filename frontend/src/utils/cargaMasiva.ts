import { isAxiosError } from "axios";

export interface ErrorFila {
  /** Número de fila del CSV, si el backend lo informa. */
  fila?: number | string;
  mensaje: string;
}

export interface ErrorCarga {
  /** Mensaje general (siempre hay uno). */
  mensaje: string;
  /** Errores por fila, si el backend los entrega. */
  filas: ErrorFila[];
}

// El contrato no define el formato de los errores por fila, así que se
// interpretan varias formas habituales de `detail`:
//   "texto" | ["texto", ...] | [{fila, error|mensaje|detail}] |
//   { mensaje|message, errores|errors|filas: [...] }
function aFila(x: unknown): ErrorFila {
  if (typeof x === "string") return { mensaje: x };
  if (x && typeof x === "object") {
    const o = x as Record<string, unknown>;
    const fila = (o.fila ?? o.row ?? o.linea ?? o.line) as number | string | undefined;
    const msg = (o.error ?? o.mensaje ?? o.message ?? o.detail ?? o.msg) as unknown;
    return { fila, mensaje: typeof msg === "string" ? msg : JSON.stringify(x) };
  }
  return { mensaje: String(x) };
}

export function extraerErrorCarga(err: unknown): ErrorCarga {
  const defecto = "No se pudo procesar el archivo.";
  if (!isAxiosError(err)) return { mensaje: err instanceof Error ? err.message : defecto, filas: [] };
  if (!err.response) return { mensaje: "No se pudo conectar con el servidor.", filas: [] };

  const detail = (err.response.data as { detail?: unknown } | null)?.detail;

  if (typeof detail === "string") return { mensaje: detail, filas: [] };
  if (Array.isArray(detail)) {
    const filas = detail.map(aFila);
    return { mensaje: "El archivo tiene errores. Corrígelos y vuelve a subirlo.", filas };
  }
  if (detail && typeof detail === "object") {
    const o = detail as Record<string, unknown>;
    const lista = (o.errores ?? o.errors ?? o.filas ?? o.rows) as unknown;
    const mensaje = (o.mensaje ?? o.message) as unknown;
    return {
      mensaje: typeof mensaje === "string" ? mensaje : "El archivo tiene errores. Corrígelos y vuelve a subirlo.",
      filas: Array.isArray(lista) ? lista.map(aFila) : [],
    };
  }
  return { mensaje: defecto, filas: [] };
}