import logging
from app.config.database import BaseDatosNoDisponible
from app.models.eleccion import Eleccion
from app.models.usuario import Usuario
from app.utils.etapas import calcular_etapa, ETAPAS_SIN_INICIAR

logger = logging.getLogger(__name__)
ESTADOS_VALIDOS = {1, 2, 3}

MSG_SISTEMA = 'Error en el sistema, intenta más tarde'
MSG_NO_ENCONTRADA = 'Elección no encontrada'


class EleccionController:

    @staticmethod
    def _eleccion_de_institucion(id_eleccion, id_usuario):
        """
        Devuelve la elección solo si pertenece a la institución del usuario.
        Si no existe o es de otra institución devuelve None: en ambos casos
        el cliente recibe el mismo mensaje, para no revelar que existe.
        """
        eleccion = Eleccion.obtener_por_id(id_eleccion)
        if not eleccion:
            return None
        if Usuario.obtener_institucion(id_usuario) != eleccion['id_institucion']:
            return None
        return eleccion

    @staticmethod
    def _con_etapa(eleccion):
        return {**eleccion, 'etapa': calcular_etapa(eleccion)}

    @staticmethod
    def _validar_fechas(inicio_insc, fin_insc, inicio, fin):
        """Devuelve el mensaje de error, o None si el orden es correcto."""
        if inicio_insc >= fin_insc:
            return 'El inicio de la postulación debe ser anterior a su cierre'
        if fin_insc > inicio:
            return 'La postulación debe cerrar a más tardar cuando inicia la votación'
        if inicio >= fin:
            return 'La fecha de inicio de la votación debe ser anterior a su fecha de fin'
        return None

    def crear_eleccion(self, id_usuario_admin, titulo, descripcion,
                       fecha_inicio_inscripcion, fecha_fin_inscripcion,
                       fecha_inicio, fecha_fin):
        try:
            error = self._validar_fechas(
                fecha_inicio_inscripcion, fecha_fin_inscripcion, fecha_inicio, fecha_fin
            )
            if error:
                return {'success': False, 'message': error}

            id_institucion = Usuario.obtener_institucion(id_usuario_admin)
            if id_institucion is None:
                return {'success': False, 'message': 'No se pudo determinar la institución del usuario'}

            id_eleccion = Eleccion.crear(
                titulo, descripcion, fecha_inicio, fecha_fin, id_institucion,
                fecha_inicio_inscripcion, fecha_fin_inscripcion
            )
            if id_eleccion is None:
                return {'success': False, 'message': 'Error al crear la elección'}

            return {'success': True, 'message': 'Elección creada exitosamente', 'id_eleccion': id_eleccion}
        except BaseDatosNoDisponible:
            raise
        except Exception as e:
            logger.error(f"Error al crear elección: {e}")
            return {'success': False, 'message': MSG_SISTEMA}

    def listar_elecciones(self, id_usuario):
        try:
            id_institucion = Usuario.obtener_institucion(id_usuario)
            if id_institucion is None:
                return {'success': False, 'message': 'No se pudo determinar la institución del usuario'}
            elecciones = Eleccion.listar_por_institucion(id_institucion) or []
            return {'success': True, 'elecciones': [self._con_etapa(e) for e in elecciones]}
        except BaseDatosNoDisponible:
            raise
        except Exception as e:
            logger.error(f"Error al listar elecciones: {e}")
            return {'success': False, 'message': MSG_SISTEMA}

    def obtener_eleccion(self, id_eleccion, id_usuario):
        try:
            eleccion = self._eleccion_de_institucion(id_eleccion, id_usuario)
            if not eleccion:
                return {'success': False, 'message': MSG_NO_ENCONTRADA}
            return {'success': True, 'eleccion': self._con_etapa(eleccion)}
        except BaseDatosNoDisponible:
            raise
        except Exception as e:
            logger.error(f"Error al obtener elección: {e}")
            return {'success': False, 'message': MSG_SISTEMA}

    def actualizar_eleccion(self, id_eleccion, id_usuario, titulo, descripcion,
                            fecha_inicio_inscripcion, fecha_fin_inscripcion,
                            fecha_inicio, fecha_fin):
        try:
            eleccion = self._eleccion_de_institucion(id_eleccion, id_usuario)
            if not eleccion:
                return {'success': False, 'message': MSG_NO_ENCONTRADA}

            error = self._validar_fechas(
                fecha_inicio_inscripcion, fecha_fin_inscripcion, fecha_inicio, fecha_fin
            )
            if error:
                return {'success': False, 'message': error}

            # RF-009: nada de cambios críticos si la elección ya inició o tiene votos
            if calcular_etapa(eleccion) not in ETAPAS_SIN_INICIAR:
                return {'success': False, 'message': 'No se puede modificar una elección que ya inició o finalizó'}
            if Eleccion.tiene_votos(id_eleccion):
                return {'success': False, 'message': 'No se puede modificar: la elección ya tiene votos registrados'}

            if not Eleccion.actualizar(
                id_eleccion, titulo, descripcion, fecha_inicio, fecha_fin,
                fecha_inicio_inscripcion, fecha_fin_inscripcion
            ):
                return {'success': False, 'message': 'Error al actualizar la elección'}
            return {'success': True, 'message': 'Elección actualizada exitosamente'}
        except BaseDatosNoDisponible:
            raise
        except Exception as e:
            logger.error(f"Error al actualizar elección: {e}")
            return {'success': False, 'message': MSG_SISTEMA}

    def ampliar_postulacion(self, id_eleccion, id_usuario, nueva_fecha_fin):
        """Gracia: mueve fecha_fin_inscripcion hacia adelante, siempre antes del inicio."""
        try:
            eleccion = self._eleccion_de_institucion(id_eleccion, id_usuario)
            if not eleccion:
                return {'success': False, 'message': MSG_NO_ENCONTRADA}

            actual = eleccion['fecha_fin_inscripcion']
            if actual is None:
                return {'success': False, 'message': 'Esta elección no tiene periodo de postulación configurado'}
            if calcular_etapa(eleccion) not in ETAPAS_SIN_INICIAR:
                return {'success': False, 'message': 'No se puede ampliar: la elección ya inició o finalizó'}
            if nueva_fecha_fin <= actual:
                return {'success': False, 'message': 'La nueva fecha debe ser posterior al cierre actual de postulaciones'}
            if nueva_fecha_fin >= eleccion['fecha_inicio']:
                return {'success': False, 'message': 'La nueva fecha debe ser anterior al inicio de la votación'}

            if not Eleccion.ampliar_fin_inscripcion(id_eleccion, nueva_fecha_fin):
                return {'success': False, 'message': 'Error al ampliar la postulación'}

            etapa = calcular_etapa({**eleccion, 'fecha_fin_inscripcion': nueva_fecha_fin})
            return {
                'success': True,
                'message': 'Postulación ampliada exitosamente',
                'fecha_fin_inscripcion': nueva_fecha_fin,
                'etapa': etapa
            }
        except BaseDatosNoDisponible:
            raise
        except Exception as e:
            logger.error(f"Error al ampliar postulación: {e}")
            return {'success': False, 'message': MSG_SISTEMA}

    def cambiar_estado(self, id_eleccion, id_usuario, id_estado_eleccion):
        try:
            if id_estado_eleccion not in ESTADOS_VALIDOS:
                return {'success': False, 'message': 'Estado de elección inválido'}
            if not self._eleccion_de_institucion(id_eleccion, id_usuario):
                return {'success': False, 'message': MSG_NO_ENCONTRADA}
            if not Eleccion.cambiar_estado(id_eleccion, id_estado_eleccion):
                return {'success': False, 'message': 'Error al cambiar el estado'}
            return {'success': True, 'message': 'Estado actualizado exitosamente'}
        except BaseDatosNoDisponible:
            raise
        except Exception as e:
            logger.error(f"Error al cambiar estado: {e}")
            return {'success': False, 'message': MSG_SISTEMA}

    def eliminar_eleccion(self, id_eleccion, id_usuario):
        try:
            if not self._eleccion_de_institucion(id_eleccion, id_usuario):
                return {'success': False, 'message': MSG_NO_ENCONTRADA}
            if not Eleccion.eliminar(id_eleccion):
                return {'success': False, 'message': 'Error al eliminar la elección'}
            return {'success': True, 'message': 'Elección y sus votos/registros asociados fueron eliminados'}
        except BaseDatosNoDisponible:
            raise
        except Exception as e:
            logger.error(f"Error al eliminar elección: {e}")
            return {'success': False, 'message': MSG_SISTEMA}