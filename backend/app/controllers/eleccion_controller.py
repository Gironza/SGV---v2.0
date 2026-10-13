import logging
from app.models.eleccion import Eleccion
from app.models.usuario import Usuario

logger = logging.getLogger(__name__)
ESTADOS_VALIDOS = {1, 2, 3}


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

    def crear_eleccion(self, id_usuario_admin, titulo, descripcion, fecha_inicio, fecha_fin):
        try:
            if fecha_inicio >= fecha_fin:
                return {'success': False, 'message': 'La fecha de inicio debe ser anterior a la fecha de fin'}

            id_institucion = Usuario.obtener_institucion(id_usuario_admin)
            if id_institucion is None:
                return {'success': False, 'message': 'No se pudo determinar la institución del usuario'}

            id_eleccion = Eleccion.crear(titulo, descripcion, fecha_inicio, fecha_fin, id_institucion)
            if id_eleccion is None:
                return {'success': False, 'message': 'Error al crear la elección'}

            return {'success': True, 'message': 'Elección creada exitosamente', 'id_eleccion': id_eleccion}
        except Exception as e:
            logger.error(f"Error al crear elección: {e}")
            return {'success': False, 'message': 'Error en el sistema, intenta más tarde'}

    def listar_elecciones(self, id_usuario):
        try:
            id_institucion = Usuario.obtener_institucion(id_usuario)
            if id_institucion is None:
                return {'success': False, 'message': 'No se pudo determinar la institución del usuario'}
            return {'success': True, 'elecciones': Eleccion.listar_por_institucion(id_institucion) or []}
        except Exception as e:
            logger.error(f"Error al listar elecciones: {e}")
            return {'success': False, 'message': 'Error en el sistema, intenta más tarde'}

    def obtener_eleccion(self, id_eleccion, id_usuario):
        try:
            eleccion = self._eleccion_de_institucion(id_eleccion, id_usuario)
            if not eleccion:
                return {'success': False, 'message': 'Elección no encontrada'}
            return {'success': True, 'eleccion': eleccion}
        except Exception as e:
            logger.error(f"Error al obtener elección: {e}")
            return {'success': False, 'message': 'Error en el sistema, intenta más tarde'}

    def actualizar_eleccion(self, id_eleccion, id_usuario, titulo, descripcion, fecha_inicio, fecha_fin):
        try:
            if not self._eleccion_de_institucion(id_eleccion, id_usuario):
                return {'success': False, 'message': 'Elección no encontrada'}
            if fecha_inicio >= fecha_fin:
                return {'success': False, 'message': 'La fecha de inicio debe ser anterior a la fecha de fin'}
            if not Eleccion.actualizar(id_eleccion, titulo, descripcion, fecha_inicio, fecha_fin):
                return {'success': False, 'message': 'Error al actualizar la elección'}
            return {'success': True, 'message': 'Elección actualizada exitosamente'}
        except Exception as e:
            logger.error(f"Error al actualizar elección: {e}")
            return {'success': False, 'message': 'Error en el sistema, intenta más tarde'}

    def cambiar_estado(self, id_eleccion, id_usuario, id_estado_eleccion):
        try:
            if id_estado_eleccion not in ESTADOS_VALIDOS:
                return {'success': False, 'message': 'Estado de elección inválido'}
            if not self._eleccion_de_institucion(id_eleccion, id_usuario):
                return {'success': False, 'message': 'Elección no encontrada'}
            if not Eleccion.cambiar_estado(id_eleccion, id_estado_eleccion):
                return {'success': False, 'message': 'Error al cambiar el estado'}
            return {'success': True, 'message': 'Estado actualizado exitosamente'}
        except Exception as e:
            logger.error(f"Error al cambiar estado: {e}")
            return {'success': False, 'message': 'Error en el sistema, intenta más tarde'}

    def eliminar_eleccion(self, id_eleccion, id_usuario):
        try:
            if not self._eleccion_de_institucion(id_eleccion, id_usuario):
                return {'success': False, 'message': 'Elección no encontrada'}
            if not Eleccion.eliminar(id_eleccion):
                return {'success': False, 'message': 'Error al eliminar la elección'}
            return {'success': True, 'message': 'Elección y sus votos/registros asociados fueron eliminados'}
        except Exception as e:
            logger.error(f"Error al eliminar elección: {e}")
            return {'success': False, 'message': 'Error en el sistema, intenta más tarde'}