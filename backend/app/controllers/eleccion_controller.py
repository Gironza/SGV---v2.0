import logging
from datetime import datetime, timedelta
from app.config.database import BaseDatosNoDisponible
from app.models.eleccion import Eleccion, TIPO_POSTULACION, TIPO_VOTACION
from app.models.usuario import Usuario
from app.utils.acceso import obtener_eleccion_de_institucion
from app.utils.etapas import (
    calcular_etapa, calcular_etapa_por_fechas, ETAPAS_SIN_INICIAR,
    ETAPA_VOTACION, ETAPA_FINALIZADA,
    ESTADO_ACTIVA, ESTADO_FINALIZADA, ESTADO_PENDIENTE
)
from app.utils.respuestas import fallo

logger = logging.getLogger(__name__)

ESTADOS_VALIDOS = {ESTADO_ACTIVA, ESTADO_FINALIZADA, ESTADO_PENDIENTE}

MSG_SISTEMA = 'Error en el sistema, intenta más tarde'
MSG_NO_ENCONTRADA = 'Elección no encontrada'

MSG_ESTADO = {
    ESTADO_ACTIVA: 'Elección activada',
    ESTADO_FINALIZADA: 'Elección finalizada',
    ESTADO_PENDIENTE: 'Elección en pausa (pendiente)',
}


class EleccionController:

    @staticmethod
    def _con_etapa(eleccion, cursos=None):
        cursos = cursos or {}
        return {
            **eleccion,
            'etapa': calcular_etapa(eleccion),
            'cursos_postulacion': cursos.get(TIPO_POSTULACION, []),
            'cursos_votacion': cursos.get(TIPO_VOTACION, []),
        }

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

    @staticmethod
    def _validar_cursos(id_institucion, cursos_postulacion, cursos_votacion):
        """
        Valida las listas contra los cursos reales de la institución (sin distinguir
        mayúsculas) y las devuelve con el nombre exacto que tienen los usuarios.
        Devuelve (postulacion, votacion, error). None se conserva como None.
        """
        if cursos_postulacion is None and cursos_votacion is None:
            return None, None, None

        disponibles = {c.lower(): c for c in Usuario.listar_cursos(id_institucion)}
        invalidos = []

        def normalizar(lista):
            if lista is None:
                return None
            resultado = []
            for curso in lista:
                canonico = disponibles.get((curso or '').strip().lower())
                if canonico is None:
                    invalidos.append(curso)
                elif canonico not in resultado:
                    resultado.append(canonico)
            return resultado

        postulacion = normalizar(cursos_postulacion)
        votacion = normalizar(cursos_votacion)
        if invalidos:
            return None, None, 'Estos cursos no existen en tu institución: ' + ', '.join(str(c) for c in invalidos)
        return postulacion, votacion, None

    def listar_cursos(self, id_usuario):
        try:
            id_institucion = Usuario.obtener_institucion(id_usuario)
            if id_institucion is None:
                return fallo('No se pudo determinar la institución del usuario')
            return {'success': True, 'cursos': Usuario.listar_cursos(id_institucion)}
        except BaseDatosNoDisponible:
            raise
        except Exception as e:
            logger.error(f"Error al listar cursos: {e}")
            return fallo(MSG_SISTEMA, 'error_sistema')

    def crear_eleccion(self, id_usuario_admin, titulo, descripcion,
                       fecha_inicio_inscripcion, fecha_fin_inscripcion,
                       fecha_inicio, fecha_fin,
                       cursos_postulacion=None, cursos_votacion=None):
        try:
            error = self._validar_fechas(
                fecha_inicio_inscripcion, fecha_fin_inscripcion, fecha_inicio, fecha_fin
            )
            if error:
                return fallo(error)

            id_institucion = Usuario.obtener_institucion(id_usuario_admin)
            if id_institucion is None:
                return fallo('No se pudo determinar la institución del usuario')

            cursos_post, cursos_vot, error = self._validar_cursos(
                id_institucion, cursos_postulacion, cursos_votacion
            )
            if error:
                return fallo(error)

            id_eleccion = Eleccion.crear(
                titulo, descripcion, fecha_inicio, fecha_fin, id_institucion,
                fecha_inicio_inscripcion, fecha_fin_inscripcion,
                cursos_post, cursos_vot
            )
            if id_eleccion is None:
                return fallo('Error al crear la elección', 'error_sistema')

            return {'success': True, 'message': 'Elección creada exitosamente', 'id_eleccion': id_eleccion}
        except BaseDatosNoDisponible:
            raise
        except Exception as e:
            logger.error(f"Error al crear elección: {e}")
            return fallo(MSG_SISTEMA, 'error_sistema')

    def listar_elecciones(self, id_usuario):
        try:
            id_institucion = Usuario.obtener_institucion(id_usuario)
            if id_institucion is None:
                return fallo('No se pudo determinar la institución del usuario')
            elecciones = Eleccion.listar_por_institucion(id_institucion) or []
            cursos = Eleccion.obtener_cursos_por_institucion(id_institucion)
            return {
                'success': True,
                'elecciones': [self._con_etapa(e, cursos.get(e['id_eleccion'])) for e in elecciones]
            }
        except BaseDatosNoDisponible:
            raise
        except Exception as e:
            logger.error(f"Error al listar elecciones: {e}")
            return fallo(MSG_SISTEMA, 'error_sistema')

    def obtener_eleccion(self, id_eleccion, id_usuario):
        try:
            eleccion = obtener_eleccion_de_institucion(id_eleccion, id_usuario)
            if not eleccion:
                return fallo(MSG_NO_ENCONTRADA, 'no_encontrado')
            return {
                'success': True,
                'eleccion': self._con_etapa(eleccion, Eleccion.obtener_cursos(id_eleccion))
            }
        except BaseDatosNoDisponible:
            raise
        except Exception as e:
            logger.error(f"Error al obtener elección: {e}")
            return fallo(MSG_SISTEMA, 'error_sistema')

    def actualizar_eleccion(self, id_eleccion, id_usuario, titulo, descripcion,
                            fecha_inicio_inscripcion, fecha_fin_inscripcion,
                            fecha_inicio, fecha_fin,
                            cursos_postulacion=None, cursos_votacion=None):
        try:
            eleccion = obtener_eleccion_de_institucion(id_eleccion, id_usuario)
            if not eleccion:
                return fallo(MSG_NO_ENCONTRADA, 'no_encontrado')

            error = self._validar_fechas(
                fecha_inicio_inscripcion, fecha_fin_inscripcion, fecha_inicio, fecha_fin
            )
            if error:
                return fallo(error)

            cursos_post, cursos_vot, error = self._validar_cursos(
                eleccion['id_institucion'], cursos_postulacion, cursos_votacion
            )
            if error:
                return fallo(error)

            # RF-009: nada de cambios críticos si la elección ya inició o tiene votos
            if calcular_etapa(eleccion) not in ETAPAS_SIN_INICIAR:
                return fallo('No se puede modificar una elección que ya inició o finalizó', 'conflicto')
            if Eleccion.tiene_votos(id_eleccion):
                return fallo('No se puede modificar: la elección ya tiene votos registrados', 'conflicto')

            if not Eleccion.actualizar(
                id_eleccion, titulo, descripcion, fecha_inicio, fecha_fin,
                fecha_inicio_inscripcion, fecha_fin_inscripcion,
                cursos_post, cursos_vot
            ):
                return fallo('Error al actualizar la elección', 'error_sistema')
            return {'success': True, 'message': 'Elección actualizada exitosamente'}
        except BaseDatosNoDisponible:
            raise
        except Exception as e:
            logger.error(f"Error al actualizar elección: {e}")
            return fallo(MSG_SISTEMA, 'error_sistema')

    def ampliar_postulacion(self, id_eleccion, id_usuario, nueva_fecha_fin):
        """Gracia: mueve fecha_fin_inscripcion hacia adelante, siempre antes del inicio."""
        try:
            eleccion = obtener_eleccion_de_institucion(id_eleccion, id_usuario)
            if not eleccion:
                return fallo(MSG_NO_ENCONTRADA, 'no_encontrado')

            actual = eleccion['fecha_fin_inscripcion']
            if actual is None:
                return fallo('Esta elección no tiene periodo de postulación configurado')
            if calcular_etapa(eleccion) not in ETAPAS_SIN_INICIAR:
                return fallo('No se puede ampliar: la elección ya inició o finalizó', 'conflicto')
            if nueva_fecha_fin <= actual:
                return fallo('La nueva fecha debe ser posterior al cierre actual de postulaciones')
            if nueva_fecha_fin >= eleccion['fecha_inicio']:
                return fallo('La nueva fecha debe ser anterior al inicio de la votación')

            if not Eleccion.ampliar_fin_inscripcion(id_eleccion, nueva_fecha_fin):
                return fallo('Error al ampliar la postulación', 'error_sistema')

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
            return fallo(MSG_SISTEMA, 'error_sistema')

    @staticmethod
    def _adelantar_inicio(eleccion, ahora):
        """
        Fechas que hay que mover para abrir la votación ya sin romper el CHECK:
        fecha_inicio pasa a 'ahora' y la postulación, si seguía abierta o sin
        empezar, se cierra 'ahora' (fin_inscripcion <= fecha_inicio).
        """
        cambios = {'fecha_inicio': ahora}
        fin_insc = eleccion['fecha_fin_inscripcion']
        if fin_insc is not None:
            if fin_insc > ahora:
                fin_insc = ahora
                cambios['fecha_fin_inscripcion'] = ahora
            if eleccion['fecha_inicio_inscripcion'] >= fin_insc:
                cambios['fecha_inicio_inscripcion'] = fin_insc - timedelta(seconds=1)
        return cambios

    def cambiar_estado(self, id_eleccion, id_usuario, id_estado, fecha_fin=None):
        """
        Control manual de la elección:
          Activa (1)     -> las fechas mandan. Si ya estaba Activa y aún no inicia,
                            abre la votación ahora. Si la fecha de fin ya pasó (reabrir
                            o reanudar), exige una fecha_fin nueva.
          Finalizada (2) -> cierra ya, ignorando fecha_fin.
          Pendiente (3)  -> pausa la votación mientras las fechas la tengan abierta.
        """
        try:
            if id_estado not in ESTADOS_VALIDOS:
                return fallo('Estado de elección inválido')
            eleccion = obtener_eleccion_de_institucion(id_eleccion, id_usuario)
            if not eleccion:
                return fallo(MSG_NO_ENCONTRADA, 'no_encontrado')
            if fecha_fin is not None and id_estado != ESTADO_ACTIVA:
                return fallo('La nueva fecha de fin solo se envía al activar la elección')

            ahora = datetime.now()
            actual = eleccion['id_estado_eleccion']
            cambios = {}

            if id_estado != ESTADO_ACTIVA:
                if actual == id_estado:
                    return fallo('La elección ya está en ese estado', 'conflicto')
            else:
                etapa_fechas = calcular_etapa_por_fechas(eleccion, ahora)
                inicio = eleccion['fecha_inicio']

                if etapa_fechas in ETAPAS_SIN_INICIAR and actual == ESTADO_ACTIVA:
                    cambios = self._adelantar_inicio(eleccion, ahora)
                    inicio = ahora
                elif etapa_fechas == ETAPA_FINALIZADA and fecha_fin is None:
                    return fallo('La fecha de fin ya pasó: envía una nueva fecha_fin para reabrir la elección')
                elif etapa_fechas == ETAPA_VOTACION and actual == ESTADO_ACTIVA and fecha_fin is None:
                    return fallo('La elección ya está activa', 'conflicto')

                if fecha_fin is not None:
                    if fecha_fin <= ahora or fecha_fin <= inicio:
                        return fallo('La nueva fecha de fin debe ser posterior a este momento y al inicio de la votación')
                    cambios['fecha_fin'] = fecha_fin

            if not Eleccion.cambiar_estado(id_eleccion, id_estado, **cambios):
                return fallo('Error al cambiar el estado', 'error_sistema')

            etapa = calcular_etapa({**eleccion, 'id_estado_eleccion': id_estado, **cambios}, ahora)
            return {'success': True, 'message': MSG_ESTADO[id_estado], 'etapa': etapa}
        except BaseDatosNoDisponible:
            raise
        except Exception as e:
            logger.error(f"Error al cambiar estado: {e}")
            return fallo(MSG_SISTEMA, 'error_sistema')

    def actualizar_publicacion(self, id_eleccion, id_usuario, fecha_publicacion):
        """Programa (o desactiva con None) la fecha desde la que se publican los resultados."""
        try:
            if not obtener_eleccion_de_institucion(id_eleccion, id_usuario):
                return fallo(MSG_NO_ENCONTRADA, 'no_encontrado')
            if not Eleccion.actualizar_publicacion(id_eleccion, fecha_publicacion):
                return fallo('Error al guardar la fecha de publicación', 'error_sistema')
            mensaje = 'Publicación de resultados programada' if fecha_publicacion \
                else 'Publicación de resultados desactivada'
            return {'success': True, 'message': mensaje}
        except BaseDatosNoDisponible:
            raise
        except Exception as e:
            logger.error(f"Error al actualizar publicación: {e}")
            return fallo(MSG_SISTEMA, 'error_sistema')

    def eliminar_eleccion(self, id_eleccion, id_usuario):
        try:
            if not obtener_eleccion_de_institucion(id_eleccion, id_usuario):
                return fallo(MSG_NO_ENCONTRADA, 'no_encontrado')
            if Eleccion.tiene_votos(id_eleccion):
                return fallo('No se puede eliminar: la elección ya tiene votos registrados', 'conflicto')
            if not Eleccion.eliminar(id_eleccion):
                return fallo('Error al eliminar la elección', 'error_sistema')
            return {'success': True, 'message': 'Elección eliminada'}
        except BaseDatosNoDisponible:
            raise
        except Exception as e:
            logger.error(f"Error al eliminar elección: {e}")
            return fallo(MSG_SISTEMA, 'error_sistema')