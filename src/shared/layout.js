const ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

// Escapa datos antes de interpolarlos en el HTML. Usar SIEMPRE con cualquier
// valor que venga de la base de datos o del usuario, también dentro de atributos.
function esc(valor) {
    return String(valor ?? '').replace(/[&<>"']/g, c => ESCAPES[c]);
}

function toastHtml(toast) {
    if (!toast) return '';
    const tipo = toast.tipo === 'exito' ? 'exito' : 'error';
    return `
<div class="toast toast--${tipo}" id="toast" role="alert" aria-live="assertive">
  <span class="toast__icono" aria-hidden="true">${tipo === 'exito' ? '&#10003;' : '!'}</span>
  <p class="toast__texto">${esc(toast.mensaje)}</p>
  <button type="button" class="toast__cerrar" aria-label="Cerrar aviso">&times;</button>
</div>
<script>
(function () {
  var t = document.getElementById('toast');
  if (!t) return;
  var cerrar = function () { t.classList.add('toast--oculto'); };
  t.querySelector('.toast__cerrar').addEventListener('click', cerrar);
  setTimeout(cerrar, 5000);
})();
</script>`;
}

// Barra superior. Los enlaces de gestión solo se muestran a los administradores;
// las rutas correspondientes además están protegidas con requireAdmin.
function nav(usuario) {
    if (!usuario) return '';
    const esAdmin = usuario.rol === 'admin';
    const enlacesAdmin = esAdmin ? `
    <a href="/libros/nuevo">Nuevo libro</a>
    <a href="/autores">Autores</a>
    <a href="/categorias">Categorías</a>
    <a href="/usuarios">Usuarios</a>` : '';

    return `
<header class="barra">
  <a class="barra__marca" href="/libros">Librería</a>
  <nav class="barra__nav">
    <a href="/libros">Catálogo</a>${enlacesAdmin}
  </nav>
  <div class="barra__usuario">
    <span class="barra__nombre">${esc(usuario.nombre)}</span>
    <span class="etiqueta etiqueta--${esAdmin ? 'admin' : 'lector'}">${esc(usuario.rol)}</span>
    <a class="boton boton--sutil" href="/logout">Salir</a>
  </div>
</header>`;
}

// opts: { toast, contenedor, bodyClass }
// contenedor: false → la vista arma su propio layout (barra a ancho completo).
function page(title, content, opts = {}) {
    const { toast = null, contenedor = true, bodyClass = '' } = opts;
    const cuerpo = contenedor ? `<div class="container">${content}</div>` : content;

    return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)} - Librería</title>
<link rel="stylesheet" href="/css/style.css">
</head>
<body${bodyClass ? ` class="${bodyClass}"` : ''}>${toastHtml(toast)}${cuerpo}</body>
</html>`;
}

module.exports = { page, esc, nav };
