import { useTituloPagina } from "../../context/PaginaContext";
import GestionUsuarios from "../../components/usuarios/GestionUsuarios";

function Usuarios() {
  useTituloPagina("Usuarios", "Gestiona estudiantes, docentes y administradores");
  return <GestionUsuarios puedeCrear puedeEditar puedeEliminar puedeCargaMasiva />;
}

export default Usuarios;