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

-- Rol de aplicación: solo LOGIN. Sin SUPERUSER, CREATEDB, CREATEROLE ni BYPASSRLS.
\prompt 'Contraseña para libreria_app (no se mostrará en el repositorio): ' app_pw
CREATE ROLE libreria_app WITH LOGIN PASSWORD :'app_pw'
    NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOREPLICATION;

-- Rol dueño del esquema. Es quien ejecuta 01_schema.sql y quien puede hacer
-- DDL. No se usa desde la aplicación.
\prompt 'Contraseña para libreria_owner: ' owner_pw
CREATE ROLE libreria_owner WITH LOGIN PASSWORD :'owner_pw'
    NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION;

CREATE DATABASE libreria_db
    WITH OWNER = libreria_owner
         ENCODING = 'UTF8'
         LC_COLLATE = 'es_MX.UTF-8'
         LC_CTYPE = 'es_MX.UTF-8'
         TEMPLATE = template0;

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

-- Comprobación: libreria_app no debe tener ningún atributo de privilegio.
SELECT rolname, rolsuper, rolcreatedb, rolcreaterole
FROM pg_roles
WHERE rolname IN ('libreria_app', 'libreria_owner');
