// Única fuente de la URL del backend. En Docker se inyecta como variable
// de build (VITE_API_URL). Sin barra final.
const raw = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000";

export const API_URL: string = String(raw).replace(/\/+$/, "");

/** Arma la URL completa de una foto/archivo servido por el backend
 *  (ej. "/uploads/abc.png" -> "http://127.0.0.1:8000/uploads/abc.png"). */
export function urlArchivo(ruta?: string | null): string | null {
  if (!ruta) return null;
  if (/^https?:\/\//i.test(ruta)) return ruta;
  return `${API_URL}${ruta.startsWith("/") ? "" : "/"}${ruta}`;
}