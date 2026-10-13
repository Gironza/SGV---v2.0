--============================================================
--SGV - Sistema de gestion de Votaciones
--Script de seeds datos ficticios de prueba - desarrollo y testing
--============================================================

INSERT INTO instituciones (nombre, NIT, direccion, telefono, correo, descripcion, codigo_admin, codigo_docente) VALUES
('Colegio Feliz', '0000000', 'Cll de la Felicidad', '00000', NULL, NULL, 'ADM-CF-2026', 'DOC-CF-2026'),
('SENA', '0000001', 'Cll 52', '00000', NULL, 'Servicio Nacional de Aprendizaje', 'ADM-SENA-2026', 'DOC-SENA-2026');



INSERT INTO usuarios (documento, id_institucion, id_tipo_doc, nombre, apellido, correo, contrasena, curso, id_rol) VALUES
('1000111222', 1, 1, 'Santiago', 'Peña', 'admin@colegio.edu.co', 'admin_123', NULL, 1), 
('79888999', 2, 1, 'Alberto', 'Gómez', 'alberto.gomez@colegio.edu.co', '0000', NULL, 1),  
('52333444', 1,1, 'Alejandra', 'Pinzón', 'aleja.pinzon@colegio.edu.co', '0000', NULL, 2),   
('1010444555', 2,1, 'Camilo', 'Sanz', 'camilo.sanz@colegio.edu.co', '0000', NULL, 2),     
('1020304050', 1,2, 'Daniela', 'Rojas', 'daniela.rojas@colegio.edu.co', '0000', '1101', 3), 
('1020304051', 1,2, 'Esteban', 'Quito', 'esteban.quito@colegio.edu.co', '0000', '1101', 3), 
('1020304052', 1,2, 'Fabián', 'Niño', 'fabian.nino@colegio.edu.co', '0000', '1102', 3),  
('1020304053', 1,3, 'Gabriela', 'Mistral', 'gabriela.mistral@colegio.edu.co', '00000', '1102', 3), 
('1020304054', 1,2, 'Hugo', 'Sánchez', 'hugo.sanchez@colegio.edu.co', '00000', '1001', 3),  
('1020304055', 2,4, 'Isabela', 'Santo', 'isabela.santo@colegio.edu.co', '0000', '1001', 3),  
('1020304056', 2,2, 'Juan', 'Valdez', 'juan.valdez@colegio.edu.co', '0000', '1002', 3),    
('1020304057', 2,1, 'Kevin', 'Flórez', 'kevin.florez@colegio.edu.co', '0000', '1002', 3);   



---ELECCIONES--------

INSERT INTO elecciones (titulo, descripcion, fecha_inicio, fecha_fin, id_estado_eleccion, id_institucion) VALUES
('Contralor', 'Elección del Contralor Estudiantil para el periodo vigente', '2026-03-01 08:00:00', '2026-03-01 16:00:00', 1, 1),
('Cabildante', 'Elección del Cabildante Estudiantil ante la localidad', '2026-03-01 08:00:00', '2026-03-01 16:00:00', 1, 1),
('Personero', 'Elección del Personero Estudiantil del colegio', '2026-03-01 08:00:00', '2026-03-01 16:00:00', 2, 1);





--CANDIDATOS------------------------



-- Eleccion 1: Contralor (candidatos 1-4)
INSERT INTO candidatos (id_usuario, propuesta, foto, id_eleccion) VALUES
(5, 'Transparencia total y rendición de cuentas mensual.', 'candidato1.jpg', 1),
(6, 'Auditoría mensual de recursos estudiantiles.', 'candidato2.jpg', 1),
(7, 'Buzón de sugerencias digital.', 'candidato3.jpg', 1),
(8, 'Mayor participación estudiantil en las decisiones.', 'candidato4.jpg', 1);
 
-- Eleccion 2: Cabildante (candidatos 5-8)
INSERT INTO candidatos (id_usuario, propuesta, foto, id_eleccion) VALUES
(9, 'Gestionar mejoras en la cafetería escolar.', 'candidato5.jpg', 2),
(10, 'Torneos deportivos intercursos.', 'candidato6.jpg', 2),
(11, 'Programas de reciclaje escolar.', 'candidato7.jpg', 2),
(12, 'Jornadas culturales mensuales.', 'candidato8.jpg', 2);
 
-- Eleccion 3: Personero (candidatos 9-12)
-- Nota: mismos estudiantes pueden postularse en elecciones distintas
-- (UNIQUE es por id_usuario + id_eleccion, no global).
INSERT INTO candidatos (id_usuario, propuesta, foto, id_eleccion) VALUES
(5, 'Defensa de los derechos estudiantiles.', 'candidato9.jpg', 3),
(7, 'Torneos de fútbol interclases.', 'candidato10.jpg', 3),
(9, 'Programas de bienestar estudiantil.', 'candidato11.jpg', 3),
(11, 'Fortalecer la convivencia escolar.', 'candidato12.jpg', 3);


------VOTOS---------------------------------


-- Eleccion 1 (candidatos 1-4) — 8 votos, incluye 1 blanco
INSERT INTO votos (id_eleccion, id_candidato) VALUES
(1, 1), (1, 1),
(1, 2), (1, 2),
(1, 3), (1, 3),
(1, 4),
(1, NULL);
 
-- Eleccion 2 (candidatos 5-8) — 8 votos, incluye 1 blanco
INSERT INTO votos (id_eleccion, id_candidato) VALUES
(2, 5), (2, 5),
(2, 6), (2, 6),
(2, 7), (2, 7),
(2, 8),
(2, NULL);
 
-- Eleccion 3 (candidatos 9-12) — 8 votos, incluye 1 blanco
INSERT INTO votos (id_eleccion, id_candidato) VALUES
(3, 9), (3, 9),
(3, 10), (3, 10),
(3, 11), (3, 11),
(3, 12),
(3, NULL);



---REGISTROS DE VOTACION-----------------
INSERT INTO registros_votacion (id_usuario, id_eleccion) VALUES
(5, 1), (6, 1), (7, 1), (8, 1), (9, 1), (10, 1), (11, 1), (12, 1),
(5, 2), (6, 2), (7, 2), (8, 2), (9, 2), (10, 2), (11, 2), (12, 2),
(5, 3), (6, 3), (7, 3), (8, 3), (9, 3), (10, 3), (11, 3), (12, 3);
  


-- Elección de prueba con fecha vigente (hoy)
INSERT INTO elecciones (titulo, descripcion, fecha_inicio, fecha_fin, id_estado_eleccion, id_institucion) VALUES
('Elección de Prueba', 'Elección de prueba para validar flujo de votación', '2026-09-06 00:00:00', '2026-09-06 23:59:59', 1, 1);

-- Candidatos para la elección de prueba (asumiendo que queda con id_eleccion = 4)
INSERT INTO candidatos (id_usuario, propuesta, foto, id_eleccion) VALUES
(5, 'Propuesta de prueba - candidato A', NULL, 4),
(6, 'Propuesta de prueba - candidato B', NULL, 4);

--Actualizaciones de usuarios con contraseña en hash

UPDATE usuarios SET contrasena = '$2b$12$TTfb/9miE1hQDsGbj5Yxk.M7Eo1RJTFpDYK/tyRVc4ZjnCOfsMXo6' WHERE correo = 'admin@colegio.edu.co';
UPDATE usuarios SET contrasena = '$2b$12$YTmkW8mcFA/Jv.oyklfqme57Cu64cp2dfN97uWhSxjEzZPAEfPNcy' WHERE correo = 'alberto.gomez@colegio.edu.co';
UPDATE usuarios SET contrasena = '$2b$12$8wsHZa.JPCIjVNaup5WMx.u/iK/2sNRqHBcLOmPLzbsW5E4DU0H8K' WHERE correo = 'aleja.pinzon@colegio.edu.co';
UPDATE usuarios SET contrasena = '$2b$12$gyuCz6P5/rJYKZt95x4KAeZhKx2KN.sgyPsVcme7StJcNpjm4FX5y' WHERE correo = 'camilo.sanz@colegio.edu.co';
UPDATE usuarios SET contrasena = '$2b$12$4Nw149E8k.T5vvec0WzawOtubTZ0AfLHS25BgUtwxjxIuovwh2bZ6' WHERE correo = 'daniela.rojas@colegio.edu.co';
UPDATE usuarios SET contrasena = '$2b$12$s0wyNhaz1wWTHvXB2hRO/.BkYTY/XscY4OaLIu3oXje2PbVVgertW' WHERE correo = 'esteban.quito@colegio.edu.co';
UPDATE usuarios SET contrasena = '$2b$12$cvn4vaMQZQtXDD355kd.6.FQL/U9kgOC/Kp4dE3/DJwX9GxZBzzgW' WHERE correo = 'fabian.nino@colegio.edu.co';
UPDATE usuarios SET contrasena = '$2b$12$xm/fzuvR9MN60wntcKsKDeytCst1Fy7Vg745xVzXti20K.pO2UO9C' WHERE correo = 'gabriela.mistral@colegio.edu.co';
UPDATE usuarios SET contrasena = '$2b$12$MtAUTliYJQV1pHJvrCCC5OT2f8RyDUJebAH6CVSoJqP422fV.PhJq' WHERE correo = 'hugo.sanchez@colegio.edu.co';
UPDATE usuarios SET contrasena = '$2b$12$wlZ94jtCbNeHjo7FXXzOfuO3utgOhAxLlq2Y9edBE2odAyOpf86za' WHERE correo = 'isabela.santo@colegio.edu.co';
UPDATE usuarios SET contrasena = '$2b$12$b/iDfp6bvSbgP217IFlpFOUKFSWFHmBGOEdV70MXwJh/u8biSUYu.' WHERE correo = 'juan.valdez@colegio.edu.co';
UPDATE usuarios SET contrasena = '$2b$12$erwSqKDM8iZjwHOtHuxU3uj9lBrR.OZYPwuc4lGxs5bXs85p5zKoC' WHERE correo = 'kevin.florez@colegio.edu.co';