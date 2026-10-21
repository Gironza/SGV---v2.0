import io
import logging
import os
import re
import secrets
from pathlib import Path
from PIL import Image, ImageOps, UnidentifiedImageError

logger = logging.getLogger(__name__)

# backend/uploads/candidatos (utils -> app -> backend)
DIRECTORIO_UPLOADS = Path(__file__).resolve().parent.parent.parent / "uploads"
DIRECTORIO_FOTOS = DIRECTORIO_UPLOADS / "candidatos"
PREFIJO_URL_FOTOS = "/uploads/candidatos"

MAX_BYTES_FOTO = 2 * 1024 * 1024   # 2 MB
LADO_MAX = 512                     # px
FORMATOS_PERMITIDOS = {"JPEG", "PNG", "WEBP"}
_NOMBRE_VALIDO = re.compile(r"^[A-Za-z0-9_-]+\.jpg$")

Image.MAX_IMAGE_PIXELS = 25_000_000  # corta imágenes gigantes (bombas de descompresión)


class FotoInvalida(Exception):
    """El archivo no es una imagen válida o no es de un formato permitido."""


def procesar_foto(contenido: bytes) -> bytes:
    """
    Valida que sea una imagen de verdad (no se confía en la extensión ni en el
    content-type), la endereza según EXIF, la reduce y la recodifica como JPEG.
    Recodificar elimina metadatos (GPS, etc.) y cualquier carga escondida.
    """
    try:
        with Image.open(io.BytesIO(contenido)) as original:
            if original.format not in FORMATOS_PERMITIDOS:
                raise FotoInvalida("Formato no permitido")
            img = ImageOps.exif_transpose(original)

            # PNG/WEBP con transparencia: fondo blanco en vez de negro
            if img.mode in ("RGBA", "LA") or (img.mode == "P" and "transparency" in img.info):
                img = img.convert("RGBA")
                fondo = Image.new("RGB", img.size, (255, 255, 255))
                fondo.paste(img, mask=img.getchannel("A"))
                img = fondo
            else:
                img = img.convert("RGB")

            img.thumbnail((LADO_MAX, LADO_MAX))
            salida = io.BytesIO()
            img.save(salida, "JPEG", quality=85, optimize=True)
            return salida.getvalue()
    except FotoInvalida:
        raise
    except (UnidentifiedImageError, Image.DecompressionBombError, OSError, ValueError) as e:
        raise FotoInvalida("Imagen inválida") from e


def guardar_foto(contenido_jpeg: bytes) -> str:
    """Guarda el archivo con nombre aleatorio y devuelve el nombre."""
    DIRECTORIO_FOTOS.mkdir(parents=True, exist_ok=True)
    nombre = f"{secrets.token_urlsafe(16)}.jpg"
    destino = DIRECTORIO_FOTOS / nombre
    temporal = destino.with_suffix(".tmp")
    temporal.write_bytes(contenido_jpeg)
    os.replace(temporal, destino)  # reemplazo atómico: nunca queda una foto a medias
    return nombre


def eliminar_archivo_foto(url: str | None) -> bool:
    """
    Borra el archivo al que apunta una URL guardada en la BD. Solo actúa sobre
    URLs de este mismo sistema con un nombre válido: cualquier otro valor
    (viejo, externo o raro) se ignora, así nunca se borra algo fuera de la carpeta.
    """
    if not url or not url.startswith(PREFIJO_URL_FOTOS + "/"):
        return False
    nombre = url[len(PREFIJO_URL_FOTOS) + 1:]
    if not _NOMBRE_VALIDO.match(nombre):
        return False
    ruta = DIRECTORIO_FOTOS / nombre
    try:
        if ruta.is_file():
            ruta.unlink()
            return True
    except OSError as e:
        logger.warning(f"No se pudo borrar la foto {nombre}: {type(e).__name__}")
    return False