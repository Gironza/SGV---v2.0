from datetime import datetime

ETAPA_PUBLICADA = "publicada"
ETAPA_POSTULACION = "postulacion"
ETAPA_MODERACION = "moderacion"
ETAPA_VOTACION = "votacion"
ETAPA_FINALIZADA = "finalizada"

# Etapas en las que la elección todavía no ha iniciado
ETAPAS_SIN_INICIAR = (ETAPA_PUBLICADA, ETAPA_POSTULACION, ETAPA_MODERACION)


def calcular_etapa(eleccion, ahora=None):
    """
    Calcula la etapa comparando la fecha actual con las fechas de la elección.
    Rangos (inicio incluido, fin excluido):
      publicada   -> antes de fecha_inicio_inscripcion
      postulacion -> fecha_inicio_inscripcion a fecha_fin_inscripcion
      moderacion  -> fecha_fin_inscripcion a fecha_inicio
      votacion    -> fecha_inicio a fecha_fin
      finalizada  -> desde fecha_fin
    Las elecciones antiguas sin fechas de inscripción nunca pasan por
    postulación ni moderación: quedan 'publicada' hasta que inicia la votación.
    """
    ahora = ahora or datetime.now()

    if ahora >= eleccion['fecha_fin']:
        return ETAPA_FINALIZADA
    if ahora >= eleccion['fecha_inicio']:
        return ETAPA_VOTACION

    inicio_post = eleccion.get('fecha_inicio_inscripcion')
    fin_post = eleccion.get('fecha_fin_inscripcion')
    if inicio_post is None or fin_post is None or ahora < inicio_post:
        return ETAPA_PUBLICADA
    if ahora < fin_post:
        return ETAPA_POSTULACION
    return ETAPA_MODERACION