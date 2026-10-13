interface StatCardProps {
  icon: string; // clase de FontAwesome, ej: "fa-solid fa-users"
  label: string;
  value: string | number;
  delta?: string; // ej: "+2 este mes"
}

/** Una sola tarjeta de métrica, usada en los 4 paneles.
 * Antes Admin.tsx y Docente.tsx tenían cada uno su propio JSX casi
 * idéntico para esto; ahora es un componente con 4 props. */
export function StatCard({ icon, label, value, delta }: StatCardProps) {
  return (
    <div className="stat-card">
      <div className="stat-card-icon">
        <i className={icon}></i>
      </div>
      <div className="stat-card-body">
        <span className="stat-card-value">{value}</span>
        <span className="stat-card-label">{label}</span>
        {delta && <span className="stat-card-delta">{delta}</span>}
      </div>
    </div>
  );
}

export default StatCard;
