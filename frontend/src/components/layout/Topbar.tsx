import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router";
import { useAuth } from "../../context/AuthContext";
import { usePagina } from "../../context/PaginaContext";
import { RUTA_CUENTA } from "../../config/navigation";

interface TopbarProps {
  onAbrirMenu: () => void;
}

function iniciales(nombre: string, apellido: string): string {
  return `${nombre.charAt(0)}${apellido.charAt(0)}`.toUpperCase() || "?";
}

/** Header: título/subtítulo de la página actual (vienen de
 *  useTituloPagina), enlace "Volver" opcional y menú de cuenta.
 *  Sin campana de notificaciones (fuera del alcance). */
export function Topbar({ onAbrirMenu }: TopbarProps) {
  const { usuario, logout } = useAuth();
  const { titulo, subtitulo, volverA } = usePagina();
  const navigate = useNavigate();
  const [abierto, setAbierto] = useState(false);
  const refMenu = useRef<HTMLDivElement>(null);

  // Cierra el menú al hacer clic fuera o con Escape.
  useEffect(() => {
    if (!abierto) return;
    function fuera(e: MouseEvent) {
      if (refMenu.current && !refMenu.current.contains(e.target as Node)) setAbierto(false);
    }
    function tecla(e: KeyboardEvent) {
      if (e.key === "Escape") setAbierto(false);
    }
    document.addEventListener("mousedown", fuera);
    document.addEventListener("keydown", tecla);
    return () => {
      document.removeEventListener("mousedown", fuera);
      document.removeEventListener("keydown", tecla);
    };
  }, [abierto]);

  if (!usuario) return null;

  function handleLogout() {
    setAbierto(false);
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <header className="app-topbar">
      <div className="topbar-left">
        <button type="button" className="topbar-hamburger" onClick={onAbrirMenu} aria-label="Abrir menú">
          <i className="fa-solid fa-bars"></i>
        </button>
        <div>
          {volverA && (
            <Link to={volverA} className="topbar-back">
              <i className="fa-solid fa-arrow-left"></i> Volver
            </Link>
          )}
          <h1>{titulo}</h1>
          {subtitulo && <p>{subtitulo}</p>}
        </div>
      </div>

      <div className="account-menu" ref={refMenu}>
        <button
          type="button"
          className="account-trigger"
          onClick={() => setAbierto((v) => !v)}
          aria-haspopup="menu"
          aria-expanded={abierto}
        >
          <span className="avatar-initials">{iniciales(usuario.nombre, usuario.apellido)}</span>
          <span className="account-trigger-text">
            <strong>{usuario.nombre}</strong>
            <small>{usuario.rol_nombre}</small>
          </span>
          <i className="fa-solid fa-chevron-down account-caret"></i>
        </button>

        {abierto && (
          <div className="account-dropdown" role="menu">
            <div className="account-dropdown-head">
              <strong>{usuario.nombre} {usuario.apellido}</strong>
              <small>{usuario.correo}</small>
              <span className="account-role">{usuario.rol_nombre}</span>
            </div>
            <Link to={RUTA_CUENTA} role="menuitem" onClick={() => setAbierto(false)}>
              <i className="fa-solid fa-user-gear"></i> Mi cuenta
            </Link>
            <button type="button" role="menuitem" className="danger" onClick={handleLogout}>
              <i className="fa-solid fa-right-from-bracket"></i> Cerrar sesión
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

export default Topbar;