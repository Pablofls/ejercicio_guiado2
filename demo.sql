-- Autores
INSERT INTO autores (nombre, biografia, nacionalidad) VALUES
('Gabriel García Márquez', 'Escritor colombiano, Premio Nobel de Literatura 1982.', 'Colombiana'),
('J.K. Rowling', 'Autora británica de la saga Harry Potter.', 'Británica'),
('George Orwell', 'Escritor inglés conocido por sus obras distópicas.', 'Británica'),
('Isabel Allende', 'Escritora chilena, una de las más leídas en español.', 'Chilena'),
('Haruki Murakami', 'Novelista japonés de fama mundial.', 'Japonesa');

-- Categorias
INSERT INTO categorias (nombre, descripcion) VALUES
('Realismo Mágico', 'Literatura que mezcla realidad con elementos fantásticos.'),
('Fantasía', 'Obras de ficción con elementos mágicos y mundos imaginarios.'),
('Distopía', 'Narrativa que retrata sociedades futuras opresivas.'),
('Romance', 'Historias centradas en relaciones sentimentales.'),
('Ciencia Ficción', 'Narrativa basada en avances científicos o tecnológicos.');

-- Libros
INSERT INTO libros (titulo, isbn, anio_publicacion, sinopsis, stock, autor_id, categoria_id) VALUES
('Cien años de soledad', '978-0-06-088328-7', 1967, 'La historia de la familia Buendía a lo largo de siete generaciones en el pueblo de Macondo.', 15, 1, 1),
('El amor en los tiempos del cólera', '978-0-14-303943-3', 1985, 'Una historia de amor que dura más de cincuenta años entre Florentino Ariza y Fermina Daza.', 10, 1, 4),
('Harry Potter y la piedra filosofal', '978-0-7475-3269-9', 1997, 'Un joven huérfano descubre que es mago y comienza sus estudios en Hogwarts.', 25, 2, 2),
('Harry Potter y la cámara secreta', '978-0-7475-3849-3', 1998, 'Harry regresa a Hogwarts para enfrentarse a misteriosos ataques contra los estudiantes.', 20, 2, 2),
('1984', '978-0-45-228423-4', 1949, 'En un estado totalitario, Winston Smith trabaja reescribiendo la historia para el Partido.', 12, 3, 3),
('Rebelión en la granja', '978-0-45-228424-1', 1945, 'Una alegoría política donde los animales se rebelan contra sus opresores humanos.', 8, 3, 3),
('La casa de los espíritus', '978-0-15-602498-9', 1982, 'Saga familiar que narra cuatro generaciones de mujeres en un país latinoamericano.', 9, 4, 1),
('Norwegian Wood', '978-0-37-570437-3', 1987, 'Una historia de amor y pérdida ambientada en el Tokio de los años sesenta.', 7, 5, 4);

-- Conceptos para Cien años de soledad
INSERT INTO conceptos (libro_id, termino, definicion) VALUES
(1, 'Macondo', 'Pueblo ficticio fundado por José Arcadio Buendía, escenario principal de la novela.'),
(1, 'Realismo mágico', 'Técnica narrativa donde eventos sobrenaturales se presentan como parte natural de la realidad.'),
(1, 'Soledad', 'Tema central que acompaña a cada miembro de la familia Buendía a lo largo de las generaciones.');

-- Conceptos para 1984
INSERT INTO conceptos (libro_id, termino, definicion) VALUES
(5, 'Gran Hermano', 'Figura simbólica del líder omnipresente del Partido que vigila a todos los ciudadanos.'),
(5, 'Doblepensar', 'Capacidad de sostener simultáneamente dos creencias contradictorias y aceptar ambas.'),
(5, 'Neolengua', 'Idioma artificial creado por el Partido para limitar el pensamiento libre de los ciudadanos.');

-- Conceptos para Harry Potter
INSERT INTO conceptos (libro_id, termino, definicion) VALUES
(3, 'Hogwarts', 'Escuela de magia y hechicería donde estudian los jóvenes magos.'),
(3, 'Muggle', 'Término para referirse a personas sin habilidades mágicas.'),
(3, 'Quidditch', 'Deporte mágico que se juega en escobas voladoras.');

-- Usuarios de prueba (ambos con la contraseña: password)
INSERT INTO usuarios (nombre, email, password_hash, rol) VALUES
('Administrador', 'admin@libreria.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin'),
('Juan Lector', 'juan@ejemplo.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'lector');
