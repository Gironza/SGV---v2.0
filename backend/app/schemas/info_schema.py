from pydantic import BaseModel
from typing import List


class RolInfo(BaseModel):
    nombre: str
    descripcion: str


class InfoSistemaOut(BaseModel):
    nombre: str
    proposito: str
    funcionalidades: List[str]
    roles: List[RolInfo]
    proceso_votacion: List[str]