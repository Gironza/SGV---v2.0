import { Link } from "react-router";
import { useAuth } from "../context/AuthContext";
import "bootstrap/dist/css/bootstrap.min.css";
import "@fortawesome/fontawesome-free/css/all.min.css";
import "../styles/styles.css";
import Logo from "../components/ui/Logo";

function Inicio() {
  const { isAuthenticated, usuario } = useAuth();
  const rutaPanel = usuario?.id_rol === 1 ? "/admin" : usuario?.id_rol === 2 ? "/docente" : "/estudiante";
  return (
    <>
      {/* NAVBAR */}
      <nav className="navbar navbar-expand-lg">
        <div className="container-fluid">
          <Link className="navbar-brand" to="/">
            <Logo size="md" />
          </Link>
          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarNav"
          >
            <span className="navbar-toggler-icon"></span>
          </button>
          <div
            className="collapse navbar-collapse"
            id="navbarNav"
          >
            <ul className="navbar-nav mx-auto">
              <li className="nav-item">
                <a className="nav-link" href="#inicio">
                  Inicio
                </a>
              </li>
              <li className="nav-item">
                <a className="nav-link" href="#caracteristicas">
                  Características
                </a>
              </li>
              <li className="nav-item">
                <a className="nav-link" href="#roles">
                  Roles
                </a>
              </li>
              <li className="nav-item">
                <a className="nav-link" href="#estadisticas">
                  Estadísticas
                </a>
              </li>
              <li className="nav-item">
                <a className="nav-link" href="#contacto">
                  Contacto
                </a>
              </li>
            </ul>
            <div className="d-flex gap-2">
              {isAuthenticated ? (
                <Link to={rutaPanel} className="btn-login text-decoration-none">Ir a mi panel</Link>
              ) : (
                <>
                  <Link to="/login" className="btn-login text-decoration-none">Iniciar sesión</Link>
                  <Link to="/registro" className="btn-register text-decoration-none">Registrarse</Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>
      {/* HERO */}
      <section className="hero" id="inicio">
        <div className="container">
          <div className="row align-items-center">
            <div className="col-lg-6">
              <h1>
                Votaciones <span>seguras</span>,
                rápidas y confiables
              </h1>
              <p>
                Plataforma educativa diseñada para gestionar
                procesos electorales estudiantiles de forma
                moderna, transparente y segura.
              </p>
              <div className="hero-buttons">
                <Link
                  to="/login"
                  className="btn-main"
                >
                  Comenzar ahora
                </Link>
                <a
                  href="#caracteristicas"
                  className="btn-secondary-custom"
                >
                  Ver características
                </a>
              </div>
            </div>
            <div className="col-lg-6 text-center hero-image mt-5 mt-lg-0">
              <img
                src="https://cdn-icons-png.flaticon.com/512/3135/3135715.png"
                alt="SGV"
              />
            </div>
          </div>
        </div>
      </section>
      {/* CARACTERÍSTICAS */}
      <section
        className="features"
        id="caracteristicas"
      >
        <div className="section-title">
          <h2>
            Características del sistema
          </h2>
          <p>
            Funciones diseñadas para una experiencia moderna
            y segura.
          </p>
        </div>
        <div className="container">
          <div className="row g-4">
            <div className="col-md-4">
              <div className="feature-card">
                <i className="fa-solid fa-shield-halved"></i>
                <h4>Seguridad</h4>
                <p>
                  Protección de datos, autenticación y
                  validaciones seguras.
                </p>
              </div>
            </div>
            <div className="col-md-4">
              <div className="feature-card">
                <i className="fa-solid fa-chart-column"></i>
                <h4>Estadísticas</h4>
                <p>
                  Visualiza resultados, participación y
                  gráficos dinámicos.
                </p>
              </div>
            </div>
            <div className="col-md-4">
              <div className="feature-card">
                <i className="fa-solid fa-bell"></i>
                <h4>Notificaciones</h4>
                <p>
                  Recibe alertas y mensajes importantes
                  en tiempo real.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* ROLES */}
      <section className="roles" id="roles">
        <div className="section-title">
          <h2>
            Roles disponibles
          </h2>
          <p>
            El sistema está diseñado para toda la
            comunidad educativa.
          </p>
        </div>
        <div className="container">
          <div className="row g-4">
            <div className="col-md-6 col-lg-3">
              <div className="role-card">
                <img
                  src="https://cdn-icons-png.flaticon.com/512/4140/4140048.png"
                  alt="Administrador"
                />
                <div className="role-card-body">
                  <h4>
                    Administrador
                  </h4>
                  <p>
                    Gestiona usuarios, votaciones y
                    configuraciones del sistema.
                  </p>
                </div>
              </div>
            </div>
            <div className="col-md-6 col-lg-3">
              <div className="role-card">
                <img
                  src="https://cdn-icons-png.flaticon.com/512/4140/4140037.png"
                  alt="Docente"
                />
                <div className="role-card-body">
                  <h4>
                    Docente
                  </h4>
                  <p>
                    Crea votaciones y administra
                    estudiantes participantes.
                  </p>
                </div>
              </div>
            </div>
            <div className="col-md-6 col-lg-3">
              <div className="role-card">
                <img
                  src="https://cdn-icons-png.flaticon.com/512/4140/4140051.png"
                  alt="Estudiante"
                />
                <div className="role-card-body">
                  <h4>
                    Estudiante
                  </h4>
                  <p>
                    Participa en votaciones y consulta
                    resultados fácilmente.
                  </p>
                </div>
              </div>
            </div>
            <div className="col-md-6 col-lg-3">
              <div className="role-card">
                <img
                  src="https://cdn-icons-png.flaticon.com/512/4140/4140047.png"
                  alt="Candidato"
                />
                <div className="role-card-body">
                  <h4>
                    Candidato
                  </h4>
                  <p>
                    Publica propuestas y participa en
                    procesos electorales.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* ESTADÍSTICAS */}
      <section
        className="stats"
        id="estadisticas"
      >
        <div className="container">
          <div className="row">
            <div className="col-md-4 stat-box mb-4">
              <h2>99%</h2>
              <p>
                Disponibilidad del sistema
              </p>
            </div>
            <div className="col-md-4 stat-box mb-4">
              <h2>24/7</h2>
              <p>
                Acceso permanente
              </p>
            </div>
            <div className="col-md-4 stat-box mb-4">
              <h2>100%</h2>
              <p>
                Procesos transparentes
              </p>
            </div>
          </div>
        </div>
      </section>
      {/* FOOTER */}
      <footer
        className="footer"
        id="contacto"
      >
        <div className="d-flex justify-content-center mb-2">
          <Logo size="lg" light />
        </div>
        <p>
          Sistema de Gestión de Votaciones
        </p>
        <div className="mt-3">
          <i className="fa-brands fa-facebook fa-2x mx-2"></i>
          <i className="fa-brands fa-instagram fa-2x mx-2"></i>
          <i className="fa-brands fa-whatsapp fa-2x mx-2"></i>
        </div>
        <p className="mt-4">
          © 2026 SGV - Todos los derechos reservados.
        </p>
      </footer>
    </>
  );
}

export default Inicio;