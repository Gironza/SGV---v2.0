from typing import Optional
from fastapi import APIRouter, Depends, Query
from app.schemas.usuario_schema import (
    EstudianteCreate, UsuarioUpdate, EstadoUsuarioRequest, CursoRequest,
    UsuarioOut, UsuarioListaOut, UsuarioCreadoResponse, EstadoUsuarioResponse
)
from app.controllers.usuario_controller import UsuarioController
from app.middleware.auth_middleware import requerir_rol
from app.utils.respuestas import resolver
from app.schemas.usuario_schema import (
    EstudianteCreate, UsuarioUpdate, EstadoUsuarioRequest, CursoRequest,
    UsuarioOut, UsuarioListaOut, UsuarioCreadoResponse, EstadoUsuarioResponse,
    MensajeResponse
)


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