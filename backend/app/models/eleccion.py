import logging
from app.config.database import Database

logger = logging.getLogger(__name__)

class Eleccion:


    _SELECT = """
        SELECT e.id_eleccion, e.titulo, e.descripcion,
               e.fecha_inicio_inscripcion, e.fecha_fin_inscripcion,
               e.fecha_inicio, e.fecha_fin,
               e.id_estado_eleccion, e.id_institucion, ee.nombre AS nombre_estado
        FROM elecciones e
        INNER JOIN estados_eleccion ee ON e.id_estado_eleccion = ee.id_estado_eleccion
    """

    @staticmethod
    def crear(titulo, descripcion, fecha_inicio, fecha_fin, id_institucion,
              fecha_inicio_inscripcion=None, fecha_fin_inscripcion=None,
              id_estado_eleccion=1):
        db = Database()
        query = """
        INSERT INTO elecciones (titulo, descripcion, fecha_inicio_inscripcion,
                                fecha_fin_inscripcion, fecha_inicio, fecha_fin,
                                id_estado_eleccion, id_institucion)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        RETURNING id_eleccion
        """
        resultado = db.ejecutar_query(query, (
            titulo, descripcion, fecha_inicio_inscripcion, fecha_fin_inscripcion,
            fecha_inicio, fecha_fin, id_estado_eleccion, id_institucion
        ))
        return resultado[0]['id_eleccion'] if resultado else None

    @staticmethod
    def obtener_por_id(id_eleccion):
        db = Database()
        resultado = db.ejecutar_query(
            Eleccion._SELECT + " WHERE e.id_eleccion = %s", (id_eleccion,)
        )
        return resultado[0] if resultado else None

    @staticmethod
    def listar_por_institucion(id_institucion):
        db = Database()
        return db.ejecutar_query(
            Eleccion._SELECT + " WHERE e.id_institucion = %s ORDER BY e.fecha_inicio DESC",
            (id_institucion,)
        )

    @staticmethod
    def actualizar(id_eleccion, titulo, descripcion, fecha_inicio, fecha_fin,
                   fecha_inicio_inscripcion=None, fecha_fin_inscripcion=None):
        db = Database()
        query = """
        UPDATE elecciones
        SET titulo = %s, descripcion = %s,
            fecha_inicio_inscripcion = %s, fecha_fin_inscripcion = %s,
            fecha_inicio = %s, fecha_fin = %s
        WHERE id_eleccion = %s
        """
        resultado = db.ejecutar_query(query, (
            titulo, descripcion, fecha_inicio_inscripcion, fecha_fin_inscripcion,
            fecha_inicio, fecha_fin, id_eleccion
        ))
        return resultado is not None and resultado > 0

    @staticmethod
    def ampliar_fin_inscripcion(id_eleccion, nueva_fecha):
        db = Database()
        query = "UPDATE elecciones SET fecha_fin_inscripcion = %s WHERE id_eleccion = %s"
        resultado = db.ejecutar_query(query, (nueva_fecha, id_eleccion))
        return resultado is not None and resultado > 0

    @staticmethod
    def tiene_votos(id_eleccion):
        db = Database()
        query = "SELECT 1 FROM votos WHERE id_eleccion = %s LIMIT 1"
        return bool(db.ejecutar_query(query, (id_eleccion,)))
    @staticmethod
    def cambiar_estado(id_eleccion, id_estado_eleccion):
        db = Database()
        query = "UPDATE elecciones SET id_estado_eleccion = %s WHERE id_eleccion = %s"
        resultado = db.ejecutar_query(query, (id_estado_eleccion, id_eleccion))
        return resultado is not None and resultado > 0

    @staticmethod
    def eliminar(id_eleccion):
        """
        Borrado en cascada manual: votos y registros_votacion no tienen
        ON DELETE CASCADE hacia elecciones (solo candidatos sí lo tiene).
        Se hace en una sola transacción para no dejar datos huérfanos
        a medias si algo falla a mitad de camino.
        """
        db = Database()
        conexion = db.obtener_conexion()
        if not conexion:
            return False

        cursor = None
        try:
            cursor = conexion.cursor()

            cursor.execute("DELETE FROM votos WHERE id_eleccion = %s", (id_eleccion,))
            cursor.execute("DELETE FROM registros_votacion WHERE id_eleccion = %s", (id_eleccion,))
            cursor.execute("DELETE FROM elecciones WHERE id_eleccion = %s", (id_eleccion,))

            conexion.commit()
            return True
        except Exception as e:
            conexion.rollback()
            logger.error(f"Error al eliminar elección: {e}")
            return False
        finally:
            if cursor:
                cursor.close()
            conexion.close()