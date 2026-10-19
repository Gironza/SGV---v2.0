import os
from pathlib import Path
import logging
import psycopg2
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv

logger = logging.getLogger(__name__)

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # sube a app/
load_dotenv(os.path.join(BASE_DIR, ".env"))




class BaseDatosNoDisponible(Exception):
    """La base de datos no responde (caída, red, credenciales o timeout)."""
    pass


class Database:
    def __init__(self):
        self.host = os.getenv("DB_HOST")
        self.user = os.getenv("DB_USER")
        self.password = os.getenv("DB_PASSWORD")
        self.database = os.getenv("DB_NAME")
        self.port = os.getenv("DB_PORT")

    def obtener_conexion(self):
        try:
            return psycopg2.connect(
                host=self.host,
                user=self.user,
                password=self.password,
                dbname=self.database,
                port=self.port,
                connect_timeout=5  # sin esto, con la BD caída la petición puede quedarse colgada
            )
        except Exception as e:
            logger.error(f"No se pudo conectar a PostgreSQL: {e}")
            raise BaseDatosNoDisponible("Base de datos no disponible") from e

    @staticmethod
    def _revertir(conexion):
        try:
            conexion.rollback()
        except Exception:
            pass

    @staticmethod
    def _cerrar(cursor, conexion):
        try:
            if cursor:
                cursor.close()
        except Exception:
            pass
        try:
            conexion.close()
        except Exception:
            pass

    def ejecutar_query(self, query, params=None):
        conexion = self.obtener_conexion()  # lanza BaseDatosNoDisponible si no hay BD
        cursor = None
        try:
            cursor = conexion.cursor(cursor_factory=RealDictCursor)
            cursor.execute(query, params or ())

            if cursor.description is not None:
                resultado = [dict(row) for row in cursor.fetchall()]
                conexion.commit()
            else:
                conexion.commit()
                resultado = cursor.rowcount
            return resultado
        except (psycopg2.OperationalError, psycopg2.InterfaceError) as e:
            # La conexión se cayó a mitad de la consulta
            logger.error(f"Se perdió la conexión con PostgreSQL: {e}")
            self._revertir(conexion)
            raise BaseDatosNoDisponible("Base de datos no disponible") from e
        except Exception as e:
            logger.error(f"Error ejecutando query: {e}")
            self._revertir(conexion)
            return None
        finally:
            self._cerrar(cursor, conexion)