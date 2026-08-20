# Librería Online — Documentación del Proyecto

Aplicación web monolítica para gestionar un catálogo de libros con autores, categorías, imágenes y conceptos asociados. Construida con Node.js + Express y PostgreSQL.

---

## Tabla de contenidos

1. [Estructura de archivos](#estructura-de-archivos)
2. [Configuración y arranque](#configuración-y-arranque)
3. [Base de datos](#base-de-datos)
4. [Rutas y endpoints](#rutas-y-endpoints)
5. [Autenticación y roles](#autenticación-y-roles)
6. [Subida de imágenes](#subida-de-imágenes)
7. [Estilos](#estilos)

---

## Estructura de archivos

```
ejercicio_guiado2/
├── index.js              # Punto de entrada: configura Express y registra las rutas
├── db.js                 # Pool de conexión a PostgreSQL (pg)
├── schema.sql            # DDL: CREATE TABLE de todas las tablas
├── demo.sql              # Datos de prueba (autores, libros, conceptos, usuarios)
├── package.json
├── public/
│   ├── css/
│   │   └── style.css     # Hoja de estilos global (una sola, compartida por todas las vistas)
│   └── uploads/          # Imágenes subidas por Multer (servidas como estáticos)
└── routes/
    ├── middleware.js      # Funciones requireLogin y requireAdmin
    ├── auth.js            # Login, registro y logout
    ├── libros.js          # CRUD completo de libros (ruta base: /libros)
    ├── autores.js         # CRUD completo de autores (ruta base: /autores)
    ├── categorias.js      # CRUD completo de categorías (ruta base: /categorias)
    ├── conceptos.js       # CRUD de conceptos ligados a un libro (ruta base: /conceptos)
    ├── imagenes.js        # Subida y borrado de imágenes de libros (ruta base: /imagenes)
    └── usuarios.js        # CRUD de usuarios (ruta base: /usuarios)
```

### Flujo general en `index.js`

```
Petición HTTP
  → express-session (sesión en memoria)
  → express.urlencoded (parseo de formularios)
  → express.static (archivos en /public)
  → Router correspondiente (auth / libros / autores / ...)
    → middleware requireLogin / requireAdmin (si aplica)
    → Consulta a PostgreSQL vía db.js
    → res.send(HTML) o res.redirect(...)
```

> Las vistas **no usan un motor de plantillas** (Pug, EJS, etc.). Cada ruta construye el HTML como template literal directamente en el archivo de ruta.

---

## Configuración y arranque

### Requisitos

- Node.js ≥ 18
- PostgreSQL ≥ 14

### Variables de conexión (`db.js`)

| Parámetro  | Valor actual     | Cómo cambiarlo                    |
|------------|------------------|-----------------------------------|
| `user`     | `libreria_user`  | Editar `db.js` línea 4            |
| `host`     | `localhost`      | Editar `db.js` línea 5            |
| `database` | `libreria_db`    | Editar `db.js` línea 6            |
| `password` | `666`            | Editar `db.js` línea 7            |
| `port`     | `5432`           | Editar `db.js` línea 8            |

> Para producción se recomienda mover estas credenciales a variables de entorno con `dotenv`.

### Pasos para levantar el proyecto

```bash
# 1. Instalar dependencias
npm install

# 2. Crear la base de datos y las tablas
psql -U libreria_user -d libreria_db -f schema.sql

# 3. (Opcional) Cargar datos de prueba
psql -U libreria_user -d libreria_db -f demo.sql

# 4. Arrancar el servidor
node index.js
# → http://localhost:3000
```

---

## Base de datos

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
  es_principal  ← BOOLEAN, solo una imagen puede ser principal por libro

conceptos
  id (PK)
  libro_id      → libros(id)      ON DELETE CASCADE
  termino
  definicion
```

### Detalles de cada tabla

#### `usuarios`
- `rol` controla el acceso: `'lector'` solo puede leer/editar; `'admin'` tiene acceso a todo (la distinción actual solo está en `requireAdmin` del middleware).
- `password_hash` usa **bcrypt** con 10 rondas de sal.

#### `libros`
- Tabla central del sistema. Las FK a `autores` y `categorias` son `SET NULL` al borrar (el libro se conserva sin autor/categoría).
- `imagenes_libros` y `conceptos` se borran en **CASCADE** al eliminar el libro.

#### `imagenes_libros`
- `ruta_archivo` solo guarda el **nombre del archivo** (ej. `1718000000000.jpg`), no la ruta completa. La URL pública es `/uploads/<ruta_archivo>`.
- Al marcar una imagen como `es_principal=TRUE` la ruta primero pone todas las demás en `FALSE` antes de insertar la nueva.

#### `conceptos`
- Son glosarios específicos de cada libro (término + definición).
- No tienen su propia página de listado; se muestran en la vista de detalle del libro (`GET /libros/:id`).

---

## Rutas y endpoints

### Autenticación (`routes/auth.js`)

| Método | Ruta        | Descripción                                      |
|--------|-------------|--------------------------------------------------|
| GET    | `/`         | Redirige a `/libros` si hay sesión, si no a `/login` |
| GET    | `/login`    | Formulario de inicio de sesión                   |
| POST   | `/login`    | Valida credenciales con bcrypt, crea sesión      |
| GET    | `/registro` | Formulario de registro de nuevo usuario          |
| POST   | `/registro` | Inserta usuario con hash de contraseña           |
| GET    | `/logout`   | Destruye la sesión y redirige a `/login`         |

### Libros (`routes/libros.js`) — requiere `requireLogin`

| Método | Ruta                  | Descripción                                           |
|--------|-----------------------|-------------------------------------------------------|
| GET    | `/libros`             | Lista todos los libros (con JOIN a autores y categorías) |
| GET    | `/libros/nuevo`       | Formulario de creación                                |
| POST   | `/libros`             | Inserta un libro nuevo                                |
| GET    | `/libros/:id`         | Detalle del libro + imágenes + conceptos              |
| GET    | `/libros/:id/editar`  | Formulario de edición                                 |
| POST   | `/libros/:id/editar`  | Actualiza el libro                                    |
| POST   | `/libros/:id/eliminar`| Elimina el libro (cascade borra imágenes y conceptos) |

### Autores (`routes/autores.js`) — requiere `requireLogin`

| Método | Ruta                   | Descripción            |
|--------|------------------------|------------------------|
| GET    | `/autores`             | Lista todos los autores |
| GET    | `/autores/nuevo`       | Formulario de creación  |
| POST   | `/autores`             | Inserta autor           |
| GET    | `/autores/:id/editar`  | Formulario de edición   |
| POST   | `/autores/:id/editar`  | Actualiza autor         |
| POST   | `/autores/:id/eliminar`| Elimina autor           |

### Categorías (`routes/categorias.js`) — requiere `requireLogin`

| Método | Ruta                      | Descripción               |
|--------|---------------------------|---------------------------|
| GET    | `/categorias`             | Lista todas las categorías |
| GET    | `/categorias/nuevo`       | Formulario de creación     |
| POST   | `/categorias`             | Inserta categoría          |
| GET    | `/categorias/:id/editar`  | Formulario de edición      |
| POST   | `/categorias/:id/editar`  | Actualiza categoría        |
| POST   | `/categorias/:id/eliminar`| Elimina categoría          |

### Conceptos (`routes/conceptos.js`) — requiere `requireLogin`

| Método | Ruta                        | Descripción                                      |
|--------|-----------------------------|--------------------------------------------------|
| GET    | `/conceptos/nuevo/:libro_id`| Formulario de nuevo concepto ligado a un libro   |
| POST   | `/conceptos/:libro_id`      | Inserta concepto y redirige al detalle del libro |
| GET    | `/conceptos/:id/editar`     | Formulario de edición                            |
| POST   | `/conceptos/:id/editar`     | Actualiza concepto y redirige al libro           |
| POST   | `/conceptos/:id/eliminar`   | Elimina concepto y redirige al libro             |

### Imágenes (`routes/imagenes.js`) — requiere `requireLogin`

| Método | Ruta                       | Descripción                                         |
|--------|----------------------------|-----------------------------------------------------|
| GET    | `/imagenes/nuevo/:libro_id`| Formulario de subida de imagen                      |
| POST   | `/imagenes/:libro_id`      | Sube archivo con Multer y registra en BD            |
| POST   | `/imagenes/:id/eliminar`   | Elimina el registro de BD (no borra el archivo físico) |

### Usuarios (`routes/usuarios.js`) — requiere `requireLogin`

| Método | Ruta                      | Descripción                                        |
|--------|---------------------------|----------------------------------------------------|
| GET    | `/usuarios`               | Lista todos los usuarios                            |
| GET    | `/usuarios/nuevo`         | Formulario de creación con selección de rol        |
| POST   | `/usuarios`               | Inserta usuario con hash                           |
| GET    | `/usuarios/:id/editar`    | Formulario de edición (contraseña opcional)        |
| POST   | `/usuarios/:id/editar`    | Actualiza; solo rehashea si se envía contraseña    |
| POST   | `/usuarios/:id/eliminar`  | Elimina usuario                                    |

---

## Autenticación y roles

El sistema usa **`express-session`** con almacenamiento en memoria (se pierde al reiniciar el servidor).

```js
// Datos guardados en req.session.usuario al hacer login
{ id, nombre, rol }
```

### Middleware (`routes/middleware.js`)

| Función        | Comportamiento                                                   |
|----------------|------------------------------------------------------------------|
| `requireLogin` | Redirige a `/login` si no hay sesión activa                      |
| `requireAdmin` | Redirige a `/login` si no hay sesión; muestra error si `rol !== 'admin'` |

> `requireAdmin` está definido pero **no se usa en ninguna ruta actualmente** (todos los endpoints solo usan `requireLogin`). Si quieres proteger rutas para administradores, reemplaza `requireLogin` por `requireAdmin` en los routers correspondientes.

### Roles disponibles

| Rol      | Descripción                            |
|----------|----------------------------------------|
| `lector` | Valor por defecto al registrarse       |
| `admin`  | Asignado manualmente en `/usuarios`    |

---

## Subida de imágenes

Gestionada con **Multer** en `routes/imagenes.js`.

- **Destino:** `public/uploads/` (carpeta servida como estático)
- **Nombre de archivo:** timestamp Unix + extensión original (ej. `1718000000000.jpg`)
- **Formatos permitidos:** `.jpg`, `.jpeg`, `.png`, `.gif`, `.webp`
- **Límite de tamaño:** ninguno configurado actualmente

Para cambiar la carpeta de destino, editar línea 9 de `routes/imagenes.js`.  
Para agregar límite de tamaño, añadir `limits: { fileSize: 5 * 1024 * 1024 }` al objeto de opciones de `multer()`.

---

## Estilos

Un único archivo CSS en [`public/css/style.css`](public/css/style.css). Todas las vistas lo enlazan con:

```html
<link rel="stylesheet" href="/css/style.css">
```

No hay framework CSS ni preprocesador. Para modificar el diseño global, editar ese archivo directamente.
