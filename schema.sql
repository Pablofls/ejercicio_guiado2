-- Tabla de usuarios
CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    rol VARCHAR(20) DEFAULT 'lector',
    creado_en TIMESTAMP DEFAULT NOW()
);

-- Tabla de autores
CREATE TABLE autores (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    biografia TEXT,
    nacionalidad VARCHAR(80)
);

-- Tabla de categorias
CREATE TABLE categorias (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(80) UNIQUE NOT NULL,
    descripcion TEXT
);

-- Tabla de libros
CREATE TABLE libros (
    id SERIAL PRIMARY KEY,
    titulo VARCHAR(200) NOT NULL,
    isbn VARCHAR(20) UNIQUE,
    anio_publicacion INT,
    sinopsis TEXT,
    stock INT DEFAULT 0,
    autor_id INT REFERENCES autores(id) ON DELETE SET NULL,
    categoria_id INT REFERENCES categorias(id) ON DELETE SET NULL,
    creado_en TIMESTAMP DEFAULT NOW()
);

-- Tabla de imagenes de libros
CREATE TABLE imagenes_libros (
    id SERIAL PRIMARY KEY,
    libro_id INT REFERENCES libros(id) ON DELETE CASCADE,
    ruta_archivo TEXT NOT NULL,
    descripcion VARCHAR(200),
    es_principal BOOLEAN DEFAULT FALSE
);

-- Tabla de conceptos asociados a libros
CREATE TABLE conceptos (
    id SERIAL PRIMARY KEY,
    libro_id INT REFERENCES libros(id) ON DELETE CASCADE,
    termino VARCHAR(150) NOT NULL,
    definicion TEXT NOT NULL
);
