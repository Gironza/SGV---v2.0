import type { ReactNode } from "react";
import { Navigate } from "react-router";
import { useAuth } from "../context/AuthContext";

interface RutaProtegidaProps {
  children: ReactNode;
  rolesPermitidos: number[]; // ej: [1] para Admin, [2] para Docente
}

// Protege una ruta según autenticación Y rol.
// - Si no hay sesión -> manda a /login
// - Si hay sesión pero el rol no coincide -> manda a / (inicio)
function RutaProtegida({ children, rolesPermitidos }: RutaProtegidaProps) {
  const { usuario, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!rolesPermitidos.includes(usuario!.id_rol)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

export default RutaProtegida;