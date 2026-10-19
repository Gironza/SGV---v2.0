import logging
import math
from app.config.database import BaseDatosNoDisponible
from app.models.usuario import Usuario
from app.models.institucion import Institucion
from app.utils.security import hashear_password, verificar_password
from app.utils.jwt_handler import crear_token
from app.utils.bloqueo_login import (
    MINUTOS_BLOQUEO, segundos_bloqueo_restantes, registrar_fallo, limpiar_intentos
)

logger = logging.getLogger(__name__)

class AuthController:


    # --- Auxiliares del bloqueo de login (PNF-001) ---
    def _respuesta_bloqueo(self, segundos):
        minutos = math.ceil(segundos / 60)
        return {
            'success': False,
            'bloqueado': True,
            'segundos_restantes': segundos,
            'message': f'Cuenta bloqueada temporalmente por demasiados intentos fallidos. '
                       f'Intenta de nuevo en {minutos} minuto(s)'
        }

    def _fallo_credenciales(self, mensaje, correo):
        restantes = registrar_fallo(correo)
        if restantes == 0:
            return self._respuesta_bloqueo(MINUTOS_BLOQUEO * 60)
        return {'success': False, 'message': f'{mensaje}. Te quedan {restantes} intento(s)'}


# LOGIN -----------------
    def login(self, correo, password):
        try:
            segundos = segundos_bloqueo_restantes(correo)
            if segundos > 0:
                return self._respuesta_bloqueo(segundos)

            usuario = Usuario.buscar_por_correo(correo)
            if not usuario:
                return self._fallo_credenciales('Usuario no encontrado', correo)

            if not verificar_password(password, usuario.contrasena):
                return self._fallo_credenciales('Contraseña Incorrecta', correo)

            limpiar_intentos(correo)

            # La contraseña es correcta, pero la cuenta fue desactivada.
            # Se revisa después de la contraseña para no revelar el estado
            # de la cuenta a quien no la conoce.
            if not usuario.activo:
                return {
                    'success': False,
                    'inactivo': True,
                    'message': 'Tu cuenta está desactivada. Contacta al administrador de tu institución'
                }

            token = crear_token({
                "sub": str(usuario.id_usuario),
                "rol": usuario.id_rol
            })

            return {
                'success': True,
                'access_token': token,
                'token_type': 'bearer',
                'user': {
                    'id_usuario': usuario.id_usuario,
                    'correo': usuario.correo,
                    'nombre': usuario.nombre,
                    'apellido': usuario.apellido,
                    'curso': usuario.curso,
                    'id_rol': usuario.id_rol,
                    'rol_nombre': usuario.rol_nombre
                }
            }
        except BaseDatosNoDisponible:
            # Que llegue al manejador global (503). Si no, la ruta lo convertiría
            # en un 401 y el frontend creería que las credenciales son malas.
            raise
        except Exception as e:
            logger.error(f"Error en login: {str(e)}")
            return {'success': False, 'message': 'Error en el sistema, intenta más tarde'}


#REGISTRO ----------------------
    def registro(self, nombres, apellidos, documento, id_tipo_doc,
                 correo, password, codigo_institucion, curso=None):
        try:

            if len(password) < 8:
                return {'success': False, 'message': 'La contraseña debe tener al menos 8 caracteres'}

            if Usuario.usuario_existente(correo):
                return {'success': False, 'message': 'Ya existe un usuario con este correo'}

            if Usuario.documento_existente(documento):
                return {'success': False, 'message': 'Ya existe un usuario con este documento'}

            institucion_data = Institucion.buscar_por_codigo(codigo_institucion)
            if institucion_data is None:
                return {'success': False, 'message': 'Código de institución inválido'}

            password_hasheado = hashear_password(password)
            nuevo_usuario = Usuario(
                id_institucion=institucion_data['id_institucion'],
                documento=documento,
                id_tipo_doc=id_tipo_doc,
                nombre=nombres,
                apellido=apellidos,
                correo=correo,
                contrasena=password_hasheado,
                curso=curso,
                id_rol=institucion_data['id_rol']
            )

            if nuevo_usuario.guardar():
                return {'success': True, 'message': 'Usuario registrado exitosamente'}
            else:
                return {'success': False, 'message': 'Error al registrar usuario'}
        except BaseDatosNoDisponible:
            raise
        except Exception as e:
            logger.error(f"Error en registro: {str(e)}")
            return {'success': False, 'message': 'Error en el sistema, intenta más tarde'}


# PERFIL  ----------------------
    def _error_sistema(self):
        return {'success': False, 'error_sistema': True,
                'message': 'Error en el sistema, intenta más tarde'}

    def _no_encontrado(self):
        return {'success': False, 'no_encontrado': True, 'message': 'Usuario no encontrado'}

    def obtener_perfil(self, id_usuario):
        try:
            perfil = Usuario.obtener_perfil(id_usuario)
            if perfil is None:
                return self._no_encontrado()
            return {'success': True, 'perfil': perfil}
        except BaseDatosNoDisponible:
            raise
        except Exception as e:
            logger.error(f"Error al obtener perfil: {str(e)}")
            return self._error_sistema()

    def actualizar_perfil(self, id_usuario, nombre, apellido, correo):
        try:
            if Usuario.correo_en_uso_por_otro(correo, id_usuario):
                return {'success': False, 'conflicto': True,
                        'message': 'Ya existe un usuario con este correo'}

            if not Usuario.actualizar_perfil(id_usuario, nombre, apellido, correo):
                return self._no_encontrado()

            # Se devuelve el perfil actualizado para que el frontend refresque su estado
            return {'success': True, 'perfil': Usuario.obtener_perfil(id_usuario)}
        except BaseDatosNoDisponible:
            raise
        except Exception as e:
            logger.error(f"Error al actualizar perfil: {str(e)}")
            return self._error_sistema()

    def cambiar_contrasena(self, id_usuario, contrasena_actual, contrasena_nueva):
        try:
            hash_actual = Usuario.obtener_contrasena(id_usuario)
            if hash_actual is None:
                return self._no_encontrado()

            if not verificar_password(contrasena_actual, hash_actual):
                return {'success': False, 'message': 'La contraseña actual es incorrecta'}

            if verificar_password(contrasena_nueva, hash_actual):
                return {'success': False,
                        'message': 'La nueva contraseña debe ser diferente a la actual'}

            if not Usuario.actualizar_contrasena(id_usuario, hashear_password(contrasena_nueva)):
                return self._no_encontrado()

            return {'success': True, 'message': 'Contraseña actualizada correctamente'}
        except BaseDatosNoDisponible:
            raise
        except Exception as e:
            logger.error(f"Error al cambiar contraseña: {str(e)}")
            return self._error_sistema()