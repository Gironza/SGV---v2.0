from typing import List
from fastapi import APIRouter, HTTPException, Depends
from app.schemas.eleccion_schema import (
    EleccionCreate, EleccionUpdate, CambiarEstadoRequest,
    EleccionOut, EleccionCreadaResponse, MensajeResponse
)
from app.controllers.eleccion_controller import EleccionController
from app.middleware.auth_middleware import obtener_usuario_actual, requerir_rol

router = APIRouter(prefix="/elecciones", tags=["Elecciones"])
eleccion_controller = EleccionController()


@router.post("/", response_model=EleccionCreadaResponse)
def crear_eleccion(datos: EleccionCreate, usuario_actual: dict = Depends(requerir_rol(1))):
    resultado = eleccion_controller.crear_eleccion(
        usuario_actual['id_usuario'], datos.titulo, datos.descripcion, datos.fecha_inicio, datos.fecha_fin
    )
    if not resultado['success']:
        raise HTTPException(status_code=400, detail=resultado['message'])
    return resultado


@router.get("/", response_model=List[EleccionOut])
def listar_elecciones(usuario_actual: dict = Depends(obtener_usuario_actual)):
    resultado = eleccion_controller.listar_elecciones(usuario_actual['id_usuario'])
    if not resultado['success']:
        raise HTTPException(status_code=400, detail=resultado['message'])
    return resultado['elecciones']


@router.get("/{id_eleccion}", response_model=EleccionOut)
def obtener_eleccion(id_eleccion: int, usuario_actual: dict = Depends(obtener_usuario_actual)):
    resultado = eleccion_controller.obtener_eleccion(id_eleccion, usuario_actual['id_usuario'])
    if not resultado['success']:
        raise HTTPException(status_code=404, detail=resultado['message'])
    return resultado['eleccion']


@router.put("/{id_eleccion}", response_model=MensajeResponse)
def actualizar_eleccion(id_eleccion: int, datos: EleccionUpdate, usuario_actual: dict = Depends(requerir_rol(1))):
    resultado = eleccion_controller.actualizar_eleccion(
        id_eleccion, usuario_actual['id_usuario'],
        datos.titulo, datos.descripcion, datos.fecha_inicio, datos.fecha_fin
    )
    if not resultado['success']:
        raise HTTPException(status_code=400, detail=resultado['message'])
    return resultado


@router.patch("/{id_eleccion}/estado", response_model=MensajeResponse)
def cambiar_estado(id_eleccion: int, datos: CambiarEstadoRequest, usuario_actual: dict = Depends(requerir_rol(1))):
    resultado = eleccion_controller.cambiar_estado(
        id_eleccion, usuario_actual['id_usuario'], datos.id_estado_eleccion
    )
    if not resultado['success']:
        raise HTTPException(status_code=400, detail=resultado['message'])
    return resultado


@router.delete("/{id_eleccion}", response_model=MensajeResponse)
def eliminar_eleccion(id_eleccion: int, usuario_actual: dict = Depends(requerir_rol(1))):
    resultado = eleccion_controller.eliminar_eleccion(id_eleccion, usuario_actual['id_usuario'])
    if not resultado['success']:
        raise HTTPException(status_code=404, detail=resultado['message'])
    return resultado