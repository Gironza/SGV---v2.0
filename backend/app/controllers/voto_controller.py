import logging
import hashlib
from datetime import datetime
from app.models.candidato import Candidato
from app.models.voto import Voto
from app.utils.acceso import obtener_eleccion_de_institucion

logger = logging.getLogger(__name__)


class VotoController:

    def listar_candidatos(self, id_eleccion, id_usuario):
        try:
            eleccion = obtener_eleccion_de_institucion(id_eleccion, id_usuario)
            if not eleccion:
                return {'success': False, 'message': 'Elección no encontrada'}

            candidatos = Candidato.listar_por_eleccion(id_eleccion)
            return {'success': True, 'candidatos': candidatos or []}
        except Exception as e:
            logger.error(f"Error al listar candidatos: {e}")
            return {'success': False, 'message': 'Error en el sistema, intenta más tarde'}

    def verificar_estado_voto(self, id_usuario, id_eleccion):
        try:
            if not obtener_eleccion_de_institucion(id_eleccion, id_usuario):
                return {'success': False, 'message': 'Elección no encontrada'}

            ya_voto = Voto.ya_voto(id_usuario, id_eleccion)
            return {'success': True, 'ya_voto': ya_voto}
        except Exception as e:
            logger.error(f"Error al verificar estado de voto: {e}")
            return {'success': False, 'message': 'Error en el sistema, intenta más tarde'}

    def registrar_voto(self, id_usuario, id_eleccion, id_candidato=None):
        try:
            eleccion = obtener_eleccion_de_institucion(id_eleccion, id_usuario)
            if not eleccion:
                return {'success': False, 'message': 'Elección no encontrada'}

            if eleccion['nombre_estado'].lower() != 'activa':
                return {'success': False, 'message': 'La elección no está activa'}

            ahora = datetime.now()
            if ahora < eleccion['fecha_inicio'] or ahora > eleccion['fecha_fin']:
                return {'success': False, 'message': 'Fuera del periodo de votación'}

            # TODO: validar curso habilitado (RN18) — pendiente hasta tener
            # gestión completa de Elecciones con esa configuración

            if Voto.ya_voto(id_usuario, id_eleccion):
                return {'success': False, 'message': 'Ya emitiste tu voto en esta elección'}

            if id_candidato is not None:
                if not Candidato.pertenece_a_eleccion(id_candidato, id_eleccion):
                    return {'success': False, 'message': 'Candidato no válido para esta elección'}

            resultado = Voto.registrar(id_eleccion, id_usuario, id_candidato)
            if not resultado:
                return {'success': False, 'message': 'Error al registrar el voto'}

            # Certificado derivado (RN22) — no persistido, CERTIFICADO no existe en el MR
            base = f"{resultado['registro']['id_registro']}-{resultado['voto']['fecha_voto']}"
            codigo_certificado = hashlib.sha256(base.encode()).hexdigest()[:12].upper()

            return {
                'success': True,
                'message': 'Voto registrado con éxito',
                'codigo_certificado': codigo_certificado,
                'fecha_voto': resultado['voto']['fecha_voto']
            }
        except Exception as e:
            logger.error(f"Error al registrar voto: {e}")
            return {'success': False, 'message': 'Error en el sistema, intenta más tarde'}