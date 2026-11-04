import { useEffect, useState } from "react";
import { useNavigate } from "react-router";

import { useTituloPagina } from "../../context/PaginaContext";
import { useToast } from "../../context/ToastContext";
import eleccionService from "../../services/eleccion.service";
import type { EleccionCreate } from "../../types/eleccion";
import Panel from "../../components/ui/Panel";
import FormularioEleccion from "../../components/elecciones/FormularioEleccion";
import Alerta from "../../components/feedback/Alerta";
import Cargando from "../../components/feedback/Cargando";
import { mensajeError } from "../../utils/errores";

function EleccionNueva() {
  useTituloPagina("Nueva elección", "Define las fechas y los cursos habilitados", "/admin/elecciones");

  const navigate = useNavigate();
  const toast = useToast();
  const [cursos, setCursos] = useState<string[]>([]);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState("");
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    let activo = true;
    eleccionService
      .listarCursos()
      .then((lista) => activo && setCursos(lista))
      .catch(async (err) => activo && setErrorCarga(await mensajeError(err, "No se pudieron cargar los cursos.")))
      .finally(() => activo && setCargando(false));
    return () => {
      activo = false;
    };
  }, []);

  async function crear(datos: EleccionCreate) {
    setEnviando(true);
    try {
      const r = await eleccionService.crearEleccion(datos);
      toast.exito(r.message || "Elección creada.");
      navigate(`/admin/elecciones/${r.id_eleccion}`);
    } catch (err) {
      toast.error(await mensajeError(err, "No se pudo crear la elección."));
      setEnviando(false);
    }
  }

  return (
    <Panel title="Datos de la elección">
      {cargando ? (
        <Cargando />
      ) : (
        <>
          {errorCarga && <Alerta tono="aviso">{errorCarga} Podrás crear la elección, pero sin elegir cursos.</Alerta>}
          <FormularioEleccion
            cursosDisponibles={cursos}
            enviando={enviando}
            onSubmit={crear}
            onCancelar={() => navigate("/admin/elecciones")}
          />
        </>
      )}
    </Panel>
  );
}

export default EleccionNueva;