from typing import List
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File
from app.schemas.candidato_schema import (
    CandidatoCreate, PropuestaUpdate, ObservacionesRequest,
    RevisarCandidaturaRequest, ResolverRetiroRequest,
    CandidatoOut, CandidaturaDetalleOut, CandidatoCreadoResponse, 
    MensajeResponse, FotoCandidatoResponse
)
from app.controllers.candidato_controller import CandidatoController
from app.middleware.auth_middleware import obtener_usuario_actual, requerir_rol
from app.utils.imagenes import MAX_BYTES_FOTO

router = APIRouter(prefix="/candidatos", tags=["Candidatos"])
candidato_controller = CandidatoController()


def _resolver(resultado):
    """Si el controlador falló lo traduce a HTTPException; si no, devuelve el resultado."""
    if resultado['success']:
        return resultado
    if resultado.get('no_encontrado'):
        codigo = 404
    elif resultado.get('prohibido'):
        codigo = 403
    elif resultado.get('conflicto'):
        codigo = 409
    elif resultado.get('demasiado_grande'):
        codigo = 413
    elif resultado.get('error_sistema'):
        codigo = 500
    else:
        codigo = 400
    raise HTTPException(status_code=codigo, detail=resultado['message'])

# El estudiante se postula con un clic (queda Pendiente), solo en etapa de postulación
@router.post("/", response_model=CandidatoCreadoResponse)
def inscribir_candidato(datos: CandidatoCreate, usuario_actual: dict = Depends(requerir_rol(3))):
    return _resolver(candidato_controller.inscribir(
        usuario_actual['id_usuario'], datos.id_eleccion
    ))


# Tarjetón de una elección: aprobadas y con retiro solicitado.
# Los estudiantes lo ven desde que cierra la postulación; admin y docente siempre.
@router.get("/eleccion/{id_eleccion}", response_model=List[CandidatoOut])
def listar_candidatos(id_eleccion: int, usuario_actual: dict = Depends(obtener_usuario_actual)):
    resultado = _resolver(candidato_controller.listar_por_eleccion(
        id_eleccion, usuario_actual['id_usuario'], usuario_actual['id_rol']
    ))
    return resultado['candidatos']


# Todas las candidaturas con su estado (admin y docente)
@router.get("/eleccion/{id_eleccion}/gestion", response_model=List[CandidaturaDetalleOut])
def listar_candidaturas_gestion(id_eleccion: int, usuario_actual: dict = Depends(requerir_rol(1, 2))):
    resultado = _resolver(candidato_controller.listar_para_gestion(
        id_eleccion, usuario_actual['id_usuario']
    ))
    return resultado['candidatos']


# La candidatura propia del estudiante en una elección
@router.get("/mia/{id_eleccion}", response_model=CandidaturaDetalleOut)
def ver_mi_candidatura(id_eleccion: int, usuario_actual: dict = Depends(requerir_rol(3))):
    resultado = _resolver(candidato_controller.obtener_mi_candidatura(
        usuario_actual['id_usuario'], id_eleccion
    ))
    return resultado['candidatura']


# El candidato edita su propuesta (candidatura aprobada y etapa de postulación)
@router.put("/{id_candidato}", response_model=MensajeResponse)
def editar_propuesta(
    id_candidato: int,
    datos: PropuestaUpdate,
    usuario_actual: dict = Depends(requerir_rol(3))
):
    return _resolver(candidato_controller.editar_propuesta(
        id_candidato, usuario_actual['id_usuario'], datos.propuesta
    ))

# El candidato sube o reemplaza su foto (aprobada y etapa de postulación)
@router.put("/{id_candidato}/foto", response_model=FotoCandidatoResponse)
def subir_foto(
    id_candidato: int,
    archivo: UploadFile = File(...),
    usuario_actual: dict = Depends(requerir_rol(3))
):
    # Se lee un byte de más para detectar si se pasó del límite sin cargar todo en memoria
    contenido = archivo.file.read(MAX_BYTES_FOTO + 1)
    return _resolver(candidato_controller.subir_foto(
        id_candidato, usuario_actual['id_usuario'], contenido
    ))


# El candidato quita su foto
@router.delete("/{id_candidato}/foto", response_model=FotoCandidatoResponse)
def quitar_foto(id_candidato: int, usuario_actual: dict = Depends(requerir_rol(3))):
    return _resolver(candidato_controller.quitar_foto(
        id_candidato, usuario_actual['id_usuario']
    ))

# Aprobar o rechazar una candidatura (admin y docente), hasta antes del inicio
@router.patch("/{id_candidato}/revisar", response_model=MensajeResponse)
def revisar_candidatura(
    id_candidato: int,
    datos: RevisarCandidaturaRequest,
    usuario_actual: dict = Depends(requerir_rol(1, 2))
):
    return _resolver(candidato_controller.revisar_candidatura(
        id_candidato,
        usuario_actual['id_usuario'],
        datos.id_estado_candidatura,
        datos.observaciones
    ))


# Comentario informativo sin cambiar el estado (admin y docente); vacío lo borra
@router.patch("/{id_candidato}/observaciones", response_model=MensajeResponse)
def actualizar_observaciones(
    id_candidato: int,
    datos: ObservacionesRequest,
    usuario_actual: dict = Depends(requerir_rol(1, 2))
):
    return _resolver(candidato_controller.actualizar_observaciones(
        id_candidato, usuario_actual['id_usuario'], datos.observaciones
    ))


# El candidato solicita retirarse (pasa a "Retiro solicitado", sigue en el tarjetón)
@router.post("/{id_candidato}/retiro", response_model=MensajeResponse)
def solicitar_retiro(id_candidato: int, usuario_actual: dict = Depends(requerir_rol(3))):
    return _resolver(candidato_controller.solicitar_retiro(
        id_candidato, usuario_actual['id_usuario']
    ))


# Admin o docente resuelve el retiro: aprobar -> Retirada, negar -> vuelve a Aprobada
@router.patch("/{id_candidato}/retiro", response_model=MensajeResponse)
def resolver_retiro(
    id_candidato: int,
    datos: ResolverRetiroRequest,
    usuario_actual: dict = Depends(requerir_rol(1, 2))
):
    return _resolver(candidato_controller.resolver_retiro(
        id_candidato, usuario_actual['id_usuario'], datos.aprobar
    ))