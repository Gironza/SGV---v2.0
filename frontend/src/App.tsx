import { BrowserRouter, Routes, Route } from "react-router";

import { AuthProvider } from "./context/AuthContext";
import RutaProtegida from "./routes/RutaProtegida";
import AppLayout from "./components/layout/AppLayout";
import PaginaEnConstruccion from "./components/ui/PaginaEnConstruccion";

import Inicio from "./pages/inicio";
import Login from "./pages/Login";
import Registro from "./pages/Registro";
import Admin from "./pages/Admin";
import Docente from "./pages/Docente";
import Estudiante from "./pages/Estudiante";
import EstudianteHistorial from "./pages/EstudianteHistorial";

// Roles: Administrador(1), Docente(2), Estudiante(3).
// Estructura: una sola ruta de layout (AppLayout) protegida para los 3
// roles; dentro, cada panel se protege con su rol. /cuenta es común.
function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* PÚBLICAS */}
          <Route path="/" element={<Inicio />} />
          <Route path="/login" element={<Login />} />
          <Route path="/registro" element={<Registro />} />

          {/* PRIVADAS: shell compartido */}
          <Route element={<RutaProtegida rolesPermitidos={[1, 2, 3]}><AppLayout /></RutaProtegida>}>
            <Route path="/cuenta" element={<PaginaEnConstruccion titulo="Mi cuenta" subtitulo="Perfil y contraseña" etapa="1H" />} />

            {/* ADMIN */}
            <Route path="/admin" element={<RutaProtegida rolesPermitidos={[1]} />}>
              <Route index element={<Admin />} />
              <Route path="elecciones" element={<PaginaEnConstruccion titulo="Elecciones" subtitulo="Configura y modera tus votaciones" etapa="1A" />} />
              <Route path="usuarios" element={<PaginaEnConstruccion titulo="Usuarios" subtitulo="Gestión de usuarios" etapa="1E" />} />
              <Route path="resultados" element={<PaginaEnConstruccion titulo="Resultados" subtitulo="Estadísticas y exportes" etapa="1D" />} />
              <Route path="institucion" element={<PaginaEnConstruccion titulo="Institución" subtitulo="Códigos de invitación e información" etapa="1G" />} />
            </Route>

            {/* DOCENTE */}
            <Route path="/docente" element={<RutaProtegida rolesPermitidos={[2]} />}>
              <Route index element={<Docente />} />
              <Route path="elecciones" element={<PaginaEnConstruccion titulo="Elecciones" subtitulo="Consulta y modera candidaturas" etapa="2A" />} />
              <Route path="estudiantes" element={<PaginaEnConstruccion titulo="Estudiantes" subtitulo="Curso y estado" etapa="2B" />} />
              <Route path="resultados" element={<PaginaEnConstruccion titulo="Resultados" subtitulo="Elecciones finalizadas" etapa="2C" />} />
            </Route>

            {/* ESTUDIANTE */}
            <Route path="/estudiante" element={<RutaProtegida rolesPermitidos={[3]} />}>
              <Route index element={<Estudiante />} />
              <Route path="elecciones" element={<PaginaEnConstruccion titulo="Elecciones" subtitulo="Postúlate o vota" etapa="3A" />} />
              <Route path="historial" element={<EstudianteHistorial />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;