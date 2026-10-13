from fastapi import APIRouter
from app.schemas.info_schema import InfoSistemaOut

router = APIRouter(prefix="/info", tags=["Informacion"])

# RF-001: ruta pública (sin token). Solo texto fijo: no consulta la base de datos
# ni expone datos de ninguna institución. Ajusta el texto a lo que esté terminado.
INFO_SISTEMA = {
    "nombre": "SGV - Sistema de Gestión de Votaciones",
    "proposito": (
        "Plataforma web para organizar y realizar las votaciones del gobierno escolar "
        "de una institución educativa, como la elección de personero, contralor y "
        "representantes, de forma segura, transparente y con voto secreto."
    ),
    "funcionalidades": [
        "Creación y gestión de elecciones por parte de los administradores",
        "Inscripción de candidaturas con sus propuestas y revisión por administradores y docentes",
        "Votación en línea con voto secreto y voto en blanco",
        "Consulta de resultados cuando la institución los publica",
        "Certificado de participación para quienes votaron",
    ],
    "roles": [
        {
            "nombre": "Administrador",
            "descripcion": "Gestiona las elecciones, los usuarios, los códigos de invitación y revisa las candidaturas de su institución.",
        },
        {
            "nombre": "Docente",
            "descripcion": "Apoya la gestión de las votaciones: revisa candidaturas, consulta resultados y administra a los estudiantes votantes.",
        },
        {
            "nombre": "Estudiante",
            "descripcion": "Consulta las votaciones disponibles, conoce a los candidatos y emite su voto. También puede inscribirse como candidato.",
        },
    ],
    "proceso_votacion": [
        "El administrador crea la elección y define sus fechas.",
        "Los estudiantes interesados se inscriben como candidatos y su candidatura es revisada.",
        "Mientras la elección está activa, cada estudiante vota una sola vez, por un candidato o en blanco.",
        "Al finalizar, la institución publica los resultados.",
    ],
}


@router.get("/", response_model=InfoSistemaOut)
def informacion_general():
    return INFO_SISTEMA