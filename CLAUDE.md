# CLAUDE.md

Librería Online — app monolítica Node.js + Express + **EJS** + PostgreSQL,
patrón MVC organizado por módulos de dominio.
Documentación completa en [README.md](README.md).

## Regla crítica: cambios en la base de datos

La base de datos **no es local**: corre en PostgreSQL instalado en una VM de GCP,
donde también está clonado el repo y corre la app. No hay conexión a la BD desde
este entorno y no se dispone de sus credenciales — nunca asumas que puedes
ejecutar una query ni verificar el esquema real.

Por eso, **todo SQL se escribe pero no se ejecuta**:

1. Cualquier cambio que toque la BD (tabla nueva, columna, índice, `ALTER`,
   corrección de datos) se escribe como archivo en `db/pending/`.
2. Nombre: `YYYYMMDD-descripcion-corta.sql`, con un comentario al inicio
   explicando qué hace y por qué.
3. `db/applied/` es historial de lo ya ejecutado en la VM. Mueve ahí un archivo
   de `db/pending/` con `git mv` **en cuanto el usuario confirme que ya corrió la
   query** en la VM — nunca antes ni por tu cuenta. Tampoco edites los que ya
   están.
4. Si algo aplicado hay que corregir, se escribe un archivo nuevo en
   `db/pending/`, no se modifica el viejo.
5. **Nunca escribas una credencial en claro en el `.sql`, ni siquiera en los
   comentarios.** Va el hash y nada más; el comentario dice qué hace la query, no
   cuál es el valor.

En el mismo cambio, siempre:

- Actualizar [`db/01_schema.sql`](db/01_schema.sql) para que refleje el estado
  final de las tablas.
- Actualizar el **diagrama de relaciones** del README (sección "Base de datos").

Nada valida `db/01_schema.sql` contra la VM automáticamente: si se saltan esos
dos pasos, la documentación del esquema queda mintiendo. Ver
[Flujo de cambios en la base de datos](README.md#flujo-de-cambios-en-la-base-de-datos).

### Scripts canónicos de `db/`

`db/00…06_*.sql` reconstruyen la base desde cero y **son entregables del
ejercicio**: se ejecutan en ese orden y no se reordenan. Ojo con dos detalles ya
resueltos, para no reintroducirlos:

- `fn_buscar_libros` (en `04`) lee de `v_libros_detalle` (creada en `06`). Está
  declarada en `plpgsql`, no en `sql`, porque el cuerpo de una función `sql` se
  valida al crearla y la vista todavía no existe en ese momento.
- `02` siembra imágenes con `es_portada = true` **antes** de que existan los
  triggers de `05`. Es correcto; no muevas el orden.

## Arquitectura

| Directorio | Responsabilidad |
|---|---|
| `app.js` | Inicialización de Express, middleware general, montaje de rutas, arranque |
| `config/` | `env.js` (lee y valida `.env`) · `db.js` (Pool único de `pg`). **Nada más lee `process.env`** |
| `middleware/` | `auth.js` · `locals.js` (CSRF) · `subidas.js` (Multer) · `errores.js` |
| `services/` | `validacion.js` (validación server-side) · `crudCatalogo.js` (lógica común de catálogos) |
| `src/modules/<n>/` | Un dominio: `<n>.model.js` · `<n>.controller.js` · `<n>.routes.js` |
| `views/` | Plantillas EJS. `views/parciales/` para lo compartido |
| `public/` `uploads/` | Estáticos · imágenes subidas (fuera de `public/`) |
| `db/` `deploy/` `docs/` `tests/` | SQL · configuración de despliegue · documentación · pruebas |

Cada módulo de dominio tiene exactamente tres archivos JS:

| Archivo | Responsabilidad |
|---|---|
| `*.model.js` | Todo el SQL (parametrizado). Devuelve datos puros, no conoce HTTP ni HTML |
| `*.controller.js` | Valida, llama al model, elige la vista y responde. Sin SQL ni HTML |
| `*.routes.js` | Mapea método + URL → controller, con middleware. Sin lógica |

Las vistas viven en `views/<modulo>/*.ejs`, no dentro del módulo: es donde
Express las busca y comparten parciales entre dominios.

Un módulo nuevo se registra en [app.js](app.js) con
`app.use('/ruta', require('./src/modules/<nombre>/<nombre>.routes'));`.

Al agregar código, sigue el patrón del módulo vecino más parecido en vez de
introducir estructuras nuevas. Si el módulo es un catálogo simple
(`nombre` + `descripcion`), su controller se resuelve con
`services/crudCatalogo.js` y sus vistas con `views/catalogo/`.

## Convenciones

- **EJS renderizado en el servidor.** Sin JSON ni XML entre navegador y servidor;
  no hay `express.json()` a propósito.
- **Escapado.** Usa siempre `<%= %>`, que escapa. `<%- %>` se reserva
  **exclusivamente** para `include` de parciales, nunca para datos.
- **Prefijo de rutas.** Todo enlace y todo `action` se construye como
  `<%= base %>/…`, y todo `redirect` como `res.locals.base + '/…'`. Sin eso, la
  app se rompe al publicarse bajo `/library` en la VM.
- **CSRF.** Todo formulario que escribe incluye
  `<%- include('../parciales/csrf') %>`. Para `multipart/form-data`,
  `verificarCsrf` va **después** de `subirImagen` en la ruta (el token viaja en
  el cuerpo y sólo existe una vez que Multer lo parseó).
- **Sin ORM:** `pg` directo, siempre con queries parametrizadas (`$1`, `$2`…).
  Ninguna consulta concatena valores del usuario.
- **Validación server-side obligatoria.** Todo lo que entra por `req.body` pasa
  por `services/validacion.js`. Los formularios llevan `novalidate`: la
  validación del navegador es ayuda visual, no control.
- **Errores.** Los controllers async se envuelven con `asyncH(...)` en la ruta.
  El usuario final nunca ve un stack trace, un nombre de tabla ni SQL.
- Código y documentación en español, igual que los nombres de tablas y módulos.
- **Ninguna credencial en claro en el repositorio.** Ni contraseñas, ni tokens,
  ni claves de API — en código, documentación, `.sql`, ejemplos del README **y
  tampoco en los comentarios**. Las credenciales reales viven sólo en el `.env`
  de la VM, que no está versionado.
  El repositorio es público y el historial de git conserva cada versión: borrar
  el archivo después no deshace la publicación, sólo rotar la credencial lo hace.
  Si detectas una credencial en claro ya versionada, díselo al usuario en vez de
  limitarte a borrarla.

## Comandos

```bash
npm install
npm start        # → http://127.0.0.1:3000  (node app.js)
```

Pruebas (requieren la app levantada y las credenciales por variable de entorno):

```bash
BASE_URL=http://127.0.0.1:3000 ADMIN_EMAIL=… ADMIN_PASS=… \
LECTOR_EMAIL=… LECTOR_PASS=… bash tests/pruebas.sh
```

No hay build ni linter. No intentes ejecutarlos.
