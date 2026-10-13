from app.utils.security import hashear_password

usuarios_passwords = {
    'admin@colegio.edu.co': 'admin_123',
    'alberto.gomez@colegio.edu.co': '0000',
    'aleja.pinzon@colegio.edu.co': '0000',
    'camilo.sanz@colegio.edu.co': '0000',
    'daniela.rojas@colegio.edu.co': '0000',
    'esteban.quito@colegio.edu.co': '0000',
    'fabian.nino@colegio.edu.co': '0000',
    'gabriela.mistral@colegio.edu.co': '00000',
    'hugo.sanchez@colegio.edu.co': '00000',
    'isabela.santo@colegio.edu.co': '0000',
    'juan.valdez@colegio.edu.co': '0000',
    'kevin.florez@colegio.edu.co': '0000',
}

for correo, pwd in usuarios_passwords.items():
    hash_generado = hashear_password(pwd)
    print(f"UPDATE usuarios SET contrasena = '{hash_generado}' WHERE correo = '{correo}';")