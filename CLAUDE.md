# CLAUDE.md

Librería Online — app monolítica Node.js + Express + PostgreSQL, patrón MVC organizado por módulos.
Documentación completa en [README.md](README.md).

## Regla crítica: cambios en la base de datos

La base de datos **no es local**: corre en PostgreSQL instalado en una VM de GCP, donde también está clonado el repo y corre la app. No hay conexión a la BD desde este entorno y no se dispone de sus credenciales — nunca asumas que puedes ejecutar una query ni verificar el esquema real.

Por eso, **todo SQL se escribe pero no se ejecuta**:

1. Cualquier cambio que toque la BD (tabla nueva, columna, índice, `ALTER`, corrección de datos) se escribe como archivo en `db/pending/`.
2. Nombre: `YYYYMMDD-descripcion-corta.sql`, con un comentario al inicio explicando qué hace y por qué.
3. `db/applied/` es historial de lo ya ejecutado en la VM. Mueve ahí un archivo de `db/pending/` con `git mv` **en cuanto el usuario confirme que ya corrió la query** en la VM — nunca antes ni por tu cuenta. Tampoco edites los que ya están.
4. Si algo aplicado hay que corregir, se escribe un archivo nuevo en `db/pending/`, no se modifica el viejo.

En el mismo cambio, siempre:

- Actualizar [`schema.sql`](schema.sql) para que refleje el estado final de las tablas.
- Actualizar el **diagrama de relaciones** del README (sección "Base de datos").

Nada valida `schema.sql` contra la VM automáticamente: si se saltan esos dos pasos, la documentación del esquema queda mintiendo. Ver [Flujo de cambios en la base de datos](README.md#flujo-de-cambios-en-la-base-de-datos).

## Arquitectura

Cada dominio es un módulo en `src/modules/<nombre>/` con exactamente cuatro archivos:

| Archivo | Responsabilidad |
|---|---|
| `*.model.js` | Todo el SQL (parametrizado). Devuelve datos puros, no conoce HTTP ni HTML |
| `*.views.js` | Genera HTML con template literals. No hace queries |
| `*.controller.js` | Llama al model, pasa el resultado a la view, responde |
| `*.routes.js` | Mapea método + URL → controller, con middleware |

Compartido en `src/shared/`: `layout.js` (helper `page(title, content)`) y `middleware.js` (`requireLogin`, `requireAdmin`).

Un módulo nuevo se registra en [index.js](index.js) con `app.use('/ruta', require('./src/modules/<nombre>/<nombre>.routes'));`.

Al agregar código, sigue el patrón del módulo vecino más parecido en vez de introducir estructuras nuevas.

## Convenciones

- Sin motor de plantillas: las vistas devuelven strings HTML.
- Sin ORM: `pg` directo, siempre con queries parametrizadas (`$1`, `$2`…).
- Código y documentación en español, igual que los nombres de tablas y módulos.
- Las credenciales van en `.env` (no versionado). Nunca escribas contraseñas ni secretos en el repo, incluida la documentación.

## Comandos

```bash
npm install
node index.js   # → http://localhost:3000
```

No hay script `start`, ni suite de tests, ni build, ni linter. No intentes ejecutarlos.
