// El backend maneja fechas "naive" (sin zona horaria, hora de Bogotá).
// REGLA: se envían y se muestran tal cual, sin convertir con new Date()
// ni toISOString(), que las correría por la zona del navegador.

/** "2026-11-03T14:30:00" -> "03/11/2026 14:30" */
export function formatearFecha(iso?: string | null): string {
  if (!iso) return "—";
  const m = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/.exec(iso);
  if (!m) return iso;
  return `${m[3]}/${m[2]}/${m[1]} ${m[4]}:${m[5]}`;
}

/** API -> <input type="datetime-local"> ("2026-11-03T14:30") */
export function aInputFecha(iso?: string | null): string {
  if (!iso) return "";
  return iso.slice(0, 16);
}

/** <input type="datetime-local"> -> API ("2026-11-03T14:30:00") */
export function deInputFecha(valor: string): string {
  if (!valor) return "";
  return valor.length === 16 ? `${valor}:00` : valor;
}