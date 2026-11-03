from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class VotoCreate(BaseModel):
    id_eleccion: int
    id_candidato: Optional[int] = None  # None = voto en blanco


class EstadoVotoResponse(BaseModel):
    ya_voto: bool
    etapa: str
    curso_habilitado: bool  # False si la elección limita la votación a otros cursos


class EleccionDisponibleOut(BaseModel):
    id_eleccion: int
    titulo: str
    descripcion: Optional[str] = None
    fecha_inicio: datetime
    fecha_fin: datetime
    etapa: str
    ya_voto: bool


class VotoConfirmadoResponse(BaseModel):
    message: str
    codigo_certificado: str
    fecha_voto: datetime