import threading
from datetime import datetime, timedelta

MAX_INTENTOS = 6
MINUTOS_BLOQUEO = 10   # cuánto dura el bloqueo
MINUTOS_VENTANA = 10   # los fallos se olvidan si pasan 15 min sin nuevos intentos

_lock = threading.Lock()  # FastAPI atiende las rutas normales en varios hilos
_intentos = {}            # correo -> {'fallos': int, 'ultimo': datetime, 'bloqueado_hasta': datetime | None}


def _clave(correo):
    return (correo or '').strip().lower()


def _limpiar_vencidos(ahora):
    # Se llama siempre con _lock tomado. Evita que el diccionario crezca sin fin.
    vencidos = [
        c for c, r in _intentos.items()
        if (r['bloqueado_hasta'] and r['bloqueado_hasta'] <= ahora)
        or (not r['bloqueado_hasta'] and ahora - r['ultimo'] > timedelta(minutes=MINUTOS_VENTANA))
    ]
    for c in vencidos:
        del _intentos[c]


def segundos_bloqueo_restantes(correo):
    """Segundos que faltan para que termine el bloqueo; 0 si no está bloqueado."""
    clave = _clave(correo)
    ahora = datetime.now()
    with _lock:
        registro = _intentos.get(clave)
        if not registro or not registro['bloqueado_hasta']:
            return 0
        if registro['bloqueado_hasta'] <= ahora:
            del _intentos[clave]  # bloqueo vencido: empieza de cero
            return 0
        return int((registro['bloqueado_hasta'] - ahora).total_seconds()) + 1


def registrar_fallo(correo):
    """Suma un intento fallido. Devuelve los intentos que le quedan (0 = quedó bloqueado)."""
    clave = _clave(correo)
    ahora = datetime.now()
    with _lock:
        _limpiar_vencidos(ahora)
        registro = _intentos.get(clave)
        if not registro:
            registro = {'fallos': 0, 'ultimo': ahora, 'bloqueado_hasta': None}
            _intentos[clave] = registro

        registro['fallos'] += 1
        registro['ultimo'] = ahora

        if registro['fallos'] >= MAX_INTENTOS:
            registro['bloqueado_hasta'] = ahora + timedelta(minutes=MINUTOS_BLOQUEO)
            return 0
        return MAX_INTENTOS - registro['fallos']


def limpiar_intentos(correo):
    """Login exitoso: se borran los fallos acumulados."""
    with _lock:
        _intentos.pop(_clave(correo), None)