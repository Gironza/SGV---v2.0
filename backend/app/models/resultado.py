from app.config.database import Database
from app.models.candidato import ESTADOS_EN_TARJETON


class Resultado:

    @staticmethod
    def conteos(id_eleccion):
        """
        Votos por candidatura del tarjetón (aprobadas y retiro solicitado, con 0
        votos incluidos), votos en blanco y total, todo en UNA consulta para que
        las tres cifras sean coherentes entre sí aunque se esté votando.
        Devuelve None si la consulta falla.
        """
        db = Database()
        query = """
        WITH conteo AS (
            SELECT id_candidato, COUNT(*) AS n
            FROM votos
            WHERE id_eleccion = %s
            GROUP BY id_candidato
        )
        SELECT 'candidato' AS tipo, c.id_candidato, u.nombre, u.apellido,
               c.propuesta, c.foto, COALESCE(k.n, 0)::int AS total_votos
        FROM candidatos c
        INNER JOIN usuarios u ON c.id_usuario = u.id_usuario
        LEFT JOIN conteo k ON k.id_candidato = c.id_candidato
        WHERE c.id_eleccion = %s AND c.id_estado_candidatura = ANY(%s)
        UNION ALL
        SELECT 'blanco', NULL::int, NULL::varchar, NULL::varchar,
               NULL::text, NULL::varchar,
               COALESCE((SELECT n FROM conteo WHERE id_candidato IS NULL), 0)::int
        UNION ALL
        SELECT 'total', NULL::int, NULL::varchar, NULL::varchar,
               NULL::text, NULL::varchar,
               COALESCE((SELECT SUM(n) FROM conteo), 0)::int
        """
        filas = db.ejecutar_query(
            query, (id_eleccion, id_eleccion, list(ESTADOS_EN_TARJETON))
        )
        if filas is None:
            return None

        candidatos, blancos, total = [], 0, 0
        for fila in filas:
            if fila['tipo'] == 'candidato':
                candidatos.append({
                    'id_candidato': fila['id_candidato'],
                    'nombre': fila['nombre'],
                    'apellido': fila['apellido'],
                    'propuesta': fila['propuesta'],
                    'foto': fila['foto'],
                    'total_votos': fila['total_votos'],
                })
            elif fila['tipo'] == 'blanco':
                blancos = fila['total_votos']
            else:
                total = fila['total_votos']

        # Orden determinista: más votos primero y, en empate, alfabético
        candidatos.sort(key=lambda c: (-c['total_votos'], c['apellido'], c['nombre']))
        return {'candidatos': candidatos, 'votos_blancos': blancos, 'total_votos': total}

    @staticmethod
    def participacion_por_curso(id_eleccion, id_institucion):
        """
        Por curso: estudiantes habilitados para votar y cuántos votaron.
        - Habilitados = estudiantes activos de la institución, filtrados por la
          lista de cursos de votación de la elección (sin lista = todos).
        - Quien ya votó cuenta aunque su cuenta se haya desactivado después.
        Solo entrega conteos: nunca quién votó por quién.
        Devuelve None si la consulta falla.
        """
        db = Database()
        query = """
        SELECT COALESCE(u.curso, 'Sin curso') AS curso,
               COUNT(*)::int AS habilitados,
               COUNT(r.id_registro)::int AS votaron
        FROM usuarios u
        LEFT JOIN registros_votacion r
               ON r.id_usuario = u.id_usuario AND r.id_eleccion = %s
        WHERE u.id_institucion = %s AND u.id_rol = 3
          AND (u.activo OR r.id_registro IS NOT NULL)
          AND (
              NOT EXISTS (SELECT 1 FROM elecciones_cursos ec
                          WHERE ec.id_eleccion = %s AND ec.tipo = 'votacion')
              OR LOWER(u.curso) IN (SELECT LOWER(ec.curso) FROM elecciones_cursos ec
                                    WHERE ec.id_eleccion = %s AND ec.tipo = 'votacion')
          )
        GROUP BY COALESCE(u.curso, 'Sin curso')
        ORDER BY 1
        """
        return db.ejecutar_query(
            query, (id_eleccion, id_institucion, id_eleccion, id_eleccion)
        )
    
    @staticmethod
    def nombre_institucion(id_institucion):
        db = Database()
        filas = db.ejecutar_query(
            "SELECT nombre FROM instituciones WHERE id_institucion = %s", (id_institucion,)
        )
        return filas[0]['nombre'] if filas else ''