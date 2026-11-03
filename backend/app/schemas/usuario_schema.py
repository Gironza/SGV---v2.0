from typing import Annotated, Optional, List
from pydantic import BaseModel, EmailStr, Field, StringConstraints, field_validator

Texto100 = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=100)]
Documento20 = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=20)]
Curso20 = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=20)]


class _DatosPersonales(BaseModel):
    documento: Documento20
    id_tipo_doc: int
    nombre: Texto100
    apellido: Texto100
    correo: EmailStr

    @field_validator('correo')
    @classmethod
    def correo_no_muy_largo(cls, valor):
        # usuarios.correo es VARCHAR(100)
        if len(valor) > 100:
            raise ValueError('correo demasiado largo')
        return valor


class EstudianteCreate(_DatosPersonales):
    curso: Curso20  # obligatorio: sin curso no podría participar en elecciones con lista de cursos


class UsuarioUpdate(_DatosPersonales):
    # Obligatorio para estudiantes; los docentes no tienen curso (omitir o null)
    curso: Optional[Curso20] = None


class EstadoUsuarioRequest(BaseModel):
    activo: bool


class CursoRequest(BaseModel):
    curso: Curso20


class UsuarioOut(BaseModel):
    id_usuario: int
    documento: str
    id_tipo_doc: int
    tipo_documento: str
    nombre: str
    apellido: str
    correo: str
    curso: Optional[str] = None
    activo: bool
    id_rol: int
    rol_nombre: str


class UsuarioListaOut(BaseModel):
    total: int      # usuarios que cumplen el filtro (todas las páginas)
    pagina: int
    tamano: int
    usuarios: List[UsuarioOut]


class UsuarioCreadoResponse(BaseModel):
    success: bool
    message: str
    id_usuario: int


class EstadoUsuarioResponse(BaseModel):
    success: bool
    message: str
    activo: bool
    advertencias: List[str] = Field(default_factory=list)

class MensajeResponse(BaseModel):
    success: bool
    message: str
