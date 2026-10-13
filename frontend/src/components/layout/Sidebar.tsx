import { Link, useLocation, useNavigate } from "react-router";
import type { NavItem } from "../../config/navigation";
import { ROL_LABEL, type Rol } from "../../types";
import { useAuth } from "../../context/AuthContext";
import Logo from "../ui/Logo";

interface SidebarProps {
  items: NavItem[];
  accent: "violet" | "green" | "blue" | "orange";
  rol: Rol;
}

/** Sidebar único para los 4 paneles. Recibe sus opciones desde
 * config/navigation.ts en lugar de tener un <ul> distinto por rol,
 * y resalta la ruta activa automáticamente con useLocation.
 *
 * El botón "Cerrar sesión" llama al logout() real de AuthContext
 * (limpia el token del localStorage) en vez de ser un <Link> decorativo
 * que solo cambiaba de página dejando la sesión abierta. */
export function Sidebar({ items, accent, rol }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();

  function handleLogout() {
    logout();
    navigate("/");
  }

  return (
    <aside className={`app-sidebar app-sidebar-${accent}`} aria-label={`Menú de ${ROL_LABEL[rol]}`}>
      <div className="app-sidebar-brand">
        <Logo size="sm" />
      </div>
      <nav>
        <ul>
          {items.map((item) => {
            const active = location.pathname === item.path;
            return (
              <li key={item.key} className={active ? "active" : ""}>
                <Link to={item.path}>
                  <i className={item.icon}></i>
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="app-sidebar-footer">
        <button type="button" onClick={handleLogout} className="logout-btn border-0 bg-transparent w-100 text-start">
          <i className="fa-solid fa-right-from-bracket"></i>
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
