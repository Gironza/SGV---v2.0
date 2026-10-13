from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class EleccionCreate(BaseModel):
    titulo: str = Field(..., min_length=1, max_length=150)
    descripcion: Optional[str] = None
    fecha_inicio: datetime
    fecha_fin: datetime


class EleccionUpdate(EleccionCreate):
    pass


class CambiarEstadoRequest(BaseModel):
    id_estado_eleccion: int


class EleccionOut(BaseModel):
    id_eleccion: int
    titulo: str
    descripcion: Optional[str] = None
    fecha_inicio: datetime
    fecha_fin: datetime
    id_estado_eleccion: int
    nombre_estado: str


class EleccionCreadaResponse(BaseModel):
    success: bool
    message: str
    id_eleccion: int


class MensajeResponse(BaseModel):
    success: bool
    message: str