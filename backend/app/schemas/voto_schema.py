from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class VotoCreate(BaseModel):
    id_eleccion: int
    id_candidato: Optional[int] = None  # None = voto en blanco


class CandidatoVotacionOut(BaseModel):
    id_candidato: int
    nombre: str
    apellido: str
    propuesta: Optional[str] = None
    foto: Optional[str] = None


class EstadoVotoResponse(BaseModel):
    ya_voto: bool


class VotoConfirmadoResponse(BaseModel):
    message: str
    codigo_certificado: str
    fecha_voto: datetime