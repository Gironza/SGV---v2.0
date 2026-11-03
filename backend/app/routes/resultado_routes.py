from typing import Literal
from fastapi import APIRouter, Depends, Query
from fastapi.responses import Response
from app.schemas.resultado_schema import ResultadoEleccionOut, EstadisticasEleccionOut
from app.controllers.resultado_controller import ResultadoController
from app.middleware.auth_middleware import obtener_usuario_actual, requerir_rol
from app.utils.respuestas import resolver

router = APIRouter(prefix="/resultados", tags=["Resultados"])
resultado_controller = ResultadoController()

TIPOS_ARCHIVO = {'csv': 'text/csv; charset=utf-8', 'pdf': 'application/pdf'}


# RF-021, 029 y 038: la visibilidad depende del rol, la etapa y fecha_publicacion_resultados
@router.get("/{id_eleccion}", response_model=ResultadoEleccionOut)
def ver_resultados(id_eleccion: int, usuario_actual: dict = Depends(obtener_usuario_actual)):
    return resolver(resultado_controller.obtener_resultados(
        id_eleccion, usuario_actual['id_usuario'], usuario_actual['id_rol']
    ))


# RF-013: estadísticas de participación (solo administrador)
@router.get("/{id_eleccion}/estadisticas", response_model=EstadisticasEleccionOut)
def ver_estadisticas(id_eleccion: int, usuario_actual: dict = Depends(requerir_rol(1))):
    return resolver(resultado_controller.obtener_estadisticas(
        id_eleccion, usuario_actual['id_usuario']
    ))


# RF-014 y RF-024: exportar los resultados en CSV o PDF (admin y docente, elección finalizada)
@router.get("/{id_eleccion}/exportar")
def exportar_resultados(
    id_eleccion: int,
    formato: Literal['csv', 'pdf'] = Query('pdf'),
    usuario_actual: dict = Depends(requerir_rol(1, 2))
):
    resultado = resolver(resultado_controller.exportar_resultados(
        id_eleccion, usuario_actual['id_usuario'], formato
    ))
    return Response(
        content=resultado['contenido'],
        media_type=TIPOS_ARCHIVO[formato],
        headers={'Content-Disposition': f'attachment; filename="resultados_eleccion_{id_eleccion}.{formato}"'}
    )