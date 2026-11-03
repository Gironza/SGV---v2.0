import logging
from app.config.database import BaseDatosNoDisponible
from app.models.candidato import Candidato
from app.models.usuario import (
    Usuario, RESULTADO_OK, RESULTADO_NO_ENCONTRADO, RESULTADO_ULTIMO_ADMIN
)
from app.utils.acceso import obtener_usuario_de_institucion
from app.utils.etapas import calcular_etapa, ETAPA_FINALIZADA
from app.utils.respuestas import fallo
from app.utils.security import hashear_password
from app.models.usuario import (
    Usuario, RESULTADO_OK, RESULTADO_NO_ENCONTRADO, RESULTADO_ULTIMO_ADMIN,
    RESULTADO_CON_HISTORIAL
)


logger = logging.getLogger(__name__)

ROL_ADMIN = 1
ROL_DOCENTE = 2
ROL_ESTUDIANTE = 3

# Única tabla de reglas del módulo: acción -> rol de quien la hace -> roles sobre los que puede.
# Los admins son iguales entre sí: sobre otro admin solo pueden cambiar el estado
# (y eliminar, en la Etapa C); sus datos los edita él mismo desde su perfil.
REGLAS = {
    'ver':      {ROL_ADMIN: (ROL_ADMIN, ROL_DOCENTE, ROL_ESTUDIANTE), ROL_DOCENTE: (ROL_ESTUDIANTE,)},
    'editar':   {ROL_ADMIN: (ROL_DOCENTE, ROL_ESTUDIANTE)},
    'estado':   {ROL_ADMIN: (ROL_ADMIN, ROL_DOCENTE, ROL_ESTUDIANTE), ROL_DOCENTE: (ROL_ESTUDIANTE,)},
    'curso':    {ROL_ADMIN: (ROL_ESTUDIANTE,), ROL_DOCENTE: (ROL_ESTUDIANTE,)},
    'eliminar': {ROL_ADMIN: (ROL_ADMIN, ROL_DOCENTE, ROL_ESTUDIANTE)},
}

MSG_PROHIBIDO = {
    'editar': 'Los datos de un administrador solo los edita él mismo desde su perfil',
    'estado': 'No tienes permiso para cambiar el estado de este usuario',
    'curso': 'El curso solo aplica a estudiantes',
    'eliminar': 'No tienes permiso para eliminar a este usuario',
}

# Acciones que nadie puede hacer sobre su propia cuenta
MSG_PROPIA_CUENTA = {
    'editar': 'Edita tus propios datos desde tu perfil',
    'estado': 'No puedes cambiar el estado de tu propia cuenta',
    'eliminar': 'No puedes eliminar tu propia cuenta',
}

MSG_SISTEMA = 'Error en el sistema, intenta más tarde'
MSG_NO_ENCONTRADO = 'Usuario no encontrado'


class UsuarioController:

    @staticmethod
    def _objetivo(accion, id_objetivo, id_actor, id_rol_actor):
        """
        Devuelve (usuario, None) si el actor puede hacer 'accion' sobre ese usuario,
        o (None, fallo). Un usuario de otra institución o de un rol que el actor no
        puede ver se trata igual que uno inexistente: no se revela que existe.
        """
        usuario = obtener_usuario_de_institucion(id_objetivo, id_actor)
        if not usuario or usuario['id_rol'] not in REGLAS['ver'].get(id_rol_actor, ()):
            return None, fallo(MSG_NO_ENCONTRADO, 'no_encontrado')
        if accion in MSG_PROPIA_CUENTA and id_objetivo == id_actor:
            return None, fallo(MSG_PROPIA_CUENTA[accion], 'prohibido')
        if usuario['id_rol'] not in REGLAS[accion].get(id_rol_actor, ()):
            return None, fallo(MSG_PROHIBIDO[accion], 'prohibido')
        return usuario, None

    # ---------- Consultar (Etapa A) ----------

    def listar_usuarios(self, id_actor, id_rol_actor, rol=None, curso=None,
                        activo=None, q=None, pagina=1, tamano=20):
        try:
            visibles = REGLAS['ver'].get(id_rol_actor, ())
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
            if not usuario or usuario['id_rol'] not in REGLAS['ver'].get(id_rol_actor, ()):
                return fallo(MSG_NO_ENCONTRADO, 'no_encontrado')
            return {'success': True, 'usuario': usuario}
        except BaseDatosNoDisponible:
            raise
        except Exception as e:
            logger.error(f"Error al obtener usuario: {e}")
            return fallo(MSG_SISTEMA, 'error_sistema')

    # ---------- Crear (RF-010) ----------

    def crear_estudiante(self, id_actor, documento, id_tipo_doc, nombre, apellido, correo, curso):
        """Crea un estudiante en la institución del admin. Su contraseña inicial es su documento."""
        try:
            if not Usuario.tipo_documento_existe(id_tipo_doc):
                return fallo('Tipo de documento inválido')
            if Usuario.usuario_existente(correo):
                return fallo('Ya existe un usuario con este correo', 'conflicto')
            if Usuario.documento_existente(documento):
                return fallo('Ya existe un usuario con este documento', 'conflicto')

            id_institucion = Usuario.obtener_institucion(id_actor)
            if id_institucion is None:
                return fallo('No se pudo determinar la institución del usuario')

            estudiante = Usuario(
                id_institucion=id_institucion, documento=documento, id_tipo_doc=id_tipo_doc,
                nombre=nombre, apellido=apellido, correo=correo,
                contrasena=hashear_password(documento), curso=curso, id_rol=ROL_ESTUDIANTE
            )
            if not estudiante.guardar():
                return fallo('Error al crear el estudiante', 'error_sistema')

            return {
                'success': True,
                'message': 'Estudiante creado. Su contraseña inicial es su número de documento',
                'id_usuario': estudiante.id_usuario,
            }
        except BaseDatosNoDisponible:
            raise
        except Exception as e:
            logger.error(f"Error al crear estudiante: {e}")
            return fallo(MSG_SISTEMA, 'error_sistema')

    # ---------- Editar (RF-010 y RF-011) ----------

    def actualizar_usuario(self, id_objetivo, id_actor, id_rol_actor, documento,
                           id_tipo_doc, nombre, apellido, correo, curso=None):
        try:
            objetivo, error = self._objetivo('editar', id_objetivo, id_actor, id_rol_actor)
            if error:
                return error

            if objetivo['id_rol'] == ROL_ESTUDIANTE and not curso:
                return fallo('El curso es obligatorio para los estudiantes')
            if objetivo['id_rol'] == ROL_DOCENTE and curso:
                return fallo('Los docentes no tienen curso')

            if not Usuario.tipo_documento_existe(id_tipo_doc):
                return fallo('Tipo de documento inválido')
            if Usuario.correo_en_uso_por_otro(correo, id_objetivo):
                return fallo('Ya existe un usuario con este correo', 'conflicto')
            if Usuario.documento_en_uso_por_otro(documento, id_objetivo):
                return fallo('Ya existe un usuario con este documento', 'conflicto')

            if not Usuario.actualizar_datos(
                id_objetivo, documento, id_tipo_doc, nombre, apellido, correo, curso
            ):
                return fallo('Error al actualizar el usuario', 'error_sistema')

            return {'success': True, 'usuario': Usuario.obtener_detalle(id_objetivo)}
        except BaseDatosNoDisponible:
            raise
        except Exception as e:
            logger.error(f"Error al actualizar usuario: {e}")
            return fallo(MSG_SISTEMA, 'error_sistema')

    # ---------- Estado (RF-010 y RF-023) ----------

    @staticmethod
    def _advertencias_candidaturas(id_usuario):
        """
        Avisos informativos al desactivar a un estudiante: desactivar NO toca sus
        candidaturas, que el admin resuelve a mano (retiro o rechazo, solo antes del inicio).
        """
        vigentes = Candidato.vigentes_de_usuario(id_usuario) or []
        avisos = []
        for e in vigentes:
            etapa = calcular_etapa(e)
            if etapa != ETAPA_FINALIZADA:
                avisos.append(
                    f"Tiene una candidatura vigente en «{e['titulo']}» (etapa: {etapa}); "
                    "desactivar la cuenta no la modifica"
                )
        return avisos

    def cambiar_estado(self, id_objetivo, id_actor, id_rol_actor, activo):
        try:
            objetivo, error = self._objetivo('estado', id_objetivo, id_actor, id_rol_actor)
            if error:
                return error

            if objetivo['activo'] == activo:
                return fallo(
                    'La cuenta ya está ' + ('activa' if activo else 'desactivada'), 'conflicto'
                )

            resultado = Usuario.cambiar_activo(id_objetivo, activo)
            if resultado == RESULTADO_NO_ENCONTRADO:
                return fallo(MSG_NO_ENCONTRADO, 'no_encontrado')
            if resultado == RESULTADO_ULTIMO_ADMIN:
                return fallo('No se puede desactivar al único administrador activo de la institución', 'conflicto')
            if resultado != RESULTADO_OK:
                return fallo('Error al cambiar el estado de la cuenta', 'error_sistema')

            advertencias = []
            if not activo and objetivo['id_rol'] == ROL_ESTUDIANTE:
                advertencias = self._advertencias_candidaturas(id_objetivo)

            return {
                'success': True,
                'message': 'Cuenta activada' if activo else 'Cuenta desactivada',
                'activo': activo,
                'advertencias': advertencias,
            }
        except BaseDatosNoDisponible:
            raise
        except Exception as e:
            logger.error(f"Error al cambiar estado de usuario: {e}")
            return fallo(MSG_SISTEMA, 'error_sistema')

    # ---------- Curso (RF-023) ----------

    def cambiar_curso(self, id_objetivo, id_actor, id_rol_actor, curso):
        try:
            objetivo, error = self._objetivo('curso', id_objetivo, id_actor, id_rol_actor)
            if error:
                return error

            if not Usuario.actualizar_curso(id_objetivo, curso):
                return fallo('Error al cambiar el curso', 'error_sistema')

            return {'success': True, 'usuario': Usuario.obtener_detalle(id_objetivo)}
        except BaseDatosNoDisponible:
            raise
        except Exception as e:
            logger.error(f"Error al cambiar curso: {e}")
            return fallo(MSG_SISTEMA, 'error_sistema')

        @staticmethod
    def _mensaje_historial(historial):
        partes = []
        if historial['candidaturas']:
            partes.append(f"{historial['candidaturas']} candidatura(s)")
        if historial['participaciones']:
            partes.append(f"{historial['participaciones']} participación(es) en votaciones")
        return ('No se puede eliminar: el usuario tiene ' + ' y '.join(partes)
                + '. Desactiva su cuenta para conservar el historial')

    # ---------- Eliminar (RF-010) ----------

    def eliminar_usuario(self, id_objetivo, id_actor, id_rol_actor):
        """
        Borrado real y manual. Solo si el usuario no tiene historial: con candidaturas
        o participaciones en votaciones se desactiva en vez de borrar.
        """
        try:
            _, error = self._objetivo('eliminar', id_objetivo, id_actor, id_rol_actor)
            if error:
                return error

            historial = Usuario.contar_historial(id_objetivo)
            if historial is None:
                return fallo(MSG_SISTEMA, 'error_sistema')
            if historial['candidaturas'] or historial['participaciones']:
                return fallo(self._mensaje_historial(historial), 'conflicto')

            resultado = Usuario.eliminar(id_objetivo)
            if resultado == RESULTADO_NO_ENCONTRADO:
                return fallo(MSG_NO_ENCONTRADO, 'no_encontrado')
            if resultado == RESULTADO_ULTIMO_ADMIN:
                return fallo('No se puede eliminar al único administrador activo de la institución', 'conflicto')
            if resultado == RESULTADO_CON_HISTORIAL:
                return fallo('No se puede eliminar: el usuario tiene historial en candidaturas o votaciones. '
                             'Desactiva su cuenta para conservarlo', 'conflicto')
            if resultado != RESULTADO_OK:
                return fallo('Error al eliminar el usuario', 'error_sistema')

            return {'success': True, 'message': 'Usuario eliminado'}
        except BaseDatosNoDisponible:
            raise
        except Exception as e:
            logger.error(f"Error al eliminar usuario: {e}")
            return fallo(MSG_SISTEMA, 'error_sistema')