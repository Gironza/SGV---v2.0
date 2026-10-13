interface TopbarProps {
  titulo: string;
  subtitulo: string;
  institucion?: string;
  notificaciones?: number;
  usuario: {
    nombre: string;
    correo: string;
    avatarUrl?: string;
  };
}

/** Barra superior compartida por los 4 paneles. La institución y las
 * notificaciones son opcionales porque, por ejemplo, el panel Candidato
 * puede no necesitarlas todavía. */
export function Topbar({ titulo, subtitulo, institucion, notificaciones, usuario }: TopbarProps) {
  return (
    <div className="app-topbar">
      <div>
        <h1>{titulo}</h1>
        <p>{subtitulo}</p>
      </div>
      <div className="app-topbar-actions">
        {institucion && (
          <div className="institution-pill">
            <i className="fa-solid fa-building-columns"></i>
            {institucion}
          </div>
        )}
        {typeof notificaciones === "number" && (
          <button type="button" className="notification-bell" aria-label="Notificaciones">
            <i className="fa-solid fa-bell"></i>
            {notificaciones > 0 && <span className="notification-count">{notificaciones}</span>}
          </button>
        )}
        <div className="profile">
          <img
            src={usuario.avatarUrl ?? "https://cdn-icons-png.flaticon.com/512/3135/3135715.png"}
            alt={usuario.nombre}
          />
          <div>
            <h5>{usuario.nombre}</h5>
            <small>{usuario.correo}</small>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Topbar;
