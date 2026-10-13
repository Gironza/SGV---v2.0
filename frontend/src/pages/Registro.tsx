import { useState } from "react";
import { useNavigate, Link } from "react-router";
import "bootstrap/dist/css/bootstrap.min.css";
import "../styles/styles.css";
import authService from "../services/auth.service";
import Logo from "../components/ui/Logo";

const TIPOS_DOCUMENTO = [
  { id: 1, nombre: "CC" },
  { id: 2, nombre: "TI" },
  { id: 3, nombre: "CE" },
  { id: 4, nombre: "PPT" },
];

function Registro() {
  const navigate = useNavigate();

  const [nombres, setNombres] = useState("");
  const [apellidos, setApellidos] = useState("");
  const [documento, setDocumento] = useState("");
  const [idTipoDoc, setIdTipoDoc] = useState("");
  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [confirmarPassword, setConfirmarPassword] = useState("");
  const [codigoInstitucion, setCodigoInstitucion] = useState("");

  const [error, setError] = useState("");
  const [mensajeExito, setMensajeExito] = useState("");
  const [cargando, setCargando] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setMensajeExito("");

    if (password !== confirmarPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }
    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres");
      return;
    }
    if (!idTipoDoc) {
      setError("Selecciona el tipo de documento");
      return;
    }

    setCargando(true);
    try {
      const resultado = await authService.registro({
        nombres,
        apellidos,
        documento,
        id_tipo_doc: Number(idTipoDoc),
        correo,
        password,
        codigo_institucion: codigoInstitucion,
      });

      setMensajeExito(resultado.message);
      setTimeout(() => navigate("/login"), 1500);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Error al registrar usuario");
    } finally {
      setCargando(false);
    }
  }

  return (
    <section className="register-container">
      <div className="register-card">
        {/* IZQUIERDA */}
        <div className="register-left">
          <div className="mb-3">
            <Logo size="lg" light />
          </div>
          <h1>Únete a SGV</h1>
          <p>
            Crea tu cuenta como Administrador o Docente de tu institución.
          </p>
          <img
            src="https://cdn-icons-png.flaticon.com/512/4207/4207247.png"
            alt="Registro"
          />
        </div>
        {/* DERECHA */}
        <div className="register-right">
          <h2>Crear Cuenta</h2>

          {error && (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          )}
          {mensajeExito && (
            <div className="alert alert-success" role="alert">
              {mensajeExito}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* NOMBRES Y APELLIDOS */}
            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label">Nombres</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Ingrese nombres"
                  value={nombres}
                  onChange={(e) => setNombres(e.target.value)}
                  required
                />
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label">Apellidos</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Ingrese apellidos"
                  value={apellidos}
                  onChange={(e) => setApellidos(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* TIPO DE DOCUMENTO Y DOCUMENTO */}
            <div className="row">
              <div className="col-md-4 mb-3">
                <label className="form-label">Tipo doc.</label>
                <select
                  className="form-select"
                  value={idTipoDoc}
                  onChange={(e) => setIdTipoDoc(e.target.value)}
                  required
                >
                  <option value="">--</option>
                  {TIPOS_DOCUMENTO.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.nombre}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-8 mb-3">
                <label className="form-label">Número de documento</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Ingrese documento"
                  value={documento}
                  onChange={(e) => setDocumento(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* CORREO */}
            <div className="mb-3">
              <label className="form-label">Correo electrónico</label>
              <input
                type="email"
                className="form-control"
                placeholder="Ingrese correo"
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                required
              />
            </div>

            {/* CONTRASEÑAS */}
            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label">Contraseña</label>
                <input
                  type="password"
                  className="form-control"
                  placeholder="Mínimo 8 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label">Confirmar contraseña</label>
                <input
                  type="password"
                  className="form-control"
                  placeholder="Confirmar contraseña"
                  value={confirmarPassword}
                  onChange={(e) => setConfirmarPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* CÓDIGO DE INSTITUCIÓN */}
            <div className="mb-3">
              <label className="form-label">Código de institución</label>
              <input
                type="text"
                className="form-control"
                placeholder="Ingrese el código de su institución"
                value={codigoInstitucion}
                onChange={(e) => setCodigoInstitucion(e.target.value)}
                required
              />
              <small className="text-muted">
                Este código determina si tu cuenta será de Administrador o
                Docente.
              </small>
            </div>

            {/* REGISTRARSE */}
            <button
              type="submit"
              className="register-btn-full d-block text-center w-100 border-0"
              disabled={cargando}
            >
              {cargando ? "Registrando..." : "Registrarse"}
            </button>
          </form>
          {/* LOGIN */}
          <p className="login-text">
            ¿Ya tienes cuenta?
            <Link to="/login" className="ms-1">
              Inicia sesión
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}

export default Registro;