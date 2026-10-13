from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class CodigosInvitacionOut(BaseModel):
    codigo_admin: Optional[str] = None
    codigo_docente: Optional[str] = None
    fecha_actualizacion: Optional[datetime] = None


class CodigoRenovadoResponse(BaseModel):
    success: bool
    message: str
    tipo: str
    codigo: str


class MensajeResponse(BaseModel):
    success: bool
    message: str