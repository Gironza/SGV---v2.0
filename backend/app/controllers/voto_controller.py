import logging
from app.config.database import BaseDatosNoDisponible
from app.models.candidato import Candidato
from app.models.eleccion import Eleccion, TIPO_VOTACION
from app.models.usuario import Usuario
from app.models.voto import Voto, VotoDuplicado
from app.utils.acceso import obtener_eleccion_de_institucion, curso_habilitado
from app.utils.etapas import (
    calcular_etapa, ETAPA_VOTACION, ETAPA_PAUSADA, ETAPA_FINALIZADA
)
from app.utils.respuestas import fallo

logger = logging.getLogger(__name__)

MSG_SISTEMA = 'Error en el sistema, intenta más tarde'
MSG_NO_ENCONTRADA = 'Elección no encontrada'
MSG_VOTACION_NO_INICIADA = 'La votación aún no ha iniciado'
MSG_FUERA_DE_VOTACION = {
    ETAPA_PAUSADA: 'La votación está en pausa',
    ETAPA_FINALIZADA: 'La votación ya finalizó',
}


class VotoController:

    @staticmethod
    def _curso_habilitado_para_votar(id_eleccion, id_usuario):
        cursos = Eleccion.obtener_cursos(id_eleccion)[TIPO_VOTACION]
        return curso_habilitado(Usuario.obtener_curso(id_usuario), cursos)

    def listar_disponibles(self, id_usuario):
        """
        RF-026: elecciones de la institución en etapa de votación y habilitadas
        para el curso del estudiante, con la marca de si ya votó.
        """
        try:
            id_institucion = Usuario.obtener_institucion(id_usuario)
            if id_institucion is None:
                return fallo('No se pudo determinar la institución del usuario')

            curso = Usuario.obtener_curso(id_usuario)
            elecciones = Eleccion.listar_por_institucion(id_institucion) or []
            cursos = Eleccion.obtener_cursos_por_institucion(id_institucion)
            votadas = Voto.elecciones_votadas(id_usuario)

            disponibles = []
            for e in elecciones:
                if calcular_etapa(e) != ETAPA_VOTACION:
                    continue
                permitidos = cursos.get(e['id_eleccion'], {}).get(TIPO_VOTACION, [])
                if not curso_habilitado(curso, permitidos):
                    continue
                disponibles.append({
                    'id_eleccion': e['id_eleccion'],
                    'titulo': e['titulo'],
                    'descripcion': e['descripcion'],
                    'fecha_inicio': e['fecha_inicio'],
                    'fecha_fin': e['fecha_fin'],
                    'etapa': ETAPA_VOTACION,
                    'ya_voto': e['id_eleccion'] in votadas,
                })
            return {'success': True, 'elecciones': disponibles}
        except BaseDatosNoDisponible:
            raise
        except Exception as e:
            logger.error(f"Error al listar votaciones disponibles: {e}")
            return fallo(MSG_SISTEMA, 'error_sistema')

    def verificar_estado_voto(self, id_usuario, id_eleccion):
        try:
            eleccion = obtener_eleccion_de_institucion(id_eleccion, id_usuario)
            if not eleccion:
                return fallo(MSG_NO_ENCONTRADA, 'no_encontrado')

            return {
                'success': True,
                'ya_voto': Voto.ya_voto(id_usuario, id_eleccion),
                'etapa': calcular_etapa(eleccion),
                'curso_habilitado': self._curso_habilitado_para_votar(id_eleccion, id_usuario),
            }
        except BaseDatosNoDisponible:
            raise
        except Exception as e:
            logger.error(f"Error al verificar estado de voto: {e}")
            return fallo(MSG_SISTEMA, 'error_sistema')

    def registrar_voto(self, id_usuario, id_eleccion, id_candidato=None):
        """RF-027: vota (o vota en blanco con id_candidato=None)."""
        try:
            eleccion = obtener_eleccion_de_institucion(id_eleccion, id_usuario)
            if not eleccion:
                return fallo(MSG_NO_ENCONTRADA, 'no_encontrado')

            # Solo importa la etapa: ya incluye el estado manual (pausa, cierre) y las fechas
            etapa = calcular_etapa(eleccion)
            if etapa != ETAPA_VOTACION:
                return fallo(MSG_FUERA_DE_VOTACION.get(etapa, MSG_VOTACION_NO_INICIADA))

            if not self._curso_habilitado_para_votar(id_eleccion, id_usuario):
                return fallo('Tu curso no está habilitado para votar en esta elección', 'prohibido')

            if Voto.ya_voto(id_usuario, id_eleccion):
                return fallo('Ya emitiste tu voto en esta elección', 'conflicto')

            if id_candidato is not None and not Candidato.pertenece_a_eleccion(id_candidato, id_eleccion):
                return fallo('Candidato no válido para esta elección')

            try:
                registro = Voto.registrar(id_eleccion, id_usuario, id_candidato)
            except VotoDuplicado:
                return fallo('Ya emitiste tu voto en esta elección', 'conflicto')
            if not registro:
                return fallo('Error al registrar el voto', 'error_sistema')

            return {
                'success': True,
                'message': 'Voto registrado con éxito',
                'codigo_certificado': Voto.codigo_certificado(
                    registro['id_registro'], registro['fecha_voto']
                ),
                'fecha_voto': registro['fecha_voto'],
            }
        except BaseDatosNoDisponible:
            raise
        except Exception as e:
            logger.error(f"Error al registrar voto: {e}")
            return fallo(MSG_SISTEMA, 'error_sistema')