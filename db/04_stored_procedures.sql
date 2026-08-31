-- =============================================================================
-- 04_stored_procedures.sql
-- Procedimientos y funciones almacenadas.
--
--     psql -U libreria_owner -d libreria_db -f db/04_stored_procedures.sql
--
-- Criterio para llevar logica a la base de datos: SOLO se encapsula aqui lo que
-- debe ser atomico o lo que ninguna capa superior puede garantizar por si sola.
-- La logica de presentacion y el control de acceso NO viven aqui: viven en la
-- aplicacion. Meter reglas de negocio en la BD "porque se puede" duplica la
-- verdad en dos lugares.
--
-- Todos reciben parametros tipados; no construyen SQL concatenando texto.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- sp_guardar_libro
-- Alta o actualizacion de un libro CON sus autores y generos, en una sola
-- transaccion. Razon de existir: un libro con autores es una unidad. Si se
-- hicieran tres round-trips desde Node (INSERT libro, INSERT autores, INSERT
-- generos) y el segundo fallara, quedaria un libro sin autores en la base.
--
-- p_id NULL  -> alta.  p_id NOT NULL -> actualizacion.
-- Los autores y generos se reemplazan por completo (patron C12 de 03).
-- Devuelve el id del libro guardado.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION sp_guardar_libro(
    p_id           INTEGER,
    p_isbn         VARCHAR,
    p_titulo       VARCHAR,
    p_anio         SMALLINT,
    p_sinopsis     TEXT,
    p_precio       NUMERIC,
    p_stock        INTEGER,
    p_categoria_id INTEGER,
    p_formato_id   INTEGER,
    p_autores      INTEGER[],
    p_generos      INTEGER[]
) RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_id INTEGER;
BEGIN
    IF p_autores IS NULL OR array_length(p_autores, 1) IS NULL THEN
        RAISE EXCEPTION 'Un libro debe tener al menos un autor'
            USING ERRCODE = 'check_violation';
    END IF;

    IF p_id IS NULL THEN
        INSERT INTO libros (isbn, titulo, anio_publicacion, sinopsis,
                            precio, stock, categoria_id, formato_id)
        VALUES (p_isbn, p_titulo, p_anio, p_sinopsis,
                p_precio, p_stock, p_categoria_id, p_formato_id)
        RETURNING id INTO v_id;
    ELSE
        UPDATE libros
        SET isbn = p_isbn, titulo = p_titulo, anio_publicacion = p_anio,
            sinopsis = p_sinopsis, precio = p_precio, stock = p_stock,
            categoria_id = p_categoria_id, formato_id = p_formato_id
        WHERE id = p_id
        RETURNING id INTO v_id;

        IF v_id IS NULL THEN
            RAISE EXCEPTION 'No existe el libro %', p_id
                USING ERRCODE = 'no_data_found';
        END IF;
    END IF;

    -- Reemplazo completo de los vinculos N:M.
    DELETE FROM libros_autores WHERE libro_id = v_id;
    INSERT INTO libros_autores (libro_id, autor_id, orden)
    SELECT v_id, a.autor_id, a.orden
    FROM unnest(p_autores) WITH ORDINALITY AS a(autor_id, orden);

    DELETE FROM libros_generos WHERE libro_id = v_id;
    IF p_generos IS NOT NULL AND array_length(p_generos, 1) IS NOT NULL THEN
        INSERT INTO libros_generos (libro_id, genero_id)
        SELECT v_id, g FROM unnest(p_generos) AS g;
    END IF;

    RETURN v_id;
END;
$$;

COMMENT ON FUNCTION sp_guardar_libro IS
    'Alta/actualizacion atomica de un libro junto con sus autores y generos.';

-- -----------------------------------------------------------------------------
-- sp_guardar_concepto_libro
-- Registra un concepto para un libro. Si el termino no existe todavia en el
-- catalogo, lo crea; si ya existe, lo reutiliza. Razon de existir: "buscar y si
-- no existe insertar" hecho en dos consultas desde Node tiene una condicion de
-- carrera. ON CONFLICT lo resuelve en una sola sentencia.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION sp_guardar_concepto_libro(
    p_libro_id   INTEGER,
    p_termino    VARCHAR,
    p_definicion TEXT,
    p_capitulo   VARCHAR DEFAULT NULL,
    p_pagina     INTEGER DEFAULT NULL
) RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_concepto_id INTEGER;
BEGIN
    INSERT INTO conceptos (termino) VALUES (btrim(p_termino))
    ON CONFLICT (termino) DO UPDATE SET termino = EXCLUDED.termino
    RETURNING id INTO v_concepto_id;

    INSERT INTO libros_conceptos (libro_id, concepto_id, definicion, capitulo, pagina)
    VALUES (p_libro_id, v_concepto_id, p_definicion, p_capitulo, p_pagina)
    ON CONFLICT (libro_id, concepto_id) DO UPDATE
        SET definicion = EXCLUDED.definicion,
            capitulo   = EXCLUDED.capitulo,
            pagina     = EXCLUDED.pagina;

    RETURN v_concepto_id;
END;
$$;

COMMENT ON FUNCTION sp_guardar_concepto_libro IS
    'Registra termino + definicion para un libro, reutilizando el concepto si ya existe.';

-- -----------------------------------------------------------------------------
-- sp_ajustar_stock
-- Suma o resta existencias en una sola sentencia. Razon de existir: leer el
-- stock en Node, calcular y volver a escribir permite que dos peticiones
-- simultaneas lean el mismo valor y una sobreescriba a la otra. Aqui la
-- aritmetica ocurre dentro de la fila bloqueada por el propio UPDATE.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION sp_ajustar_stock(p_libro_id INTEGER, p_delta INTEGER)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_stock INTEGER;
BEGIN
    UPDATE libros SET stock = stock + p_delta
    WHERE id = p_libro_id
    RETURNING stock INTO v_stock;

    IF v_stock IS NULL THEN
        RAISE EXCEPTION 'No existe el libro %', p_libro_id
            USING ERRCODE = 'no_data_found';
    END IF;

    RETURN v_stock;   -- ck_libros_stock aborta antes si quedaria negativo
END;
$$;

COMMENT ON FUNCTION sp_ajustar_stock IS
    'Ajusta existencias de forma atomica; ck_libros_stock impide dejarlo negativo.';

-- -----------------------------------------------------------------------------
-- sp_marcar_portada
-- Marca una imagen como portada. El trigger trg_imagenes_portada_unica se
-- encarga de apagar la anterior; esta funcion existe para que la aplicacion
-- tenga una sola llamada y para validar que la imagen exista.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION sp_marcar_portada(p_imagen_id INTEGER)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_libro_id INTEGER;
BEGIN
    UPDATE imagenes_libros SET es_portada = TRUE
    WHERE id = p_imagen_id
    RETURNING libro_id INTO v_libro_id;

    IF v_libro_id IS NULL THEN
        RAISE EXCEPTION 'No existe la imagen %', p_imagen_id
            USING ERRCODE = 'no_data_found';
    END IF;

    RETURN v_libro_id;
END;
$$;

COMMENT ON FUNCTION sp_marcar_portada IS
    'Marca una imagen como portada del libro; el trigger apaga la anterior.';

-- -----------------------------------------------------------------------------
-- fn_buscar_libros
-- Busqueda por ISBN o por titulo (RF-05). Razon de existir: la regla de "ISBN
-- exacto ignorando guiones, o titulo parcial ignorando mayusculas" es una
-- decision del modelo de datos, no de la interfaz, y conviene que sea la misma
-- desde cualquier consumidor.
--
-- El parametro es texto tipado; jamas se concatena dentro de la consulta.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_buscar_libros(p_texto TEXT)
RETURNS TABLE (
    id INTEGER, isbn VARCHAR, titulo VARCHAR, anio_publicacion SMALLINT,
    precio NUMERIC, stock INTEGER, categoria VARCHAR, formato VARCHAR,
    autores TEXT, generos TEXT, portada VARCHAR
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
    -- Se declara en plpgsql y no en SQL a proposito: el cuerpo de una funcion
    -- SQL se valida al crearla, y v_libros_detalle todavia no existe cuando
    -- corre este archivo (se crea en 06_views.sql). El cuerpo plpgsql se
    -- resuelve en la primera ejecucion, cuando la vista ya esta.
    RETURN QUERY
    SELECT v.id, v.isbn, v.titulo, v.anio_publicacion, v.precio, v.stock,
           v.categoria, v.formato, v.autores, v.generos, v.portada
    FROM v_libros_detalle v
    WHERE p_texto IS NULL
       OR btrim(p_texto) = ''
       OR replace(v.isbn, '-', '') = replace(btrim(p_texto), '-', '')
       OR v.titulo  ILIKE '%' || btrim(p_texto) || '%'
       OR v.autores ILIKE '%' || btrim(p_texto) || '%'
    ORDER BY v.titulo;
END;
$$;

COMMENT ON FUNCTION fn_buscar_libros IS
    'Busca por ISBN exacto (sin guiones), titulo parcial o nombre de autor.';

-- fn_buscar_libros depende de v_libros_detalle, que se crea en 06_views.sql.
-- Por eso 06 se ejecuta despues y esta funcion no se invoca hasta entonces.
