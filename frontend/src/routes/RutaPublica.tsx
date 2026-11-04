import type { ReactNode } from "react";
import { Navigate } from "react-router";
import { useAuth } from "../context/AuthContext";
import { idRolToRol } from "../types";
import { ROL_HOME } from "../config/navigation";

/** Para /login y /registro: si ya hay sesión, manda al panel del rol. */
function RutaPublica({ children }: { children: ReactNode }) {
  const { usuario, isAuthenticated } = useAuth();
  if (isAuthenticated && usuario) {
    return <Navigate to={ROL_HOME[idRolToRol(usuario.id_rol)]} replace />;
  }
  return <>{children}</>;
}

export default RutaPublica;