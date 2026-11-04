import { urlArchivo } from "../../config/env";
import type { CandidatoOut } from "../../types/votacion";

import "../../styles/candidaturas.css";
import "../../styles/estudiante.css";

interface Props {
  c: CandidatoOut;
  /** En el tarjetón la tarjeta es seleccionable. */
  seleccionable?: boolean;
  seleccionado?: boolean;
  onSeleccionar?: () => void;
}

/** Candidato con foto, nombre y propuesta completa. */
export function TarjetaCandidato({ c, seleccionable = false, seleccionado = false, onSeleccionar }: Props) {
  const foto = urlArchivo(c.foto);
  const iniciales = `${c.nombre.charAt(0)}${c.apellido.charAt(0)}`.toUpperCase();

  const contenido = (
    <>
      <div className="cand-head">
        {foto ? (
          <img src={foto} alt={`Foto de ${c.nombre} ${c.apellido}`} className="cand-foto" />
        ) : (
          <span className="cand-foto cand-foto-vacia" aria-hidden="true">{iniciales}</span>
        )}
        <strong className="est-cand-nombre">{c.nombre} {c.apellido}</strong>
        {seleccionable && (
          <i className={`fa-solid ${seleccionado ? "fa-circle-check" : "fa-circle"} est-radio`} aria-hidden="true"></i>
        )}
      </div>
      <p className={`est-cand-propuesta${c.propuesta ? "" : " is-vacia"}`}>
        {c.propuesta || "Sin propuesta cargada."}
      </p>
    </>
  );

  if (!seleccionable) return <article className="est-cand">{contenido}</article>;

  return (
    <button
      type="button"
      className={`est-cand est-cand-select${seleccionado ? " is-on" : ""}`}
      aria-pressed={seleccionado}
      onClick={onSeleccionar}
    >
      {contenido}
    </button>
  );
}

export default TarjetaCandidato;