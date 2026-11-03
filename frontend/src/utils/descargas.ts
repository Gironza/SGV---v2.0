import api from "../services/api";

function nombreDesdeHeader(cd?: string): string | null {
  if (!cd) return null;
  const m = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(cd);
  return m ? decodeURIComponent(m[1]) : null;
}

/** Descarga un archivo (PDF/CSV) desde un endpoint autenticado.
 *  Los errores se propagan: usa mensajeError(err) en el catch. */
export async function descargarArchivo(
  url: string,
  params?: Record<string, unknown>,
  nombreSugerido = "archivo"
): Promise<void> {
  const res = await api.get<Blob>(url, { params, responseType: "blob" });
  const nombre = nombreDesdeHeader(res.headers["content-disposition"]) ?? nombreSugerido;
  const href = URL.createObjectURL(res.data);
  const a = document.createElement("a");
  a.href = href;
  a.download = nombre;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(href);
}