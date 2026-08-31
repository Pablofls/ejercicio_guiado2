# Librería Online — Documentación del Proyecto

Aplicación web monolítica para gestionar un catálogo de libros con autores, categorías, imágenes y conceptos asociados. Construida con Node.js + Express y PostgreSQL, siguiendo el patrón **MVC** organizado por módulos.

> **El proyecto se hospeda en GCP y la base de datos vive ahí, en la máquina virtual.** No existe una base de datos local: todo cambio de esquema o de datos se escribe en `db/pending/` y solo es real cuando se ejecuta en la VM. Ver [Hosting en GCP](#hosting-en-gcp) y [Flujo de cambios en la base de datos](#flujo-de-cambios-en-la-base-de-datos).

---

## Tabla de contenidos

1. [Arquitectura](#arquitectura)
2. [Hosting en GCP](#hosting-en-gcp)
3. [Estructura de archivos](#estructura-de-archivos)
4. [Configuración y arranque](#configuración-y-arranque)
5. [Base de datos](#base-de-datos)
6. [Flujo de cambios en la base de datos](#flujo-de-cambios-en-la-base-de-datos)
7. [Rutas y endpoints](#rutas-y-endpoints)
8. [Autenticación y roles](#autenticación-y-roles)
9. [Subida de imágenes](#subida-de-imágenes)
10. [Cómo agregar un módulo nuevo](#cómo-agregar-un-módulo-nuevo)
11. [Estilos](#estilos)

---

## Arquitectura

El proyecto aplica tres decisiones de diseño combinadas:

| Decisión | Descripción |
|---|---|
| **Monolito** | Una sola aplicación Node.js desplegable; sin microservicios ni APIs separadas |
| **MVC** | Cada módulo separa responsabilidades en Model · Views · Controller · Routes |
| **Organización por módulos** | El código se agrupa por dominio (libros, autores…), no por tipo de archivo |

### Flujo de una petición HTTP

```
Petición HTTP
  → express-session      (sesión en memoria)
  → express.urlencoded   (parseo de formularios)
  → express.static       (archivos en /public)
  → *.routes.js          (mapea URL → función de controller)
    → requireLogin / requireAdmin  (src/shared/middleware.js)
    → *.controller.js    (orquesta: llama al model y pasa datos a la view)
      → *.model.js       (consultas SQL a PostgreSQL vía db.js)
      → *.views.js       (genera el HTML como string y lo devuelve)
    → res.send(HTML) o res.redirect(...)
```

> Las vistas no usan motor de plantillas (Pug, EJS, etc.). Cada `*.views.js` genera HTML con template literals. El helper `src/shared/layout.js` evita repetir el `<html>/<head>/<body>` en cada vista.

---

## Hosting en GCP

Tanto la aplicación como la base de datos corren en **Google Cloud Platform**, sobre una máquina virtual. PostgreSQL está instalado en esa misma VM.

| Elemento | Ubicación |
|---|---|
| Aplicación Node.js | VM en GCP |
| PostgreSQL | La misma VM |
| Archivos subidos (`public/uploads/`) | Disco de la VM |
| Credenciales (`.env`) | Solo en la VM, fuera de git |

### Consecuencias prácticas

- **No hay base de datos local.** El esquema real es el que corre en la VM. Un `CREATE TABLE` en `schema.sql` no existe hasta que se ejecuta allá.
- **`DB_HOST` depende de desde dónde te conectes.** Con la app corriendo dentro de la VM es `localhost`. Para conectarte desde tu equipo hace falta la IP de la VM con el puerto de PostgreSQL abierto en el firewall, o un túnel SSH.
- **Las imágenes viven en el disco de la VM**, no en Cloud Storage. Si la VM se recrea sin conservar el disco, se pierden.
- El repositorio nunca guarda credenciales. El `.env` se crea a mano en la VM y está en `.gitignore`.

---

## Estructura de archivos

```
ejercicio_guiado2/
├── index.js                          # Entrada: configura Express y registra los módulos
├── db.js                             # Pool de conexión a PostgreSQL (pg)
├── schema.sql                        # DDL: CREATE TABLE de todas las tablas
├── demo.sql                          # Datos de prueba (autores, libros, conceptos, usuarios)
├── package.json
├── db/                               # Cambios SQL versionados (ver flujo más abajo)
│   ├── pending/                      # SQL escrito, aún NO ejecutado en la VM
│   └── applied/                      # SQL ya ejecutado en la VM
├── public/
│   ├── css/
│   │   └── style.css                 # Hoja de estilos global compartida por todas las vistas
│   └── uploads/                      # Imágenes subidas por Multer (servidas como estáticos)
└── src/
    ├── shared/
    │   ├── layout.js                 # Helper page(title, content) → HTML completo
    │   └── middleware.js             # requireLogin y requireAdmin
    └── modules/
        ├── auth/
        │   ├── auth.model.js         # findByEmail, createUser, verifyPassword
        │   ├── auth.views.js         # loginView, registroView
        │   ├── auth.controller.js    # getLogin, postLogin, getRegistro, postRegistro, getLogout
        │   └── auth.routes.js        # GET/POST /, /login, /registro, /logout
        ├── libros/
        │   ├── libros.model.js       # getAll, getById, getImagenes, getConceptos, create, update, remove
        │   ├── libros.views.js       # listaView, formularioView, detalleView
        │   ├── libros.controller.js  # getLista, getNuevo, postCrear, getDetalle, getEditar, postActualizar, postEliminar
        │   └── libros.routes.js      # CRUD /libros
        ├── autores/
        │   ├── autores.model.js      # getAll, getById, create, update, remove
        │   ├── autores.views.js      # listaView, formularioView
        │   ├── autores.controller.js # getLista, getNuevo, postCrear, getEditar, postActualizar, postEliminar
        │   └── autores.routes.js     # CRUD /autores
        ├── categorias/
        │   ├── categorias.model.js
        │   ├── categorias.views.js
        │   ├── categorias.controller.js
        │   └── categorias.routes.js  # CRUD /categorias
        ├── conceptos/
        │   ├── conceptos.model.js    # getById, create, update, remove
        │   ├── conceptos.views.js    # formularioNuevoView, formularioEditarView
        │   ├── conceptos.controller.js
        │   └── conceptos.routes.js   # CRUD /conceptos (ligado a un libro)
        ├── imagenes/
        │   ├── imagenes.model.js     # create (con lógica de es_principal), remove
        │   ├── imagenes.views.js     # formularioView
        │   ├── imagenes.controller.js # configura Multer + getNuevo, postSubir, postEliminar
        │   └── imagenes.routes.js    # POST /imagenes/:libro_id (con uploadMiddleware)
        └── usuarios/
            ├── usuarios.model.js     # getAll, getById, create, update (rehash opcional), remove
            ├── usuarios.views.js     # listaView, formularioView
            ├── usuarios.controller.js
            └── usuarios.routes.js    # CRUD /usuarios
```

### Responsabilidad de cada capa MVC

| Capa | Archivo | Responsabilidad |
|---|---|---|
| **Model** | `*.model.js` | Todo el SQL. Devuelve datos puros. No conoce HTTP ni HTML |
| **View** | `*.views.js` | Genera strings HTML a partir de datos. No hace queries |
| **Controller** | `*.controller.js` | Orquesta: llama al model, pasa resultado a la view, envía respuesta |
| **Routes** | `*.routes.js` | Solo mapea método HTTP + URL → función del controller (+ middleware) |
| **Shared** | `src/shared/` | `layout.js` (wrapper HTML) y `middleware.js` (guards de sesión) |

---

## Configuración y arranque

### Requisitos

- Node.js ≥ 18
- PostgreSQL ≥ 14

### Variables de entorno (`.env`)

Las credenciales de la base de datos se configuran mediante un archivo `.env` en la raíz del proyecto. Este archivo **no se sube a git** (está en `.gitignore`) y `db.js` no define valores por defecto: sin `.env` la aplicación no conecta.

| Variable      | Valor en la VM    | Descripción                                                        |
|---------------|-------------------|--------------------------------------------------------------------|
| `DB_USER`     | `libreria_user`   | Usuario de PostgreSQL                                              |
| `DB_HOST`     | `localhost`       | `localhost` desde la propia VM; la IP de la VM si te conectas desde fuera |
| `DB_NAME`     | `libreria_db`     | Nombre de la base de datos                                         |
| `DB_PASSWORD` | *(ver la VM)*     | Contraseña del usuario — no se documenta aquí                      |
| `DB_PORT`     | `5432`            | Puerto de PostgreSQL                                               |

### Pasos para levantar el proyecto

Los pasos 3 y 4 son solo para el **primer montaje** o para recrear el entorno desde cero. En la VM de GCP la base de datos ya existe: ahí el trabajo del día a día es el descrito en [Flujo de cambios en la base de datos](#flujo-de-cambios-en-la-base-de-datos).

```bash
# 1. Instalar dependencias
npm install

# 2. Crear el archivo .env con las credenciales
cat > .env << 'EOF'
DB_USER=libreria_user
DB_HOST=localhost
DB_NAME=libreria_db
DB_PASSWORD=tu_password
DB_PORT=5432
EOF

# 3. Crear la base de datos y las tablas (solo primer montaje)
psql -U libreria_user -d libreria_db -f schema.sql

# 4. (Opcional) Cargar datos de prueba
psql -U libreria_user -d libreria_db -f demo.sql

# 5. Arrancar el servidor
node index.js
# → http://localhost:3000
```

---

## Base de datos

El esquema se define en [`schema.sql`](schema.sql). La base de datos real corre en la VM de GCP: `schema.sql` y el diagrama de esta sección son su documentación y **deben mantenerse sincronizados a mano** con cada cambio aplicado (ver [Flujo de cambios en la base de datos](#flujo-de-cambios-en-la-base-de-datos)).

### Diagrama de relaciones

```
usuarios
  id (PK)
  nombre
  email (UNIQUE)
  password_hash
  rol             ← 'lector' | 'admin'
  creado_en

autores                    categorias
  id (PK)                    id (PK)
  nombre                     nombre (UNIQUE)
  biografia                  descripcion
  nacionalidad

libros
  id (PK)
  titulo
  isbn (UNIQUE)
  anio_publicacion
  sinopsis
  stock
  autor_id      → autores(id)     ON DELETE SET NULL
  categoria_id  → categorias(id)  ON DELETE SET NULL
  creado_en

imagenes_libros
  id (PK)
  libro_id      → libros(id)      ON DELETE CASCADE
  ruta_archivo                   ← nombre del archivo en /public/uploads/
  descripcion
  es_principal  ← BOOLEAN, solo una puede ser principal por libro

conceptos
  id (PK)
  libro_id      → libros(id)      ON DELETE CASCADE
  termino
  definicion
```

### Detalles de cada tabla

#### `usuarios`
- `rol` controla el acceso: `'lector'` o `'admin'`.
- `password_hash` usa **bcrypt** con 10 rondas de sal.

#### `libros`
- Tabla central del sistema. Las FK a `autores` y `categorias` son `SET NULL` al borrar (el libro se conserva sin autor/categoría).
- `imagenes_libros` y `conceptos` se borran en **CASCADE** al eliminar el libro.

#### `imagenes_libros`
- `ruta_archivo` guarda solo el **nombre del archivo** (ej. `1718000000000.jpg`). La URL pública es `/uploads/<ruta_archivo>`.
- Al marcar `es_principal=TRUE`, el model primero pone todas las demás en `FALSE` (`imagenes.model.js`).

#### `conceptos`
- Glosario específico de cada libro (término + definición).
- No tienen listado propio; se muestran en la vista de detalle del libro (`GET /libros/:id`).

---

## Flujo de cambios en la base de datos

La base de datos vive en la VM de GCP y **la aplicación nunca modifica el esquema por su cuenta**. Todo SQL que haya que correr se escribe primero en un archivo dentro de `db/pending/` y espera ahí hasta que se ejecuta a mano en la VM.

### Carpetas

| Carpeta | Contenido |
|---|---|
| `db/pending/` | SQL escrito pero **todavía no ejecutado** en la VM |
| `db/applied/` | SQL que **ya se ejecutó** en la base de datos de la VM |

### Regla

> Si un cambio del sistema toca la base de datos — tabla nueva, columna nueva, índice, `ALTER`, corrección de datos — el `.sql` correspondiente se crea en `db/pending/`. Nada se mueve a `db/applied/` hasta confirmar que la query corrió en la VM sin error.

### Nombre de los archivos

`YYYYMMDD-descripcion-corta.sql`, para que el orden de ejecución sea evidente:

```
db/pending/20260830-agrega-tabla-resenas.sql
db/pending/20260901-indices-en-fks.sql
```

Cada archivo empieza con un comentario que explica qué hace y por qué.

### Ciclo completo

1. **Escribir** el `.sql` en `db/pending/`.

2. **Ejecutar** en la VM, en orden de fecha:

   ```bash
   psql -U libreria_user -d libreria_db -f db/pending/20260830-agrega-tabla-resenas.sql
   ```

3. **Mover** el archivo a `db/applied/` en cuanto se confirma que corrió — basta con avisarle a Claude que la query ya se ejecutó:

   ```bash
   git mv db/pending/20260830-agrega-tabla-resenas.sql db/applied/
   ```

4. **Actualizar [`schema.sql`](schema.sql)** para que refleje el estado final de las tablas.

5. **Actualizar el [diagrama de relaciones](#diagrama-de-relaciones)** de este README.

6. **Un solo commit** con las tres cosas: el archivo movido, `schema.sql` y el README.

### Los pasos 4 y 5 no son opcionales

`schema.sql` y el diagrama de relaciones son la única documentación del esquema, y nada los valida automáticamente contra la VM. Si se saltan:

- `schema.sql` deja de servir para levantar el proyecto desde cero.
- El diagrama del README empieza a describir una base de datos que ya no existe.

Los archivos de `db/applied/` son historial: no se editan ni se vuelven a correr. Si algo hay que corregir, se escribe un archivo nuevo en `db/pending/`.

---

## Rutas y endpoints

### Autenticación (`src/modules/auth/`)

| Método | Ruta        | Controller            | Descripción                              |
|--------|-------------|-----------------------|------------------------------------------|
| GET    | `/`         | `getRoot`             | Redirige a `/libros` o `/login`          |
| GET    | `/login`    | `getLogin`            | Formulario de inicio de sesión           |
| POST   | `/login`    | `postLogin`           | Valida credenciales, crea sesión         |
| GET    | `/registro` | `getRegistro`         | Formulario de registro                   |
| POST   | `/registro` | `postRegistro`        | Inserta usuario con hash de contraseña   |
| GET    | `/logout`   | `getLogout`           | Destruye la sesión                       |

### Libros (`src/modules/libros/`) — requiere `requireLogin`

| Método | Ruta                   | Controller       | Descripción                                        |
|--------|------------------------|------------------|----------------------------------------------------|
| GET    | `/libros`              | `getLista`       | Lista todos los libros (JOIN autores + categorías) |
| GET    | `/libros/nuevo`        | `getNuevo`       | Formulario de creación                             |
| POST   | `/libros`              | `postCrear`      | Inserta libro nuevo                                |
| GET    | `/libros/:id`          | `getDetalle`     | Detalle + imágenes + conceptos del libro           |
| GET    | `/libros/:id/editar`   | `getEditar`      | Formulario de edición                              |
| POST   | `/libros/:id/editar`   | `postActualizar` | Actualiza el libro                                 |
| POST   | `/libros/:id/eliminar` | `postEliminar`   | Elimina libro (cascade: imágenes y conceptos)      |

### Autores (`src/modules/autores/`) — requiere `requireLogin`

| Método | Ruta                    | Controller       | Descripción          |
|--------|-------------------------|------------------|----------------------|
| GET    | `/autores`              | `getLista`       | Lista autores        |
| GET    | `/autores/nuevo`        | `getNuevo`       | Formulario creación  |
| POST   | `/autores`              | `postCrear`      | Inserta autor        |
| GET    | `/autores/:id/editar`   | `getEditar`      | Formulario edición   |
| POST   | `/autores/:id/editar`   | `postActualizar` | Actualiza autor      |
| POST   | `/autores/:id/eliminar` | `postEliminar`   | Elimina autor        |

### Categorías (`src/modules/categorias/`) — requiere `requireLogin`

| Método | Ruta                       | Controller       | Descripción            |
|--------|----------------------------|------------------|------------------------|
| GET    | `/categorias`              | `getLista`       | Lista categorías       |
| GET    | `/categorias/nuevo`        | `getNuevo`       | Formulario creación    |
| POST   | `/categorias`              | `postCrear`      | Inserta categoría      |
| GET    | `/categorias/:id/editar`   | `getEditar`      | Formulario edición     |
| POST   | `/categorias/:id/editar`   | `postActualizar` | Actualiza categoría    |
| POST   | `/categorias/:id/eliminar` | `postEliminar`   | Elimina categoría      |

### Conceptos (`src/modules/conceptos/`) — requiere `requireLogin`

| Método | Ruta                          | Controller       | Descripción                              |
|--------|-------------------------------|------------------|------------------------------------------|
| GET    | `/conceptos/nuevo/:libro_id`  | `getNuevo`       | Formulario de nuevo concepto             |
| POST   | `/conceptos/:libro_id`        | `postCrear`      | Inserta concepto, redirige al libro      |
| GET    | `/conceptos/:id/editar`       | `getEditar`      | Formulario de edición                    |
| POST   | `/conceptos/:id/editar`       | `postActualizar` | Actualiza concepto, redirige al libro    |
| POST   | `/conceptos/:id/eliminar`     | `postEliminar`   | Elimina concepto, redirige al libro      |

### Imágenes (`src/modules/imagenes/`) — requiere `requireLogin`

| Método | Ruta                        | Controller    | Descripción                                         |
|--------|-----------------------------|---------------|-----------------------------------------------------|
| GET    | `/imagenes/nuevo/:libro_id` | `getNuevo`    | Formulario de subida de imagen                      |
| POST   | `/imagenes/:libro_id`       | `postSubir`   | Sube archivo (Multer) y registra en BD              |
| POST   | `/imagenes/:id/eliminar`    | `postEliminar`| Elimina registro de BD (no borra el archivo físico) |

### Usuarios (`src/modules/usuarios/`) — requiere `requireLogin`

| Método | Ruta                      | Controller       | Descripción                                      |
|--------|---------------------------|------------------|--------------------------------------------------|
| GET    | `/usuarios`               | `getLista`       | Lista todos los usuarios                         |
| GET    | `/usuarios/nuevo`         | `getNuevo`       | Formulario de creación con selección de rol      |
| POST   | `/usuarios`               | `postCrear`      | Inserta usuario con hash                         |
| GET    | `/usuarios/:id/editar`    | `getEditar`      | Formulario de edición (contraseña opcional)      |
| POST   | `/usuarios/:id/editar`    | `postActualizar` | Actualiza; solo rehashea si se envía contraseña  |
| POST   | `/usuarios/:id/eliminar`  | `postEliminar`   | Elimina usuario                                  |

---

## Autenticación y roles

El sistema usa **`express-session`** con almacenamiento en memoria (se pierde al reiniciar el servidor).

```js
// Datos guardados en req.session.usuario al hacer login
{ id, nombre, rol }
```

### Middleware (`src/shared/middleware.js`)

| Función        | Comportamiento                                                          |
|----------------|-------------------------------------------------------------------------|
| `requireLogin` | Redirige a `/login` si no hay sesión activa                             |
| `requireAdmin` | Redirige a `/login` si no hay sesión; error si `rol !== 'admin'`        |

> `requireAdmin` está definido pero **no se usa en ninguna ruta actualmente**. Para proteger una ruta para administradores, reemplaza `requireLogin` por `requireAdmin` en el archivo `*.routes.js` correspondiente.

### Roles disponibles

| Rol      | Descripción                         |
|----------|-------------------------------------|
| `lector` | Valor por defecto al registrarse    |
| `admin`  | Asignado manualmente en `/usuarios` |

---

## Subida de imágenes

Gestionada con **Multer** en `src/modules/imagenes/imagenes.controller.js`.

- **Destino:** `public/uploads/` (carpeta servida como estático)
- **Nombre de archivo:** timestamp Unix + extensión original (ej. `1718000000000.jpg`)
- **Formatos permitidos:** `.jpg`, `.jpeg`, `.png`, `.gif`, `.webp`
- **Límite de tamaño:** ninguno configurado actualmente

Para cambiar la carpeta de destino, editar la propiedad `destination` del `diskStorage` en `imagenes.controller.js`.  
Para agregar límite de tamaño, añadir `limits: { fileSize: 5 * 1024 * 1024 }` al objeto de opciones de `multer()`.

---

## Cómo agregar un módulo nuevo

Ejemplo: agregar un módulo `reseñas`.

1. **BD** — añadir `CREATE TABLE reseñas (...)` en `schema.sql` y ejecutarlo.

2. **Crear los 4 archivos del módulo:**

```
src/modules/reseñas/
├── reseñas.model.js       ← funciones SQL (getAll, getById, create, update, remove)
├── reseñas.views.js       ← funciones que devuelven HTML (listaView, formularioView…)
├── reseñas.controller.js  ← orquesta model + views, exporta una función por endpoint
└── reseñas.routes.js      ← importa controller y middleware, define GET/POST
```

3. **Registrar en `index.js`:**

```js
app.use('/reseñas', require('./src/modules/reseñas/reseñas.routes'));
```

---

## Estilos

Un único archivo CSS en [`public/css/style.css`](public/css/style.css). Todas las vistas lo reciben a través del helper `layout.js`, que inserta automáticamente:

```html
<link rel="stylesheet" href="/css/style.css">
```

No hay framework CSS ni preprocesador. Para modificar el diseño global, editar ese archivo directamente.
