import logging
from app.config.database import BaseDatosNoDisponible
from app.models.usuario import Usuario
from app.utils.acceso import obtener_usuario_de_institucion
from app.utils.respuestas import fallo

logger = logging.getLogger(__name__)

ROL_ADMIN = 1
ROL_DOCENTE = 2
ROL_ESTUDIANTE = 3

# Quién ve a quién. Es la única tabla de reglas de este módulo: las acciones de
# escritura (crear, editar, estado, curso, eliminar) se suman en las siguientes etapas.
ROLES_VISIBLES = {
    ROL_ADMIN: (ROL_ADMIN, ROL_DOCENTE, ROL_ESTUDIANTE),
    ROL_DOCENTE: (ROL_ESTUDIANTE,),
}

MSG_SISTEMA = 'Error en el sistema, intenta más tarde'
MSG_NO_ENCONTRADO = 'Usuario no encontrado'


class UsuarioController:

    def listar_usuarios(self, id_actor, id_rol_actor, rol=None, curso=None,
                        activo=None, q=None, pagina=1, tamano=20):
        try:
            visibles = ROLES_VISIBLES.get(id_rol_actor, ())
            if not visibles:
                return fallo('No tienes permiso para consultar usuarios', 'prohibido')
            if rol is not None and rol not in visibles:
                return fallo('No tienes permiso para consultar usuarios con ese rol', 'prohibido')

            id_institucion = Usuario.obtener_institucion(id_actor)
            if id_institucion is None:
                return fallo('No se pudo determinar la institución del usuario')

            resultado = Usuario.listar(
                id_institucion, visibles, rol, curso, activo, q,
                limite=tamano, desplazamiento=(pagina - 1) * tamano
            )
            if resultado is None:
                return fallo(MSG_SISTEMA, 'error_sistema')

            return {
                'success': True,
                'total': resultado['total'],
                'pagina': pagina,
                'tamano': tamano,
                'usuarios': resultado['usuarios'],
            }
        except BaseDatosNoDisponible:
            raise
        except Exception as e:
            logger.error(f"Error al listar usuarios: {e}")
            return fallo(MSG_SISTEMA, 'error_sistema')

    def obtener_usuario(self, id_objetivo, id_actor, id_rol_actor):
        try:
            usuario = obtener_usuario_de_institucion(id_objetivo, id_actor)
            # Un rol que no puede verse se trata igual que uno inexistente: no se revela
            if not usuario or usuario['id_rol'] not in ROLES_VISIBLES.get(id_rol_actor, ()):
                return fallo(MSG_NO_ENCONTRADO, 'no_encontrado')
            return {'success': True, 'usuario': usuario}
        except BaseDatosNoDisponible:
            raise
        except Exception as e:
            logger.error(f"Error al obtener usuario: {e}")
            return fallo(MSG_SISTEMA, 'error_sistema')