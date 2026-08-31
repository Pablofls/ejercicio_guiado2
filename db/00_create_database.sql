-- =============================================================================
-- 00_create_database.sql
-- Crea la base de datos y el usuario de aplicación con privilegios mínimos.
--
-- Se ejecuta UNA sola vez, conectado como superusuario (postgres):
--     sudo -u postgres psql -f db/00_create_database.sql
--
-- Regla del ejercicio: la aplicación NUNCA se conecta con un superusuario.
-- libreria_app solo puede leer y escribir filas en las tablas del esquema
-- public; no es dueño de las tablas, así que no puede hacer DROP ni ALTER.
--
-- La contraseña de libreria_app NO se escribe en este archivo (repositorio
-- público). Se define a mano en la VM con el bloque \prompt de abajo y se
-- guarda únicamente en el .env de la VM, que no está versionado.
-- =============================================================================

-- Es idempotente: se puede volver a ejecutar sin romper nada. Los roles y la
-- base sólo se crean si no existen; si ya existen, se les fija la contraseña
-- que se escriba en el prompt.

-- Rol de aplicación: solo LOGIN. Sin SUPERUSER, CREATEDB, CREATEROLE ni BYPASSRLS.
\prompt 'Contraseña para libreria_app (no se mostrará en el repositorio): ' app_pw
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'libreria_app') THEN
        CREATE ROLE libreria_app WITH LOGIN
            NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOREPLICATION;
    END IF;
END $$;
ALTER ROLE libreria_app WITH PASSWORD :'app_pw';

-- Rol dueño del esquema. Es quien ejecuta 01_schema.sql y quien puede hacer
-- DDL. No se usa desde la aplicación.
\prompt 'Contraseña para libreria_owner: ' owner_pw
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'libreria_owner') THEN
        CREATE ROLE libreria_owner WITH LOGIN
            NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION;
    END IF;
END $$;
ALTER ROLE libreria_owner WITH PASSWORD :'owner_pw';

-- CREATE DATABASE no admite IF NOT EXISTS ni puede ir dentro de un bloque DO,
-- así que se genera la sentencia sólo cuando hace falta y se ejecuta con \gexec.
SELECT 'CREATE DATABASE libreria_db WITH OWNER = libreria_owner '
       'ENCODING = ''UTF8'' TEMPLATE = template0'
WHERE NOT EXISTS (SELECT 1 FROM pg_database WHERE datname = 'libreria_db')
\gexec

-- Si la base ya existía con otro dueño, se traspasa a libreria_owner.
ALTER DATABASE libreria_db OWNER TO libreria_owner;

COMMENT ON DATABASE libreria_db IS
    'Librería Online - Integración de Aplicaciones Computacionales (UDEM)';

-- Nadie más que el dueño crea objetos en public.
\connect libreria_db
REVOKE ALL ON SCHEMA public FROM PUBLIC;
GRANT USAGE ON SCHEMA public TO libreria_app;

-- Que libreria_app pueda usar las secuencias SERIAL y leer/escribir filas.
-- Se aplica como DEFAULT para las tablas que 01_schema.sql creará después.
ALTER DEFAULT PRIVILEGES FOR ROLE libreria_owner IN SCHEMA public
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO libreria_app;
ALTER DEFAULT PRIVILEGES FOR ROLE libreria_owner IN SCHEMA public
    GRANT USAGE, SELECT ON SEQUENCES TO libreria_app;
ALTER DEFAULT PRIVILEGES FOR ROLE libreria_owner IN SCHEMA public
    GRANT EXECUTE ON FUNCTIONS TO libreria_app;

-- Y para las tablas que YA existan (caso de una base previa): los DEFAULT
-- PRIVILEGES sólo aplican a lo que se cree después.
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES    IN SCHEMA public TO libreria_app;
GRANT USAGE, SELECT                  ON ALL SEQUENCES IN SCHEMA public TO libreria_app;
GRANT EXECUTE                        ON ALL FUNCTIONS IN SCHEMA public TO libreria_app;

-- Comprobación: libreria_app no debe tener ningún atributo de privilegio.
SELECT rolname, rolsuper, rolcreatedb, rolcreaterole
FROM pg_roles
WHERE rolname IN ('libreria_app', 'libreria_owner');
