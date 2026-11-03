from fastapi import HTTPException


def fallo(mensaje, bandera=None):
    """Resultado de error de un controlador, con bandera opcional para el código HTTP."""
    resultado = {'success': False, 'message': mensaje}
    if bandera:
        resultado[bandera] = True
    return resultado


def resolver(resultado):
    """Si el controlador falló lo traduce a HTTPException; si no, devuelve el resultado."""
    if resultado['success']:
        return resultado
    if resultado.get('no_encontrado'):
        codigo = 404
    elif resultado.get('prohibido'):
        codigo = 403
    elif resultado.get('conflicto'):
        codigo = 409
    elif resultado.get('demasiado_grande'):
        codigo = 413
    elif resultado.get('error_sistema'):
        codigo = 500
    else:
        codigo = 400
    raise HTTPException(status_code=codigo, detail=resultado['message'])