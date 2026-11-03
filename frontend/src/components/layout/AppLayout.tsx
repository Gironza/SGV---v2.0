import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { PaginaProvider } from "../../context/PaginaContext";
import { useAuth } from "../../context/AuthContext";
import { NAV_BY_ROLE, ROL_ACCENT } from "../../config/navigation";
import { idRolToRol } from "../../types";

import "../../styles/styles.css";
import "../../styles/app-shell.css";
import "../../styles/shell-extra.css";

/** Layout ÚNICO de los tres paneles. Se monta una sola vez; al navegar
 *  solo cambia el <Outlet />, así que sidebar y header no se desmontan. */
export function AppLayout() {
  const { usuario } = useAuth();
  const { pathname } = useLocation();
  const [menuAbierto, setMenuAbierto] = useState(false);

  // Cierra el menú móvil al navegar.
  useEffect(() => {
    setMenuAbierto(false);
  }, [pathname]);

  if (!usuario) return null; // RutaProtegida ya redirige a /login

  const rol = idRolToRol(usuario.id_rol);

  return (
    <PaginaProvider>
      <div className="app-shell">
        <Sidebar
          items={NAV_BY_ROLE[rol]}
          accent={ROL_ACCENT[rol]}
          rol={rol}
          abierto={menuAbierto}
          onCerrar={() => setMenuAbierto(false)}
        />
        {menuAbierto && (
          <div className="app-backdrop" onClick={() => setMenuAbierto(false)} aria-hidden="true" />
        )}
        <div className="app-main">
          <Topbar onAbrirMenu={() => setMenuAbierto(true)} />
          <main className="app-content">
            <Outlet />
          </main>
        </div>
      </div>
    </PaginaProvider>
  );
}

export default AppLayout;