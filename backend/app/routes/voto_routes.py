from typing import List
from fastapi import APIRouter, HTTPException, Depends
from app.schemas.voto_schema import (
    VotoCreate, CandidatoVotacionOut, EstadoVotoResponse, VotoConfirmadoResponse
)
from app.controllers.voto_controller import VotoController
from app.middleware.auth_middleware import obtener_usuario_actual, requerir_rol

router = APIRouter(prefix="/votacion", tags=["Votacion"])
voto_controller = VotoController()


@router.get("/{id_eleccion}/candidatos", response_model=List[CandidatoVotacionOut])
def ver_candidatos(id_eleccion: int, usuario_actual: dict = Depends(obtener_usuario_actual)):
    resultado = voto_controller.listar_candidatos(id_eleccion, usuario_actual['id_usuario'])
    if not resultado['success']:
        raise HTTPException(status_code=404, detail=resultado['message'])
    return resultado['candidatos']


@router.get("/{id_eleccion}/estado", response_model=EstadoVotoResponse)
def ver_estado_voto(id_eleccion: int, usuario_actual: dict = Depends(obtener_usuario_actual)):
    resultado = voto_controller.verificar_estado_voto(usuario_actual['id_usuario'], id_eleccion)
    if not resultado['success']:
        status_code = 404 if resultado['message'] == 'Elección no encontrada' else 500
        raise HTTPException(status_code=status_code, detail=resultado['message'])
    return resultado


@router.post("/votar", response_model=VotoConfirmadoResponse)
def votar(datos: VotoCreate, usuario_actual: dict = Depends(requerir_rol(3))):  # 3 = Estudiante
    resultado = voto_controller.registrar_voto(
        usuario_actual['id_usuario'],
        datos.id_eleccion,
        datos.id_candidato
    )
    if not resultado['success']:
        status_code = 409 if 'ya emitiste' in resultado['message'].lower() else 400
        raise HTTPException(status_code=status_code, detail=resultado['message'])
    return resultado