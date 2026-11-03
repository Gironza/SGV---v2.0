import { Link, useLocation, useNavigate } from "react-router";
import type { NavItem } from "../../config/navigation";
import { ROL_LABEL, type Rol } from "../../types";
import { useAuth } from "../../context/AuthContext";
import Logo from "../ui/Logo";

interface SidebarProps {
  items: NavItem[];
  accent: "violet" | "green" | "blue" | "orange";
  rol: Rol;
  abierto?: boolean; // solo afecta en pantallas pequeñas
  onCerrar?: () => void;
}

function estaActivo(pathname: string, item: NavItem): boolean {
  if (item.end) return pathname === item.path;
  return pathname === item.path || pathname.startsWith(item.path + "/");
}

export function Sidebar({ items, accent, rol, abierto = false, onCerrar }: SidebarProps) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <aside
      className={`app-sidebar app-sidebar-${accent}${abierto ? " is-open" : ""}`}
      aria-label={`Menú de ${ROL_LABEL[rol]}`}
    >
      <div className="app-sidebar-brand">
        <Logo size="sm" />
        <button
          type="button"
          className="sidebar-close"
          onClick={onCerrar}
          aria-label="Cerrar menú"
        >
          <i className="fa-solid fa-xmark"></i>
        </button>
      </div>
      <nav>
        <ul>
          {items.map((item) => (
            <li key={item.key} className={estaActivo(pathname, item) ? "active" : ""}>
              <Link to={item.path} aria-current={estaActivo(pathname, item) ? "page" : undefined}>
                <i className={item.icon}></i>
                {item.label}
              </Link>
            </li>
          ))}
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