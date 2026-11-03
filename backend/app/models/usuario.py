import logging
from psycopg2 import errors
from psycopg2.extras import RealDictCursor
from app.config.database import Database

logger = logging.getLogger(__name__)

# Resultados de Usuario.cambiar_activo
RESULTADO_OK = 'ok'
RESULTADO_NO_ENCONTRADO = 'no_encontrado'
RESULTADO_ULTIMO_ADMIN = 'ultimo_admin'
RESULTADO_CON_HISTORIAL = 'con_historial'

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
    def buscar_por_id(id_usuario):
        db = Database()
        query = """
        SELECT id_usuario, correo, contrasena, activo
        FROM usuarios WHERE id_usuario = %s
        """
        resultado = db.ejecutar_query(query, (id_usuario,))
        return resultado[0] if resultado else None
    
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
    def listar_cursos(id_institucion):
        """Cursos reales de los estudiantes de la institución (para validar y armar listas)."""
        db = Database()
        query = """
        SELECT DISTINCT curso FROM usuarios
        WHERE id_institucion = %s AND id_rol = 3
          AND curso IS NOT NULL AND curso <> ''
        ORDER BY curso
        """
        resultado = db.ejecutar_query(query, (id_institucion,)) or []
        return [fila['curso'] for fila in resultado]
 
    @staticmethod
    def _condiciones_listado(id_institucion, roles, rol=None, curso=None,
                             activo=None, q=None):
        """WHERE del listado (compartido por el conteo y la página) y sus parámetros."""
        condiciones = ["u.id_institucion = %s", "u.id_rol = ANY(%s)"]
        params = [id_institucion, list(roles)]

        if rol is not None:
            condiciones.append("u.id_rol = %s")
            params.append(rol)
        if curso:
            condiciones.append("LOWER(u.curso) = LOWER(%s)")
            params.append(curso.strip())
        if activo is not None:
            condiciones.append("u.activo = %s")
            params.append(activo)
        if q and q.strip():
            # strpos y no ILIKE: así %, _ y \ del texto buscado se toman literales
            condiciones.append(
                "strpos(LOWER(u.nombre || ' ' || u.apellido || ' ' || u.documento"
                " || ' ' || u.correo), %s) > 0"
            )
            params.append(q.strip().lower())

        return " AND ".join(condiciones), params

    @staticmethod
    def listar(id_institucion, roles, rol=None, curso=None, activo=None, q=None,
               limite=20, desplazamiento=0):
        """
        Usuarios de la institución con los roles indicados, filtrados y paginados.
        Devuelve {'total', 'usuarios'} o None si alguna consulta falla.
        """
        db = Database()
        donde, params = Usuario._condiciones_listado(
            id_institucion, roles, rol, curso, activo, q
        )

        total = db.ejecutar_query(
            f"SELECT COUNT(*) AS total FROM usuarios u WHERE {donde}", tuple(params)
        )
        if total is None:
            return None

        filas = db.ejecutar_query(f"""
            SELECT u.id_usuario, u.documento, u.id_tipo_doc, td.nombre AS tipo_documento,
                   u.nombre, u.apellido, u.correo, u.curso, u.activo,
                   u.id_rol, r.nombre AS rol_nombre
            FROM usuarios u
            INNER JOIN roles r ON u.id_rol = r.id_rol
            INNER JOIN tipos_documento td ON u.id_tipo_doc = td.id_tipo_doc
            WHERE {donde}
            ORDER BY u.apellido, u.nombre, u.id_usuario
            LIMIT %s OFFSET %s
        """, tuple(params + [limite, desplazamiento]))
        if filas is None:
            return None

        return {'total': total[0]['total'], 'usuarios': filas}

    @staticmethod
    def obtener_detalle(id_usuario):
        """Datos de gestión de un usuario (incluye id_institucion para validar acceso)."""
        db = Database()
        query = """
        SELECT u.id_usuario, u.id_institucion, u.documento, u.id_tipo_doc,
               td.nombre AS tipo_documento, u.nombre, u.apellido, u.correo,
               u.curso, u.activo, u.id_rol, r.nombre AS rol_nombre
        FROM usuarios u
        INNER JOIN roles r ON u.id_rol = r.id_rol
        INNER JOIN tipos_documento td ON u.id_tipo_doc = td.id_tipo_doc
        WHERE u.id_usuario = %s
        """
        resultado = db.ejecutar_query(query, (id_usuario,))
        return resultado[0] if resultado else None
 
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
    def obtener_curso(id_usuario):
        """Curso del usuario; None si no tiene o no existe."""
        db = Database()
        query = "SELECT curso FROM usuarios WHERE id_usuario = %s"
        resultado = db.ejecutar_query(query, (id_usuario,))
        return resultado[0]['curso'] if resultado else None

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
    
    @staticmethod
    def documento_en_uso_por_otro(documento, id_usuario):
        """True si otro usuario (distinto al indicado) ya tiene ese documento."""
        db = Database()
        query = "SELECT COUNT(*) as count FROM usuarios WHERE documento = %s AND id_usuario <> %s"
        resultado = db.ejecutar_query(query, (documento, id_usuario))
        return resultado[0]['count'] > 0 if resultado else False

    @staticmethod
    def tipo_documento_existe(id_tipo_doc):
        db = Database()
        query = "SELECT 1 FROM tipos_documento WHERE id_tipo_doc = %s"
        return bool(db.ejecutar_query(query, (id_tipo_doc,)))

    @staticmethod
    def actualizar_datos(id_usuario, documento, id_tipo_doc, nombre, apellido, correo, curso):
        db = Database()
        query = """
        UPDATE usuarios
        SET documento = %s, id_tipo_doc = %s, nombre = %s, apellido = %s,
            correo = %s, curso = %s
        WHERE id_usuario = %s
        RETURNING id_usuario
        """
        resultado = db.ejecutar_query(
            query, (documento, id_tipo_doc, nombre, apellido, correo, curso, id_usuario)
        )
        return bool(resultado)

    @staticmethod
    def actualizar_curso(id_usuario, curso):
        db = Database()
        query = "UPDATE usuarios SET curso = %s WHERE id_usuario = %s RETURNING id_usuario"
        return bool(db.ejecutar_query(query, (curso, id_usuario)))

    @staticmethod
    def cambiar_activo(id_usuario, activo):
        """
        Activa o desactiva una cuenta. Devuelve RESULTADO_OK, RESULTADO_NO_ENCONTRADO,
        RESULTADO_ULTIMO_ADMIN, o None si falla.
        Al desactivar a un admin, primero se bloquean las filas de los admins activos
        de su institución: así, si dos admins intentan desactivarse a la vez, el segundo
        espera, ve el resultado del primero y no deja la institución sin ningún admin.
        """
        db = Database()
        conexion = db.obtener_conexion()
        if not conexion:
            return None

        cursor = None
        try:
            cursor = conexion.cursor(cursor_factory=RealDictCursor)

            cursor.execute(
                "SELECT id_institucion, id_rol FROM usuarios WHERE id_usuario = %s",
                (id_usuario,)
            )
            objetivo = cursor.fetchone()
            if not objetivo:
                conexion.rollback()
                return RESULTADO_NO_ENCONTRADO

            if not activo and objetivo['id_rol'] == 1:
                cursor.execute("""
                    SELECT id_usuario FROM usuarios
                    WHERE id_institucion = %s AND id_rol = 1 AND activo
                    ORDER BY id_usuario
                    FOR UPDATE
                """, (objetivo['id_institucion'],))
                otros = [f for f in cursor.fetchall() if f['id_usuario'] != id_usuario]
                if not otros:
                    conexion.rollback()
                    return RESULTADO_ULTIMO_ADMIN

            cursor.execute(
                "UPDATE usuarios SET activo = %s WHERE id_usuario = %s", (activo, id_usuario)
            )
            conexion.commit()
            return RESULTADO_OK
        except Exception as e:
            conexion.rollback()
            logger.error(f"Error al cambiar estado de la cuenta: {e}")
            return None
        finally:
            if cursor:
                cursor.close()
            conexion.close()
    
    @staticmethod
    def contar_historial(id_usuario):
        """Candidaturas (en cualquier estado) y participaciones en votaciones del usuario."""
        db = Database()
        query = """
        SELECT (SELECT COUNT(*) FROM candidatos WHERE id_usuario = %s) AS candidaturas,
               (SELECT COUNT(*) FROM registros_votacion WHERE id_usuario = %s) AS participaciones
        """
        resultado = db.ejecutar_query(query, (id_usuario, id_usuario))
        return resultado[0] if resultado else None

    @staticmethod
    def eliminar(id_usuario):
        """
        Borrado real. Devuelve RESULTADO_OK, RESULTADO_NO_ENCONTRADO, RESULTADO_ULTIMO_ADMIN,
        RESULTADO_CON_HISTORIAL (la BD rechazó el borrado por candidaturas o votaciones
        que aparecieron después de revisar), o None si falla.
        Igual que al desactivar, borrar a un admin activo bloquea primero las filas de los
        admins activos de su institución para no dejarla sin ninguno.
        """
        db = Database()
        conexion = db.obtener_conexion()
        if not conexion:
            return None

        cursor = None
        try:
            cursor = conexion.cursor(cursor_factory=RealDictCursor)

            cursor.execute(
                "SELECT id_institucion, id_rol, activo FROM usuarios WHERE id_usuario = %s",
                (id_usuario,)
            )
            objetivo = cursor.fetchone()
            if not objetivo:
                conexion.rollback()
                return RESULTADO_NO_ENCONTRADO

            if objetivo['id_rol'] == 1 and objetivo['activo']:
                cursor.execute("""
                    SELECT id_usuario FROM usuarios
                    WHERE id_institucion = %s AND id_rol = 1 AND activo
                    ORDER BY id_usuario
                    FOR UPDATE
                """, (objetivo['id_institucion'],))
                otros = [f for f in cursor.fetchall() if f['id_usuario'] != id_usuario]
                if not otros:
                    conexion.rollback()
                    return RESULTADO_ULTIMO_ADMIN

            cursor.execute("DELETE FROM usuarios WHERE id_usuario = %s", (id_usuario,))
            if cursor.rowcount == 0:
                conexion.rollback()
                return RESULTADO_NO_ENCONTRADO

            conexion.commit()
            return RESULTADO_OK
        except errors.ForeignKeyViolation:
            conexion.rollback()
            return RESULTADO_CON_HISTORIAL
        except Exception as e:
            conexion.rollback()
            logger.error(f"Error al eliminar usuario: {e}")
            return None
        finally:
            if cursor:
                cursor.close()
            conexion.close()