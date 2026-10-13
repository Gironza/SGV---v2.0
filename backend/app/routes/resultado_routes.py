from fastapi import APIRouter, HTTPException, Depends
from app.schemas.resultado_schema import ResultadoEleccionOut
from app.controllers.resultado_controller import ResultadoController
from app.middleware.auth_middleware import obtener_usuario_actual

router = APIRouter(prefix="/resultados", tags=["Resultados"])
resultado_controller = ResultadoController()


@router.get("/{id_eleccion}", response_model=ResultadoEleccionOut)
def ver_resultados(id_eleccion: int, usuario_actual: dict = Depends(obtener_usuario_actual)):
    resultado = resultado_controller.obtener_resultados(id_eleccion, usuario_actual['id_usuario'])
    if not resultado['success']:
        raise HTTPException(status_code=404, detail=resultado['message'])
    return resultado