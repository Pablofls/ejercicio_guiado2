-- =============================================================================
-- 03_all_quieries_before_stored_procedures.sql
-- Todas las consultas que la aplicacion necesita, escritas primero como SQL
-- plano. Este archivo es el paso intermedio del diseno: aqui se comprueba que
-- el modelo 4FN responde a cada requisito ANTES de encapsular nada en
-- procedimientos almacenados (04) o vistas (06).
--
--     psql -U libreria_owner -d libreria_db -f db/03_all_quieries_before_stored_procedures.sql
--
-- Las consultas llevan literales solo para poder ejecutarse aqui. En la
-- aplicacion, cada una de estas viaja parametrizada ($1, $2...): ver
-- src/modules/<modulo>/<modulo>.model.js. Nunca se concatena valor del usuario.
-- =============================================================================

\echo '== C01: catalogo completo con autores y generos agregados =='
-- Un solo recorrido con agregacion: string_agg sobre cada tabla puente. Se usan
-- subconsultas laterales en lugar de dos JOIN directos porque unir autores y
-- generos a la vez multiplica las filas (producto cartesiano de las dos DMV).
SELECT l.id, l.isbn, l.titulo, l.anio_publicacion, l.precio, l.stock,
       c.nombre AS categoria, f.nombre AS formato,
       aut.autores, gen.generos, img.nombre_archivo AS portada
FROM libros l
JOIN categorias c ON c.id = l.categoria_id
JOIN formatos   f ON f.id = l.formato_id
LEFT JOIN LATERAL (
    SELECT string_agg(a.nombre, ', ' ORDER BY la.orden) AS autores
    FROM libros_autores la JOIN autores a ON a.id = la.autor_id
    WHERE la.libro_id = l.id
) aut ON TRUE
LEFT JOIN LATERAL (
    SELECT string_agg(g.nombre, ', ' ORDER BY g.nombre) AS generos
    FROM libros_generos lg JOIN generos g ON g.id = lg.genero_id
    WHERE lg.libro_id = l.id
) gen ON TRUE
LEFT JOIN LATERAL (
    SELECT i.nombre_archivo FROM imagenes_libros i
    WHERE i.libro_id = l.id ORDER BY i.es_portada DESC, i.id LIMIT 1
) img ON TRUE
ORDER BY l.titulo
LIMIT 10;

\echo '== C02: busqueda por ISBN y titulo (RF-05) =='
-- Un solo parametro cubre los dos casos: coincidencia exacta de ISBN o
-- coincidencia parcial de titulo, sin distinguir mayusculas ni guiones.
-- En la aplicacion el literal es $1; aqui va fijo para poder ejecutarla.
SELECT l.id, l.isbn, l.titulo
FROM libros l
WHERE replace(l.isbn, '-', '') = replace('978-607-32-2345-6', '-', '')
   OR l.titulo ILIKE '%' || 'normaliza' || '%'
ORDER BY l.titulo;

\echo '== C03: caracteres especiales, prueba de parametrizacion =='
-- Cadena con comilla simple y con la carga clasica de inyeccion. Al viajar como
-- parametro NO cierra la cadena ni ejecuta nada: devuelve cero filas.
SELECT count(*) AS coincidencias
FROM libros
WHERE titulo ILIKE '%' || $$' OR 1=1; DROP TABLE libros; --$$ || '%';

\echo '== C04: detalle de un libro =='
SELECT l.*, c.nombre AS categoria, f.nombre AS formato
FROM libros l
JOIN categorias c ON c.id = l.categoria_id
JOIN formatos   f ON f.id = l.formato_id
WHERE l.id = 1;

\echo '== C05: autores de un libro, en orden de portada =='
SELECT a.id, a.nombre, a.nacionalidad, la.orden
FROM libros_autores la JOIN autores a ON a.id = la.autor_id
WHERE la.libro_id = 1 ORDER BY la.orden;

\echo '== C06: generos de un libro =='
SELECT g.id, g.nombre
FROM libros_generos lg JOIN generos g ON g.id = lg.genero_id
WHERE lg.libro_id = 1 ORDER BY g.nombre;

\echo '== C07: conceptos y definiciones de un libro (RF-08) =='
-- La definicion sale de la tabla puente, no del catalogo de conceptos.
SELECT co.termino, lc.definicion, lc.capitulo, lc.pagina
FROM libros_conceptos lc JOIN conceptos co ON co.id = lc.concepto_id
WHERE lc.libro_id = 1 ORDER BY co.termino;

\echo '== C08: el mismo concepto definido distinto en libros distintos =='
-- Evidencia de por que la definicion NO puede vivir en `conceptos`.
SELECT co.termino, l.titulo, left(lc.definicion, 70) || '...' AS definicion
FROM libros_conceptos lc
JOIN conceptos co ON co.id = lc.concepto_id
JOIN libros    l  ON l.id  = lc.libro_id
WHERE co.termino IN ('IaaS', 'Bucket', 'Serverless')
ORDER BY co.termino, l.titulo;

\echo '== C09: imagenes de un libro =='
SELECT id, nombre_archivo, tipo_mime, tamano_bytes, texto_alternativo, es_portada
FROM imagenes_libros WHERE libro_id = 1 ORDER BY es_portada DESC, id;

\echo '== C10: login, busqueda del usuario por correo =='
-- Solo trae lo necesario. La comparacion del hash la hace bcrypt en Node,
-- nunca la base de datos.
SELECT id, nombre, email, password_hash, rol, activo
FROM usuarios WHERE lower(email) = lower('admin@libreria.udem.mx');

\echo '== C11: altas =='
-- INSERT ... RETURNING evita una segunda consulta para recuperar el id.
INSERT INTO autores (nombre, biografia, nacionalidad)
VALUES ('Autor de prueba C11', 'Alta de ejemplo del archivo 03.', 'Mexicana')
RETURNING id, nombre;

INSERT INTO generos (nombre, descripcion)
VALUES ('Genero de prueba C11', 'Alta de ejemplo del archivo 03.')
RETURNING id, nombre;

\echo '== C12: vincular autores y generos a un libro (reemplazo completo) =='
-- Patron usado por la aplicacion al guardar un libro: borrar los vinculos
-- previos y volver a insertarlos. Es idempotente y evita comparar diferencias.
BEGIN;
DELETE FROM libros_autores WHERE libro_id = 30;
INSERT INTO libros_autores (libro_id, autor_id, orden) VALUES (30, 18, 1), (30, 19, 2);
DELETE FROM libros_generos WHERE libro_id = 30;
INSERT INTO libros_generos (libro_id, genero_id) VALUES (30, 29), (30, 8);
COMMIT;

\echo '== C13: actualizacion de un libro =='
UPDATE libros
SET titulo = titulo, precio = precio, stock = stock, actualizado_en = NOW()
WHERE id = 30
RETURNING id, titulo, precio, stock;

\echo '== C14: control de stock sin condicion de carrera =='
-- El stock se calcula en la propia sentencia (stock = stock - 1), no leyendo
-- primero en Node: dos peticiones simultaneas no pueden dejarlo negativo.
-- El CHECK ck_libros_stock es la red de seguridad final.
UPDATE libros SET stock = stock - 1 WHERE id = 30 AND stock > 0
RETURNING id, stock;

\echo '== C15: inventario por categoria =='
SELECT c.nombre AS categoria, count(l.id) AS titulos,
       coalesce(sum(l.stock), 0) AS ejemplares,
       coalesce(round(avg(l.precio), 2), 0) AS precio_promedio
FROM categorias c LEFT JOIN libros l ON l.categoria_id = c.id
GROUP BY c.nombre HAVING count(l.id) > 0 ORDER BY titulos DESC;

\echo '== C16: libros sin autor asignado (control de calidad de datos) =='
SELECT l.id, l.titulo
FROM libros l
WHERE NOT EXISTS (SELECT 1 FROM libros_autores la WHERE la.libro_id = l.id);

\echo '== C17: cuantos administradores hay (debe ser 1) =='
SELECT rol, count(*) FROM usuarios GROUP BY rol ORDER BY rol;

\echo '== C18: limpieza de las altas de prueba de C11/C12 =='
DELETE FROM autores WHERE nombre = 'Autor de prueba C11';
DELETE FROM generos WHERE nombre = 'Genero de prueba C11';

\echo '== C19..C24: PRUEBAS NEGATIVAS DE INTEGRIDAD =='
-- Cada bloque ejecuta una sentencia que DEBE fallar y captura el error de
-- PostgreSQL. El resultado esperado es el mensaje, no el exito.

\echo '-- C19: ISBN duplicado -> esperado 23505 unique_violation'
DO $$ BEGIN
    INSERT INTO libros (isbn, titulo, precio, stock, categoria_id, formato_id)
    VALUES ('978-0-13-609181-2', 'Duplicado de ISBN', 100, 1, 1, 1);
    RAISE NOTICE 'FALLO LA PRUEBA: se acepto un ISBN duplicado';
EXCEPTION WHEN unique_violation THEN
    RAISE NOTICE 'OK C19 -> %  (%)', SQLERRM, SQLSTATE;
END $$;

\echo '-- C20: stock negativo -> esperado 23514 check_violation'
DO $$ BEGIN
    UPDATE libros SET stock = -5 WHERE id = 1;
    RAISE NOTICE 'FALLO LA PRUEBA: se acepto stock negativo';
EXCEPTION WHEN check_violation THEN
    RAISE NOTICE 'OK C20 -> %  (%)', SQLERRM, SQLSTATE;
END $$;

\echo '-- C21: precio invalido -> esperado 23514 check_violation'
DO $$ BEGIN
    UPDATE libros SET precio = -1 WHERE id = 1;
    RAISE NOTICE 'FALLO LA PRUEBA: se acepto precio negativo';
EXCEPTION WHEN check_violation THEN
    RAISE NOTICE 'OK C21 -> %  (%)', SQLERRM, SQLSTATE;
END $$;

\echo '-- C22: FK inexistente -> esperado 23503 foreign_key_violation'
DO $$ BEGIN
    INSERT INTO libros_autores (libro_id, autor_id) VALUES (1, 999999);
    RAISE NOTICE 'FALLO LA PRUEBA: se acepto una FK inexistente';
EXCEPTION WHEN foreign_key_violation THEN
    RAISE NOTICE 'OK C22 -> %  (%)', SQLERRM, SQLSTATE;
END $$;

\echo '-- C23: borrar una categoria con libros -> esperado 23503 (ON DELETE RESTRICT)'
DO $$ BEGIN
    DELETE FROM categorias WHERE id = 1;
    RAISE NOTICE 'FALLO LA PRUEBA: se borro una categoria con libros';
EXCEPTION WHEN foreign_key_violation THEN
    RAISE NOTICE 'OK C23 -> %  (%)', SQLERRM, SQLSTATE;
END $$;

\echo '-- C24: segundo administrador -> esperado 23505 por ux_usuarios_admin_unico'
DO $$ BEGIN
    INSERT INTO usuarios (nombre, email, password_hash, rol)
    VALUES ('Segundo admin', 'segundo.admin@libreria.udem.mx',
            '$2b$10$c/yES5ffi.7RI/BtxEDfhezl6Sc39xn9JnMyyuGYH3GTtIjXVi.vG', 'admin');
    RAISE NOTICE 'FALLO LA PRUEBA: se creo un segundo administrador';
EXCEPTION WHEN unique_violation THEN
    RAISE NOTICE 'OK C24 -> %  (%)', SQLERRM, SQLSTATE;
END $$;

\echo '-- C25: contrasena en claro en password_hash -> esperado 23514'
DO $$ BEGIN
    INSERT INTO usuarios (nombre, email, password_hash, rol)
    VALUES ('Sin hash', 'sin.hash@libreria.udem.mx', 'textoplano', 'lector');
    RAISE NOTICE 'FALLO LA PRUEBA: se acepto una contrasena sin hashear';
EXCEPTION WHEN check_violation THEN
    RAISE NOTICE 'OK C25 -> %  (%)', SQLERRM, SQLSTATE;
END $$;

\echo '== Fin de 03. Ninguna de las pruebas negativas debe decir FALLO LA PRUEBA. =='
