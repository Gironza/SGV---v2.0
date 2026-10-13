from datetime import datetime, timedelta, timezone
from jose import jwt, JWTError
import os



SECRET_KEY = os.getenv("JWT_SECRET_KEY")
ALGORITHM = "HS256"
EXPIRACION_MINUTOS = 60 * 8  #8 horas

#Cracion del JWT firmado con los datos del usuario
def crear_token(data: dict) -> str:
    to_encode = data.copy()
    expira = datetime.now(timezone.utc) + timedelta(minutes=EXPIRACION_MINUTOS)
    to_encode.update({"exp": expira})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


#Decodificacion y validacion del JWT, Devuelve la info (payload) o lo None en caso de invalidaciones

def verificar_token(token: str) -> dict | None:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None