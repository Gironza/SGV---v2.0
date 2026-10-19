import logging
import os
import smtplib
from email.message import EmailMessage

logger = logging.getLogger(__name__)

TIMEOUT_SEGUNDOS = 10


class CorreoNoDisponible(Exception):
    """No se pudo enviar el correo (SMTP sin configurar o inalcanzable)."""


def _leer_config():
    # Se lee en cada envío y no al importar el módulo, así no depende
    # del orden en que se cargue el .env
    try:
        puerto = int(os.getenv("SMTP_PORT", "587"))
    except ValueError:
        puerto = 587
    usuario = os.getenv("SMTP_USER")
    return {
        "host": os.getenv("SMTP_HOST"),
        "puerto": puerto,
        "usuario": usuario,
        "password": os.getenv("SMTP_PASSWORD"),
        "remitente": os.getenv("SMTP_FROM") or usuario,
    }


def enviar_correo(destinatario, asunto, cuerpo, responder_a=None):
    """
    Envía un correo de texto plano.
    Lanza CorreoNoDisponible si no se pudo enviar.
    `responder_a` pone el Reply-To (útil en soporte: responder al usuario).
    """
    cfg = _leer_config()
    if not (cfg["host"] and cfg["usuario"] and cfg["password"]):
        logger.error("SMTP sin configurar: revisa SMTP_HOST, SMTP_USER y SMTP_PASSWORD en el .env")
        raise CorreoNoDisponible("Servicio de correo no configurado")

    mensaje = EmailMessage()
    mensaje["From"] = cfg["remitente"]
    mensaje["To"] = destinatario
    mensaje["Subject"] = " ".join(asunto.split())  # sin saltos de línea: evita inyección de cabeceras
    if responder_a:
        mensaje["Reply-To"] = responder_a
    mensaje.set_content(cuerpo)

    # 465 = SSL directo; cualquier otro puerto (587) = STARTTLS
    usa_ssl = cfg["puerto"] == 465
    clase_smtp = smtplib.SMTP_SSL if usa_ssl else smtplib.SMTP

    try:
        with clase_smtp(cfg["host"], cfg["puerto"], timeout=TIMEOUT_SEGUNDOS) as servidor:
            if not usa_ssl:
                servidor.starttls()
            servidor.login(cfg["usuario"], cfg["password"])
            servidor.send_message(mensaje)
    except (smtplib.SMTPException, OSError) as e:
        # Solo el tipo de error: nunca se loguea la contraseña ni el cuerpo
        logger.error(f"No se pudo enviar el correo: {type(e).__name__}")
        raise CorreoNoDisponible("No se pudo enviar el correo") from e