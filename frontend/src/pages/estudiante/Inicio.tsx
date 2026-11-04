import { useAuth } from "../../context/AuthContext";
import { useTituloPagina } from "../../context/PaginaContext";
import { useEleccionesEstudiante } from "../../hooks/useEleccionesEstudiante";
import Panel from "../../components/ui/Panel";
import StatCard from "../../components/ui/StatCard";
import Alerta from "../../components/feedback/Alerta";
import Cargando from "../../components/feedback/Cargando";
import TarjetasElecciones from "../../components/estudiante/TarjetasElecciones";

function EstudianteInicio() {
  const { usuario } = useAuth();
  useTituloPagina(`¡Hola, ${usuario?.nombre ?? "Estudiante"}!`, "Participa en las votaciones de tu institución.");
  const { items, cargando, error, recargar } = useEleccionesEstudiante();

  const paraVotar = items.filter((i) => i.fase === "votacion" && i.puedeVotar && !i.yaVoto).length;
  const postulacionesAbiertas = items.filter((i) => i.fase === "postulacion" && i.puedePostular).length;

  return (
    <>
      <div className="stat-grid">
        <StatCard icon="fa-solid fa-check-to-slot" label="Votaciones por votar" value={paraVotar} />
        <StatCard icon="fa-solid fa-hand" label="Postulaciones abiertas" value={postulacionesAbiertas} />
        <StatCard icon="fa-solid fa-list" label="Votaciones vigentes" value={items.length} />
      </div>

      <Panel title="Votaciones vigentes">
        {error && (
          <Alerta tono="error">
            {error}{" "}
            <button type="button" className="btn btn-sm btn-outline-danger ms-2" onClick={() => void recargar()}>Reintentar</button>
          </Alerta>
        )}
        {cargando ? <Cargando texto="Cargando votaciones..." /> : !error && <TarjetasElecciones items={items} />}
      </Panel>
    </>
  );
}

export default EstudianteInicio;