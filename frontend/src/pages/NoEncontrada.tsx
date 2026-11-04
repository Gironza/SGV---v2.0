import { Link } from "react-router";
import { useAuth } from "../context/AuthContext";
import { useTituloPagina } from "../context/PaginaContext";
import { ROL_HOME } from "../config/navigation";
import { idRolToRol } from "../types";
import EstadoVacio from "../components/feedback/EstadoVacio";

/** 404 dentro del shell: se ve el sidebar y el usuario puede volver. */
function NoEncontrada() {
  const { usuario } = useAuth();
  useTituloPagina("Página no encontrada");

  const inicio = usuario ? ROL_HOME[idRolToRol(usuario.id_rol)] : "/";

  return (
    <div className="panel-box">
      <EstadoVacio
        icono="fa-solid fa-compass"
        titulo="Esta página no existe"
        descripcion="Revisa la dirección o vuelve al inicio de tu panel."
      >
        <Link to={inicio} className="btn-accent btn-accent-violet" style={{ textDecoration: "none" }}>
          Ir al inicio
        </Link>
      </EstadoVacio>
    </div>
  );
}

export default NoEncontrada;