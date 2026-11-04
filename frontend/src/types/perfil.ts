// Alineado con el openapi.json (v2.0.0).

/** GET /auth/me */
export interface PerfilResponse {
  id_usuario: number;
  documento: string;
  nombre: string;
  apellido: string;
  correo: string;
  curso?: string | null;
  id_rol: number;
  rol_nombre: string;
}

/** PUT /auth/me */
export interface PerfilUpdate {
  nombre: string; // 1-100
  apellido: string; // 1-100
  correo: string;
}

/** PUT /auth/me/contrasena */
export interface CambioContrasena {
  contrasena_actual: string;
  contrasena_nueva: string; // 8-72
}