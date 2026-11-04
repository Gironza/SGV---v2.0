import Badge from "../ui/Badge";
import { ESTADO_CANDIDATURA, type CandidaturaDetalleOut } from "../../types/candidatura";
import { infoEstadoCandidatura } from "../../utils/candidatura";
import { urlArchivo } from "../../config/env";

import "../../styles/candidaturas.css";

interface Props {
  c: CandidaturaDetalleOut;
  ocupado: boolean;
  onAprobar: () => void;
  onRechazar: () => void;
  onObservaciones: () => void;
  onResolverRetiro: (aprobar: boolean) => void;
}

/** Tarjeta de una candidatura con sus acciones de moderación. */
export function CandidaturaCard({ c, ocupado, onAprobar, onRechazar, onObservaciones, onResolverRetiro }: Props) {
  const { etiqueta, tono } = infoEstadoCandidatura(c.id_estado_candidatura, c.nombre_estado);
  const foto = urlArchivo(c.foto);
  const iniciales = `${c.nombre.charAt(0)}${c.apellido.charAt(0)}`.toUpperCase();
  const estado = c.id_estado_candidatura;

  const puedeAprobar = estado === ESTADO_CANDIDATURA.PENDIENTE || estado === ESTADO_CANDIDATURA.RECHAZADA;
  const puedeRechazar = estado === ESTADO_CANDIDATURA.PENDIENTE || estado === ESTADO_CANDIDATURA.APROBADA;
  const pideRetiro = estado === ESTADO_CANDIDATURA.RETIRO_SOLICITADO;
  const retirada = estado === ESTADO_CANDIDATURA.RETIRADA;

  return (
    <article className="cand-card">
      <header className="cand-head">
        {foto ? (
          <img src={foto} alt={`Foto de ${c.nombre} ${c.apellido}`} className="cand-foto" />
        ) : (
          <span className="cand-foto cand-foto-vacia" aria-hidden="true">{iniciales}</span>
        )}
        <div className="cand-nombre">
          <strong>{c.nombre} {c.apellido}</strong>
          <Badge tone={tono}>{etiqueta}</Badge>
        </div>
      </header>

      <p className={`cand-propuesta${c.propuesta ? "" : " is-vacia"}`}>
        {c.propuesta || "Aún no ha cargado su propuesta."}
      </p>

      {c.observaciones && (
        <div className="cand-obs">
          <span>Observaciones</span>
          {c.observaciones}
        </div>
      )}

      {pideRetiro && (
        <div className="cand-aviso">
          <i className="fa-solid fa-person-walking-arrow-right me-2"></i>
          El candidato solicitó retirarse.
        </div>
      )}

      <footer className="cand-acciones">
        {pideRetiro ? (
          <>
            <button type="button" className="btn btn-sm btn-danger" disabled={ocupado} onClick={() => onResolverRetiro(true)}>
              Aprobar retiro
            </button>
            <button type="button" className="btn btn-sm btn-outline-secondary" disabled={ocupado} onClick={() => onResolverRetiro(false)}>
              Mantener candidatura
            </button>
          </>
        ) : (
          <>
            {puedeAprobar && (
              <button type="button" className="btn btn-sm btn-success" disabled={ocupado} onClick={onAprobar}>
                <i className="fa-solid fa-check me-1"></i>Aprobar
              </button>
            )}
            {puedeRechazar && (
              <button type="button" className="btn btn-sm btn-outline-danger" disabled={ocupado} onClick={onRechazar}>
                <i className="fa-solid fa-xmark me-1"></i>Rechazar
              </button>
            )}
          </>
        )}
        {!retirada && (
          <button type="button" className="btn btn-sm btn-link ms-auto" disabled={ocupado} onClick={onObservaciones}>
            {c.observaciones ? "Editar observaciones" : "Agregar observaciones"}
          </button>
        )}
      </footer>
    </article>
  );
}

export default CandidaturaCard;