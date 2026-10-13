import logging
import secrets
from app.models.institucion import Institucion
from app.models.usuario import Usuario

logger = logging.getLogger(__name__)

# Sin 0, O, 1 ni I para que no se confundan al dictar o copiar el código
ALFABETO = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
PREFIJOS = {'admin': 'ADM', 'docente': 'DOC'}  # el prefijo evita que un código de admin choque con uno de docente
INTENTOS_GENERACION = 5


class InstitucionController:

    @staticmethod
    def _generar_codigo(tipo):
        sufijo = ''.join(secrets.choice(ALFABETO) for _ in range(8))
        return f"{PREFIJOS[tipo]}-{sufijo}"

    def obtener_codigos(self, id_usuario):
        try:
            id_institucion = Usuario.obtener_institucion(id_usuario)
            if id_institucion is None:
                return {'success': False, 'message': 'No se pudo determinar la institución del usuario'}

            codigos = Institucion.obtener_codigos(id_institucion)
            if not codigos:
                return {'success': False, 'message': 'Institución no encontrada'}

            return {'success': True, 'codigos': codigos}
        except Exception as e:
            logger.error(f"Error al obtener códigos de invitación: {e}")
            return {'success': False, 'message': 'Error en el sistema, intenta más tarde'}

    def renovar_codigo(self, id_usuario, tipo):
        try:
            if tipo not in PREFIJOS:
                return {'success': False, 'message': 'Tipo de código inválido'}

            id_institucion = Usuario.obtener_institucion(id_usuario)
            if id_institucion is None:
                return {'success': False, 'message': 'No se pudo determinar la institución del usuario'}

            # Si el código generado ya existe (muy improbable), la BD lo rechaza y se reintenta
            for _ in range(INTENTOS_GENERACION):
                codigo = self._generar_codigo(tipo)
                if Institucion.actualizar_codigo(id_institucion, tipo, codigo):
                    return {
                        'success': True,
                        'message': 'Código renovado. El anterior ya no sirve para registrarse',
                        'tipo': tipo,
                        'codigo': codigo
                    }

            return {'success': False, 'message': 'No se pudo generar un código único, intenta de nuevo'}
        except Exception as e:
            logger.error(f"Error al renovar código de invitación: {e}")
            return {'success': False, 'message': 'Error en el sistema, intenta más tarde'}

    def desactivar_codigo(self, id_usuario, tipo):
        try:
            if tipo not in PREFIJOS:
                return {'success': False, 'message': 'Tipo de código inválido'}

            id_institucion = Usuario.obtener_institucion(id_usuario)
            if id_institucion is None:
                return {'success': False, 'message': 'No se pudo determinar la institución del usuario'}

            if not Institucion.actualizar_codigo(id_institucion, tipo, None):
                return {'success': False, 'message': 'Error al desactivar el código'}

            return {
                'success': True,
                'message': f'Código de {tipo} desactivado. Nadie podrá registrarse con ese rol hasta que lo renueves'
            }
        except Exception as e:
            logger.error(f"Error al desactivar código de invitación: {e}")
            return {'success': False, 'message': 'Error en el sistema, intenta más tarde'}