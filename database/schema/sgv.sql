-- ============================================================
-- SGV - Sistema de Gestión de Votaciones
-- Script base de la BD (v3): crea el esquema desde cero (Docker).
-- Ya incluye las migraciones 001 y 002: no hay que correrlas aparte.
-- Los catálogos (roles, estados, tipos de documento) van en database/seeds.
-- Requiere PostgreSQL 13 o superior (gen_random_uuid()).
-- ============================================================

CREATE TABLE instituciones(
    id_institucion SERIAL PRIMARY KEY,
    nombre varchar(256) NOT NULL,
    NIT varchar(15) UNIQUE,
    direccion varchar(50) NOT NULL,
    telefono varchar(15),
    correo varchar(256),
    descripcion text,
    codigo_admin VARCHAR UNIQUE,
    codigo_docente VARCHAR UNIQUE,
    fecha_actualizacion_cod TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE estados_eleccion (
    id_estado_eleccion INT PRIMARY KEY,
    nombre varchar(35)
);


CREATE TABLE estados_candidatura (
    id_estado_candidatura INT PRIMARY KEY,
    nombre VARCHAR(35) NOT NULL
);


CREATE TABLE roles (
    id_rol INT PRIMARY KEY,
    nombre VARCHAR(30) NOT NULL,
    descripcion VARCHAR(256)
);


CREATE TABLE tipos_documento(
    id_tipo_doc INT PRIMARY KEY,
    nombre VARCHAR(35) NOT NULL,
    descripcion VARCHAR(256)
);


CREATE TABLE usuarios (
    id_usuario SERIAL PRIMARY KEY,
    id_institucion INT NOT NULL,
    documento VARCHAR(20) UNIQUE NOT NULL,
    id_tipo_doc INT NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    correo VARCHAR(100) UNIQUE NOT NULL,
    contrasena VARCHAR(255) NOT NULL,
    curso VARCHAR(20),
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    id_rol INT NOT NULL,
    foto VARCHAR(255),  -- existe en la BD actual; el código aún no la usa
    FOREIGN KEY (id_institucion) REFERENCES instituciones(id_institucion),
    FOREIGN KEY (id_rol) REFERENCES roles(id_rol),
    FOREIGN KEY (id_tipo_doc) REFERENCES tipos_documento(id_tipo_doc)
);


CREATE TABLE elecciones (
    id_eleccion SERIAL PRIMARY KEY,
    titulo VARCHAR(150) NOT NULL,
    descripcion TEXT,
    fecha_inicio_inscripcion TIMESTAMP,
    fecha_fin_inscripcion TIMESTAMP,
    fecha_inicio TIMESTAMP NOT NULL,
    fecha_fin TIMESTAMP NOT NULL,
    fecha_publicacion_resultados TIMESTAMP,
    id_estado_eleccion INT DEFAULT 1 NOT NULL,   -- 1 Activa, 2 Finalizada, 3 Pendiente (pausa)
    id_institucion INT NOT NULL,
    FOREIGN KEY (id_institucion) REFERENCES instituciones(id_institucion),
    FOREIGN KEY (id_estado_eleccion) REFERENCES estados_eleccion(id_estado_eleccion),
    -- Migración 001: orden de las fechas. Las de inscripción pueden ser NULL
    -- (elecciones antiguas), pero si una viene, la otra también.
    CONSTRAINT chk_elecciones_orden_fechas CHECK (
        fecha_inicio < fecha_fin
        AND (fecha_inicio_inscripcion IS NULL) = (fecha_fin_inscripcion IS NULL)
        AND (fecha_inicio_inscripcion IS NULL
             OR fecha_inicio_inscripcion < fecha_fin_inscripcion)
        AND (fecha_fin_inscripcion IS NULL
             OR fecha_fin_inscripcion <= fecha_inicio)
    )
);


-- Cursos que pueden postularse o votar en cada elección.
-- Sin filas de un tipo = ese paso está abierto a todos los cursos.
CREATE TABLE elecciones_cursos (
    id_eleccion INT NOT NULL,
    curso VARCHAR(20) NOT NULL,
    tipo VARCHAR(12) NOT NULL CHECK (tipo IN ('postulacion', 'votacion')),
    PRIMARY KEY (id_eleccion, curso, tipo),
    FOREIGN KEY (id_eleccion) REFERENCES elecciones(id_eleccion) ON DELETE CASCADE
);


CREATE TABLE candidatos (
    id_candidato SERIAL PRIMARY KEY,
    id_usuario INT NOT NULL,
    id_eleccion INT NOT NULL,
    propuesta TEXT,
    foto VARCHAR(255),
    id_estado_candidatura INT NOT NULL DEFAULT 1,  -- 1 = Pendiente: toda candidatura nueva se revisa
    observaciones TEXT,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario),
    FOREIGN KEY (id_eleccion) REFERENCES elecciones(id_eleccion) ON DELETE CASCADE,
    FOREIGN KEY (id_estado_candidatura) REFERENCES estados_candidatura(id_estado_candidatura),
    UNIQUE(id_usuario, id_eleccion)
);


-- Voto secreto (migración 002): sin usuario, sin fecha y con id aleatorio,
-- para que no se pueda cruzar con registros_votacion.
CREATE TABLE votos (
    id_voto UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_eleccion INT NOT NULL,
    id_candidato INT NULL,  -- NULL = voto en blanco
    FOREIGN KEY (id_eleccion) REFERENCES elecciones(id_eleccion),
    FOREIGN KEY (id_candidato) REFERENCES candidatos(id_candidato)
);


CREATE TABLE registros_votacion(
    id_registro SERIAL PRIMARY KEY,
    id_usuario INT NOT NULL,
    id_eleccion INT NOT NULL,
    fecha_voto TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario),
    FOREIGN KEY (id_eleccion) REFERENCES elecciones(id_eleccion),
    CONSTRAINT uq_registro_usuario_eleccion UNIQUE (id_usuario, id_eleccion)
);