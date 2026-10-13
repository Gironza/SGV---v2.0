import logging
from datetime import datetime
from app.models.candidato import (
    Candidato, ESTADO_APROBADA, ESTADO_RECHAZADA, ESTADO_RETIRADA
)
from app.models.eleccion import Eleccion
from app.models.usuario import Usuario
from app.utils.acceso import obtener_eleccion_de_institucion

logger = logging.getLogger(__name__)


class CandidatoController:

    def inscribir(self, id_usuario, id_eleccion, propuesta, foto):
        try:
            eleccion = Eleccion.obtener_por_id(id_eleccion)
            if not eleccion:
                return {'success': False, 'message': 'Elección no encontrada'}

            if eleccion['id_estado_eleccion'] == 2:
                return {'success': False, 'message': 'No puedes inscribirte en una elección finalizada'}

            id_institucion_usuario = Usuario.obtener_institucion(id_usuario)
            if id_institucion_usuario != eleccion['id_institucion']:
                return {'success': False, 'message': 'No perteneces a la institución de esta elección'}

            if Candidato.ya_inscrito(id_usuario, id_eleccion):
                return {'success': False, 'message': 'Ya estás inscrito como candidato en esta elección'}

            id_candidato = Candidato.crear(id_usuario, propuesta, foto, id_eleccion)
            if id_candidato is None:
                return {'success': False, 'message': 'Error al inscribir la candidatura'}

            return {
                'success': True,
                'message': 'Candidatura inscrita, queda pendiente de aprobación',
                'id_candidato': id_candidato
            }
        except Exception as e:
            logger.error(f"Error al inscribir candidato: {e}")
            return {'success': False, 'message': 'Error en el sistema, intenta más tarde'}

    def listar_por_eleccion(self, id_eleccion, id_usuario):
        # Solo devuelve candidaturas aprobadas (el filtro está en el modelo)
        try:
            if not obtener_eleccion_de_institucion(id_eleccion, id_usuario):
                return {'success': False, 'message': 'Elección no encontrada'}
            return {'success': True, 'candidatos': Candidato.listar_por_eleccion(id_eleccion) or []}
        except Exception as e:
            logger.error(f"Error al listar candidatos: {e}")
            return {'success': False, 'message': 'Error en el sistema, intenta más tarde'}

    def listar_para_gestion(self, id_eleccion, id_usuario):
        # Para admin y docente: todas las candidaturas con su estado
        try:
            eleccion = Eleccion.obtener_por_id(id_eleccion)
            if not eleccion:
                return {'success': False, 'message': 'Elección no encontrada'}

            if Usuario.obtener_institucion(id_usuario) != eleccion['id_institucion']:
                return {'success': False, 'message': 'Esta elección no pertenece a tu institución'}

            return {'success': True, 'candidatos': Candidato.listar_para_gestion(id_eleccion) or []}
        except Exception as e:
            logger.error(f"Error al listar candidaturas para gestión: {e}")
            return {'success': False, 'message': 'Error en el sistema, intenta más tarde'}

    def revisar_candidatura(self, id_candidato, id_usuario_revisor, id_estado, observaciones=None):
        # Aprobar o rechazar una candidatura (admin y docente)
        try:
            if id_estado not in (ESTADO_APROBADA, ESTADO_RECHAZADA):
                return {'success': False, 'message': 'Solo se puede aprobar o rechazar una candidatura'}

            observaciones = (observaciones or '').strip()
            if id_estado == ESTADO_RECHAZADA and not observaciones:
                return {'success': False, 'message': 'Debes indicar el motivo del rechazo'}

            candidato = Candidato.obtener_por_id(id_candidato)
            if not candidato:
                return {'success': False, 'message': 'Candidatura no encontrada'}

            eleccion = Eleccion.obtener_por_id(candidato['id_eleccion'])
            if not eleccion:
                return {'success': False, 'message': 'Elección no encontrada'}

            if Usuario.obtener_institucion(id_usuario_revisor) != eleccion['id_institucion']:
                return {'success': False, 'message': 'Esta candidatura no pertenece a tu institución'}

            if candidato['id_estado_candidatura'] == ESTADO_RETIRADA:
                return {'success': False, 'message': 'La candidatura fue retirada por el candidato'}

            if Candidato.tiene_votos(id_candidato):
                return {'success': False, 'message': 'No se puede cambiar el estado: la candidatura ya tiene votos registrados'}

            # Las observaciones solo se guardan en un rechazo
            observaciones_guardar = observaciones if id_estado == ESTADO_RECHAZADA else None

            if not Candidato.cambiar_estado(id_candidato, id_estado, observaciones_guardar):
                return {'success': False, 'message': 'Error al actualizar la candidatura'}

            accion = 'aprobada' if id_estado == ESTADO_APROBADA else 'rechazada'
            return {'success': True, 'message': f'Candidatura {accion} exitosamente'}
        except Exception as e:
            logger.error(f"Error al revisar candidatura: {e}")
            return {'success': False, 'message': 'Error en el sistema, intenta más tarde'}

    def retirar_candidatura(self, id_candidato, id_usuario_solicitante):
        # El candidato se retira: la fila no se borra, cambia a estado Retirada
        try:
            candidato = Candidato.obtener_por_id(id_candidato)
            if not candidato:
                return {'success': False, 'message': 'Candidatura no encontrada'}

            if candidato['id_usuario'] != id_usuario_solicitante:
                return {'success': False, 'message': 'No puedes retirar la candidatura de otro estudiante'}

            if candidato['id_estado_candidatura'] in (ESTADO_RETIRADA, ESTADO_RECHAZADA):
                return {'success': False, 'message': 'La candidatura no se puede retirar en su estado actual'}

            eleccion = Eleccion.obtener_por_id(candidato['id_eleccion'])
            if not eleccion:
                return {'success': False, 'message': 'Elección no encontrada'}

            if datetime.now() >= eleccion['fecha_inicio']:
                return {'success': False, 'message': 'No puedes retirarte: la elección ya inició'}

            if Candidato.tiene_votos(id_candidato):
                return {'success': False, 'message': 'No se puede retirar: la candidatura ya tiene votos registrados'}

            if not Candidato.cambiar_estado(id_candidato, ESTADO_RETIRADA):
                return {'success': False, 'message': 'Error al retirar la candidatura'}

            return {'success': True, 'message': 'Candidatura retirada exitosamente'}
        except Exception as e:
            logger.error(f"Error al retirar candidatura: {e}")
            return {'success': False, 'message': 'Error en el sistema, intenta más tarde'}

    def obtener_mi_candidatura(self, id_usuario, id_eleccion):
        # El candidato consulta el estado de su propia candidatura
        try:
            candidatura = Candidato.obtener_de_usuario(id_usuario, id_eleccion)
            if not candidatura:
                return {'success': False, 'message': 'No tienes candidatura en esta elección'}
            return {'success': True, 'candidatura': candidatura}
        except Exception as e:
            logger.error(f"Error al obtener candidatura propia: {e}")
            return {'success': False, 'message': 'Error en el sistema, intenta más tarde'}