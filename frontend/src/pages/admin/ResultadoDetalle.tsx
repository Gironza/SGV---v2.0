import { useParams } from "react-router";
import ResultadosEleccion from "../../components/resultados/ResultadosEleccion";
import EstadoVacio from "../../components/feedback/EstadoVacio";

function ResultadoDetalle() {
  const { id } = useParams();
  const idEleccion = Number(id);

  if (!Number.isInteger(idEleccion) || idEleccion <= 0) {
    return (
      <div className="panel-box">
        <EstadoVacio icono="fa-solid fa-circle-exclamation" titulo="Dirección no válida" descripcion="La elección indicada no existe." />
      </div>
    );
  }

  return <ResultadosEleccion idEleccion={idEleccion} volverA="/admin/resultados" />;
}

export default ResultadoDetalle;