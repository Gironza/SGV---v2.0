import csv
import io
from xml.sax.saxutils import escape

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

# Una celda de texto que empieza así, Excel la ejecuta como fórmula
_PELIGROSOS = ('=', '+', '-', '@', '\t', '\r')


def _pct(parte, total):
    return round(parte * 100 / total, 1) if total else 0.0


def _decimal(valor):
    # Coma decimal: con punto, Excel en español puede leer "12.5" como una fecha
    return f"{valor:.1f}".replace('.', ',')


def _fecha(valor):
    return valor.strftime('%d/%m/%Y %H:%M') if valor else '-'


def _nombre(candidato):
    return f"{candidato['nombre']} {candidato['apellido']}"


def _celda(valor):
    """Texto que escribió un usuario (nombres, curso, título): se neutraliza si parece una fórmula."""
    texto = str(valor)
    return "'" + texto if texto.startswith(_PELIGROSOS) else texto


def _veredicto(datos):
    if datos['ganador']:
        return 'Ganador', datos['ganador']
    if datos['empatados']:
        return 'Empate entre', ' / '.join(datos['empatados'])
    return 'Ganador', 'Sin ganador (ningún candidato recibió votos)'


# ---------- CSV ----------

def generar_csv(datos):
    """
    CSV por secciones, pensado para abrirse en Excel: punto y coma, BOM (tildes) y
    coma decimal. Devuelve los bytes del archivo.
    """
    salida = io.StringIO()
    w = csv.writer(salida, delimiter=';', lineterminator='\r\n')
    total = datos['total_votos']

    w.writerow(['Resultados de la elección'])
    w.writerow(['Elección', _celda(datos['titulo_eleccion'])])
    w.writerow(['Institución', _celda(datos['institucion'])])
    w.writerow(['Inicio de la votación', _fecha(datos['fecha_inicio'])])
    w.writerow(['Fin de la votación', _fecha(datos['fecha_fin'])])
    w.writerow(['Generado', _fecha(datos['generado'])])
    w.writerow([])

    w.writerow(['Candidato', 'Votos', 'Porcentaje (%)'])
    for c in datos['candidatos']:
        w.writerow([_celda(_nombre(c)), c['total_votos'], _decimal(c['porcentaje'])])
    w.writerow(['Voto en blanco', datos['votos_blancos'], _decimal(_pct(datos['votos_blancos'], total))])
    w.writerow(['Total de votos', total, _decimal(100.0 if total else 0.0)])
    w.writerow([])

    etiqueta, valor = _veredicto(datos)
    w.writerow([etiqueta, _celda(valor)])
    w.writerow([])

    w.writerow(['Participación por curso'])
    w.writerow(['Curso', 'Habilitados', 'Votaron', 'Participación (%)'])
    for c in datos['por_curso']:
        w.writerow([_celda(c['curso']), c['habilitados'], c['votaron'], _decimal(c['porcentaje'])])
    p = datos['participacion']
    w.writerow(['Total', p['habilitados'], p['votaron'], _decimal(p['porcentaje'])])

    return ('\ufeff' + salida.getvalue()).encode('utf-8')


# ---------- PDF ----------

def _tabla(filas, anchos, columnas_derecha=()):
    """Tabla con encabezado oscuro, filas alternadas y la última fila (totales) en negrita."""
    tabla = Table(filas, colWidths=anchos, repeatRows=1)
    estilo = [
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2F4F6F')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('GRID', (0, 0), (-1, -1), 0.4, colors.HexColor('#B0B0B0')),
        ('ROWBACKGROUNDS', (0, 1), (-1, -2), [colors.white, colors.HexColor('#F3F5F7')]),
        ('BACKGROUND', (0, -1), (-1, -1), colors.HexColor('#E3E8ED')),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]
    for columna in columnas_derecha:
        estilo.append(('ALIGN', (columna, 0), (columna, -1), 'RIGHT'))
    tabla.setStyle(TableStyle(estilo))
    return tabla


def _pie(canvas, doc):
    canvas.saveState()
    canvas.setFont('Helvetica', 8)
    canvas.setFillColor(colors.grey)
    canvas.drawString(2 * cm, 1.2 * cm, 'Generado por SGV - Sistema de Gestión de Votaciones')
    canvas.drawRightString(A4[0] - 2 * cm, 1.2 * cm, f'Página {doc.page}')
    canvas.restoreState()


def generar_pdf(datos):
    """PDF de una página (o más si hay muchos cursos) con los resultados. Devuelve los bytes."""
    estilos = getSampleStyleSheet()
    normal = estilos['BodyText']
    celda = ParagraphStyle('celda', parent=normal, fontSize=9, leading=11)
    total = datos['total_votos']

    elementos = [
        Paragraph('Resultados de la elección', estilos['Title']),
        Paragraph(escape(datos['titulo_eleccion']), estilos['Heading2']),
        Paragraph(f"<b>Institución:</b> {escape(datos['institucion'])}", normal),
        Paragraph(f"<b>Votación:</b> {_fecha(datos['fecha_inicio'])} a {_fecha(datos['fecha_fin'])}", normal),
        Paragraph(f"<b>Generado:</b> {_fecha(datos['generado'])}", normal),
        Spacer(1, 0.6 * cm),
        Paragraph('Votos por candidato', estilos['Heading3']),
    ]

    if not datos['candidatos']:
        elementos.append(Paragraph('No hay candidaturas en el tarjetón.', normal))
    filas = [['Candidato', 'Votos', 'Porcentaje (%)']]
    for c in datos['candidatos']:
        filas.append([Paragraph(escape(_nombre(c)), celda), c['total_votos'], _decimal(c['porcentaje'])])
    filas.append(['Voto en blanco', datos['votos_blancos'], _decimal(_pct(datos['votos_blancos'], total))])
    filas.append(['Total de votos', total, _decimal(100.0 if total else 0.0)])
    elementos.append(_tabla(filas, [9 * cm, 3.5 * cm, 4.5 * cm], columnas_derecha=(1, 2)))

    etiqueta, valor = _veredicto(datos)
    elementos += [
        Spacer(1, 0.5 * cm),
        Paragraph(f"<b>{etiqueta}:</b> {escape(valor)}", normal),
        Spacer(1, 0.6 * cm),
        Paragraph('Participación por curso', estilos['Heading3']),
    ]

    if not datos['por_curso']:
        elementos.append(Paragraph('No hay estudiantes habilitados para votar.', normal))
    filas = [['Curso', 'Habilitados', 'Votaron', 'Participación (%)']]
    for c in datos['por_curso']:
        filas.append([Paragraph(escape(c['curso']), celda), c['habilitados'], c['votaron'], _decimal(c['porcentaje'])])
    p = datos['participacion']
    filas.append(['Total', p['habilitados'], p['votaron'], _decimal(p['porcentaje'])])
    elementos.append(_tabla(filas, [6 * cm, 3.7 * cm, 3.7 * cm, 3.6 * cm], columnas_derecha=(1, 2, 3)))

    buffer = io.BytesIO()
    documento = SimpleDocTemplate(
        buffer, pagesize=A4, leftMargin=2 * cm, rightMargin=2 * cm,
        topMargin=2 * cm, bottomMargin=2 * cm,
        title=f"Resultados - {datos['titulo_eleccion']}", author='SGV'
    )
    documento.build(elementos, onFirstPage=_pie, onLaterPages=_pie)
    return buffer.getvalue()