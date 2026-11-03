import { isAxiosError } from "axios";

type Detail = string | { msg?: string; loc?: unknown[] }[] | undefined;

function textoDeDetail(detail: Detail): string | null {
  if (!detail) return null;
  if (typeof detail === "string") return detail;
  // 422 de FastAPI: lista de { loc, msg }
  if (Array.isArray(detail)) {
    const msgs = detail.map((d) => d?.msg).filter(Boolean);
    return msgs.length ? msgs.join(". ") : null;
  }
  return null;
}

/** Devuelve siempre un texto legible para mostrar al usuario.
 *  Lee `detail` del backend, también cuando llega dentro de un Blob
 *  (descargas de PDF/CSV que fallan). */
export async function mensajeError(
  err: unknown,
  porDefecto = "Ocurrió un error inesperado. Intenta de nuevo."
): Promise<string> {
  if (!isAxiosError(err)) {
    return err instanceof Error && err.message ? err.message : porDefecto;
  }
  if (!err.response) {
    return "No se pudo conectar con el servidor.";
  }
  let data: unknown = err.response.data;

  if (data instanceof Blob) {
    try {
      data = JSON.parse(await data.text());
    } catch {
      return porDefecto;
    }
  }
  const detail = (data as { detail?: Detail } | null)?.detail;
  return textoDeDetail(detail) ?? porDefecto;
}

export function esConflicto(err: unknown): boolean {
  return isAxiosError(err) && err.response?.status === 409;
}

export function esProhibido(err: unknown): boolean {
  return isAxiosError(err) && err.response?.status === 403;
}