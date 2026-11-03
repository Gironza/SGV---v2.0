from app.models.eleccion import Eleccion
from app.models.usuario import Usuario


def obtener_eleccion_de_institucion(id_eleccion, id_usuario):
    """
    Devuelve la elección solo si pertenece a la institución del usuario.
    Si no existe o es de otra institución devuelve None: en ambos casos el
    cliente recibe el mismo mensaje, así no se revela que la elección existe.
    """
    eleccion = Eleccion.obtener_por_id(id_eleccion)
    if not eleccion:
        return None
    if Usuario.obtener_institucion(id_usuario) != eleccion['id_institucion']:
        return None
    return eleccion


def obtener_usuario_de_institucion(id_objetivo, id_actor):
    """
    Devuelve el usuario solo si es de la misma institución que quien consulta.
    Si no existe o es de otra institución devuelve None (mismo mensaje en ambos casos).
    """
    usuario = Usuario.obtener_detalle(id_objetivo)
    if not usuario:
        return None
    if Usuario.obtener_institucion(id_actor) != usuario['id_institucion']:
        return None
    return usuario


def curso_habilitado(curso_usuario, cursos_permitidos):
    """
    Lista vacía = elección abierta a todos los cursos. Con lista, el curso del
    usuario debe estar en ella (sin distinguir mayúsculas); sin curso no pasa.
    """
    if not cursos_permitidos:
        return True
    if not curso_usuario:
        return False
    permitidos = {c.strip().lower() for c in cursos_permitidos}
    return curso_usuario.strip().lower() in permitidos