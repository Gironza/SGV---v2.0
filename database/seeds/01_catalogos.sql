--============================================================
--SGV - Sistema de gestion de Votaciones
--Script de seeds, catalogos registros obligatorios para el buen funcionamiento del sistema
--============================================================

INSERT INTO roles (id_rol, nombre, descripcion) VALUES
    (1, 'Administrador', 'Control total del sistema de votación'),
    (2, 'Docente', 'Usuario con permisos de visualización y jurado de votación'),
    (3, 'Estudiante', 'Usuario habilitado para ejercer el derecho al voto')
ON CONFLICT DO NOTHING;

INSERT INTO tipos_documento (id_tipo_doc, nombre, descripcion) VALUES
    (1, 'CC', 'Cédula de Ciudadanía'),
    (2, 'TI', 'Tarjeta de Identidad'),
    (3, 'CE', 'Cédula de Extranjería'),
    (4, 'PPT', 'Permiso por Protección Temporal')
ON CONFLICT DO NOTHING;

INSERT INTO estados_eleccion (id_estado_eleccion, nombre) VALUES
    (1, 'Activa'), (2, 'Finalizada'), (3, 'Pendiente')
ON CONFLICT DO NOTHING;

INSERT INTO estados_candidatura (id_estado_candidatura, nombre) VALUES
    (1, 'Pendiente'), (2, 'Aprobada'), (3, 'Rechazada'),
    (4, 'Retirada'), (5, 'Retiro solicitado')
ON CONFLICT DO NOTHING;