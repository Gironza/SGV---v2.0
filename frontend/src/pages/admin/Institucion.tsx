import { useCallback, useEffect, useState } from "react";

import { useTituloPagina } from "../../context/PaginaContext";
import { useToast } from "../../context/ToastContext";
import institucionService from "../../services/institucion.service";
import type { CodigosInvitacionOut, TipoCodigo } from "../../types/institucion";
import Panel from "../../components/ui/Panel";
import Badge from "../../components/ui/Badge";
import Alerta from "../../components/feedback/Alerta";
import Cargando from "../../components/feedback/Cargando";
import ConfirmDialog from "../../components/feedback/ConfirmDialog";
import { formatearFecha } from "../../utils/fechas";
import { mensajeError } from "../../utils/errores";

import "../../styles/institucion.css";

type Accion = null | { tipo: TipoCodigo; accion: "renovar" | "desactivar" };

const INFO: Record<TipoCodigo, { titulo: string; icono: string; descripcion: string }> = {
  docente: {
    titulo: "Código de docentes",
    icono: "fa-solid fa-chalkboard-user",
    descripcion: "Los docentes lo usan para registrarse en tu institución.",
  },
  admin: {
    titulo: "Código de administradores",
    icono: "fa-solid fa-user-shield",
    descripcion: "Da acceso de administrador. Compártelo solo con personas de confianza.",
  },
};

function Institucion() {
  useTituloPagina("Institución", "Códigos de invitación e información");
  const toast = useToast();

  const [codigos, setCodigos] = useState<CodigosInvitacionOut | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const [accion, setAccion] = useState<Accion>(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError("");
    try {
      setCodigos(await institucionService.verCodigos());
    } catch (err) {
      setError(await mensajeError(err, "No se pudieron cargar los códigos."));
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  async function copiar(codigo: string) {
    try {
      await navigator.clipboard.writeText(codigo);
      toast.exito("Código copiado.");
    } catch {
      toast.aviso("No se pudo copiar. Selecciónalo y cópialo a mano.");
    }
  }

  async function confirmar() {
    if (!accion) return;
    setOcupado(true);
    try {
      const r =
        accion.accion === "renovar"
          ? await institucionService.renovar(accion.tipo)
          : await institucionService.desactivar(accion.tipo);
      toast.exito(r.message || (accion.accion === "renovar" ? "Código renovado." : "Código desactivado."));
      setAccion(null);
      await cargar();
    } catch (err) {
      toast.error(await mensajeError(err));
    } finally {
      setOcupado(false);
    }
  }

  function tarjeta(tipo: TipoCodigo, codigo?: string | null) {
    const { titulo, icono, descripcion } = INFO[tipo];
    return (
      <Panel title={titulo} action={<Badge tone={codigo ? "success" : "neutral"}>{codigo ? "Activo" : "Desactivado"}</Badge>}>
        <div className="inst-codigo-bloque">
          <p className="inst-desc"><i className={`${icono} me-2`}></i>{descripcion}</p>

          {codigo ? (
            <div className="inst-codigo">
              <code>{codigo}</code>
              <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => void copiar(codigo)}>
                <i className="fa-regular fa-copy me-2"></i>Copiar
              </button>
            </div>
          ) : (
            <p className="inst-vacio">Sin código activo: nadie puede registrarse con este rol hasta que generes uno nuevo.</p>
          )}

          <div className="inst-acciones">
            <button type="button" className="fb-btn fb-btn-primary" disabled={ocupado} onClick={() => setAccion({ tipo, accion: "renovar" })}>
              <i className="fa-solid fa-rotate me-2"></i>{codigo ? "Renovar código" : "Generar código"}
            </button>
            {codigo && (
              <button type="button" className="fb-btn fb-btn-ghost" disabled={ocupado} onClick={() => setAccion({ tipo, accion: "desactivar" })}>
                Desactivar
              </button>
            )}
          </div>
        </div>
      </Panel>
    );
  }

  if (cargando && !codigos) return <div className="panel-box"><Cargando texto="Cargando códigos..." /></div>;

  const info = accion ? INFO[accion.tipo].titulo.toLowerCase() : "";

  return (
    <>
      {error && (
        <Alerta tono="error">
          {error}{" "}
          <button type="button" className="btn btn-sm btn-outline-danger ms-2" onClick={() => void cargar()}>Reintentar</button>
        </Alerta>
      )}

      {codigos && (
        <>
          <p className="inst-actualizado">
            Última actualización: <strong>{formatearFecha(codigos.fecha_actualizacion)}</strong>
          </p>
          <div className="inst-grid">
            {tarjeta("docente", codigos.codigo_docente)}
            {tarjeta("admin", codigos.codigo_admin)}
          </div>
        </>
      )}

      <ConfirmDialog
        abierto={accion !== null}
        titulo={accion?.accion === "renovar" ? "Renovar código" : "Desactivar código"}
        mensaje={
          accion?.accion === "renovar"
            ? `Se generará un nuevo ${info}. El anterior dejará de funcionar de inmediato.`
            : `Se desactivará el ${info}. Nadie podrá registrarse con ese rol hasta que generes uno nuevo.`
        }
        tono={accion?.accion === "desactivar" ? "warning" : "primary"}
        textoConfirmar={accion?.accion === "renovar" ? "Renovar" : "Desactivar"}
        cargando={ocupado}
        onConfirmar={() => void confirmar()}
        onCancelar={() => setAccion(null)}
      />
    </>
  );
}

export default Institucion;