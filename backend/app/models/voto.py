import hashlib
import logging
from psycopg2 import errors
from psycopg2.extras import RealDictCursor
from app.config.database import Database

logger = logging.getLogger(__name__)


class VotoDuplicado(Exception):
    """El usuario ya tiene registro de votación en esa elección (choque del UNIQUE)."""


class Voto:

    @staticmethod
    def ya_voto(id_usuario, id_eleccion):
        db = Database()
        query = """
        SELECT 1 FROM registros_votacion
        WHERE id_usuario = %s AND id_eleccion = %s
        LIMIT 1
        """
        return bool(db.ejecutar_query(query, (id_usuario, id_eleccion)))

    @staticmethod
    def elecciones_votadas(id_usuario):
        """Ids de las elecciones en las que el usuario ya votó, en una sola consulta."""
        db = Database()
        filas = db.ejecutar_query(
            "SELECT id_eleccion FROM registros_votacion WHERE id_usuario = %s",
            (id_usuario,)
        )
        return {fila['id_eleccion'] for fila in filas or []}

    @staticmethod
    def registrar(id_eleccion, id_usuario, id_candidato):
        """
        Una sola transacción: registro de votación + voto, o ninguno.
        - Voto secreto: 'votos' no guarda usuario, fecha ni id secuencial.
        - Se inserta primero el registro: si el usuario ya votó (aunque sea
          en un doble clic simultáneo) el UNIQUE lo rechaza y no se crea el voto.
        - id_candidato None = voto en blanco.
        Devuelve {'id_registro', 'fecha_voto'}, None si falló, o lanza VotoDuplicado.
        No usa ejecutar_query() porque hace commit en cada llamada.
        """
        db = Database()
        conexion = db.obtener_conexion()
        if not conexion:
            return None

        cursor = None
        try:
            cursor = conexion.cursor(cursor_factory=RealDictCursor)

            cursor.execute("""
                INSERT INTO registros_votacion (id_usuario, id_eleccion)
                VALUES (%s, %s)
                RETURNING id_registro, fecha_voto
            """, (id_usuario, id_eleccion))
            registro = cursor.fetchone()

            cursor.execute(
                "INSERT INTO votos (id_eleccion, id_candidato) VALUES (%s, %s)",
                (id_eleccion, id_candidato)
            )

            conexion.commit()
            return registro

        except errors.UniqueViolation:
            conexion.rollback()
            raise VotoDuplicado()
        except Exception as e:
            conexion.rollback()
            logger.error(f"Error al registrar voto: {e}")
            return None
        finally:
            if cursor:
                cursor.close()
            conexion.close()

    @staticmethod
    def codigo_certificado(id_registro, fecha_voto):
        """
        Código derivado del registro de votación (nunca del voto, que es secreto).
        No se guarda: se recalcula con los mismos datos cuando se necesite (RF-028).
        """
        base = f"{id_registro}-{fecha_voto.isoformat()}"
        return hashlib.sha256(base.encode()).hexdigest()[:12].upper()
    
    @staticmethod
    def historial(id_usuario):
        """Elecciones en las que el usuario votó. Nunca dice por quién."""
        db = Database()
        query = """
        SELECT r.id_registro, r.id_eleccion, e.titulo, r.fecha_voto
        FROM registros_votacion r
        INNER JOIN elecciones e ON r.id_eleccion = e.id_eleccion
        WHERE r.id_usuario = %s
        ORDER BY r.fecha_voto DESC, r.id_registro DESC
        """
        return db.ejecutar_query(query, (id_usuario,))

    @staticmethod
    def datos_certificado(id_usuario, id_eleccion):
        """
        Datos para el certificado, a partir del registro de votación del usuario
        (nunca de la tabla votos, que es secreta). None si no votó en esa elección.
        """
        db = Database()
        query = """
        SELECT r.id_registro, r.fecha_voto, e.titulo,
               u.nombre, u.apellido, u.documento, td.nombre AS tipo_documento,
               i.nombre AS institucion
        FROM registros_votacion r
        INNER JOIN elecciones e ON r.id_eleccion = e.id_eleccion
        INNER JOIN instituciones i ON e.id_institucion = i.id_institucion
        INNER JOIN usuarios u ON r.id_usuario = u.id_usuario
        INNER JOIN tipos_documento td ON u.id_tipo_doc = td.id_tipo_doc
        WHERE r.id_usuario = %s AND r.id_eleccion = %s
        """
        resultado = db.ejecutar_query(query, (id_usuario, id_eleccion))
        return resultado[0] if resultado else None


    