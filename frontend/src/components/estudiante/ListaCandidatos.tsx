import { useEffect, useState } from "react";
import candidatoService from "../../services/candidato.service";
import type { CandidatoOut } from "../../types/votacion";
import Panel from "../ui/Panel";
import Alerta from "../feedback/Alerta";
import Cargando from "../feedback/Cargando";
import EstadoVacio from "../feedback/EstadoVacio";
import TarjetaCandidato from "./TarjetaCandidato";
import { mensajeError } from "../../utils/errores";

import "../../styles/estudiante.css";

/** Candidaturas presentes de la elección (solo lectura). */
export function ListaCandidatos({ idEleccion }: { idEleccion: number }) {
  const [lista, setLista] = useState<CandidatoOut[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let activo = true;
    candidatoService
      .listarPorEleccion(idEleccion)
      .then((l) => activo && setLista(l))
      .catch(async (err) => activo && setError(await mensajeError(err, "No se pudieron cargar los candidatos.")))
      .finally(() => activo && setCargando(false));
    return () => {
      activo = false;
    };
  }, [idEleccion]);

  return (
    <Panel title="Candidatos">
      {cargando ? (
        <Cargando />
      ) : error ? (
        <Alerta tono="error">{error}</Alerta>
      ) : lista.length === 0 ? (
        <EstadoVacio icono="fa-solid fa-user-slash" titulo="Aún no hay candidatos" descripcion="Las candidaturas aprobadas aparecerán aquí." />
      ) : (
        <div className="est-cand-grid">
          {lista.map((c) => <TarjetaCandidato key={c.id_candidato} c={c} />)}
        </div>
      )}
    </Panel>
  );
}

export default ListaCandidatos;