from app.config.database import Database


class Resultado:

    @staticmethod
    def obtener_por_candidato(id_eleccion):
        # Solo cuentan las candidaturas aprobadas (id_estado_candidatura = 2)
        db = Database()
        query = """
        SELECT c.id_candidato, u.nombre, u.apellido, c.propuesta, c.foto,
               COUNT(v.id_voto) AS total_votos
        FROM candidatos c
        INNER JOIN usuarios u ON c.id_usuario = u.id_usuario
        LEFT JOIN votos v ON v.id_candidato = c.id_candidato
        WHERE c.id_eleccion = %s AND c.id_estado_candidatura = 2
        GROUP BY c.id_candidato, u.nombre, u.apellido, c.propuesta, c.foto
        ORDER BY total_votos DESC
        """
        return db.ejecutar_query(query, (id_eleccion,))

    @staticmethod
    def contar_blancos(id_eleccion):
        db = Database()
        query = "SELECT COUNT(*) as count FROM votos WHERE id_eleccion = %s AND id_candidato IS NULL"
        resultado = db.ejecutar_query(query, (id_eleccion,))
        return resultado[0]['count'] if resultado else 0

    @staticmethod
    def contar_total(id_eleccion):
        db = Database()
        query = "SELECT COUNT(*) as count FROM votos WHERE id_eleccion = %s"
        resultado = db.ejecutar_query(query, (id_eleccion,))
        return resultado[0]['count'] if resultado else 0