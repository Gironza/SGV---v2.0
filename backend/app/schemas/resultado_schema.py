from pydantic import BaseModel
from typing import Optional, List


class CandidatoResultadoOut(BaseModel):
    id_candidato: int
    nombre: str
    apellido: str
    propuesta: Optional[str] = None
    foto: Optional[str] = None
    total_votos: int


class ResultadoEleccionOut(BaseModel):
    titulo_eleccion: str
    nombre_estado: str
    candidatos: List[CandidatoResultadoOut]
    votos_blancos: int
    total_votos: int
    ganador: Optional[str] = None