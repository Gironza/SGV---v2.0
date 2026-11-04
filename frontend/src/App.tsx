import { BrowserRouter, Routes, Route } from "react-router";

import { AuthProvider } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";
import RutaProtegida from "./routes/RutaProtegida";
import RutaPublica from "./routes/RutaPublica";
import AppLayout from "./components/layout/AppLayout";
import PaginaEnConstruccion from "./components/ui/PaginaEnConstruccion";

import Inicio from "./pages/inicio";
import Login from "./pages/Login";
import Registro from "./pages/Registro";
import Admin from "./pages/Admin";
import Docente from "./pages/Docente";
import EstudianteInicio from "./pages/estudiante/Inicio";
import EleccionesEstudiante from "./pages/estudiante/Elecciones";
import EleccionEstudiante from "./pages/estudiante/EleccionEstudiante";
import EstudianteHistorial from "./pages/EstudianteHistorial";
import NoEncontrada from "./pages/NoEncontrada";
import Elecciones from "./pages/admin/Elecciones";
import EleccionNueva from "./pages/admin/EleccionNueva";
import EleccionDetalle from "./pages/admin/EleccionDetalle";
import Resultados from "./pages/admin/Resultados";
import ResultadoDetalle from "./pages/admin/ResultadoDetalle";

// Roles: Administrador(1), Docente(2), Estudiante(3).
// Estructura: una sola ruta de layout (AppLayout) protegida para los 3
// roles; dentro, cada panel se protege con su rol. /cuenta es común.
function App() {
  return (
    <AuthProvider>
      <ToastProvider>
      <BrowserRouter>
        <Routes>
          {/* PÚBLICAS */}
          <Route path="/" element={<Inicio />} />
          <Route path="/login" element={<RutaPublica><Login /></RutaPublica>} />
          <Route path="/registro" element={<RutaPublica><Registro /></RutaPublica>} />

          {/* PRIVADAS: shell compartido */}
          <Route element={<RutaProtegida rolesPermitidos={[1, 2, 3]}><AppLayout /></RutaProtegida>}>
            <Route path="/cuenta" element={<PaginaEnConstruccion titulo="Mi cuenta" subtitulo="Perfil y contraseña" etapa="1H" />} />

            {/* TEMPORAL: prueba de componentes de feedback (borrar al cerrar la Fase 0) */}
            <Route path="/demo-feedback" element={<DemoFeedback />} />

            {/* ADMIN */}
            <Route path="/admin" element={<RutaProtegida rolesPermitidos={[1]} />}>
              <Route index element={<Admin />} />
              <Route path="elecciones" element={<Elecciones />} />
              <Route path="elecciones/nueva" element={<EleccionNueva />} />
              <Route path="elecciones/:id" element={<EleccionDetalle />} />
              <Route path="usuarios" element={<PaginaEnConstruccion titulo="Usuarios" subtitulo="Gestión de usuarios" etapa="1E" />} />
              <Route path="resultados" element={<Resultados />} />
              <Route path="resultados/:id" element={<ResultadoDetalle />} />
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
              <Route index element={<EstudianteInicio />} />
              <Route path="elecciones" element={<EleccionesEstudiante />} />
              <Route path="elecciones/:id" element={<EleccionEstudiante />} />
              <Route path="historial" element={<EstudianteHistorial />} />
            </Route>

            {/* 404 dentro del shell */}
            <Route path="*" element={<NoEncontrada />} />
          </Route>
        </Routes>
      </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;