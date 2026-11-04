import { useEffect, useState, type FormEvent } from "react";

import { useAuth } from "../context/AuthContext";
import { useTituloPagina } from "../context/PaginaContext";
import { useToast } from "../context/ToastContext";
import perfilService from "../services/perfil.service";
import type { PerfilResponse } from "../types/perfil";
import Panel from "../components/ui/Panel";
import Alerta from "../components/feedback/Alerta";
import Cargando from "../components/feedback/Cargando";
import { mensajeError } from "../utils/errores";

import "../styles/elecciones.css";
import "../styles/cuenta.css";

const CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Mi cuenta: perfil y contraseña. La usan los tres roles. */
function Cuenta() {
  useTituloPagina("Mi cuenta", "Tu perfil y tu contraseña");
  const toast = useToast();
  const { refrescarUsuario } = useAuth();

  const [perfil, setPerfil] = useState<PerfilResponse | null>(null);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState("");

  // Perfil
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [correo, setCorreo] = useState("");
  const [errorPerfil, setErrorPerfil] = useState("");
  const [guardando, setGuardando] = useState(false);

  // Contraseña
  const [actual, setActual] = useState("");
  const [nueva, setNueva] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [errorClave, setErrorClave] = useState("");
  const [cambiando, setCambiando] = useState(false);

  function aplicar(p: PerfilResponse) {
    setPerfil(p);
    setNombre(p.nombre);
    setApellido(p.apellido);
    setCorreo(p.correo);
  }

  useEffect(() => {
    let activo = true;
    perfilService
      .obtener()
      .then((p) => activo && aplicar(p))
      .catch(async (err) => activo && setErrorCarga(await mensajeError(err, "No se pudo cargar tu perfil.")))
      .finally(() => activo && setCargando(false));
    return () => {
      activo = false;
    };
  }, []);

  async function guardarPerfil(e: FormEvent) {
    e.preventDefault();
    if (!nombre.trim() || !apellido.trim()) return setErrorPerfil("Nombre y apellido son obligatorios.");
    if (!CORREO.test(correo.trim())) return setErrorPerfil("Escribe un correo válido.");
    setErrorPerfil("");
    setGuardando(true);
    try {
      const p = await perfilService.actualizar({ nombre: nombre.trim(), apellido: apellido.trim(), correo: correo.trim() });
      aplicar(p);
      await refrescarUsuario(); // el header se actualiza sin recargar
      toast.exito("Perfil actualizado.");
    } catch (err) {
      setErrorPerfil(await mensajeError(err, "No se pudo actualizar el perfil."));
    } finally {
      setGuardando(false);
    }
  }

  async function cambiarClave(e: FormEvent) {
    e.preventDefault();
    if (!actual) return setErrorClave("Escribe tu contraseña actual.");
    if (nueva.length < 8) return setErrorClave("La nueva contraseña debe tener al menos 8 caracteres.");
    if (nueva.length > 72) return setErrorClave("La nueva contraseña no puede superar 72 caracteres.");
    if (nueva !== confirmar) return setErrorClave("La confirmación no coincide con la nueva contraseña.");
    if (nueva === actual) return setErrorClave("La nueva contraseña debe ser distinta de la actual.");
    setErrorClave("");
    setCambiando(true);
    try {
      const r = await perfilService.cambiarContrasena({ contrasena_actual: actual, contrasena_nueva: nueva });
      toast.exito(r.message || "Contraseña actualizada.");
      setActual("");
      setNueva("");
      setConfirmar("");
    } catch (err) {
      setErrorClave(await mensajeError(err, "No se pudo cambiar la contraseña."));
    } finally {
      setCambiando(false);
    }
  }

  if (cargando) return <div className="panel-box"><Cargando texto="Cargando tu perfil..." /></div>;
  if (errorCarga || !perfil) return <Alerta tono="error">{errorCarga || "No se pudo cargar tu perfil."}</Alerta>;

  return (
    <div className="cuenta-grid">
      <Panel title="Datos personales">
        <form onSubmit={(e) => void guardarPerfil(e)} noValidate className="cuenta-form">
          {errorPerfil && <Alerta tono="error" onCerrar={() => setErrorPerfil("")}>{errorPerfil}</Alerta>}

          <dl className="cuenta-fijos">
            <div><dt>Documento</dt><dd>{perfil.documento}</dd></div>
            <div><dt>Rol</dt><dd>{perfil.rol_nombre}</dd></div>
            {perfil.curso && <div><dt>Curso</dt><dd>{perfil.curso}</dd></div>}
          </dl>

          <div className="cuenta-fila">
            <div className="form-campo">
              <label htmlFor="cta-nombre">Nombre</label>
              <input id="cta-nombre" className="form-control" value={nombre} maxLength={100} onChange={(e) => setNombre(e.target.value)} />
            </div>
            <div className="form-campo">
              <label htmlFor="cta-apellido">Apellido</label>
              <input id="cta-apellido" className="form-control" value={apellido} maxLength={100} onChange={(e) => setApellido(e.target.value)} />
            </div>
          </div>

          <div className="form-campo">
            <label htmlFor="cta-correo">Correo</label>
            <input id="cta-correo" type="email" className="form-control" value={correo} onChange={(e) => setCorreo(e.target.value)} />
          </div>

          <div className="form-acciones">
            <button type="submit" className="fb-btn fb-btn-primary" disabled={guardando}>
              {guardando && <span className="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>}
              Guardar cambios
            </button>
          </div>
        </form>
      </Panel>

      <Panel title="Cambiar contraseña">
        <form onSubmit={(e) => void cambiarClave(e)} noValidate className="cuenta-form">
          {errorClave && <Alerta tono="error" onCerrar={() => setErrorClave("")}>{errorClave}</Alerta>}

          <div className="form-campo">
            <label htmlFor="cta-actual">Contraseña actual</label>
            <input id="cta-actual" type="password" autoComplete="current-password" className="form-control" value={actual} onChange={(e) => setActual(e.target.value)} />
          </div>
          <div className="form-campo">
            <label htmlFor="cta-nueva">Nueva contraseña</label>
            <input id="cta-nueva" type="password" autoComplete="new-password" className="form-control" value={nueva} maxLength={72} onChange={(e) => setNueva(e.target.value)} />
            <small className="cuenta-ayuda">Entre 8 y 72 caracteres.</small>
          </div>
          <div className="form-campo">
            <label htmlFor="cta-confirmar">Confirmar nueva contraseña</label>
            <input id="cta-confirmar" type="password" autoComplete="new-password" className="form-control" value={confirmar} maxLength={72} onChange={(e) => setConfirmar(e.target.value)} />
          </div>

          <div className="form-acciones">
            <button type="submit" className="fb-btn fb-btn-primary" disabled={cambiando}>
              {cambiando && <span className="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>}
              Cambiar contraseña
            </button>
          </div>
        </form>
      </Panel>
    </div>
  );
}

export default Cuenta;