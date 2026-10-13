import { createContext, useContext, useState, type ReactNode } from "react";
import authService, { type UsuarioResponse } from "../services/auth.service";

interface AuthContextType {
  usuario: UsuarioResponse | null;
  isAuthenticated: boolean;
  login: (correo: string, password: string) => Promise<UsuarioResponse>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Recupera la sesión guardada en localStorage al recargar la página.
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

  return (
    <AuthContext.Provider
      value={{ usuario, isAuthenticated: !!usuario, login, logout }}
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