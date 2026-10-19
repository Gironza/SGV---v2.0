import hashlib
import hmac
import os
from datetime import datetime, timedelta, timezone
from jose import jwt, JWTError




SECRET_KEY = os.getenv("JWT_SECRET_KEY")
ALGORITHM = "HS256"
EXPIRACION_MINUTOS = 60 * 8  #8 horas
EXPIRACION_RECUPERACION_MINUTOS = 30

#Cracion del JWT firmado con los datos del usuario
def crear_token(data: dict, minutos: int = EXPIRACION_MINUTOS) -> str:
    to_encode = data.copy()
    expira = datetime.now(timezone.utc) + timedelta(minutes=minutos)
    to_encode.update({"exp": expira})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


#Decodificacion y validacion del JWT, Devuelve la info (payload) o lo None en caso de invalidaciones

def verificar_token(token: str) -> dict | None:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None


# --- Recuperación de contraseña (RF-004) ---
# El token NO lleva 'rol' (obtener_usuario_actual lo rechaza si alguien lo usa como
# sesión) y lleva tipo='recuperacion' (restablecer rechaza los tokens de sesión).

def huella_contrasena(hash_contrasena: str) -> str:
    """
    Huella corta del hash de contraseña actual, firmada con la clave secreta.
    El JWT se puede leer (solo está firmado, no cifrado), por eso no va el hash
    ni un SHA simple, sino un HMAC recortado.
    """
    return hmac.new(
        SECRET_KEY.encode(), hash_contrasena.encode(), hashlib.sha256
    ).hexdigest()[:16]


def huella_coincide(huella: str, hash_contrasena: str) -> bool:
    return hmac.compare_digest(huella, huella_contrasena(hash_contrasena))


def crear_token_recuperacion(id_usuario: int, hash_contrasena: str) -> str:
    return crear_token(
        {
            "sub": str(id_usuario),
            "tipo": "recuperacion",
            "huella": huella_contrasena(hash_contrasena),
        },
        minutos=EXPIRACION_RECUPERACION_MINUTOS,
    )


def verificar_token_recuperacion(token: str) -> dict | None:
    """Devuelve {'id_usuario', 'huella'} si es un token de recuperación válido y vigente."""
    payload = verificar_token(token)
    if payload is None or payload.get("tipo") != "recuperacion":
        return None
    try:
        return {"id_usuario": int(payload["sub"]), "huella": str(payload["huella"])}
    except (KeyError, ValueError, TypeError):
        return None