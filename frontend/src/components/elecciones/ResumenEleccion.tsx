import type { EleccionOut } from "../../types/eleccion";
import EtapaBadge from "./EtapaBadge";
import { formatearFecha } from "../../utils/fechas";

import "../../styles/elecciones.css";

function lista(cursos: string[]): string {
  return cursos.length ? cursos.join(", ") : "Sin restricción";
}

/** Encabezado del detalle: título, etapa y datos clave. */
export function ResumenEleccion({ eleccion: e }: { eleccion: EleccionOut }) {
  return (
    <div className="resumen-eleccion">
      <div className="resumen-cabecera">
        <h3>{e.titulo}</h3>
        <EtapaBadge etapa={e.etapa} />
      </div>
      {e.descripcion && <p className="resumen-desc">{e.descripcion}</p>}
      <dl className="info-grid">
        <div><dt>Inicio postulación</dt><dd>{formatearFecha(e.fecha_inicio_inscripcion)}</dd></div>
        <div><dt>Fin postulación</dt><dd>{formatearFecha(e.fecha_fin_inscripcion)}</dd></div>
        <div><dt>Inicio votación</dt><dd>{formatearFecha(e.fecha_inicio)}</dd></div>
        <div><dt>Cierre votación</dt><dd>{formatearFecha(e.fecha_fin)}</dd></div>
        <div><dt>Publicación de resultados</dt><dd>{formatearFecha(e.fecha_publicacion_resultados)}</dd></div>
        <div><dt>Pueden postularse</dt><dd>{lista(e.cursos_postulacion)}</dd></div>
        <div><dt>Pueden votar</dt><dd>{lista(e.cursos_votacion)}</dd></div>
      </dl>
    </div>
  );
}

export default ResumenEleccion;