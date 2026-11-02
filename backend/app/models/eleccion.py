import logging
from psycopg2.extras import RealDictCursor
from app.config.database import Database

logger = logging.getLogger(__name__)

TIPO_POSTULACION = 'postulacion'
TIPO_VOTACION = 'votacion'


class Eleccion:

    _SELECT = """
        SELECT e.id_eleccion, e.titulo, e.descripcion,
               e.fecha_inicio_inscripcion, e.fecha_fin_inscripcion,
               e.fecha_inicio, e.fecha_fin, e.fecha_publicacion_resultados,
               e.id_estado_eleccion, e.id_institucion, ee.nombre AS nombre_estado
        FROM elecciones e
        INNER JOIN estados_eleccion ee ON e.id_estado_eleccion = ee.id_estado_eleccion
    """

    # ---------- Cursos (tabla elecciones_cursos) ----------

    @staticmethod
    def _guardar_cursos(cursor, id_eleccion, tipo, cursos):
        """
        Reemplaza la lista de cursos de un tipo dentro de la transacción del cursor.
        None = sin cambios; lista vacía = abierta a todos los cursos.
        """
        if cursos is None:
            return
        cursor.execute(
            "DELETE FROM elecciones_cursos WHERE id_eleccion = %s AND tipo = %s",
            (id_eleccion, tipo)
        )
        if cursos:
            cursor.executemany(
                "INSERT INTO elecciones_cursos (id_eleccion, curso, tipo) VALUES (%s, %s, %s)",
                [(id_eleccion, curso, tipo) for curso in cursos]
            )

    @staticmethod
    def obtener_cursos(id_eleccion):
        """{'postulacion': [...], 'votacion': [...]}; lista vacía = abierta a todos."""
        db = Database()
        filas = db.ejecutar_query(
            "SELECT tipo, curso FROM elecciones_cursos WHERE id_eleccion = %s ORDER BY curso",
            (id_eleccion,)
        )
        cursos = {TIPO_POSTULACION: [], TIPO_VOTACION: []}
        for fila in filas or []:
            cursos[fila['tipo']].append(fila['curso'])
        return cursos

    @staticmethod
    def obtener_cursos_por_institucion(id_institucion):
        """Los cursos de todas las elecciones de la institución en una sola consulta."""
        db = Database()
        filas = db.ejecutar_query("""
            SELECT ec.id_eleccion, ec.tipo, ec.curso
            FROM elecciones_cursos ec
            INNER JOIN elecciones e ON ec.id_eleccion = e.id_eleccion
            WHERE e.id_institucion = %s
            ORDER BY ec.curso
        """, (id_institucion,))
        por_eleccion = {}
        for fila in filas or []:
            grupo = por_eleccion.setdefault(
                fila['id_eleccion'], {TIPO_POSTULACION: [], TIPO_VOTACION: []}
            )
            grupo[fila['tipo']].append(fila['curso'])
        return por_eleccion

    # ---------- CRUD ----------

    @staticmethod
    def crear(titulo, descripcion, fecha_inicio, fecha_fin, id_institucion,
              fecha_inicio_inscripcion=None, fecha_fin_inscripcion=None,
              cursos_postulacion=None, cursos_votacion=None, id_estado_eleccion=1):
        """Crea la elección y sus listas de cursos en una sola transacción."""
        db = Database()
        conexion = db.obtener_conexion()
        if not conexion:
            return None

        cursor = None
        try:
            cursor = conexion.cursor(cursor_factory=RealDictCursor)
            cursor.execute("""
                INSERT INTO elecciones (titulo, descripcion, fecha_inicio_inscripcion,
                                        fecha_fin_inscripcion, fecha_inicio, fecha_fin,
                                        id_estado_eleccion, id_institucion)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING id_eleccion
            """, (
                titulo, descripcion, fecha_inicio_inscripcion, fecha_fin_inscripcion,
                fecha_inicio, fecha_fin, id_estado_eleccion, id_institucion
            ))
            id_eleccion = cursor.fetchone()['id_eleccion']

            Eleccion._guardar_cursos(cursor, id_eleccion, TIPO_POSTULACION, cursos_postulacion)
            Eleccion._guardar_cursos(cursor, id_eleccion, TIPO_VOTACION, cursos_votacion)

            conexion.commit()
            return id_eleccion
        except Exception as e:
            conexion.rollback()
            logger.error(f"Error al crear elección: {e}")
            return None
        finally:
            if cursor:
                cursor.close()
            conexion.close()

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
                   fecha_inicio_inscripcion=None, fecha_fin_inscripcion=None,
                   cursos_postulacion=None, cursos_votacion=None):
        """Actualiza la elección y (si se envían) sus listas de cursos, todo o nada."""
        db = Database()
        conexion = db.obtener_conexion()
        if not conexion:
            return False

        cursor = None
        try:
            cursor = conexion.cursor()
            cursor.execute("""
                UPDATE elecciones
                SET titulo = %s, descripcion = %s,
                    fecha_inicio_inscripcion = %s, fecha_fin_inscripcion = %s,
                    fecha_inicio = %s, fecha_fin = %s
                WHERE id_eleccion = %s
            """, (
                titulo, descripcion, fecha_inicio_inscripcion, fecha_fin_inscripcion,
                fecha_inicio, fecha_fin, id_eleccion
            ))
            if cursor.rowcount == 0:
                conexion.rollback()
                return False

            Eleccion._guardar_cursos(cursor, id_eleccion, TIPO_POSTULACION, cursos_postulacion)
            Eleccion._guardar_cursos(cursor, id_eleccion, TIPO_VOTACION, cursos_votacion)

            conexion.commit()
            return True
        except Exception as e:
            conexion.rollback()
            logger.error(f"Error al actualizar elección: {e}")
            return False
        finally:
            if cursor:
                cursor.close()
            conexion.close()

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
    def cambiar_estado(id_eleccion, id_estado_eleccion, fecha_inicio=None, fecha_fin=None,
                       fecha_inicio_inscripcion=None, fecha_fin_inscripcion=None):
        """
        Cambia el estado y, si se pasan, ajusta fechas en la misma sentencia
        (el CHECK de orden de fechas se evalúa sobre el resultado final).
        Una fecha en None se conserva.
        """
        db = Database()
        query = """
        UPDATE elecciones
        SET id_estado_eleccion = %s,
            fecha_inicio = COALESCE(%s, fecha_inicio),
            fecha_fin = COALESCE(%s, fecha_fin),
            fecha_inicio_inscripcion = COALESCE(%s, fecha_inicio_inscripcion),
            fecha_fin_inscripcion = COALESCE(%s, fecha_fin_inscripcion)
        WHERE id_eleccion = %s
        """
        resultado = db.ejecutar_query(query, (
            id_estado_eleccion, fecha_inicio, fecha_fin,
            fecha_inicio_inscripcion, fecha_fin_inscripcion, id_eleccion
        ))
        return resultado is not None and resultado > 0

    @staticmethod
    def actualizar_publicacion(id_eleccion, fecha_publicacion):
        # None desactiva la publicación de resultados
        db = Database()
        query = "UPDATE elecciones SET fecha_publicacion_resultados = %s WHERE id_eleccion = %s"
        resultado = db.ejecutar_query(query, (fecha_publicacion, id_eleccion))
        return resultado is not None and resultado > 0

    @staticmethod
    def eliminar(id_eleccion):
        """
        Borrado en cascada manual: votos y registros_votacion no tienen
        ON DELETE CASCADE hacia elecciones (candidatos y elecciones_cursos sí).
        Todo en una sola transacción para no dejar datos huérfanos.
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