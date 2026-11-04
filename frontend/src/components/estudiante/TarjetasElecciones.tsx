import { Link } from "react-router";
import Badge from "../ui/Badge";
import EstadoVacio from "../feedback/EstadoVacio";
import type { ItemEleccion } from "../../hooks/useEleccionesEstudiante";
import { infoFase } from "../../utils/etapa";
import { formatearFecha } from "../../utils/fechas";

import "../../styles/estudiante.css";

/** Texto y acción de la tarjeta según la fase de la elección. */
function accionDe(i: ItemEleccion): { texto: string; fecha: string } {
  const e = i.eleccion;
  switch (i.fase) {
    case "postulacion":
      return {
        texto: i.puedePostular ? "Ver / Postularme" : "Ver",
        fecha: `Postulación hasta ${formatearFecha(e.fecha_fin_inscripcion)}`,
      };
    case "moderacion":
      return { texto: "Ver", fecha: `La votación inicia ${formatearFecha(e.fecha_inicio)}` };
    case "pausada":
      return { texto: "Ver", fecha: "Votación en pausa" };
    case "votacion":
      return {
        texto: i.yaVoto || !i.puedeVotar ? "Ver" : "Votar",
        fecha: `La votación cierra ${formatearFecha(e.fecha_fin)}`,
      };
    case "antes":
      return { texto: "Ver", fecha: `La postulación inicia ${formatearFecha(e.fecha_inicio_inscripcion)}` };
    default:
      return { texto: "Ver", fecha: `Cierra ${formatearFecha(e.fecha_fin)}` };
  }
}

export function TarjetasElecciones({ items }: { items: ItemEleccion[] }) {
  if (items.length === 0) {
    return (
      <EstadoVacio
        icono="fa-solid fa-check-to-slot"
        titulo="No hay votaciones vigentes"
        descripcion="Cuando haya una nueva, la verás aquí. Las finalizadas están en tu historial."
      />
    );
  }

  return (
    <div className="est-grid">
      {items.map((i) => {
        const { etiqueta, tono } = infoFase(i.fase);
        const { texto, fecha } = accionDe(i);
        const sinCurso = !i.puedePostular && !i.puedeVotar;
        return (
          <article key={i.eleccion.id_eleccion} className="est-card">
            <div className="est-card-head">
              <h4>{i.eleccion.titulo}</h4>
              <Badge tone={tono}>{etiqueta}</Badge>
            </div>
            <p className="est-card-fecha">{fecha}</p>
            {i.yaVoto && (
              <p className="est-card-nota est-ok"><i className="fa-solid fa-circle-check me-1"></i>Ya votaste</p>
            )}
            {sinCurso && <p className="est-card-nota">Tu curso no participa en esta elección.</p>}
            <Link to={`/estudiante/elecciones/${i.eleccion.id_eleccion}`} className="btn-accent btn-accent-blue est-card-btn">
              {texto}
            </Link>
          </article>
        );
      })}
    </div>
  );
}

export default TarjetasElecciones;