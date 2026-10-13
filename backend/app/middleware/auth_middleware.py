from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.models.usuario import Usuario
from app.utils.jwt_handler import verificar_token

security_scheme = HTTPBearer()


def obtener_usuario_actual(credenciales: HTTPAuthorizationCredentials = Depends(security_scheme)) -> dict:
    """
    Verifica el JWT del header Authorization.
    Devuelve el payload (id_usuario, rol) si es válido y la cuenta sigue activa.
    Lanza 401 si el token falta, es inválido o expiró, o si la cuenta
    ya no existe o fue desactivada.
    """
    token = credenciales.credentials
    payload = verificar_token(token)

    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido o expirado",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        id_usuario = int(payload["sub"])
        id_rol = payload["rol"]
    except (KeyError, ValueError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token con formato inválido",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Una consulta por petición: así una cuenta desactivada pierde el acceso
    # aunque su token todavía no haya expirado.
    activo = Usuario.esta_activo(id_usuario)
    if activo is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="La cuenta ya no existe",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not activo:
        # 401 y no 403: así el frontend cierra la sesión con su manejo habitual
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Tu cuenta está desactivada, contacta al administrador de tu institución",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return {
        "id_usuario": id_usuario,
        "id_rol": id_rol
    }

def requerir_rol(*roles_permitidos: int):
    """
    Fábrica de dependencias: exige que el usuario autenticado
    tenga uno de los roles indicados. Uso: Depends(requerir_rol(1))
    """
    def verificar_rol(usuario: dict = Depends(obtener_usuario_actual)) -> dict:
        if usuario["id_rol"] not in roles_permitidos:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes permisos para acceder a este recurso"
            )
        return usuario
    return verificar_rol