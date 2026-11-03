import logging
from datetime import datetime
from app.config.database import BaseDatosNoDisponible
from app.models.resultado import Resultado
from app.utils import exportes
from app.utils.acceso import obtener_eleccion_de_institucion
from app.utils.etapas import (
    calcular_etapa, ETAPA_VOTACION, ETAPA_PAUSADA, ETAPA_FINALIZADA
)
from app.utils.respuestas import fallo

logger = logging.getLogger(__name__)

ROL_ADMIN = 1
ROL_DOCENTE = 2

MSG_SISTEMA = 'Error en el sistema, intenta más tarde'
MSG_NO_ENCONTRADA = 'Elección no encontrada'


def _porcentaje(parte, total):
    return round(parte * 100 / total, 1) if total else 0.0


class ResultadoController:

    @staticmethod
    def _motivo_sin_acceso(eleccion, id_rol, etapa, ahora):
        """
        Quién ve los resultados y cuándo. Devuelve el motivo si NO puede, o None.
          Admin:                votación, pausa y finalizada.
          Docente:              solo finalizada.
          Estudiante/candidato: finalizada y con fecha_publicacion_resultados ya cumplida.
        """
        if id_rol == ROL_ADMIN:
            if etapa in (ETAPA_VOTACION, ETAPA_PAUSADA, ETAPA_FINALIZADA):
                return None
            return 'Los resultados estarán disponibles cuando inicie la votación'

        if id_rol == ROL_DOCENTE:
            if etapa == ETAPA_FINALIZADA:
                return None
            return 'Los resultados estarán disponibles cuando finalice la votación'

        if etapa != ETAPA_FINALIZADA:
            return 'Los resultados no están disponibles hasta que finalice la votación'
        publicacion = eleccion.get('fecha_publicacion_resultados')
        if publicacion is None or publicacion > ahora:
            return 'Los resultados aún no han sido publicados'
        return None

    @staticmethod
    def _resumen(filas):
        habilitados = sum(f['habilitados'] for f in filas)
        votaron = sum(f['votaron'] for f in filas)
        return {
            'habilitados': habilitados,
            'votaron': votaron,
            'porcentaje': _porcentaje(votaron, habilitados),
        }

    @staticmethod
    def _ganador(candidatos):
        """
        El voto en blanco no compite. Devuelve (ganador, empatados):
        sin votos para candidatos no hay ganador; si hay empate en el primer
        lugar no se declara ganador y se listan los empatados.
        """
        if not candidatos or candidatos[0]['total_votos'] == 0:
            return None, []
        maximo = candidatos[0]['total_votos']
        primeros = [
            f"{c['nombre']} {c['apellido']}"
            for c in candidatos if c['total_votos'] == maximo
        ]
        if len(primeros) == 1:
            return primeros[0], []
        return None, primeros

    def _armar_resultados(self, eleccion, etapa):
        """
        Todas las cifras de una elección, sin revisar permisos (eso lo hace quien llama).
        Devuelve None si alguna consulta falla.
        """
        id_eleccion = eleccion['id_eleccion']
        conteos = Resultado.conteos(id_eleccion)
        cursos = Resultado.participacion_por_curso(id_eleccion, eleccion['id_institucion'])
        if conteos is None or cursos is None:
            return None

        total = conteos['total_votos']
        candidatos = [
            {**c, 'porcentaje': _porcentaje(c['total_votos'], total)}
            for c in conteos['candidatos']
        ]
        ganador, empatados = (
            self._ganador(candidatos) if etapa == ETAPA_FINALIZADA else (None, [])
        )

        return {
            'titulo_eleccion': eleccion['titulo'],
            'etapa': etapa,
            'candidatos': candidatos,
            'votos_blancos': conteos['votos_blancos'],
            'total_votos': total,
            'participacion': self._resumen(cursos),
            'por_curso': [
                {
                    'curso': f['curso'],
                    'habilitados': f['habilitados'],
                    'votaron': f['votaron'],
                    'porcentaje': _porcentaje(f['votaron'], f['habilitados']),
                }
                for f in cursos
            ],
            'ganador': ganador,
            'empatados': empatados,
        }

    def obtener_resultados(self, id_eleccion, id_usuario, id_rol):
        """RF-021, RF-029 y RF-038."""
        try:
            eleccion = obtener_eleccion_de_institucion(id_eleccion, id_usuario)
            if not eleccion:
                return fallo(MSG_NO_ENCONTRADA, 'no_encontrado')

            ahora = datetime.now()
            etapa = calcular_etapa(eleccion, ahora)
            motivo = self._motivo_sin_acceso(eleccion, id_rol, etapa, ahora)
            if motivo:
                return fallo(motivo, 'prohibido')

            datos = self._armar_resultados(eleccion, etapa)
            if datos is None:
                return fallo(MSG_SISTEMA, 'error_sistema')

            return {'success': True, **datos}
        except BaseDatosNoDisponible:
            raise
        except Exception as e:
            logger.error(f"Error al obtener resultados: {e}")
            return fallo(MSG_SISTEMA, 'error_sistema')

    def obtener_estadisticas(self, id_eleccion, id_usuario):
        """RF-013 (solo admin): participación general y por curso, y votos en blanco."""
        try:
            eleccion = obtener_eleccion_de_institucion(id_eleccion, id_usuario)
            if not eleccion:
                return fallo(MSG_NO_ENCONTRADA, 'no_encontrado')

            ahora = datetime.now()
            etapa = calcular_etapa(eleccion, ahora)
            motivo = self._motivo_sin_acceso(eleccion, ROL_ADMIN, etapa, ahora)
            if motivo:
                return fallo(motivo, 'prohibido')

            datos = self._armar_resultados(eleccion, etapa)
            if datos is None:
                return fallo(MSG_SISTEMA, 'error_sistema')

            total = datos['total_votos']
            blancos = datos['votos_blancos']
            return {
                'success': True,
                'titulo_eleccion': datos['titulo_eleccion'],
                'etapa': etapa,
                'participacion': datos['participacion'],
                'por_curso': datos['por_curso'],
                'total_votos': total,
                'votos_validos': total - blancos,
                'votos_blancos': blancos,
                'porcentaje_blancos': _porcentaje(blancos, total),
            }
        except BaseDatosNoDisponible:
            raise
        except Exception as e:
            logger.error(f"Error al obtener estadísticas: {e}")
            return fallo(MSG_SISTEMA, 'error_sistema')

    def exportar_resultados(self, id_eleccion, id_usuario, formato):
        """
        RF-014 y RF-024 (admin y docente): CSV o PDF, solo con la elección finalizada,
        aunque el admin pueda ver los resultados en vivo durante la votación.
        Devuelve los bytes del archivo en 'contenido'.
        """
        try:
            if formato not in ('csv', 'pdf'):
                return fallo('Formato no válido: usa csv o pdf')

            eleccion = obtener_eleccion_de_institucion(id_eleccion, id_usuario)
            if not eleccion:
                return fallo(MSG_NO_ENCONTRADA, 'no_encontrado')

            ahora = datetime.now()
            etapa = calcular_etapa(eleccion, ahora)
            if etapa != ETAPA_FINALIZADA:
                return fallo('Los resultados solo se pueden exportar cuando la elección ha finalizado',
                             'prohibido')

            datos = self._armar_resultados(eleccion, etapa)
            if datos is None:
                return fallo(MSG_SISTEMA, 'error_sistema')

            datos['institucion'] = Resultado.nombre_institucion(eleccion['id_institucion'])
            datos['fecha_inicio'] = eleccion['fecha_inicio']
            datos['fecha_fin'] = eleccion['fecha_fin']
            datos['generado'] = ahora

            contenido = exportes.generar_csv(datos) if formato == 'csv' else exportes.generar_pdf(datos)
            return {'success': True, 'contenido': contenido}
        except BaseDatosNoDisponible:
            raise
        except Exception as e:
            logger.error(f"Error al exportar resultados: {e}")
            return fallo(MSG_SISTEMA, 'error_sistema')