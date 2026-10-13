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