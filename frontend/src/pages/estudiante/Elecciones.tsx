import { useTituloPagina } from "../../context/PaginaContext";
import { useEleccionesEstudiante } from "../../hooks/useEleccionesEstudiante";
import Panel from "../../components/ui/Panel";
import Alerta from "../../components/feedback/Alerta";
import Cargando from "../../components/feedback/Cargando";
import TarjetasElecciones from "../../components/estudiante/TarjetasElecciones";

function EleccionesEstudiante() {
  useTituloPagina("Elecciones", "Postúlate, conoce a los candidatos y vota");
  const { items, cargando, error, recargar } = useEleccionesEstudiante();

  return (
    <Panel title="Votaciones de tu institución">
      {error && (
        <Alerta tono="error">
          {error}{" "}
          <button type="button" className="btn btn-sm btn-outline-danger ms-2" onClick={() => void recargar()}>Reintentar</button>
        </Alerta>
      )}
      {cargando ? <Cargando texto="Cargando votaciones..." /> : !error && <TarjetasElecciones items={items} />}
    </Panel>
  );
}

export default EleccionesEstudiante;