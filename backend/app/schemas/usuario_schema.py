from pydantic import BaseModel
from typing import Optional, List


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