import { useState } from "react";
import { useNavigate, Link } from "react-router";
import "bootstrap/dist/css/bootstrap.min.css";
import "@fortawesome/fontawesome-free/css/all.min.css";
import "../styles/styles.css";
import { useAuth } from "../context/AuthContext";
import Logo from "../components/ui/Logo";

function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setCargando(true);

    try {
      const usuario = await login(correo, password);

      // Redirección según rol: 1=Administrador, 2=Docente, 3=Estudiante
      if (usuario.id_rol === 1) {
        navigate("/admin");
      } else if (usuario.id_rol === 2) {
        navigate("/docente");
      } else if (usuario.id_rol === 3) {
        navigate("/estudiante");
      } else {
        setError("Rol de usuario no reconocido");
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || "Error al iniciar sesión");
    } finally {
      setCargando(false);
    }
  }

  return (
    <section className="login-container">
      <div className="login-card">
        {/* IZQUIERDA */}
        <div className="login-left">
          <Logo size="lg" light />
          <p>Bienvenido nuevamente al sistema de votaciones estudiantiles.</p>
          <img
            src="https://cdn-icons-png.flaticon.com/512/3135/3135715.png"
            alt="Login"
          />
        </div>
        {/* DERECHA */}
        <div className="login-right">
          <h2>Iniciar Sesión</h2>

          {error && (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* CORREO */}
            <div className="mb-3">
              <label className="form-label">Correo electrónico</label>
              <div className="input-group">
                <span className="input-group-text">
                  <i className="fa-solid fa-envelope"></i>
                </span>
                <input
                  type="email"
                  className="form-control"
                  placeholder="Ingrese su correo"
                  value={correo}
                  onChange={(e) => setCorreo(e.target.value)}
                  required
                />
              </div>
            </div>
            {/* CONTRASEÑA */}
            <div className="mb-3">
              <label className="form-label">Contraseña</label>
              <div className="input-group">
                <span className="input-group-text">
                  <i className="fa-solid fa-lock"></i>
                </span>
                <input
                  type="password"
                  className="form-control"
                  placeholder="Ingrese su contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>
            {/* INGRESAR */}
            <button
              type="submit"
              className="login-btn d-block text-center w-100 border-0"
              disabled={cargando}
            >
              {cargando ? "Ingresando..." : "Ingresar"}
            </button>
          </form>
          {/* REGISTRO */}
          <p className="register-text">
            ¿No tienes cuenta?
            <Link to="/registro" className="ms-1">
              Regístrate
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}

export default Login;