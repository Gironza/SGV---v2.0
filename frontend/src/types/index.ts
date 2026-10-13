// Tipos centrales de la UI. A partir de la integración con el backend
// real, estos tipos están alineados con las tablas de catálogo del
// backend (roles, estados_eleccion) en vez de ser una suposición.

// roles: 1=Administrador, 2=Docente, 3=Estudiante (seeds/01_catalogos.sql).
// No existe un 4to rol "Candidato" en la base de datos — inscribirse
// como candidato es una acción que un Estudiante hace sobre una
// elección (tabla candidatos), no un rol de login aparte. Esto confirma
// la ambigüedad que señalé entre RN02 y RN13/F13: la interpretación
// correcta es "Candidato = generalización de Estudiante".
export type Rol = "admin" | "docente" | "estudiante";

export const ROL_LABEL: Record<Rol, string> = {
  admin: "Administrador",
  docente: "Docente",
  estudiante: "Estudiante",
};

/** Traduce el id_rol numérico que devuelve el backend al Rol de la UI. */
export function idRolToRol(id_rol: number): Rol {
  if (id_rol === 1) return "admin";
  if (id_rol === 2) return "docente";
  return "estudiante";
}

// estados_eleccion: 1=Activa, 2=Finalizada, 3=Pendiente (seeds/01_catalogos.sql).
// La UI no debe asumir estos IDs en ningún componente visual — siempre
// se compara por `nombre_estado` (string), que es lo que ya hace el
// propio backend en voto_controller.py.
export type NombreEstadoEleccion = "Activa" | "Finalizada" | "Pendiente" | string;
