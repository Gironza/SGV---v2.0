import io
from xml.sax.saxutils import escape

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

AZUL = colors.HexColor('#2F4F6F')

# Nombres propios y no locale.setlocale(): así no depende del idioma del servidor
MESES = ('enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio',
         'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre')


def _fecha_larga(valor):
    return f"{valor.day} de {MESES[valor.month - 1]} de {valor.year}"


def _marco(canvas, doc):
    """Doble borde y pie de página."""
    ancho, alto = A4
    canvas.saveState()
    canvas.setStrokeColor(AZUL)
    canvas.setLineWidth(2.5)
    canvas.rect(1.2 * cm, 1.2 * cm, ancho - 2.4 * cm, alto - 2.4 * cm)
    canvas.setLineWidth(0.6)
    canvas.rect(1.5 * cm, 1.5 * cm, ancho - 3 * cm, alto - 3 * cm)
    canvas.setFont('Helvetica', 8)
    canvas.setFillColor(colors.grey)
    canvas.drawCentredString(ancho / 2, 2.0 * cm, 'Generado por SGV - Sistema de Gestión de Votaciones')
    canvas.restoreState()


def generar_pdf(datos):
    """
    Certificado electoral en PDF. 'datos' trae: institucion, titulo (de la elección),
    nombre, apellido, tipo_documento, documento, fecha_voto, codigo y generado.
    Devuelve los bytes del archivo.
    """
    base = getSampleStyleSheet()['BodyText']
    centrado = ParagraphStyle('centrado', parent=base, alignment=TA_CENTER, fontSize=12, leading=18)
    institucion = ParagraphStyle('institucion', parent=centrado, fontName='Helvetica-Bold',
                                 fontSize=15, leading=20, textColor=AZUL)
    titulo = ParagraphStyle('titulo', parent=centrado, fontName='Helvetica-Bold',
                            fontSize=26, leading=32, textColor=AZUL)
    nombre = ParagraphStyle('nombre', parent=centrado, fontName='Helvetica-Bold', fontSize=18, leading=24)
    codigo = ParagraphStyle('codigo', parent=centrado, fontName='Courier-Bold', fontSize=18, leading=24)
    nota = ParagraphStyle('nota', parent=centrado, fontName='Helvetica-Oblique', fontSize=9,
                          leading=12, textColor=colors.grey)

    fecha = datos['fecha_voto']
    nombre_completo = f"{datos['nombre']} {datos['apellido']}".upper()

    caja_codigo = Table(
        [[Paragraph('Código del certificado', centrado)], [Paragraph(escape(datos['codigo']), codigo)]],
        colWidths=[9 * cm]
    )
    caja_codigo.setStyle(TableStyle([
        ('BOX', (0, 0), (-1, -1), 1, AZUL),
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#F3F5F7')),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ]))

    elementos = [
        Spacer(1, 1.5 * cm),
        Paragraph(escape(datos['institucion']), institucion),
        Spacer(1, 1.2 * cm),
        Paragraph('CERTIFICADO ELECTORAL', titulo),
        Spacer(1, 1.5 * cm),
        Paragraph('Se certifica que', centrado),
        Spacer(1, 0.5 * cm),
        Paragraph(escape(nombre_completo), nombre),
        Paragraph(f"identificado(a) con {escape(datos['tipo_documento'])} No. {escape(datos['documento'])}", centrado),
        Spacer(1, 0.8 * cm),
        Paragraph(
            f"ejerció su derecho al voto en la elección «{escape(datos['titulo'])}» "
            f"el {_fecha_larga(fecha)} a las {fecha.strftime('%H:%M')}.",
            centrado
        ),
        Spacer(1, 1.5 * cm),
        caja_codigo,
        Spacer(1, 1.2 * cm),
        Paragraph('Este certificado acredita la participación en la votación. '
                  'Por ser el voto secreto, no indica por quién se votó.', nota),
        Spacer(1, 0.6 * cm),
        Paragraph(f"Expedido el {_fecha_larga(datos['generado'])}", nota),
    ]

    buffer = io.BytesIO()
    documento = SimpleDocTemplate(
        buffer, pagesize=A4, leftMargin=3 * cm, rightMargin=3 * cm,
        topMargin=2.5 * cm, bottomMargin=2.5 * cm,
        title=f"Certificado electoral - {datos['titulo']}", author='SGV'
    )
    documento.build(elementos, onFirstPage=_marco)
    return buffer.getvalue()