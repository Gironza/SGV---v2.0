interface SelectorCursosProps {
  etiqueta: string;
  ayuda?: string;
  cursos: string[];
  seleccion: string[];
  onChange: (seleccion: string[]) => void;
}

/** Selección múltiple de cursos con "Todos" / "Ninguno". */
export function SelectorCursos({ etiqueta, ayuda, cursos, seleccion, onChange }: SelectorCursosProps) {
  function alternar(curso: string) {
    onChange(seleccion.includes(curso) ? seleccion.filter((c) => c !== curso) : [...seleccion, curso]);
  }

  return (
    <fieldset className="selector-cursos">
      <legend>{etiqueta}</legend>
      {ayuda && <p className="selector-cursos-ayuda">{ayuda}</p>}

      {cursos.length === 0 ? (
        <p className="selector-cursos-ayuda">No hay cursos disponibles.</p>
      ) : (
        <>
          <div className="selector-cursos-acciones">
            <button type="button" onClick={() => onChange([...cursos])}>Todos</button>
            <button type="button" onClick={() => onChange([])}>Ninguno</button>
            <span>{seleccion.length} de {cursos.length}</span>
          </div>
          <div className="selector-cursos-lista">
            {cursos.map((curso) => (
              <label key={curso} className={seleccion.includes(curso) ? "is-on" : ""}>
                <input type="checkbox" checked={seleccion.includes(curso)} onChange={() => alternar(curso)} />
                {curso}
              </label>
            ))}
          </div>
        </>
      )}
    </fieldset>
  );
}

export default SelectorCursos;