from typing import Annotated
from pydantic import BaseModel, EmailStr, Field, StringConstraints

Texto100 = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=100)]

class UsuarioLogin(BaseModel):
    correo: EmailStr
    password: str = Field(..., min_length=1)


class UsuarioRegistro(BaseModel):
    nombres: str = Field(..., min_length=1, max_length=100)
    apellidos: str = Field(..., min_length=1, max_length=100)
    documento: str = Field(..., min_length=1, max_length=20)
    id_tipo_doc: int
    correo: EmailStr
    password: str = Field(..., min_length=8, max_length=72)
    codigo_institucion: str = Field(..., min_length=1)
    curso: str | None = None


class UsuarioResponse(BaseModel):
    id_usuario: int
    correo: str
    nombre: str
    apellido: str
    curso: str | None
    id_rol: int
    rol_nombre: str

#respuesta token 

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: UsuarioResponse

#mensaje 

class MensajeResponse(BaseModel):
    success: bool
    message: str

#perfil 

class PerfilResponse(BaseModel):
    id_usuario: int
    documento: str
    nombre: str
    apellido: str
    correo: str
    curso: str | None
    id_rol: int
    rol_nombre: str


class PerfilUpdate(BaseModel):
    nombre: Texto100
    apellido: Texto100
    correo: EmailStr


class CambioContrasena(BaseModel):
    contrasena_actual: str = Field(..., min_length=1)
    contrasena_nueva: str = Field(..., min_length=8, max_length=72)