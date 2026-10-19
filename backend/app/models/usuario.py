from app.config.database import Database
 
 
class Usuario:
 
    def __init__(self, id_usuario=None, id_institucion=None, documento=None,
                 id_tipo_doc=None, nombre=None, apellido=None, correo=None,
                 contrasena=None, curso=None, id_rol=None, activo=True):
        self.id_usuario = id_usuario
        self.id_institucion = id_institucion
        self.documento = documento
        self.id_tipo_doc = id_tipo_doc
        self.nombre = nombre
        self.apellido = apellido
        self.correo = correo
        self.contrasena = contrasena
        self.curso = curso
        self.id_rol = id_rol
        self.activo = activo
        self.rol_nombre = None
 
    def guardar(self):
        # 'activo' no se envía: la columna tiene DEFAULT TRUE
        db = Database()
        query = """
        INSERT INTO usuarios
            (id_institucion, documento, id_tipo_doc, nombre, apellido,
             correo, contrasena, curso, id_rol)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        RETURNING id_usuario
        """
        params = (
            self.id_institucion, self.documento, self.id_tipo_doc,
            self.nombre, self.apellido, self.correo, self.contrasena,
            self.curso, self.id_rol
        )
 
        resultado = db.ejecutar_query(query, params)
        if resultado:
            self.id_usuario = resultado[0]['id_usuario']  #guarda la informacion dellid del usuario a los parametros consultados (info del usuario)
            return True
        return False
 
    @staticmethod
    def buscar_por_correo(correo):
        db = Database()
        query = """
        SELECT
            u.id_usuario, u.id_institucion, u.documento, u.id_tipo_doc,
            u.nombre, u.apellido, u.correo, u.contrasena, u.curso, u.id_rol,
            u.activo, r.nombre AS rol_nombre
        FROM usuarios u
        INNER JOIN roles r ON u.id_rol = r.id_rol
        WHERE u.correo = %s
        """
 
        resultado = db.ejecutar_query(query, (correo,))
 
        if resultado and len(resultado) > 0:
            data = resultado[0]
            usuario = Usuario(
                id_usuario=data['id_usuario'],
                id_institucion=data['id_institucion'],
                documento=data['documento'],
                id_tipo_doc=data['id_tipo_doc'],
                nombre=data['nombre'],
                apellido=data['apellido'],
                correo=data['correo'],
                contrasena=data['contrasena'],
                curso=data['curso'],
                id_rol=data['id_rol'],
                activo=data['activo'],
            )
            usuario.rol_nombre = data['rol_nombre']
            return usuario
        return None
 
    @staticmethod
    def extraer_usuarios(id_institucion=None):
        db = Database()
        query = """
        SELECT
            u.id_usuario, u.documento, u.nombre, u.apellido, u.correo,
            u.curso, u.activo, r.nombre AS rol_nombre
        FROM usuarios u
        INNER JOIN roles r ON u.id_rol = r.id_rol
        """
        params = None
        if id_institucion is not None:
            query += " WHERE u.id_institucion = %s"
            params = (id_institucion,)
        query += " ORDER BY u.id_usuario"
 
        return db.ejecutar_query(query, params)
 
    @staticmethod
    def usuario_existente(correo):
        db = Database()
        query = "SELECT COUNT(*) as count FROM usuarios WHERE correo = %s"
        resultado = db.ejecutar_query(query, (correo,))
        return resultado[0]['count'] > 0 if resultado else False
 
    @staticmethod
    def documento_existente(documento):
        db = Database()
        query = "SELECT COUNT(*) as count FROM usuarios WHERE documento = %s"
        resultado = db.ejecutar_query(query, (documento,))
        return resultado[0]['count'] > 0 if resultado else False

    @staticmethod
    def obtener_institucion(id_usuario):
        db = Database()
        query = "SELECT id_institucion FROM usuarios WHERE id_usuario = %s"
        resultado = db.ejecutar_query(query, (id_usuario,))
        return resultado[0]['id_institucion'] if resultado else None

    @staticmethod
    def esta_activo(id_usuario):
        """True o False según el estado de la cuenta; None si el usuario no existe."""
        db = Database()
        query = "SELECT activo FROM usuarios WHERE id_usuario = %s"
        resultado = db.ejecutar_query(query, (id_usuario,))
        return resultado[0]['activo'] if resultado else None

    @staticmethod
    def obtener_perfil(id_usuario):
        db = Database()
        query = """
        SELECT u.id_usuario, u.documento, u.nombre, u.apellido, u.correo,
               u.curso, u.id_rol, r.nombre AS rol_nombre
        FROM usuarios u
        INNER JOIN roles r ON u.id_rol = r.id_rol
        WHERE u.id_usuario = %s
        """
        resultado = db.ejecutar_query(query, (id_usuario,))
        return resultado[0] if resultado else None

    @staticmethod
    def correo_en_uso_por_otro(correo, id_usuario):
        """True si otro usuario (distinto al indicado) ya usa ese correo."""
        db = Database()
        query = "SELECT COUNT(*) as count FROM usuarios WHERE correo = %s AND id_usuario <> %s"
        resultado = db.ejecutar_query(query, (correo, id_usuario))
        return resultado[0]['count'] > 0 if resultado else False

    @staticmethod
    def actualizar_perfil(id_usuario, nombre, apellido, correo):
        db = Database()
        query = """
        UPDATE usuarios
        SET nombre = %s, apellido = %s, correo = %s
        WHERE id_usuario = %s
        RETURNING id_usuario
        """
        resultado = db.ejecutar_query(query, (nombre, apellido, correo, id_usuario))
        return bool(resultado)

    @staticmethod
    def obtener_contrasena(id_usuario):
        """Devuelve el hash actual; None si el usuario no existe."""
        db = Database()
        query = "SELECT contrasena FROM usuarios WHERE id_usuario = %s"
        resultado = db.ejecutar_query(query, (id_usuario,))
        return resultado[0]['contrasena'] if resultado else None

    @staticmethod
    def actualizar_contrasena(id_usuario, contrasena_hasheada):
        db = Database()
        query = """
        UPDATE usuarios SET contrasena = %s
        WHERE id_usuario = %s
        RETURNING id_usuario
        """
        resultado = db.ejecutar_query(query, (contrasena_hasheada, id_usuario))
        return bool(resultado)