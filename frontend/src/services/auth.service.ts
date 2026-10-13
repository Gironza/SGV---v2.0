import api from "./api";

// Debe coincidir exactamente con UsuarioRegistro (backend)
export interface RegistroPayload {
  nombres: string;
  apellidos: string;
  documento: string;
  id_tipo_doc: number;
  correo: string;
  password: string;
  codigo_institucion: string;
  curso?: string | null;
}

// Debe coincidir exactamente con UsuarioResponse
export interface UsuarioResponse {
  id_usuario: number;
  correo: string;
  nombre: string;
  apellido: string;
  curso: string | null;
  id_rol: number;
  rol_nombre: string;
}

// Debe coincidir exactamente con TokenResponse
export interface TokenResponse {
  access_token: string;
  token_type: string;
  user: UsuarioResponse;
}

// Debe coincidir exactamente con MensajeResponse
export interface MensajeResponse {
  success: boolean;
  message: string;
}

// POST /auth/login
async function login(correo: string, password: string): Promise<TokenResponse> {
  const { data } = await api.post<TokenResponse>("/auth/login", {
    correo,
    password,
  });
  return data;
}

// POST /auth/registro
// OJO: no devuelve token. Auto-login rechazado a propósito —
// después de registrarse, el usuario debe iniciar sesión manualmente.
async function registro(payload: RegistroPayload): Promise<MensajeResponse> {
  const { data } = await api.post<MensajeResponse>("/auth/registro", payload);
  return data;
}

export default { login, registro };