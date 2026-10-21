from pydantic import BaseModel, Field
from typing import Optional


class CandidatoCreate(BaseModel):
    id_eleccion: int  # la postulación es solo un clic: sin propuesta ni foto


class PropuestaUpdate(BaseModel):
    propuesta: str = Field(..., min_length=1, max_length=2000)


class ObservacionesRequest(BaseModel):
    # Un texto vacío borra la observación actual
    observaciones: str = Field(..., max_length=1000)


class RevisarCandidaturaRequest(BaseModel):
    id_estado_candidatura: int  # 2 = Aprobada, 3 = Rechazada
    observaciones: Optional[str] = Field(None, max_length=1000)


class ResolverRetiroRequest(BaseModel):
    aprobar: bool  # true -> Retirada, false -> vuelve a Aprobada


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


class CandidatoCreadoResponse(BaseModel):
    message: str
    id_candidato: int


class MensajeResponse(BaseModel):
    success: bool
    message: str

class FotoCandidatoResponse(BaseModel):
    success: bool
    message: str
    foto: Optional[str] = None  # URL relativa; null si se quitó la foto