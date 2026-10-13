from app.models.usuario import Usuario
from app.utils.security import verificar_password

usuario = Usuario.buscar_por_correo("admin@colegio.com")
print("Correo encontrado:", usuario.correo)
print("Hash en BD:", repr(usuario.contrasena))
print("Longitud del hash:", len(usuario.contrasena))
print("Verificación:", verificar_password("admin_123", usuario.contrasena))