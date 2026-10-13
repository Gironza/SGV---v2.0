import logging
from psycopg2.extras import RealDictCursor
from app.config.database import Database

logger = logging.getLogger(__name__)


class Voto:

    @staticmethod
    def ya_voto(id_usuario, id_eleccion):
        db = Database()
        query = """
        SELECT COUNT(*) as count FROM registros_votacion
        WHERE id_usuario = %s AND id_eleccion = %s
        """
        resultado = db.ejecutar_query(query, (id_usuario, id_eleccion))
        return resultado[0]['count'] > 0 if resultado else False

    @staticmethod
    def registrar(id_eleccion, id_usuario, id_candidato):
        """
        Transacción atómica: VOTO + REGISTRO_VOTACION.
        No usa ejecutar_query() porque ese método hace commit y cierra
        conexión en cada llamada — aquí ambos inserts deben ir en la
        misma transacción o revertirse juntos si algo falla.
        """
        db = Database()
        conexion = db.obtener_conexion()
        if not conexion:
            return None

        cursor = None
        try:
            cursor = conexion.cursor(cursor_factory=RealDictCursor)

            cursor.execute("""
                INSERT INTO votos (id_eleccion, id_candidato, fecha_voto)
                VALUES (%s, %s, NOW())
                RETURNING id_voto, fecha_voto
            """, (id_eleccion, id_candidato))
            voto = cursor.fetchone()

            cursor.execute("""
                INSERT INTO registros_votacion (id_usuario, id_eleccion, fecha_voto)
                VALUES (%s, %s, NOW())
                RETURNING id_registro
            """, (id_usuario, id_eleccion))
            registro = cursor.fetchone()

            conexion.commit()
            return {'voto': voto, 'registro': registro}

        except Exception as e:
            conexion.rollback()
            logger.error(f"Error al registrar voto: {e}")
            return None
        finally:
            if cursor:
                cursor.close()
            conexion.close()