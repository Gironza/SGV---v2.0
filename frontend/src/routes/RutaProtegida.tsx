import type { ReactNode } from "react";
import { Navigate, Outlet } from "react-router";
import { useAuth } from "../context/AuthContext";
import { idRolToRol } from "../types";
import { ROL_HOME } from "../config/navigation";

interface RutaProtegidaProps {
  /** Opcional: sin children actúa como ruta de layout y renderiza <Outlet />. */
  children?: ReactNode;
  rolesPermitidos: number[]; // 1 Admin, 2 Docente, 3 Estudiante
}

// - Sin sesión -> /login
// - Con sesión pero rol no permitido -> al inicio de SU propio panel
//   (el que decide en última instancia es el backend con 403).
function RutaProtegida({ children, rolesPermitidos }: RutaProtegidaProps) {
  const { usuario, isAuthenticated } = useAuth();

  if (!isAuthenticated || !usuario) {
    return <Navigate to="/login" replace />;
  }

  if (!rolesPermitidos.includes(usuario.id_rol)) {
    return <Navigate to={ROL_HOME[idRolToRol(usuario.id_rol)]} replace />;
  }

  return <>{children ?? <Outlet />}</>;
}

export default RutaProtegida;