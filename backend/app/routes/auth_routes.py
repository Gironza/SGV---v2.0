from fastapi import APIRouter, Depends, HTTPException
from app.middleware.auth_middleware import obtener_usuario_actual
from app.schemas.auth_schema import (
    UsuarioLogin, UsuarioRegistro, TokenResponse, MensajeResponse,
    PerfilResponse, PerfilUpdate, CambioContrasena
)

from app.controllers.auth_controller import AuthController

router = APIRouter(prefix="/auth", tags=["Auth"])
auth_controller = AuthController()

#mensajes y estados de errores

def _lanzar_error_perfil(resultado):
    if resultado.get('no_encontrado'):
        raise HTTPException(status_code=404, detail=resultado['message'])
    if resultado.get('conflicto'):
        raise HTTPException(status_code=409, detail=resultado['message'])
    if resultado.get('error_sistema'):
        raise HTTPException(status_code=500, detail=resultado['message'])
    raise HTTPException(status_code=400, detail=resultado['message'])



#responsemodel es del schema evalua que  los datos sean necesarios y puntuales

@router.post("/login", response_model=TokenResponse)
def login(datos: UsuarioLogin):
    resultado = auth_controller.login(datos.correo, datos.password)
    #evalua si el resultado no fue existoso si el login no se efectuo en el controlador y la respuesta fue falsa
    if not resultado['success']:
        # Cuenta bloqueada por demasiados intentos: 429 + tiempo de espera
        if resultado.get('bloqueado'):
            raise HTTPException(
                status_code=429,
                detail=resultado['message'],
                headers={"Retry-After": str(resultado['segundos_restantes'])}
            )
        # Credenciales correctas pero cuenta desactivada
        if resultado.get('inactivo'):
            raise HTTPException(status_code=403, detail=resultado['message'])
        raise HTTPException(status_code=401, detail=resultado['message'])#401 credenciales malucas

    return resultado


@router.post("/registro", response_model=MensajeResponse)
def registro(datos: UsuarioRegistro):
    resultado = auth_controller.registro(
        nombres=datos.nombres,
        apellidos=datos.apellidos,
        documento=datos.documento,
        id_tipo_doc=datos.id_tipo_doc,
        correo=datos.correo,
        password=datos.password,
        codigo_institucion=datos.codigo_institucion,
        curso=datos.curso
    )

    if not resultado['success']:
        raise HTTPException(status_code=400, detail=resultado['message'])

    return resultado


#Configuracion del perfil 
# RF-007: perfil del usuario autenticado (cualquier rol)
@router.get("/me", response_model=PerfilResponse)
def ver_perfil(usuario: dict = Depends(obtener_usuario_actual)):
    resultado = auth_controller.obtener_perfil(usuario['id_usuario'])
    if not resultado['success']:
        _lanzar_error_perfil(resultado)
    return resultado['perfil']


@router.put("/me", response_model=PerfilResponse)
def editar_perfil(datos: PerfilUpdate, usuario: dict = Depends(obtener_usuario_actual)):
    resultado = auth_controller.actualizar_perfil(
        usuario['id_usuario'], datos.nombre, datos.apellido, datos.correo
    )
    if not resultado['success']:
        _lanzar_error_perfil(resultado)
    return resultado['perfil']


@router.put("/me/contrasena", response_model=MensajeResponse)
def cambiar_contrasena(datos: CambioContrasena, usuario: dict = Depends(obtener_usuario_actual)):
    resultado = auth_controller.cambiar_contrasena(
        usuario['id_usuario'], datos.contrasena_actual, datos.contrasena_nueva
    )
    if not resultado['success']:
        _lanzar_error_perfil(resultado)
    return resultado



# RF-008: el JWT es sin estado, así que el cierre real de sesión es que el frontend
# borre el token. No exige token a propósito: se puede cerrar sesión aunque el token
# ya haya expirado, sin provocar un 401.
@router.post("/logout", response_model=MensajeResponse)
def logout():
    return {'success': True, 'message': 'Sesión cerrada correctamente'}