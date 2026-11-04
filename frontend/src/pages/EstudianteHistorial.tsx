import { useCallback, useEffect, useState } from "react";

import { useTituloPagina } from "../context/PaginaContext";
import { useToast } from "../context/ToastContext";
import eleccionService from "../services/eleccion.service";
import votoService from "../services/voto.service";
import type { EleccionOut } from "../types/eleccion";
import type { HistorialVotoOut } from "../types/votacion";
import Panel from "../components/ui/Panel";
import Badge from "../components/ui/Badge";
import Alerta from "../components/feedback/Alerta";
import Cargando from "../components/feedback/Cargando";
import EstadoVacio from "../components/feedback/EstadoVacio";
import ResultadosResumen from "../components/resultados/ResultadosResumen";
import { esFinalizada, faseDe, infoFase } from "../utils/etapa";
import { formatearFecha } from "../utils/fechas";
import { mensajeError } from "../utils/errores";

import "../styles/estudiante.css";

interface ItemHistorial {
  eleccion: EleccionOut;
  /** Mi voto en esa elección (null si no voté). */
  voto: HistorialVotoOut | null;
}

/** Historial del estudiante: elecciones finalizadas y aquellas en las que
 *  votó, con su certificado en PDF y, si ya se publicaron, los resultados. */
function EstudianteHistorial() {
  useTituloPagina("Mi historial", "Tus votos, certificados y resultados");
  const toast = useToast();

  const [items, setItems] = useState<ItemHistorial[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [descargando, setDescargando] = useState<number | null>(null);
  const [abierta, setAbierta] = useState<EleccionOut | null>(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError("");
    try {
      const [elecciones, historial] = await Promise.all([eleccionService.listar(), votoService.historial()]);
      const votos = new Map(historial.map((h) => [h.id_eleccion, h]));
      setItems(
        elecciones
          .filter((e) => esFinalizada(e) || votos.has(e.id_eleccion))
          .map<ItemHistorial>((e) => ({ eleccion: e, voto: votos.get(e.id_eleccion) ?? null }))
          .sort((a, b) => b.eleccion.fecha_fin.localeCompare(a.eleccion.fecha_fin))
      );
    } catch (err) {
      setError(await mensajeError(err, "No se pudo cargar tu historial."));
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  async function certificado(idEleccion: number) {
    setDescargando(idEleccion);
    try {
      await votoService.descargarCertificado(idEleccion);
    } catch (err) {
      toast.error(await mensajeError(err, "No se pudo descargar el certificado."));
    } finally {
      setDescargando(null);
    }
  }

  // Detalle de resultados de una elección
  if (abierta) {
    return (
      <Panel
        title={abierta.titulo}
        action={
          <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setAbierta(null)}>
            ← Volver al historial
          </button>
        }
      >
        <ResultadosResumen idEleccion={abierta.id_eleccion} fechaPublicacion={abierta.fecha_publicacion_resultados} />
      </Panel>
    );
  }

  return (
    <Panel title="Mis votaciones">
      {error && (
        <Alerta tono="error">
          {error}{" "}
          <button type="button" className="btn btn-sm btn-outline-danger ms-2" onClick={() => void cargar()}>Reintentar</button>
        </Alerta>
      )}

      {cargando ? (
        <Cargando texto="Cargando historial..." />
      ) : (
        !error &&
        (items.length === 0 ? (
          <EstadoVacio
            icono="fa-solid fa-clock-rotate-left"
            titulo="Aún no tienes historial"
            descripcion="Aquí verás tus votos y las votaciones finalizadas de tu institución."
          />
        ) : (
          <div className="est-grid">
            {items.map(({ eleccion: e, voto }) => {
              const finalizada = esFinalizada(e);
              const { etiqueta, tono } = infoFase(faseDe(e));
              return (
                <article key={e.id_eleccion} className="est-card">
                  <div className="est-card-head">
                    <h4>{e.titulo}</h4>
                    <Badge tone={tono}>{etiqueta}</Badge>
                  </div>
                  <p className="est-card-fecha">{finalizada ? "Cerró" : "Cierra"}: {formatearFecha(e.fecha_fin)}</p>

                  {voto ? (
                    <>
                      <p className="est-card-nota est-ok">
                        <i className="fa-solid fa-circle-check me-1"></i>
                        Votaste{voto.fecha_voto ? ` el ${formatearFecha(voto.fecha_voto)}` : ""}
                      </p>
                      {voto.codigo_certificado && (
                        <p className="est-card-nota">Código del certificado: <code>{voto.codigo_certificado}</code></p>
                      )}
                    </>
                  ) : (
                    <p className="est-card-nota">No votaste en esta elección.</p>
                  )}

                  <div className="d-flex gap-2 flex-wrap align-items-center mt-auto">
                    {voto && (
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-secondary"
                        disabled={descargando === e.id_eleccion}
                        onClick={() => void certificado(e.id_eleccion)}
                      >
                        {descargando === e.id_eleccion ? (
                          <span className="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>
                        ) : (
                          <i className="fa-solid fa-file-pdf me-2"></i>
                        )}
                        Certificado
                      </button>
                    )}
                    {e.fecha_publicacion_resultados ? (
                      <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => setAbierta(e)}>
                        Ver resultados
                      </button>
                    ) : (
                      <small className="text-muted">Resultados sin publicar</small>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        ))
      )}
    </Panel>
  );
}

export default EstudianteHistorial;