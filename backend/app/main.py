import logging
from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from app.utils.imagenes import DIRECTORIO_UPLOADS
from app.config.database import BaseDatosNoDisponible
from app.routes.auth_routes import router as auth_router
from app.routes.voto_routes import router as voto_router
from app.routes.eleccion_routes import router as eleccion_router
from app.routes.candidato_routes import router as candidato_router
from app.routes.resultado_routes import router as resultado_router
from app.routes.institucion_routes import router as institucion_router
from app.routes.info_routes import router as info_router
from app.utils.correo import CorreoNoDisponible


# --- Logging ---
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)

#app
app = FastAPI(title="SGV", version="2.0.0")


#cors
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # el origen exacto de Vite (React - Frontend)
    allow_credentials=False,  # No se necesitan cookies, porque esta el header
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- Manejo de errores ---

# PNF-004: la base de datos no responde -> mensaje controlado, sin detalles técnicos
@app.exception_handler(BaseDatosNoDisponible)
async def bd_no_disponible_handler(request: Request, exc: BaseDatosNoDisponible):
    return JSONResponse(
        status_code=503,
        content={"detail": "El servicio no está disponible en este momento, intenta más tarde"}
    )


# PNF-009: FastAPI devuelve 'detail' como lista de objetos y el frontend no sabe
# pintarla (pantalla en blanco). Aquí siempre llega como texto legible.
MENSAJES_VALIDACION = {
    "missing": "es obligatorio",
    "string_too_short": "es demasiado corto",
    "string_too_long": "excede la longitud permitida",
    "string_type": "debe ser texto",
    "int_parsing": "debe ser un número entero",
    "int_type": "debe ser un número entero",
    "datetime_parsing": "no es una fecha válida",
    "datetime_type": "no es una fecha válida",
    "value_error": "no es válido",
    "literal_error": "no tiene un valor permitido",
    "json_invalid": "el cuerpo de la solicitud no es un JSON válido",
}


@app.exception_handler(RequestValidationError)
async def validacion_handler(request: Request, exc: RequestValidationError):
    errores = []
    for error in exc.errors():
        campo = ".".join(str(p) for p in error["loc"] if p not in ("body", "query", "path"))
        motivo = MENSAJES_VALIDACION.get(error["type"], error["msg"])
        errores.append(f"{campo} {motivo}" if campo else motivo)
    return JSONResponse(
        status_code=422,
        content={"detail": "Datos inválidos: " + "; ".join(errores)}
    )

@app.exception_handler(CorreoNoDisponible)
async def correo_no_disponible_handler(request, exc):
    return JSONResponse(
        status_code=503,
        content={"detail": "El servicio de correo no está disponible, intenta más tarde"}
    )

#routers
app.include_router(auth_router)
app.include_router(voto_router)
app.include_router(eleccion_router)
app.include_router(candidato_router)
app.include_router(resultado_router)
app.include_router(institucion_router)
app.include_router(info_router)

DIRECTORIO_UPLOADS.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=DIRECTORIO_UPLOADS), name="uploads")

@app.get("/")
def api():
    return {"mensaje":" SGV API activa"}