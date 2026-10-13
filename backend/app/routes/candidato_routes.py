from typing import List
from fastapi import APIRouter, HTTPException, Depends
from app.schemas.candidato_schema import (
    CandidatoCreate, CandidatoOut, CandidaturaDetalleOut,
    RevisarCandidaturaRequest, CandidatoCreadoResponse, MensajeResponse
)
from app.controllers.candidato_controller import CandidatoController
from app.middleware.auth_middleware import obtener_usuario_actual, requerir_rol

router = APIRouter(prefix="/candidatos", tags=["Candidatos"])
candidato_controller = CandidatoController()


@router.post("/", response_model=CandidatoCreadoResponse)
def inscribir_candidato(datos: CandidatoCreate, usuario_actual: dict = Depends(requerir_rol(3))):
    resultado = candidato_controller.inscribir(
        usuario_actual['id_usuario'], datos.id_eleccion, datos.propuesta, datos.foto
    )
    if not resultado['success']:
        raise HTTPException(status_code=400, detail=resultado['message'])
    return resultado


# Candidaturas aprobadas de una elección (lo que ve cualquier usuario autenticado de esa institución)
@router.get("/eleccion/{id_eleccion}", response_model=List[CandidatoOut])
def listar_candidatos(id_eleccion: int, usuario_actual: dict = Depends(obtener_usuario_actual)):
    resultado = candidato_controller.listar_por_eleccion(id_eleccion, usuario_actual['id_usuario'])
    if not resultado['success']:
        raise HTTPException(status_code=404, detail=resultado['message'])
    return resultado['candidatos']


# Todas las candidaturas con su estado (admin y docente)
@router.get("/eleccion/{id_eleccion}/gestion", response_model=List[CandidaturaDetalleOut])
def listar_candidaturas_gestion(id_eleccion: int, usuario_actual: dict = Depends(requerir_rol(1, 2))):
    resultado = candidato_controller.listar_para_gestion(id_eleccion, usuario_actual['id_usuario'])
    if not resultado['success']:
        raise HTTPException(status_code=404, detail=resultado['message'])
    return resultado['candidatos']


# La candidatura propia del estudiante en una elección
@router.get("/mia/{id_eleccion}", response_model=CandidaturaDetalleOut)
def ver_mi_candidatura(id_eleccion: int, usuario_actual: dict = Depends(requerir_rol(3))):
    resultado = candidato_controller.obtener_mi_candidatura(usuario_actual['id_usuario'], id_eleccion)
    if not resultado['success']:
        raise HTTPException(status_code=404, detail=resultado['message'])
    return resultado['candidatura']


# Aprobar o rechazar una candidatura (admin y docente)
@router.patch("/{id_candidato}/revisar", response_model=MensajeResponse)
def revisar_candidatura(
    id_candidato: int,
    datos: RevisarCandidaturaRequest,
    usuario_actual: dict = Depends(requerir_rol(1, 2))
):
    resultado = candidato_controller.revisar_candidatura(
        id_candidato,
        usuario_actual['id_usuario'],
        datos.id_estado_candidatura,
        datos.observaciones
    )
    if not resultado['success']:
        raise HTTPException(status_code=400, detail=resultado['message'])
    return resultado


# El candidato se retira (la fila no se borra, pasa a estado Retirada)
@router.delete("/{id_candidato}", response_model=MensajeResponse)
def retirar_candidatura(id_candidato: int, usuario_actual: dict = Depends(requerir_rol(3))):
    resultado = candidato_controller.retirar_candidatura(id_candidato, usuario_actual['id_usuario'])
    if not resultado['success']:
        raise HTTPException(status_code=400, detail=resultado['message'])
    return resultado