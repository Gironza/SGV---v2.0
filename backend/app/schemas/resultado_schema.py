from pydantic import BaseModel, Field
from typing import Optional, List


class CandidatoResultadoOut(BaseModel):
    id_candidato: int
    nombre: str
    apellido: str
    propuesta: Optional[str] = None
    foto: Optional[str] = None
    total_votos: int
    porcentaje: float  # sobre el total de votos (blancos incluidos)


class ParticipacionOut(BaseModel):
    habilitados: int
    votaron: int
    porcentaje: float


class ParticipacionCursoOut(ParticipacionOut):
    curso: str


class ResultadoEleccionOut(BaseModel):
    titulo_eleccion: str
    etapa: str
    candidatos: List[CandidatoResultadoOut]
    votos_blancos: int
    total_votos: int
    participacion: ParticipacionOut
    # Solo con la elección finalizada. En empate ganador es null y se listan los empatados.
    ganador: Optional[str] = None
    empatados: List[str] = Field(default_factory=list)


class EstadisticasEleccionOut(BaseModel):
    titulo_eleccion: str
    etapa: str
    participacion: ParticipacionOut
    por_curso: List[ParticipacionCursoOut]
    total_votos: int
    votos_validos: int
    votos_blancos: int
    porcentaje_blancos: float