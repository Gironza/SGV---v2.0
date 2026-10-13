--SELECTS 
select * from estado_eleccion;
select * from roles; 

--Mostrar infromacion de los usuarios con su rol 
SELECT 
    u.id_usuario,
    i.nombre AS institucion, ---Es Opcional ver la institucion, ya que el Administrador solo manejara una institucion, en discucion
    td.nombre AS tipo_documento, 
    u.documento,
    u.nombre,
    u.apellido,
    u.correo,
    u.curso,
    r.nombre AS rol_sistema       
FROM 
    usuarios AS u 
INNER JOIN 
    tipo_documento AS td ON u.id_tipo_doc = td.id_tipo_doc
INNER JOIN 
    roles AS r ON u.id_rol = r.id_rol
INNER JOIN 
    institucion AS i ON u.id_institucion = i.id_institucion
WHERE 
    u.id_institucion = 1 ------> Se Puede filtrar de acuerdo al colegio en el que este 
ORDER BY
    u.id_usuario ASC;

---Mostrar las elecciones de acuerdo con su estado
SELECT
    e.id_eleccion,
    e.titulo,
    e.fecha_inicio,
    e.fecha_fin,
    es.nombre AS estado
FROM 
    elecciones AS e 
INNER JOIN
    estado_eleccion AS es ON e.id_estado_eleccion = es.id_estado_eleccion
WHERE 
    e.id_institucion = 1 ------> Filtro de Institucion 
ORDER BY 
    e.id_eleccion ASC;


---Mostrar la informacion de las candidatos y el numero de votos efectuados 
SELECT 
    c.id_candidato, 
    c.nombre,
    c.apellido,
    c.propuesta,
    c.foto, 
    e.titulo AS Eleccion_inscrita,
    COUNT(v.id_voto) AS total_votos 
FROM 
    candidatos AS c
INNER JOIN 
    elecciones AS e ON c.id_eleccion = e.id_eleccion
LEFT JOIN 
    votos AS v ON c.id_candidato = v.id_candidato
GROUP BY 
    c.id_candidato, c.nombre, c.apellido, e.titulo
WHERE 
    e.id_institucion = 1  ------> Filtro de Institucion
ORDER BY 
    e.titulo, total_votos DESC;
