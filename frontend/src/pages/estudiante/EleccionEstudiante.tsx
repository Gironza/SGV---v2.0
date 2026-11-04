import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";

import { useAuth } from "../../context/AuthContext";
import { useTituloPagina } from "../../context/PaginaContext";
import eleccionService from "../../services/eleccion.service";
import type { EleccionOut } from "../../types/eleccion";
import ResumenEleccion from "../../components/elecciones/ResumenEleccion";
import MiCandidatura from "../../components/estudiante/MiCandidatura";
import ListaCandidatos from "../../components/estudiante/ListaCandidatos";
import Tarjeton from "../../components/estudiante/Tarjeton";
import Alerta from "../../components/feedback/Alerta";
import Cargando from "../../components/feedback/Cargando";
import EstadoVacio from "../../components/feedback/EstadoVacio";
import { faseDe } from "../../utils/etapa";
import { formatearFecha } from "../../utils/fechas";
import { mensajeError } from "../../utils/errores";

/** Detalle de una elección para el estudiante. Lo que se muestra depende de
 *  la fase:
 *   postulación -> descripción + Postularme / mi candidatura
 *   moderación  -> descripción + candidatos presentes (solo ver)
 *   votación    -> descripción + tarjetón con la info de los candidatos
 *   pausada     -> aviso: la votación está en pausa */
function EleccionEstudiante() {
  const { id } = useParams();
  const idEleccion = Number(id);
  const navigate = useNavigate();
  const { usuario } = useAuth();

  const [eleccion, setEleccion] = useState<EleccionOut | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useTituloPagina(eleccion?.titulo ?? "Elección", "Detalle de la votación", "/estudiante/elecciones");

  useEffect(() => {
    let activo = true;
    if (!Number.isInteger(idEleccion) || idEleccion <= 0) {
      setError("La dirección de la elección no es válida.");
      setCargando(false);
      return;
    }
    eleccionService
      .obtener(idEleccion)
      .then((e) => activo && setEleccion(e))
      .catch(async (err) => activo && setError(await mensajeError(err, "No se pudo cargar la elección.")))
      .finally(() => activo && setCargando(false));
    return () => {
      activo = false;
    };
  }, [idEleccion]);

  if (cargando) return <div className="panel-box"><Cargando texto="Cargando elección..." /></div>;

  if (error || !eleccion) {
    return (
      <div className="panel-box">
        <EstadoVacio icono="fa-solid fa-circle-exclamation" titulo="No se pudo abrir la elección" descripcion={error}>
          <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => navigate("/estudiante/elecciones")}>
            Volver a las votaciones
          </button>
        </EstadoVacio>
      </div>
    );
  }

  const fase = faseDe(eleccion);
  const curso = usuario?.curso ?? null;
  const puedePostular = eleccion.cursos_postulacion.length === 0 || curso === null || eleccion.cursos_postulacion.includes(curso);

  return (
    <>
      <div className="panel-box" style={{ padding: 20 }}>
        <ResumenEleccion eleccion={eleccion} />
      </div>

      {fase === "antes" && (
        <Alerta tono="info">La postulación inicia el {formatearFecha(eleccion.fecha_inicio_inscripcion)}.</Alerta>
      )}

      {fase === "postulacion" && (
        <MiCandidatura idEleccion={idEleccion} fase="postulacion" puedePostular={puedePostular} />
      )}

      {fase === "moderacion" && (
        <>
          <Alerta tono="info">
            La postulación ya cerró. La votación inicia el {formatearFecha(eleccion.fecha_inicio)}.
          </Alerta>
          <MiCandidatura idEleccion={idEleccion} fase="moderacion" puedePostular={false} />
          <ListaCandidatos idEleccion={idEleccion} />
        </>
      )}

      {fase === "votacion" && <Tarjeton idEleccion={idEleccion} />}

      {fase === "pausada" && (
        <Alerta tono="aviso">La votación está en pausa. Vuelve a revisar más tarde.</Alerta>
      )}

      {fase === "finalizada" && (
        <Alerta tono="info">
          Esta elección ya finalizó. Consulta los resultados en tu <Link to="/estudiante/historial">historial</Link>.
        </Alerta>
      )}

      {fase === "desconocida" && (
        <Alerta tono="aviso">No se pudo determinar la etapa de esta elección ("{eleccion.etapa}").</Alerta>
      )}
    </>
  );
}

export default EleccionEstudiante;