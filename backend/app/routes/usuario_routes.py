from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from fastapi.responses import JSONResponse, Response
from app.schemas.usuario_schema import (
    EstudianteCreate, UsuarioUpdate, EstadoUsuarioRequest, CursoRequest,
    UsuarioOut, UsuarioListaOut, UsuarioCreadoResponse, EstadoUsuarioResponse,
    MensajeResponse, CargaMasivaResponse
)
from app.controllers.usuario_controller import UsuarioController
from app.middleware.auth_middleware import requerir_rol
from app.utils.carga_masiva import COLUMNAS, MAX_BYTES
from app.utils.respuestas import resolver

router = APIRouter(prefix="/usuarios", tags=["Usuarios"])
usuario_controller = UsuarioController()


# Listado con filtros y paginación. Admin: todos los roles de su institución.
# Docente: solo estudiantes (RF-023).
@router.get("/", response_model=UsuarioListaOut)
def listar_usuarios(
    rol: Optional[int] = Query(None, ge=1, le=3, description="1 admin, 2 docente, 3 estudiante"),
    curso: Optional[str] = Query(None, max_length=20),
    activo: Optional[bool] = None,
    q: Optional[str] = Query(None, max_length=100, description="Busca en nombre, apellido, documento y correo"),
    pagina: int = Query(1, ge=1),
    tamano: int = Query(20, ge=1, le=100),
    usuario_actual: dict = Depends(requerir_rol(1, 2))
):
    return resolver(usuario_controller.listar_usuarios(
        usuario_actual['id_usuario'], usuario_actual['id_rol'],
        rol, curso, activo, q, pagina, tamano
    ))


# El admin crea estudiantes; docentes y admins se registran solos con su código
@router.post("/", response_model=UsuarioCreadoResponse)
def crear_estudiante(datos: EstudianteCreate, usuario_actual: dict = Depends(requerir_rol(1))):
    return resolver(usuario_controller.crear_estudiante(
        usuario_actual['id_usuario'], datos.documento, datos.id_tipo_doc,
        datos.nombre, datos.apellido, datos.correo, datos.curso
    ))


@router.get("/{id_usuario}", response_model=UsuarioOut)
def obtener_usuario(id_usuario: int, usuario_actual: dict = Depends(requerir_rol(1, 2))):
    return resolver(usuario_controller.obtener_usuario(
        id_usuario, usuario_actual['id_usuario'], usuario_actual['id_rol']
    ))['usuario']


# El admin edita docentes y estudiantes (los datos de un admin los edita él mismo en /auth/me)
@router.put("/{id_usuario}", response_model=UsuarioOut)
def actualizar_usuario(
    id_usuario: int, datos: UsuarioUpdate,
    usuario_actual: dict = Depends(requerir_rol(1))
):
    return resolver(usuario_controller.actualizar_usuario(
        id_usuario, usuario_actual['id_usuario'], usuario_actual['id_rol'],
        datos.documento, datos.id_tipo_doc, datos.nombre, datos.apellido,
        datos.correo, datos.curso
    ))['usuario']


# Activar o desactivar una cuenta. Admin: cualquier usuario menos él mismo.
# Docente: solo estudiantes.
@router.patch("/{id_usuario}/estado", response_model=EstadoUsuarioResponse)
def cambiar_estado(
    id_usuario: int, datos: EstadoUsuarioRequest,
    usuario_actual: dict = Depends(requerir_rol(1, 2))
):
    return resolver(usuario_controller.cambiar_estado(
        id_usuario, usuario_actual['id_usuario'], usuario_actual['id_rol'], datos.activo
    ))


# Cambiar el curso de un estudiante (admin y docente)
@router.patch("/{id_usuario}/curso", response_model=UsuarioOut)
def cambiar_curso(
    id_usuario: int, datos: CursoRequest,
    usuario_actual: dict = Depends(requerir_rol(1, 2))
):
    return resolver(usuario_controller.cambiar_curso(
        id_usuario, usuario_actual['id_usuario'], usuario_actual['id_rol'], datos.curso
    ))['usuario']

# Borrado real y manual (solo admin). Con historial de candidaturas o votaciones
# no se borra: se desactiva la cuenta.
@router.delete("/{id_usuario}", response_model=MensajeResponse)
def eliminar_usuario(id_usuario: int, usuario_actual: dict = Depends(requerir_rol(1))):
    return resolver(usuario_controller.eliminar_usuario(
        id_usuario, usuario_actual['id_usuario'], usuario_actual['id_rol']
    ))


# Formato del CSV: solo el encabezado, para que nadie suba datos de ejemplo por error
@router.get("/carga-masiva/plantilla")
def descargar_plantilla(usuario_actual: dict = Depends(requerir_rol(1))):
    # BOM + punto y coma: así Excel en Colombia lo abre en columnas y con tildes
    contenido = '\ufeff' + ';'.join(COLUMNAS) + '\r\n'
    return Response(
        content=contenido.encode('utf-8'),
        media_type='text/csv; charset=utf-8',
        headers={'Content-Disposition': 'attachment; filename="plantilla_estudiantes.csv"'}
    )


# RF-012: alta masiva de estudiantes por CSV (máx. 500 filas y 2 MB). Todo o nada.
@router.post("/carga-masiva", response_model=CargaMasivaResponse)
def carga_masiva(
    archivo: UploadFile = File(...),
    usuario_actual: dict = Depends(requerir_rol(1))
):
    if not (archivo.filename or '').lower().endswith('.csv'):
        raise HTTPException(status_code=400, detail='Solo se aceptan archivos .csv')

    # Se lee un byte de más para detectar si se pasó del límite sin cargar todo en memoria
    contenido = archivo.file.read(MAX_BYTES + 1)
    resultado = usuario_controller.cargar_estudiantes(usuario_actual['id_usuario'], contenido)

    # Con errores por fila: 'detail' sigue siendo texto legible (PNF-009) y se suma
    # la lista estructurada para que el frontend pueda marcarlas
    if not resultado['success'] and 'errores' in resultado:
        return JSONResponse(status_code=400, content={
            'detail': resultado['message'],
            'errores': resultado['errores'],
            'total_errores': resultado['total_errores'],
        })
    return resolver(resultado)