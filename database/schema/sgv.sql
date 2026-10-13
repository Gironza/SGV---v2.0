-- ============================================================
-- SGV - Sistema de gestion de Votaciones
-- Script de Base de datos - consolidado (v2)
-- Es para crear la BD desde cero (Docker). Los catálogos
-- (roles, estados, tipos de documento) van en database/seeds.
-- ============================================================

--CREATE DATABASE SGV;

-- Conectarse con: \c SGV   (en psql)
-- o configurar la cadena de conexión en el backend (FastAPI/psycopg2).


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
    id_estado_eleccion INT DEFAULT 1 NOT NULL,
    id_institucion INT NOT NULL,
    FOREIGN KEY (id_institucion) REFERENCES instituciones(id_institucion),
    FOREIGN KEY (id_estado_eleccion) REFERENCES estados_eleccion(id_estado_eleccion)
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


CREATE TABLE votos (
    id_voto SERIAL PRIMARY KEY,
    id_eleccion INT NOT NULL,
    id_candidato INT NULL,
    fecha_voto TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
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