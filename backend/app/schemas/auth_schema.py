from pydantic import BaseModel, EmailStr, Field


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


class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: UsuarioResponse


class MensajeResponse(BaseModel):
    success: bool
    message: str