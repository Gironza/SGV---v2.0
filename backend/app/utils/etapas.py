from datetime import datetime

ETAPA_PUBLICADA = "publicada"
ETAPA_POSTULACION = "postulacion"
ETAPA_MODERACION = "moderacion"
ETAPA_VOTACION = "votacion"
ETAPA_FINALIZADA = "finalizada"
ETAPA_PAUSADA = "pausada"

# Catálogo estados_eleccion
ESTADO_ACTIVA = 1
ESTADO_FINALIZADA = 2
ESTADO_PENDIENTE = 3

# Etapas en las que la elección todavía no ha iniciado
ETAPAS_SIN_INICIAR = (ETAPA_PUBLICADA, ETAPA_POSTULACION, ETAPA_MODERACION)


def calcular_etapa_por_fechas(eleccion, ahora=None):
    """
    Etapa que dicen las fechas (inicio incluido, fin excluido):
      publicada   -> antes de fecha_inicio_inscripcion
      postulacion -> fecha_inicio_inscripcion a fecha_fin_inscripcion
      moderacion  -> fecha_fin_inscripcion a fecha_inicio
      votacion    -> fecha_inicio a fecha_fin
      finalizada  -> desde fecha_fin
    Las elecciones antiguas sin fechas de inscripción quedan 'publicada'
    hasta que inicia la votación.
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


def calcular_etapa(eleccion, ahora=None):
    """
    Etapa real: las fechas mandan, salvo que el estado de la elección diga otra cosa.
      Activa (1)      -> lo que digan las fechas.
      Finalizada (2)  -> siempre finalizada (se ignora fecha_fin).
      Pendiente (3)   -> pausa: si las fechas dicen 'votacion', nadie vota (pausada).
    El dict debe traer id_estado_eleccion además de las 4 fechas.
    """
    ahora = ahora or datetime.now()
    estado = eleccion.get('id_estado_eleccion')

    if estado == ESTADO_FINALIZADA:
        return ETAPA_FINALIZADA

    etapa = calcular_etapa_por_fechas(eleccion, ahora)
    if estado == ESTADO_PENDIENTE and etapa == ETAPA_VOTACION:
        return ETAPA_PAUSADA
    return etapa