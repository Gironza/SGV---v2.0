from typing import Literal
from fastapi import APIRouter, HTTPException, Depends
from app.schemas.institucion_schema import (
    CodigosInvitacionOut, CodigoRenovadoResponse, MensajeResponse
)
from app.controllers.institucion_controller import InstitucionController
from app.middleware.auth_middleware import requerir_rol

router = APIRouter(prefix="/codigos-invitacion", tags=["Codigos de invitacion"])
institucion_controller = InstitucionController()


# Códigos vigentes de la institución del admin
@router.get("/", response_model=CodigosInvitacionOut)
def ver_codigos(usuario_actual: dict = Depends(requerir_rol(1))):
    resultado = institucion_controller.obtener_codigos(usuario_actual['id_usuario'])
    if not resultado['success']:
        raise HTTPException(status_code=400, detail=resultado['message'])
    return resultado['codigos']


# Genera un código nuevo ('admin' o 'docente'); el anterior deja de funcionar
@router.post("/{tipo}/renovar", response_model=CodigoRenovadoResponse)
def renovar_codigo(tipo: Literal['admin', 'docente'], usuario_actual: dict = Depends(requerir_rol(1))):
    resultado = institucion_controller.renovar_codigo(usuario_actual['id_usuario'], tipo)
    if not resultado['success']:
        raise HTTPException(status_code=400, detail=resultado['message'])
    return resultado


# Desactiva un código: queda en NULL y nadie puede registrarse con ese rol
@router.delete("/{tipo}", response_model=MensajeResponse)
def desactivar_codigo(tipo: Literal['admin', 'docente'], usuario_actual: dict = Depends(requerir_rol(1))):
    resultado = institucion_controller.desactivar_codigo(usuario_actual['id_usuario'], tipo)
    if not resultado['success']:
        raise HTTPException(status_code=400, detail=resultado['message'])
    return resultado