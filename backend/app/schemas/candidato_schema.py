from pydantic import BaseModel, Field
from typing import Optional


class CandidatoCreate(BaseModel):
    id_eleccion: int
    propuesta: Optional[str] = Field(None, max_length=2000)
    foto: Optional[str] = None


class CandidatoOut(BaseModel):
    id_candidato: int
    nombre: str
    apellido: str
    propuesta: Optional[str] = None
    foto: Optional[str] = None


class CandidaturaDetalleOut(BaseModel):
    id_candidato: int
    id_eleccion: int
    nombre: str
    apellido: str
    propuesta: Optional[str] = None
    foto: Optional[str] = None
    id_estado_candidatura: int
    nombre_estado: str
    observaciones: Optional[str] = None


class RevisarCandidaturaRequest(BaseModel):
    id_estado_candidatura: int  # 2 = Aprobada, 3 = Rechazada
    observaciones: Optional[str] = Field(None, max_length=1000)


class CandidatoCreadoResponse(BaseModel):
    message: str
    id_candidato: int


class MensajeResponse(BaseModel):
    success: bool
    message: str