-- =============================================================================
-- 05_triggers.sql
-- Disparadores. Cada uno protege una regla que la aplicacion podria olvidar.
--
--     psql -U libreria_owner -d libreria_db -f db/05_triggers.sql
--
-- Un trigger no sustituye a una restriccion declarativa: donde un UNIQUE o un
-- CHECK bastan, se usa la restriccion (es mas barata y no se puede evadir).
-- Los triggers de aqui existen para lo que una restriccion no puede expresar:
-- modificar OTRAS filas, o dar un mensaje de error legible.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Un solo administrador  (RF-11, defensa en base de datos)
-- La defensa dura es el indice unico parcial ux_usuarios_admin_unico de
-- 01_schema.sql. Este trigger corre ANTES y solo mejora el mensaje: sin el, el
-- usuario veria "duplicate key value violates unique constraint".
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_un_solo_admin() RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.rol = 'admin' THEN
        IF EXISTS (SELECT 1 FROM usuarios
                   WHERE rol = 'admin' AND id IS DISTINCT FROM NEW.id) THEN
            RAISE EXCEPTION
                'Ya existe un Administrador. El sistema admite como maximo uno.'
                USING ERRCODE = 'unique_violation';
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_un_solo_admin ON usuarios;
CREATE TRIGGER trg_un_solo_admin
    BEFORE INSERT OR UPDATE OF rol ON usuarios
    FOR EACH ROW EXECUTE FUNCTION fn_un_solo_admin();

-- -----------------------------------------------------------------------------
-- 2. Nunca quedarse sin administrador
-- Simetrico al anterior: impide borrar o degradar al unico admin, que dejaria
-- el sistema sin nadie capaz de administrarlo. Esto NO se puede expresar con
-- una restriccion declarativa: depende del resto de la tabla.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_conservar_admin() RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF OLD.rol = 'admin' AND (TG_OP = 'DELETE' OR NEW.rol <> 'admin') THEN
        IF NOT EXISTS (SELECT 1 FROM usuarios
                       WHERE rol = 'admin' AND id <> OLD.id) THEN
            RAISE EXCEPTION
                'No se puede dejar el sistema sin Administrador.'
                USING ERRCODE = 'restrict_violation';
        END IF;
    END IF;
    RETURN CASE TG_OP WHEN 'DELETE' THEN OLD ELSE NEW END;
END;
$$;

DROP TRIGGER IF EXISTS trg_conservar_admin ON usuarios;
CREATE TRIGGER trg_conservar_admin
    BEFORE DELETE OR UPDATE OF rol ON usuarios
    FOR EACH ROW EXECUTE FUNCTION fn_conservar_admin();

-- -----------------------------------------------------------------------------
-- 3. Una sola portada por libro  (RF-09)
-- ux_imagenes_portada_unica impide que haya dos, pero por si solo hace fallar
-- el UPDATE. Este trigger apaga la portada anterior antes de encender la nueva:
-- convierte un error en el comportamiento esperado. Toca OTRAS filas, cosa que
-- una restriccion no puede hacer.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_portada_unica() RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.es_portada THEN
        UPDATE imagenes_libros
        SET es_portada = FALSE
        WHERE libro_id = NEW.libro_id
          AND id IS DISTINCT FROM NEW.id
          AND es_portada;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_portada_unica ON imagenes_libros;
CREATE TRIGGER trg_portada_unica
    BEFORE INSERT OR UPDATE OF es_portada ON imagenes_libros
    FOR EACH ROW EXECUTE FUNCTION fn_portada_unica();

-- -----------------------------------------------------------------------------
-- 4. Promover portada al borrar la actual
-- Si se elimina la imagen que era portada y quedan otras, una de ellas pasa a
-- serlo. Evita que el catalogo muestre el marcador de "sin portada" teniendo
-- imagenes disponibles.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_promover_portada() RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF OLD.es_portada THEN
        UPDATE imagenes_libros
        SET es_portada = TRUE
        WHERE id = (SELECT id FROM imagenes_libros
                    WHERE libro_id = OLD.libro_id AND id <> OLD.id
                    ORDER BY id LIMIT 1);
    END IF;
    RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_promover_portada ON imagenes_libros;
CREATE TRIGGER trg_promover_portada
    AFTER DELETE ON imagenes_libros
    FOR EACH ROW EXECUTE FUNCTION fn_promover_portada();

-- -----------------------------------------------------------------------------
-- 5. Sello de modificacion en libros
-- actualizado_en debe reflejar el ultimo cambio real, venga de la aplicacion,
-- de un procedimiento o de psql. Dejarlo a cargo del codigo garantiza que
-- alguna ruta se olvide de ponerlo.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_sello_actualizacion() RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.actualizado_en := NOW();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_libros_actualizado ON libros;
CREATE TRIGGER trg_libros_actualizado
    BEFORE UPDATE ON libros
    FOR EACH ROW EXECUTE FUNCTION fn_sello_actualizacion();

-- -----------------------------------------------------------------------------
-- 6. Normalizar el correo de los usuarios
-- Guarda el correo en minusculas y sin espacios. Sin esto, uq_usuarios_email
-- dejaria pasar 'Admin@x.com' y 'admin@x.com' como dos cuentas distintas.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_normalizar_email() RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.email  := lower(btrim(NEW.email));
    NEW.nombre := btrim(NEW.nombre);
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_normalizar_email ON usuarios;
CREATE TRIGGER trg_normalizar_email
    BEFORE INSERT OR UPDATE OF email, nombre ON usuarios
    FOR EACH ROW EXECUTE FUNCTION fn_normalizar_email();

-- Inventario de disparadores creados.
SELECT c.relname AS tabla, t.tgname AS disparador
FROM pg_trigger t JOIN pg_class c ON c.oid = t.tgrelid
WHERE NOT t.tgisinternal AND c.relnamespace = 'public'::regnamespace
ORDER BY 1, 2;
