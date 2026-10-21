import logging
from app.config.database import Database

logger = logging.getLogger(__name__)

ESTADO_PENDIENTE = 1
ESTADO_APROBADA = 2
ESTADO_RECHAZADA = 3
ESTADO_RETIRADA = 4
ESTADO_RETIRO_SOLICITADO = 5

# Estados que aparecen en el tarjetón y por los que se puede votar.
# "Retiro solicitado" sigue ahí hasta que un admin o docente lo resuelva.
ESTADOS_EN_TARJETON = (ESTADO_APROBADA, ESTADO_RETIRO_SOLICITADO)


class Candidato:

    @staticmethod
    def crear(id_usuario, id_eleccion):
        # El estado queda en Pendiente por el DEFAULT de la columna
        db = Database()
        query = """
        INSERT INTO candidatos (id_usuario, id_eleccion)
        VALUES (%s, %s)
        RETURNING id_candidato
        """
        resultado = db.ejecutar_query(query, (id_usuario, id_eleccion))
        return resultado[0]['id_candidato'] if resultado else None

    @staticmethod
    def ya_inscrito(id_usuario, id_eleccion):
        db = Database()
        query = "SELECT 1 FROM candidatos WHERE id_usuario = %s AND id_eleccion = %s"
        resultado = db.ejecutar_query(query, (id_usuario, id_eleccion))
        return bool(resultado)

    @staticmethod
    def obtener_por_id(id_candidato):
        db = Database()
        query = """
        SELECT c.id_candidato, c.id_usuario, c.propuesta, c.foto, c.id_eleccion,
               c.id_estado_candidatura, ec.nombre AS nombre_estado, c.observaciones,
               u.nombre, u.apellido
        FROM candidatos c
        INNER JOIN usuarios u ON c.id_usuario = u.id_usuario
        INNER JOIN estados_candidatura ec
            ON c.id_estado_candidatura = ec.id_estado_candidatura
        WHERE c.id_candidato = %s
        """
        resultado = db.ejecutar_query(query, (id_candidato,))
        return resultado[0] if resultado else None

    @staticmethod
    def listar_por_eleccion(id_eleccion):
        # El tarjetón: aprobadas y con retiro solicitado, en orden alfabético
        db = Database()
        query = """
        SELECT c.id_candidato, u.nombre, u.apellido, c.propuesta, c.foto
        FROM candidatos c
        INNER JOIN usuarios u ON c.id_usuario = u.id_usuario
        WHERE c.id_eleccion = %s AND c.id_estado_candidatura = ANY(%s)
        ORDER BY u.apellido, u.nombre
        """
        return db.ejecutar_query(query, (id_eleccion, list(ESTADOS_EN_TARJETON)))

    @staticmethod
    def listar_para_gestion(id_eleccion):
        # Todas las candidaturas, con su estado: para admin y docente
        db = Database()
        query = """
        SELECT c.id_candidato, c.id_eleccion, u.nombre, u.apellido,
               c.propuesta, c.foto,
               c.id_estado_candidatura, ec.nombre AS nombre_estado, c.observaciones
        FROM candidatos c
        INNER JOIN usuarios u ON c.id_usuario = u.id_usuario
        INNER JOIN estados_candidatura ec
            ON c.id_estado_candidatura = ec.id_estado_candidatura
        WHERE c.id_eleccion = %s
        ORDER BY c.id_estado_candidatura, u.apellido
        """
        return db.ejecutar_query(query, (id_eleccion,))

    @staticmethod
    def obtener_de_usuario(id_usuario, id_eleccion):
        # La candidatura propia del estudiante en una elección
        db = Database()
        query = """
        SELECT c.id_candidato, c.id_eleccion, u.nombre, u.apellido,
               c.propuesta, c.foto,
               c.id_estado_candidatura, ec.nombre AS nombre_estado, c.observaciones
        FROM candidatos c
        INNER JOIN usuarios u ON c.id_usuario = u.id_usuario
        INNER JOIN estados_candidatura ec
            ON c.id_estado_candidatura = ec.id_estado_candidatura
        WHERE c.id_usuario = %s AND c.id_eleccion = %s
        """
        resultado = db.ejecutar_query(query, (id_usuario, id_eleccion))
        return resultado[0] if resultado else None

    @staticmethod
    def pertenece_a_eleccion(id_candidato, id_eleccion):
        # Solo se vota por candidaturas del tarjetón (aprobada o retiro solicitado)
        db = Database()
        query = """
        SELECT 1 FROM candidatos
        WHERE id_candidato = %s AND id_eleccion = %s
          AND id_estado_candidatura = ANY(%s)
        """
        resultado = db.ejecutar_query(
            query, (id_candidato, id_eleccion, list(ESTADOS_EN_TARJETON))
        )
        return bool(resultado)

    @staticmethod
    def tiene_votos(id_candidato):
        db = Database()
        query = "SELECT 1 FROM votos WHERE id_candidato = %s LIMIT 1"
        resultado = db.ejecutar_query(query, (id_candidato,))
        return bool(resultado)

    @staticmethod
    def cambiar_estado(id_candidato, id_estado, observaciones=None):
        """
        Cambia el estado. Las observaciones son independientes del estado:
        si no se pasan (None) se conservan las que ya había; si se pasan,
        reemplazan a las anteriores. Todo en una sola sentencia (atómico).
        """
        db = Database()
        query = """
        UPDATE candidatos
        SET id_estado_candidatura = %s,
            observaciones = COALESCE(%s, observaciones)
        WHERE id_candidato = %s
        """
        resultado = db.ejecutar_query(query, (id_estado, observaciones, id_candidato))
        return resultado is not None and resultado > 0

    @staticmethod
    def actualizar_observaciones(id_candidato, observaciones):
        # None borra la observación
        db = Database()
        query = "UPDATE candidatos SET observaciones = %s WHERE id_candidato = %s"
        resultado = db.ejecutar_query(query, (observaciones, id_candidato))
        return resultado is not None and resultado > 0

    @staticmethod
    def actualizar_propuesta(id_candidato, propuesta):
        db = Database()
        query = "UPDATE candidatos SET propuesta = %s WHERE id_candidato = %s"
        resultado = db.ejecutar_query(query, (propuesta, id_candidato))
        return resultado is not None and resultado > 0