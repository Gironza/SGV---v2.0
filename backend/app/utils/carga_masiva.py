import csv
import io
import re
import unicodedata
from pydantic import EmailStr, TypeAdapter, ValidationError

MAX_FILAS = 500
MAX_BYTES = 2 * 1024 * 1024

COLUMNAS = ('documento', 'tipo_documento', 'nombre', 'apellido', 'correo', 'curso')
# Largos máximos según las columnas de la tabla usuarios
LARGOS = {'documento': 20, 'nombre': 100, 'apellido': 100, 'correo': 100, 'curso': 20}

# Excel convierte los números largos a esto (por ejemplo 1.02E+09) y pierde dígitos
_NOTACION_CIENTIFICA = re.compile(r'^\d+([.,]\d+)?[eE][+-]?\d+$')
_validar_correo = TypeAdapter(EmailStr).validate_python


class ArchivoInvalido(Exception):
    """El archivo no se puede procesar (formato, columnas, vacío o demasiadas filas)."""


def _normalizar_columna(nombre):
    """'Tipo documento ', 'tipo-documento' y 'Tipo_Documento' se leen igual."""
    sin_tildes = ''.join(
        c for c in unicodedata.normalize('NFD', nombre or '')
        if unicodedata.category(c) != 'Mn'
    )
    return re.sub(r'[\s\-]+', '_', sin_tildes.strip().lower())


def _decodificar(contenido):
    # Un .xlsx (o texto Unicode de Excel) trae bytes nulos: no es un CSV de texto
    if b'\x00' in contenido:
        raise ArchivoInvalido(
            'El archivo no parece un CSV de texto (¿es un .xlsx?). '
            'En Excel usa Guardar como > CSV'
        )
    # UTF-8 (con o sin BOM) primero; Excel en Windows guarda en Windows-1252
    for codificacion in ('utf-8-sig', 'cp1252'):
        try:
            return contenido.decode(codificacion)
        except UnicodeDecodeError:
            continue
    raise ArchivoInvalido(
        'No se pudo leer el texto del archivo. Guárdalo como CSV (UTF-8) e inténtalo de nuevo'
    )


def leer_filas(contenido):
    """
    Lee el CSV (separado por coma o punto y coma) y devuelve [(fila, valores)], donde
    fila es el número de línea del archivo (la 1 es el encabezado, como en Excel).
    Las filas completamente vacías se ignoran (Excel suele dejar ',,,,,' al final).
    Lanza ArchivoInvalido si no se puede procesar.
    """
    texto = _decodificar(contenido)

    primera = next((l for l in texto.splitlines() if l.strip()), None)
    if primera is None:
        raise ArchivoInvalido('El archivo está vacío')
    delimitador = ';' if primera.count(';') > primera.count(',') else ','

    lector = csv.reader(io.StringIO(texto), delimiter=delimitador)

    encabezado = None
    for fila in lector:
        if any(c.strip() for c in fila):
            encabezado = [_normalizar_columna(c) for c in fila]
            break

    indices = {c: encabezado.index(c) for c in COLUMNAS if c in encabezado}
    faltantes = [c for c in COLUMNAS if c not in indices]
    if faltantes:
        raise ArchivoInvalido(
            'Faltan columnas obligatorias: ' + ', '.join(faltantes)
            + '. El encabezado debe ser: ' + ';'.join(COLUMNAS)
        )

    filas = []
    for fila in lector:
        if not any(c.strip() for c in fila):
            continue
        valores = {
            c: (fila[i].strip() if i < len(fila) else '') for c, i in indices.items()
        }
        valores['_sobran'] = len(fila) > len(encabezado)
        filas.append((lector.line_num, valores))

    if not filas:
        raise ArchivoInvalido('El archivo no tiene estudiantes: solo trae el encabezado')
    if len(filas) > MAX_FILAS:
        raise ArchivoInvalido(
            f'El archivo tiene {len(filas)} filas y el máximo es {MAX_FILAS} por archivo. '
            'Divídelo en varios archivos'
        )
    return filas


def validar_filas(filas, tipos_documento):
    """
    Valida todas las filas (sin tocar la BD) y junta TODOS los errores, no solo el primero.
    tipos_documento: {'cc': 1, 'ti': 2, ...} (nombre en minúsculas -> id).
    Devuelve (validas, errores, documentos, correos):
      - validas: filas listas para guardar (con id_tipo_doc y correo normalizado)
      - errores: [{'fila', 'campo', 'motivo'}]
      - documentos / correos: {valor: fila} de todos los que traen texto, para
        compararlos con la BD (los correos en minúsculas)
    """
    validas, errores = [], []
    documentos, correos = {}, {}
    tipos_texto = ', '.join(sorted(n.upper() for n in tipos_documento))

    for fila, v in filas:
        antes = len(errores)

        def error(campo, motivo):
            errores.append({'fila': fila, 'campo': campo, 'motivo': motivo})

        if v['_sobran']:
            error('fila', 'tiene más valores que columnas (¿hay una coma o punto y coma dentro de un campo?)')

        for campo in COLUMNAS:
            if not v[campo]:
                error(campo, 'está vacío')

        for campo, largo in LARGOS.items():
            if len(v[campo]) > largo:
                error(campo, f'es demasiado largo (máximo {largo} caracteres)')

        documento = v['documento']
        if documento:
            if _NOTACION_CIENTIFICA.match(documento):
                error('documento', 'está en notación científica (Excel lo convirtió); '
                                   'formatea la columna como texto y vuelve a escribirlo')
            if documento in documentos:
                error('documento', f'repetido: ya aparece en la fila {documentos[documento]}')
            else:
                documentos[documento] = fila

        id_tipo_doc = None
        if v['tipo_documento']:
            id_tipo_doc = tipos_documento.get(v['tipo_documento'].lower())
            if id_tipo_doc is None:
                error('tipo_documento', f"«{v['tipo_documento']}» no es válido (usa: {tipos_texto})")

        correo = v['correo']
        if correo:
            try:
                correo = _validar_correo(correo)
            except ValidationError:
                error('correo', 'no es un correo válido')
            else:
                clave = correo.lower()
                if clave in correos:
                    error('correo', f'repetido: ya aparece en la fila {correos[clave]}')
                else:
                    correos[clave] = fila

        if len(errores) == antes:
            validas.append({
                'fila': fila, 'documento': documento, 'id_tipo_doc': id_tipo_doc,
                'nombre': v['nombre'], 'apellido': v['apellido'],
                'correo': correo, 'curso': v['curso'],
            })

    return validas, errores, documentos, correos