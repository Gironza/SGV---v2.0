import { createContext, useContext, useState, type ReactNode } from "react";
import authService, { type UsuarioResponse } from "../services/auth.service";
import api from "../services/api";

interface AuthContextType {
  usuario: UsuarioResponse | null;
  isAuthenticated: boolean;
  login: (correo: string, password: string) => Promise<UsuarioResponse>;
  logout: () => void;
  /** Vuelve a leer GET /auth/me y actualiza el usuario en memoria y en
   *  localStorage (útil tras editar el perfil, para que el header cambie). */
  refrescarUsuario: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function cargarUsuarioGuardado(): UsuarioResponse | null {
  const raw = localStorage.getItem("usuario");
  if (!raw) return null;
  try {
    return JSON.parse(raw) as UsuarioResponse;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<UsuarioResponse | null>(
    cargarUsuarioGuardado()
  );

  async function login(correo: string, password: string) {
    const data = await authService.login(correo, password);
    localStorage.setItem("token", data.access_token);
    localStorage.setItem("usuario", JSON.stringify(data.user));
    setUsuario(data.user);
    return data.user;
  }

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");
    setUsuario(null);
  }

  async function refrescarUsuario() {
    const { data } = await api.get<UsuarioResponse>("/auth/me");
    const nuevo: UsuarioResponse = {
      id_usuario: data.id_usuario,
      correo: data.correo,
      nombre: data.nombre,
      apellido: data.apellido,
      curso: data.curso,
      id_rol: data.id_rol,
      rol_nombre: data.rol_nombre,
    };
    localStorage.setItem("usuario", JSON.stringify(nuevo));
    setUsuario(nuevo);
  }

  return (
    <AuthContext.Provider
      value={{ usuario, isAuthenticated: !!usuario, login, logout, refrescarUsuario }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Hook: const { usuario, login, logout } = useAuth();
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe usarse dentro de un <AuthProvider>");
  }
  return context;
}