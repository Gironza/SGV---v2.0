import logging
from app.models.resultado import Resultado
from app.utils.acceso import obtener_eleccion_de_institucion

logger = logging.getLogger(__name__)


class ResultadoController:

    def obtener_resultados(self, id_eleccion, id_usuario):
        try:
            eleccion = obtener_eleccion_de_institucion(id_eleccion, id_usuario)
            if not eleccion:
                return {'success': False, 'message': 'Elección no encontrada'}

            candidatos = Resultado.obtener_por_candidato(id_eleccion) or []
            votos_blancos = Resultado.contar_blancos(id_eleccion)
            total_votos = Resultado.contar_total(id_eleccion)

            ganador = None
            if candidatos and candidatos[0]['total_votos'] > 0:
                max_votos = candidatos[0]['total_votos']
                empatados = [c for c in candidatos if c['total_votos'] == max_votos]
                if len(empatados) == 1:
                    ganador = f"{empatados[0]['nombre']} {empatados[0]['apellido']}"
                else:
                    ganador = "Empate"

            return {
                'success': True,
                'titulo_eleccion': eleccion['titulo'],
                'nombre_estado': eleccion['nombre_estado'],
                'candidatos': candidatos,
                'votos_blancos': votos_blancos,
                'total_votos': total_votos,
                'ganador': ganador
            }
        except Exception as e:
            logger.error(f"Error al obtener resultados: {e}")
            return {'success': False, 'message': 'Error en el sistema, intenta más tarde'}