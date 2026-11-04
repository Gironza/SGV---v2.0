import { useState } from "react";
import { useTituloPagina } from "../context/PaginaContext";
import { useToast } from "../context/ToastContext";
import ConfirmDialog from "../components/feedback/ConfirmDialog";
import Alerta from "../components/feedback/Alerta";
import Cargando from "../components/feedback/Cargando";
import EstadoVacio from "../components/feedback/EstadoVacio";
import Panel from "../components/ui/Panel";

// TEMPORAL: solo para probar los componentes de feedback en /demo-feedback.
// Se borra (junto con su ruta en App.tsx) al terminar la Fase 0.
function DemoFeedback() {
  useTituloPagina("Demo de feedback", "Prueba de la etapa 0C");
  const toast = useToast();
  const [dialogo, setDialogo] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [alerta, setAlerta] = useState(true);

  function confirmar() {
    setCargando(true);
    setTimeout(() => {
      setCargando(false);
      setDialogo(false);
      toast.exito("Acción confirmada");
    }, 1200);
  }

  return (
    <>
      <Panel title="Toasts">
        <div className="d-flex gap-2 flex-wrap">
          <button className="btn btn-success btn-sm" onClick={() => toast.exito("Guardado correctamente")}>Éxito</button>
          <button className="btn btn-danger btn-sm" onClick={() => toast.error("No se pudo completar la acción")}>Error</button>
          <button className="btn btn-warning btn-sm" onClick={() => toast.aviso("Revisa los datos")}>Aviso</button>
          <button className="btn btn-info btn-sm" onClick={() => toast.info("Dato informativo")}>Info</button>
        </div>
      </Panel>

      <Panel title="ConfirmDialog">
        <button className="btn btn-outline-danger btn-sm" onClick={() => setDialogo(true)}>Abrir confirmación</button>
        <ConfirmDialog
          abierto={dialogo}
          titulo="Eliminar elección"
          mensaje="Esta acción no se puede deshacer."
          tono="danger"
          textoConfirmar="Eliminar"
          cargando={cargando}
          onConfirmar={confirmar}
          onCancelar={() => setDialogo(false)}
        />
      </Panel>

      <Panel title="Alerta, carga y vacío">
        {alerta && <Alerta tono="aviso" onCerrar={() => setAlerta(false)}>Alerta en línea cerrable.</Alerta>}
        <Cargando />
        <EstadoVacio titulo="Sin elecciones" descripcion="Aún no hay elecciones creadas." />
      </Panel>
    </>
  );
}

export default DemoFeedback;