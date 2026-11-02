from pydantic import BaseModel, Field, field_validator
from typing import Optional, List
from datetime import datetime


def _sin_zona(valor):
    # La BD guarda TIMESTAMP sin zona y el código compara con datetime.now():
    # se descarta la zona para no mezclar fechas con y sin zona horaria.
    if valor is None:
        return None
    return valor.replace(tzinfo=None) if valor.tzinfo else valor


class EleccionCreate(BaseModel):
    titulo: str = Field(..., min_length=1, max_length=150)
    descripcion: Optional[str] = None
    fecha_inicio_inscripcion: datetime
    fecha_fin_inscripcion: datetime
    fecha_inicio: datetime
    fecha_fin: datetime
    # Cursos que pueden postularse / votar. Lista vacía u omitida = todos los cursos.
    # En PUT, omitir el campo conserva la lista actual; [] la limpia.
    cursos_postulacion: Optional[List[str]] = None
    cursos_votacion: Optional[List[str]] = None

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
    id_estado_eleccion: int           # 1 Activa, 2 Finalizada, 3 Pendiente (pausa)
    fecha_fin: Optional[datetime] = None  # solo al activar: reabrir o reanudar con la fecha vencida

    @field_validator('fecha_fin')
    @classmethod
    def quitar_zona(cls, valor):
        return _sin_zona(valor)


class PublicacionRequest(BaseModel):
    # Obligatorio enviarlo: una fecha programa la publicación, null la desactiva
    fecha_publicacion_resultados: Optional[datetime]

    @field_validator('fecha_publicacion_resultados')
    @classmethod
    def quitar_zona(cls, valor):
        return _sin_zona(valor)


class EleccionOut(BaseModel):
    id_eleccion: int
    titulo: str
    descripcion: Optional[str] = None
    fecha_inicio_inscripcion: Optional[datetime] = None
    fecha_fin_inscripcion: Optional[datetime] = None
    fecha_inicio: datetime
    fecha_fin: datetime
    fecha_publicacion_resultados: Optional[datetime] = None
    etapa: str
    id_estado_eleccion: int
    nombre_estado: str
    cursos_postulacion: List[str] = Field(default_factory=list)
    cursos_votacion: List[str] = Field(default_factory=list)


class EleccionCreadaResponse(BaseModel):
    success: bool
    message: str
    id_eleccion: int


class GraciaResponse(BaseModel):
    success: bool
    message: str
    fecha_fin_inscripcion: datetime
    etapa: str


class CambioEstadoResponse(BaseModel):
    success: bool
    message: str
    etapa: str


class MensajeResponse(BaseModel):
    success: bool
    message: str