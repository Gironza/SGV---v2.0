from typing import List
from fastapi import APIRouter, Depends
from app.schemas.voto_schema import (
    VotoCreate, EleccionDisponibleOut, EstadoVotoResponse, VotoConfirmadoResponse, HistorialVotoOut
)
from app.controllers.voto_controller import VotoController
from app.middleware.auth_middleware import requerir_rol
from app.utils.respuestas import resolver

router = APIRouter(prefix="/votacion", tags=["Votacion"])
voto_controller = VotoController()

ROL_ESTUDIANTE = 3


# RF-026: votaciones abiertas para el estudiante (etapa de votación y su curso habilitado)
@router.get("/disponibles", response_model=List[EleccionDisponibleOut])
def ver_disponibles(usuario_actual: dict = Depends(requerir_rol(ROL_ESTUDIANTE))):
    return resolver(voto_controller.listar_disponibles(usuario_actual['id_usuario']))['elecciones']


# RF-031: elecciones en las que ya participó el estudiante (sin revelar por quién votó)
@router.get("/historial", response_model=List[HistorialVotoOut])
def ver_historial(usuario_actual: dict = Depends(requerir_rol(ROL_ESTUDIANTE))):
    return resolver(voto_controller.historial(usuario_actual['id_usuario']))['historial']


@router.get("/{id_eleccion}/estado", response_model=EstadoVotoResponse)
def ver_estado_voto(id_eleccion: int, usuario_actual: dict = Depends(requerir_rol(ROL_ESTUDIANTE))):
    return resolver(voto_controller.verificar_estado_voto(
        usuario_actual['id_usuario'], id_eleccion
    ))


# RF-027: votar. id_candidato omitido o null = voto en blanco
@router.post("/votar", response_model=VotoConfirmadoResponse)
def votar(datos: VotoCreate, usuario_actual: dict = Depends(requerir_rol(ROL_ESTUDIANTE))):
    return resolver(voto_controller.registrar_voto(
        usuario_actual['id_usuario'], datos.id_eleccion, datos.id_candidato
    ))