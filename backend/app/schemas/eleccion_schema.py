from pydantic import BaseModel, Field, field_validator
from typing import Optional
from datetime import datetime


def _sin_zona(valor: datetime) -> datetime:
    # La BD guarda TIMESTAMP sin zona y el código compara con datetime.now():
    # se descarta la zona para no mezclar fechas con y sin zona horaria.
    return valor.replace(tzinfo=None) if valor.tzinfo else valor


class EleccionCreate(BaseModel):
    titulo: str = Field(..., min_length=1, max_length=150)
    descripcion: Optional[str] = None
    fecha_inicio_inscripcion: datetime
    fecha_fin_inscripcion: datetime
    fecha_inicio: datetime
    fecha_fin: datetime

    @field_validator(
        'fecha_inicio_inscripcion', 'fecha_fin_inscripcion',
        'fecha_inicio', 'fecha_fin'
    )
    @classmethod
    def quitar_zona(cls, valor):
        return _sin_zona(valor)


class EleccionUpdate(EleccionCreate):
    pass


class GraciaRequest(BaseModel):
    fecha_fin_inscripcion: datetime  # nueva fecha de cierre de postulaciones

    @field_validator('fecha_fin_inscripcion')
    @classmethod
    def quitar_zona(cls, valor):
        return _sin_zona(valor)


class CambiarEstadoRequest(BaseModel):
    id_estado_eleccion: int


class EleccionOut(BaseModel):
    id_eleccion: int
    titulo: str
    descripcion: Optional[str] = None
    fecha_inicio_inscripcion: Optional[datetime] = None
    fecha_fin_inscripcion: Optional[datetime] = None
    fecha_inicio: datetime
    fecha_fin: datetime
    etapa: str
    id_estado_eleccion: int
    nombre_estado: str


class EleccionCreadaResponse(BaseModel):
    success: bool
    message: str
    id_eleccion: int


class GraciaResponse(BaseModel):
    success: bool
    message: str
    fecha_fin_inscripcion: datetime
    etapa: str


class MensajeResponse(BaseModel):
    success: bool
    message: str