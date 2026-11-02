from typing import List
from fastapi import APIRouter, Depends
from app.schemas.eleccion_schema import (
    EleccionCreate, EleccionUpdate, CambiarEstadoRequest, GraciaRequest,
    PublicacionRequest, EleccionOut, EleccionCreadaResponse, GraciaResponse,
    CambioEstadoResponse, MensajeResponse
)
from app.controllers.eleccion_controller import EleccionController
from app.middleware.auth_middleware import obtener_usuario_actual, requerir_rol
from app.utils.respuestas import resolver

router = APIRouter(prefix="/elecciones", tags=["Elecciones"])
eleccion_controller = EleccionController()


@router.post("/", response_model=EleccionCreadaResponse)
def crear_eleccion(datos: EleccionCreate, usuario_actual: dict = Depends(requerir_rol(1))):
    return resolver(eleccion_controller.crear_eleccion(
        usuario_actual['id_usuario'], datos.titulo, datos.descripcion,
        datos.fecha_inicio_inscripcion, datos.fecha_fin_inscripcion,
        datos.fecha_inicio, datos.fecha_fin,
        datos.cursos_postulacion, datos.cursos_votacion
    ))


@router.get("/", response_model=List[EleccionOut])
def listar_elecciones(usuario_actual: dict = Depends(obtener_usuario_actual)):
    return resolver(eleccion_controller.listar_elecciones(usuario_actual['id_usuario']))['elecciones']


# Cursos reales de la institución, para armar las listas de postulación y votación.
# Va antes de /{id_eleccion} para que "cursos" no se interprete como un id.
@router.get("/cursos", response_model=List[str])
def listar_cursos(usuario_actual: dict = Depends(requerir_rol(1))):
    return resolver(eleccion_controller.listar_cursos(usuario_actual['id_usuario']))['cursos']


@router.get("/{id_eleccion}", response_model=EleccionOut)
def obtener_eleccion(id_eleccion: int, usuario_actual: dict = Depends(obtener_usuario_actual)):
    return resolver(eleccion_controller.obtener_eleccion(
        id_eleccion, usuario_actual['id_usuario']
    ))['eleccion']


@router.put("/{id_eleccion}", response_model=MensajeResponse)
def actualizar_eleccion(id_eleccion: int, datos: EleccionUpdate, usuario_actual: dict = Depends(requerir_rol(1))):
    return resolver(eleccion_controller.actualizar_eleccion(
        id_eleccion, usuario_actual['id_usuario'],
        datos.titulo, datos.descripcion,
        datos.fecha_inicio_inscripcion, datos.fecha_fin_inscripcion,
        datos.fecha_inicio, datos.fecha_fin,
        datos.cursos_postulacion, datos.cursos_votacion
    ))


@router.patch("/{id_eleccion}/gracia", response_model=GraciaResponse)
def ampliar_postulacion(id_eleccion: int, datos: GraciaRequest, usuario_actual: dict = Depends(requerir_rol(1))):
    return resolver(eleccion_controller.ampliar_postulacion(
        id_eleccion, usuario_actual['id_usuario'], datos.fecha_fin_inscripcion
    ))


# Control manual: 1 Activa, 2 Finalizada, 3 Pendiente (pausa)
@router.patch("/{id_eleccion}/estado", response_model=CambioEstadoResponse)
def cambiar_estado(id_eleccion: int, datos: CambiarEstadoRequest, usuario_actual: dict = Depends(requerir_rol(1))):
    return resolver(eleccion_controller.cambiar_estado(
        id_eleccion, usuario_actual['id_usuario'], datos.id_estado_eleccion, datos.fecha_fin
    ))


# Programa o desactiva la publicación de resultados para estudiantes y candidatos
@router.patch("/{id_eleccion}/publicacion", response_model=MensajeResponse)
def actualizar_publicacion(id_eleccion: int, datos: PublicacionRequest, usuario_actual: dict = Depends(requerir_rol(1))):
    return resolver(eleccion_controller.actualizar_publicacion(
        id_eleccion, usuario_actual['id_usuario'], datos.fecha_publicacion_resultados
    ))


@router.delete("/{id_eleccion}", response_model=MensajeResponse)
def eliminar_eleccion(id_eleccion: int, usuario_actual: dict = Depends(requerir_rol(1))):
    return resolver(eleccion_controller.eliminar_eleccion(
        id_eleccion, usuario_actual['id_usuario']
    ))