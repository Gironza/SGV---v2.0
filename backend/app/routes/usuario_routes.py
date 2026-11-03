from typing import Optional
from fastapi import APIRouter, Depends, Query
from app.schemas.usuario_schema import UsuarioOut, UsuarioListaOut
from app.controllers.usuario_controller import UsuarioController
from app.middleware.auth_middleware import requerir_rol
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


@router.get("/{id_usuario}", response_model=UsuarioOut)
def obtener_usuario(id_usuario: int, usuario_actual: dict = Depends(requerir_rol(1, 2))):
    return resolver(usuario_controller.obtener_usuario(
        id_usuario, usuario_actual['id_usuario'], usuario_actual['id_rol']
    ))['usuario']