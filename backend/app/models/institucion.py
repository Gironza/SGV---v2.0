from app.config.database import Database


# Nombre de columna por tipo de código. El nombre sale de aquí, nunca del usuario.
COLUMNAS_CODIGO = {
    'admin': 'codigo_admin',
    'docente': 'codigo_docente'
}


class Institucion:

#constructora

    def __init__(self, id_institucion=None, nombre=None, nit=None,
                 direccion=None, telefono=None, correo=None,
                 descripcion=None, codigo_admin=None, codigo_docente=None):
        self.id_institucion = id_institucion
        self.nombre = nombre
        self.nit = nit
        self.direccion = direccion
        self.telefono = telefono
        self.correo = correo
        self.descripcion = descripcion
        self.codigo_admin = codigo_admin
        self.codigo_docente = codigo_docente


#Busca la intitucion concorde al codigo dado puede ser de admin o docente
#devulve un dict con id_institucion e id_rol, None si no coincide
    @staticmethod
    def buscar_por_codigo(codigo):
        db = Database()
        query = """
        SELECT id_institucion, codigo_admin, codigo_docente
        FROM instituciones
        WHERE codigo_admin = %s OR codigo_docente = %s
        """
        resultado = db.ejecutar_query(query, (codigo, codigo))

        #Comprueba si el resultado es vacio o no
        if not resultado or len(resultado) == 0:
            return None

        #variable que toma resultado de la lista
        data = resultado[0]

        if data['codigo_admin'] == codigo:
            id_rol = 1  # Administrador
        else:
            id_rol = 2  # Docente

        #retornos
        return {
            'id_institucion': data['id_institucion'],
            'id_rol': id_rol
        }


#Devuelve los dos códigos vigentes de la institución (None si están desactivados)
    @staticmethod
    def obtener_codigos(id_institucion):
        db = Database()
        query = """
        SELECT codigo_admin, codigo_docente,
               fecha_actualizacion_cod AS fecha_actualizacion
        FROM instituciones
        WHERE id_institucion = %s
        """
        resultado = db.ejecutar_query(query, (id_institucion,))
        return resultado[0] if resultado else None


#Cambia un código. tipo = 'admin' o 'docente'. codigo = None lo desactiva.
    @staticmethod
    def actualizar_codigo(id_institucion, tipo, codigo):
        columna = COLUMNAS_CODIGO.get(tipo)
        if columna is None:
            return False

        db = Database()
        query = f"""
        UPDATE instituciones
        SET {columna} = %s, fecha_actualizacion_cod = CURRENT_TIMESTAMP
        WHERE id_institucion = %s
        """
        resultado = db.ejecutar_query(query, (codigo, id_institucion))
        return resultado is not None and resultado > 0