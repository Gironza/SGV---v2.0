import { BrowserRouter, Routes, Route } from "react-router";

import { AuthProvider } from "./context/AuthContext";
import RutaProtegida from "./routes/RutaProtegida";

import Inicio from "./pages/inicio";
import Login from "./pages/Login";
import Registro from "./pages/Registro";
import Admin from "./pages/Admin";
import Docente from "./pages/Docente";
import Estudiante from "./pages/Estudiante";

// No existe ruta "/candidato": en el backend real (tabla roles) solo hay
// 3 roles — Administrador(1), Docente(2), Estudiante(3). Postularse como
// candidato es una acción dentro del panel Estudiante, no un login aparte
// (ver la nota en src/types/index.ts).
function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* INICIO */}
          <Route path="/" element={<Inicio />} />
          {/* LOGIN */}
          <Route path="/login" element={<Login />} />
          {/* REGISTRO (solo Admin/Docente, vía código de institución) */}
          <Route path="/registro" element={<Registro />} />

          {/* ADMINISTRADOR (id_rol = 1) */}
          <Route
            path="/admin"
            element={
              <RutaProtegida rolesPermitidos={[1]}>
                <Admin />
              </RutaProtegida>
            }
          />

          {/* DOCENTE (id_rol = 2) */}
          <Route
            path="/docente"
            element={
              <RutaProtegida rolesPermitidos={[2]}>
                <Docente />
              </RutaProtegida>
            }
          />

          {/* ESTUDIANTE (id_rol = 3) */}
          <Route
            path="/estudiante"
            element={
              <RutaProtegida rolesPermitidos={[3]}>
                <Estudiante />
              </RutaProtegida>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
