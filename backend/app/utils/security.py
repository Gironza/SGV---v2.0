from passlib.context import CryptContext

#libreria que encipta, abajo es la variable que administra el algoritmo de hash 
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

#convierte contraseña a hash bycript
def hashear_password(password: str) -> str:
    return pwd_context.hash(password)

#comparador de contraseña ingresada hasheada con conraseña hash almacenada
def verificar_password(password_ingresado: str, password_hash: str) -> bool:
    return pwd_context.verify(password_ingresado, password_hash)