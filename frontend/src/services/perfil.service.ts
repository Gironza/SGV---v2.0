import api from "./api";
import type { MensajeResponse } from "../types/eleccion";
import type { CambioContrasena, PerfilResponse, PerfilUpdate } from "../types/perfil";

const perfilService = {
  obtener: () => api.get<PerfilResponse>("/auth/me").then((r) => r.data),

  actualizar: (d: PerfilUpdate) => api.put<PerfilResponse>("/auth/me", d).then((r) => r.data),

  cambiarContrasena: (d: CambioContrasena) =>
    api.put<MensajeResponse>("/auth/me/contrasena", d).then((r) => r.data),
};

export default perfilService;