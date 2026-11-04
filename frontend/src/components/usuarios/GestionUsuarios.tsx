import { useCallback, useEffect, useRef, useState } from "react";

import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import usuarioService from "../../services/usuario.service";
import eleccionService from "../../services/eleccion.service";
import { ROL, ROL_NOMBRE, type EstudianteCreate, type UsuarioListaOut, type UsuarioOut, type UsuarioUpdate } from "../../types/usuario";
import Panel from "../ui/Panel";
import Badge from "../ui/Badge";
import Alerta from "../feedback/Alerta";
import Cargando from "../feedback/Cargando";
import EstadoVacio from "../feedback/EstadoVacio";
import ConfirmDialog from "../feedback/ConfirmDialog";
import Modal from "../feedback/Modal";
import FormularioUsuario, { type DatosUsuarioForm } from "./FormularioUsuario";
import CargaMasivaUsuarios from "./CargaMasivaUsuarios";
import { esConflicto, mensajeError } from "../../utils/errores";

import "../../styles/elecciones.css";
import "../../styles/usuarios.css";

const TAMANO = 20;

interface Props {
  /** Fija el rol listado (ej. el docente solo ve estudiantes: ROL.ESTUDIANTE). */
  rolFijo?: number;
  puedeCrear?: boolean;
  puedeEditar?: boolean;
  puedeEliminar?: boolean;
  /** Muestra el botón de carga masiva por CSV. */
  puedeCargaMasiva?: boolean;
}

type Formulario = null | { modo: "crear" } | { modo: "editar"; usuario: UsuarioOut };

const TONO_ROL: Record<number, "info" | "warning" | "neutral"> = { 1: "info", 2: "warning", 3: "neutral" };

/** Listado y gestión de usuarios. Reutilizable por el docente (2B) con
 *  rolFijo = ESTUDIANTE y sin crear/editar/eliminar. Los permisos reales los
 *  decide el backend (403): aquí solo se ocultan los botones. */
export function GestionUsuarios({ rolFijo, puedeCrear = false, puedeEditar = false, puedeEliminar = false, puedeCargaMasiva = false }: Props) {
  const toast = useToast();
  const { usuario: yo } = useAuth();

  // Filtros
  const [q, setQ] = useState("");
  const [qAplicada, setQAplicada] = useState("");
  const [rol, setRol] = useState("");
  const [curso, setCurso] = useState("");
  const [activo, setActivo] = useState("");
  const [pagina, setPagina] = useState(1);
  const [cursos, setCursos] = useState<string[]>([]);

  // Datos
  const [datos, setDatos] = useState<UsuarioListaOut | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [ocupado, setOcupado] = useState(false);

  // Ventanas
  const [formulario, setFormulario] = useState<Formulario>(null);
  const [cargaMasiva, setCargaMasiva] = useState(false);
  const [aCambiarCurso, setACambiarCurso] = useState<UsuarioOut | null>(null);
  const [cursoNuevo, setCursoNuevo] = useState("");
  const [aDesactivar, setADesactivar] = useState<UsuarioOut | null>(null);
  const [aEliminar, setAEliminar] = useState<UsuarioOut | null>(null);
  const [conflicto, setConflicto] = useState<{ usuario: UsuarioOut; mensaje: string } | null>(null);

  const solicitud = useRef(0);
  const rolEfectivo = rolFijo ?? (rol ? Number(rol) : undefined);

  // Cursos para el filtro y las sugerencias de los formularios.
  useEffect(() => {
    eleccionService.listarCursos().then(setCursos).catch(() => setCursos([]));
  }, []);

  // Búsqueda con retardo para no consultar en cada letra.
  useEffect(() => {
    const t = window.setTimeout(() => {
      setQAplicada(q.trim());
      setPagina(1);
    }, 350);
    return () => window.clearTimeout(t);
  }, [q]);

  const cargar = useCallback(
    async (silencioso = false) => {
      const n = ++solicitud.current; // ignora respuestas viejas
      if (!silencioso) setCargando(true);
      setError("");
      try {
        const r = await usuarioService.listar({
          rol: rolEfectivo,
          curso: curso || undefined,
          activo: activo === "" ? undefined : activo === "true",
          q: qAplicada || undefined,
          pagina,
          tamano: TAMANO,
        });
        if (n === solicitud.current) setDatos(r);
      } catch (err) {
        const msg = await mensajeError(err, "No se pudo cargar el listado de usuarios.");
        if (n === solicitud.current) setError(msg);
      } finally {
        if (n === solicitud.current) setCargando(false);
      }
    },
    [rolEfectivo, curso, activo, qAplicada, pagina]
  );

  useEffect(() => {
    void cargar();
  }, [cargar]);

  function cambiarFiltro(fn: () => void) {
    fn();
    setPagina(1);
  }

  // ---- Acciones ----
  async function guardar(d: DatosUsuarioForm) {
    if (!formulario) return;
    setOcupado(true);
    try {
      if (formulario.modo === "crear") {
        const payload: EstudianteCreate = { ...d, curso: d.curso ?? "" };
        const r = await usuarioService.crearEstudiante(payload);
        toast.exito(r.message || "Estudiante creado.");
        setPagina(1);
      } else {
        const payload: UsuarioUpdate = { ...d };
        await usuarioService.actualizar(formulario.usuario.id_usuario, payload);
        toast.exito("Usuario actualizado.");
      }
      setFormulario(null);
      await cargar(true);
    } catch (err) {
      toast.error(await mensajeError(err, "No se pudo guardar el usuario."));
    } finally {
      setOcupado(false);
    }
  }

  async function cambiarEstado(u: UsuarioOut, nuevoActivo: boolean) {
    setOcupado(true);
    try {
      const r = await usuarioService.cambiarEstado(u.id_usuario, nuevoActivo);
      toast.exito(r.message || (nuevoActivo ? "Usuario activado." : "Usuario desactivado."));
      (r.advertencias ?? []).forEach((a) => toast.aviso(a));
      setADesactivar(null);
      setConflicto(null);
      await cargar(true);
    } catch (err) {
      toast.error(await mensajeError(err));
    } finally {
      setOcupado(false);
    }
  }

  async function guardarCurso() {
    if (!aCambiarCurso) return;
    const nuevo = cursoNuevo.trim();
    if (!nuevo) {
      toast.aviso("Escribe el nuevo curso.");
      return;
    }
    setOcupado(true);
    try {
      await usuarioService.cambiarCurso(aCambiarCurso.id_usuario, nuevo);
      toast.exito("Curso actualizado.");
      setACambiarCurso(null);
      await cargar(true);
    } catch (err) {
      toast.error(await mensajeError(err));
    } finally {
      setOcupado(false);
    }
  }

  async function eliminar() {
    if (!aEliminar) return;
    const u = aEliminar;
    setOcupado(true);
    try {
      const r = await usuarioService.eliminar(u.id_usuario);
      toast.exito(r.message || "Usuario eliminado.");
      setAEliminar(null);
      if (datos && datos.usuarios.length === 1 && pagina > 1) setPagina(pagina - 1);
      else await cargar(true);
    } catch (err) {
      const mensaje = await mensajeError(err, "No se pudo eliminar el usuario.");
      setAEliminar(null);
      // 409 = tiene historial: se ofrece desactivarlo en su lugar.
      if (esConflicto(err)) setConflicto({ usuario: u, mensaje });
      else toast.error(mensaje);
    } finally {
      setOcupado(false);
    }
  }

  const totalPaginas = datos ? Math.max(1, Math.ceil(datos.total / datos.tamano)) : 1;
  const acciones = (puedeCrear || puedeCargaMasiva) && (
    <div className="d-flex gap-2 flex-wrap">
      {puedeCargaMasiva && (
        <button type="button" className="btn btn-outline-secondary" onClick={() => setCargaMasiva(true)}>
          <i className="fa-solid fa-file-arrow-up me-2"></i>Cargar CSV
        </button>
      )}
      {puedeCrear && (
        <button type="button" className="btn-accent btn-accent-violet border-0" onClick={() => setFormulario({ modo: "crear" })}>
          <i className="fa-solid fa-plus me-2"></i>Nuevo estudiante
        </button>
      )}
    </div>
  );

  return (
    <Panel title="Usuarios" action={acciones}>
      {/* Filtros */}
      <div className="usr-filtros">
        <input type="search" className="form-control usr-buscar" placeholder="Buscar por nombre, documento o correo..."
          value={q} onChange={(e) => setQ(e.target.value)} aria-label="Buscar usuarios" />
        {rolFijo === undefined && (
          <select className="form-select" value={rol} onChange={(e) => cambiarFiltro(() => setRol(e.target.value))} aria-label="Filtrar por rol">
            <option value="">Todos los roles</option>
            <option value={ROL.ADMIN}>Administradores</option>
            <option value={ROL.DOCENTE}>Docentes</option>
            <option value={ROL.ESTUDIANTE}>Estudiantes</option>
          </select>
        )}
        {cursos.length > 0 && (
          <select className="form-select" value={curso} onChange={(e) => cambiarFiltro(() => setCurso(e.target.value))} aria-label="Filtrar por curso">
            <option value="">Todos los cursos</option>
            {cursos.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        )}
        <select className="form-select" value={activo} onChange={(e) => cambiarFiltro(() => setActivo(e.target.value))} aria-label="Filtrar por estado">
          <option value="">Activos e inactivos</option>
          <option value="true">Solo activos</option>
          <option value="false">Solo inactivos</option>
        </select>
      </div>

      {error && (
        <Alerta tono="error">
          {error}{" "}
          <button type="button" className="btn btn-sm btn-outline-danger ms-2" onClick={() => void cargar()}>Reintentar</button>
        </Alerta>
      )}

      {cargando && !datos ? (
        <Cargando texto="Cargando usuarios..." />
      ) : datos && datos.usuarios.length === 0 ? (
        <EstadoVacio icono="fa-solid fa-users-slash" titulo="No hay usuarios con esos filtros" descripcion="Prueba con otra búsqueda o limpia los filtros." />
      ) : (
        datos && (
          <>
            <div className={`tabla-scroll${cargando ? " usr-recargando" : ""}`}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Usuario</th>
                    <th>Documento</th>
                    <th>Rol</th>
                    <th>Curso</th>
                    <th>Estado</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {datos.usuarios.map((u) => {
                    const esYo = u.id_usuario === yo?.id_usuario;
                    return (
                      <tr key={u.id_usuario}>
                        <td>
                          <div className="usr-nombre">
                            <strong>{u.nombre} {u.apellido}{esYo && <span className="usr-yo"> (tú)</span>}</strong>
                            <small>{u.correo}</small>
                          </div>
                        </td>
                        <td className="celda-cursos">{u.tipo_documento} {u.documento}</td>
                        <td><Badge tone={TONO_ROL[u.id_rol] ?? "neutral"}>{ROL_NOMBRE[u.id_rol] ?? u.rol_nombre}</Badge></td>
                        <td>{u.curso || "—"}</td>
                        <td><Badge tone={u.activo ? "success" : "danger"}>{u.activo ? "Activo" : "Inactivo"}</Badge></td>
                        <td>
                          <div className="usr-acciones">
                            {puedeEditar && (
                              <button type="button" title="Editar" aria-label={`Editar a ${u.nombre}`} onClick={() => setFormulario({ modo: "editar", usuario: u })}>
                                <i className="fa-solid fa-pen"></i>
                              </button>
                            )}
                            {u.id_rol === ROL.ESTUDIANTE && (
                              <button type="button" title="Cambiar curso" aria-label={`Cambiar curso de ${u.nombre}`}
                                onClick={() => { setCursoNuevo(u.curso ?? ""); setACambiarCurso(u); }}>
                                <i className="fa-solid fa-shuffle"></i>
                              </button>
                            )}
                            {!esYo && (
                              <button type="button" title={u.activo ? "Desactivar" : "Activar"} aria-label={u.activo ? `Desactivar a ${u.nombre}` : `Activar a ${u.nombre}`}
                                disabled={ocupado} onClick={() => (u.activo ? setADesactivar(u) : void cambiarEstado(u, true))}>
                                <i className={`fa-solid ${u.activo ? "fa-user-slash" : "fa-user-check"}`}></i>
                              </button>
                            )}
                            {puedeEliminar && !esYo && (
                              <button type="button" className="usr-peligro" title="Eliminar" aria-label={`Eliminar a ${u.nombre}`} onClick={() => setAEliminar(u)}>
                                <i className="fa-solid fa-trash"></i>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="usr-paginacion">
              <span>{datos.total} {datos.total === 1 ? "usuario" : "usuarios"} · Página {datos.pagina} de {totalPaginas}</span>
              <div>
                <button type="button" className="btn btn-sm btn-outline-secondary" disabled={pagina <= 1} onClick={() => setPagina(pagina - 1)}>Anterior</button>
                <button type="button" className="btn btn-sm btn-outline-secondary ms-2" disabled={pagina >= totalPaginas} onClick={() => setPagina(pagina + 1)}>Siguiente</button>
              </div>
            </div>
          </>
        )
      )}

      {/* Carga masiva */}
      <CargaMasivaUsuarios
        abierto={cargaMasiva}
        onCerrar={() => setCargaMasiva(false)}
        onCompletada={() => { setPagina(1); void cargar(true); }}
      />

      {/* Crear / editar */}
      <Modal
        abierto={formulario !== null}
        titulo={formulario?.modo === "editar" ? "Editar usuario" : "Nuevo estudiante"}
        onCerrar={() => setFormulario(null)}
        bloqueado={ocupado}
      >
        {formulario && (
          <FormularioUsuario
            // key: el formulario se reinicia al cambiar de usuario
            key={formulario.modo === "editar" ? formulario.usuario.id_usuario : "nuevo"}
            usuario={formulario.modo === "editar" ? formulario.usuario : undefined}
            cursosDisponibles={cursos}
            cursoObligatorio={formulario.modo === "crear" || formulario.usuario.id_rol === ROL.ESTUDIANTE}
            enviando={ocupado}
            textoEnviar={formulario.modo === "editar" ? "Guardar cambios" : "Crear estudiante"}
            onSubmit={(d) => void guardar(d)}
            onCancelar={() => setFormulario(null)}
          />
        )}
      </Modal>

      {/* Cambiar curso */}
      <ConfirmDialog
        abierto={aCambiarCurso !== null}
        titulo="Cambiar curso"
        mensaje={aCambiarCurso && <>Nuevo curso de <strong>{aCambiarCurso.nombre} {aCambiarCurso.apellido}</strong>.</>}
        textoConfirmar="Guardar curso"
        cargando={ocupado}
        onConfirmar={() => void guardarCurso()}
        onCancelar={() => setACambiarCurso(null)}
      >
        <div className="form-campo mb-1">
          <label htmlFor="usr-curso-nuevo">Curso</label>
          <input id="usr-curso-nuevo" className="form-control" list="usr-cursos-sugeridos" maxLength={20}
            value={cursoNuevo} onChange={(e) => setCursoNuevo(e.target.value)} />
          <datalist id="usr-cursos-sugeridos">
            {cursos.map((c) => <option key={c} value={c} />)}
          </datalist>
        </div>
      </ConfirmDialog>

      {/* Desactivar */}
      <ConfirmDialog
        abierto={aDesactivar !== null}
        titulo="Desactivar usuario"
        mensaje={aDesactivar && <><strong>{aDesactivar.nombre} {aDesactivar.apellido}</strong> no podrá iniciar sesión mientras esté inactivo. Podrás activarlo de nuevo cuando quieras.</>}
        tono="warning"
        textoConfirmar="Desactivar"
        cargando={ocupado}
        onConfirmar={() => aDesactivar && void cambiarEstado(aDesactivar, false)}
        onCancelar={() => setADesactivar(null)}
      />

      {/* Eliminar */}
      <ConfirmDialog
        abierto={aEliminar !== null}
        titulo="Eliminar usuario"
        mensaje={aEliminar && <>Vas a eliminar a <strong>{aEliminar.nombre} {aEliminar.apellido}</strong>. Esta acción no se puede deshacer.</>}
        tono="danger"
        textoConfirmar="Eliminar"
        cargando={ocupado}
        onConfirmar={() => void eliminar()}
        onCancelar={() => setAEliminar(null)}
      />

      {/* 409: tiene historial -> ofrecer desactivar */}
      <ConfirmDialog
        abierto={conflicto !== null}
        titulo="No se puede eliminar"
        mensaje={conflicto && <>{conflicto.mensaje} ¿Quieres desactivar a <strong>{conflicto.usuario.nombre} {conflicto.usuario.apellido}</strong> en su lugar?</>}
        tono="warning"
        textoConfirmar="Desactivar"
        textoCancelar="Cerrar"
        cargando={ocupado}
        onConfirmar={() => conflicto && void cambiarEstado(conflicto.usuario, false)}
        onCancelar={() => setConflicto(null)}
      />
    </Panel>
  );
}

export default GestionUsuarios;