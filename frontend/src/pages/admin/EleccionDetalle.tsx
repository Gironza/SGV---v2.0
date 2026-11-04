import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router";

import { useTituloPagina } from "../../context/PaginaContext";
import eleccionService from "../../services/eleccion.service";
import type { EleccionOut } from "../../types/eleccion";
import ResumenEleccion from "../../components/elecciones/ResumenEleccion";
import ConfiguracionEleccion from "../../components/elecciones/ConfiguracionEleccion";
import Alerta from "../../components/feedback/Alerta";
import Cargando from "../../components/feedback/Cargando";
import EstadoVacio from "../../components/feedback/EstadoVacio";
import { mensajeError } from "../../utils/errores";

import "../../styles/elecciones.css";

type Pestana = "configuracion" | "candidaturas";

function EleccionDetalle() {
  const { id } = useParams();
  const idEleccion = Number(id);
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const pestana: Pestana = params.get("tab") === "candidaturas" ? "candidaturas" : "configuracion";

  const [eleccion, setEleccion] = useState<EleccionOut | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useTituloPagina(eleccion?.titulo ?? "Elección", "Configuración y candidaturas", "/admin/elecciones");

  // `silencioso` = recarga tras una acción, sin parpadeo de "Cargando".
  const cargar = useCallback(
    async (silencioso = false) => {
      if (!Number.isInteger(idEleccion) || idEleccion <= 0) {
        setError("La dirección de la elección no es válida.");
        setCargando(false);
        return;
      }
      if (!silencioso) setCargando(true);
      setError("");
      try {
        setEleccion(await eleccionService.obtener(idEleccion));
      } catch (err) {
        setError(await mensajeError(err, "No se pudo cargar la elección."));
      } finally {
        setCargando(false);
      }
    },
    [idEleccion]
  );

  useEffect(() => {
    void cargar();
  }, [cargar]);

  function cambiarPestana(p: Pestana) {
    setParams(p === "configuracion" ? {} : { tab: p }, { replace: true });
  }

  if (cargando) return <div className="panel-box"><Cargando texto="Cargando elección..." /></div>;

  if (error || !eleccion) {
    return (
      <div className="panel-box">
        <EstadoVacio icono="fa-solid fa-circle-exclamation" titulo="No se pudo abrir la elección" descripcion={error}>
          <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => navigate("/admin/elecciones")}>
            Volver a la lista
          </button>
        </EstadoVacio>
      </div>
    );
  }

  return (
    <>
      <div className="panel-box" style={{ padding: 20 }}>
        <ResumenEleccion eleccion={eleccion} />
      </div>

      <div className="tabs-eleccion" role="tablist">
        <button type="button" role="tab" aria-selected={pestana === "configuracion"}
          className={pestana === "configuracion" ? "is-on" : ""} onClick={() => cambiarPestana("configuracion")}>
          Configuración
        </button>
        <button type="button" role="tab" aria-selected={pestana === "candidaturas"}
          className={pestana === "candidaturas" ? "is-on" : ""} onClick={() => cambiarPestana("candidaturas")}>
          Candidaturas
        </button>
      </div>

      {pestana === "configuracion" ? (
        <ConfiguracionEleccion
          eleccion={eleccion}
          onActualizada={() => cargar(true)}
          onEliminada={() => navigate("/admin/elecciones", { replace: true })}
        />
      ) : (
        <div className="panel-box">
          <Alerta tono="info">La moderación de candidaturas (aprobar, rechazar, observaciones y retiros) se construye en la etapa 1C.</Alerta>
          <EstadoVacio icono="fa-solid fa-user-check" titulo="Candidaturas" descripcion="Próximamente en esta pestaña." />
        </div>
      )}
    </>
  );
}

export default EleccionDetalle;