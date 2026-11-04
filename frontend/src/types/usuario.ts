// Alineado con el openapi.json (v2.0.0).

/** tipos_documento (seed del backend). */
export const TIPOS_DOCUMENTO = [
  { id: 1, sigla: "CC", nombre: "Cédula de Ciudadanía" },
  { id: 2, sigla: "TI", nombre: "Tarjeta de Identidad" },
  { id: 3, sigla: "CE", nombre: "Cédula de Extranjería" },
  { id: 4, sigla: "PPT", nombre: "Permiso por Protección Temporal" },
] as const;

export const ROL = { ADMIN: 1, DOCENTE: 2, ESTUDIANTE: 3 } as const;

export const ROL_NOMBRE: Record<number, string> = {
  1: "Administrador",
  2: "Docente",
  3: "Estudiante",
};

export interface UsuarioOut {
  id_usuario: number;
  documento: string;
  id_tipo_doc: number;
  tipo_documento: string;
  nombre: string;
  apellido: string;
  correo: string;
  curso?: string | null;
  activo: boolean;
  id_rol: number;
  rol_nombre: string;
}

/** GET /usuarios/ */
export interface UsuarioListaOut {
  total: number;
  pagina: number;
  tamano: number;
  usuarios: UsuarioOut[];
}

export interface FiltrosUsuarios {
  rol?: number;
  curso?: string;
  activo?: boolean;
  q?: string;
  pagina: number;
  tamano: number;
}

/** POST /usuarios/ (solo crea estudiantes; docentes y admins se registran
 *  con código de invitación). */
export interface EstudianteCreate {
  documento: string; // 1-20
  id_tipo_doc: number;
  nombre: string; // 1-100
  apellido: string; // 1-100
  correo: string;
  curso: string; // 1-20
}

/** PUT /usuarios/{id}. `curso` puede ser null (docentes/admins). */
export interface UsuarioUpdate {
  documento: string;
  id_tipo_doc: number;
  nombre: string;
  apellido: string;
  correo: string;
  curso?: string | null;
}

export interface UsuarioCreadoResponse {
  success: boolean;
  message: string;
  id_usuario: number;
}

/** PATCH /usuarios/{id}/estado. `advertencias` avisa de efectos (por
 *  ejemplo, candidaturas activas de un estudiante desactivado). */
export interface EstadoUsuarioResponse {
  success: boolean;
  message: string;
  activo: boolean;
  advertencias?: string[];
}

/** POST /usuarios/carga-masiva */
export interface CargaMasivaResponse {
  success: boolean;
  message: string;
  creados: number;
  duracion_segundos: number;
}