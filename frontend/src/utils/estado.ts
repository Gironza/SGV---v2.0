import type { NombreEstadoEleccion } from "../types";

/** Decide el color del Badge a partir del `nombre_estado` que devuelve
 * el backend (tabla estados_eleccion: "Activa" | "Finalizada" | "Pendiente").
 * Comparar por nombre (no por id) porque es lo mismo que ya hace
 * voto_controller.py en el backend — así la UI nunca se desincroniza
 * si algún día cambian los IDs de la tabla. */
export function estadoEleccionTone(nombreEstado: NombreEstadoEleccion): "success" | "warning" | "neutral" {
  const n = nombreEstado.toLowerCase();
  if (n === "activa") return "success";
  if (n === "pendiente") return "warning";
  return "neutral"; // "Finalizada" u otro valor no previsto
}
