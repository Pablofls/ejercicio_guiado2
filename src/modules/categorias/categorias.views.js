const { page } = require('../../shared/layout');

function listaView(categorias) {
    const filas = categorias.map(c => `
        <tr>
            <td>${c.id}</td>
            <td>${c.nombre}</td>
            <td>${c.descripcion || ''}</td>
            <td>
                <a href="/categorias/${c.id}/editar">Editar</a> |
                <form method="POST" action="/categorias/${c.id}/eliminar" style="display:inline">
                    <button type="submit" onclick="return confirm('¿Eliminar?')">Eliminar</button>
                </form>
            </td>
        </tr>`).join('');

    return page('Categorías', `
<h1>Categorías</h1>
<a href="/categorias/nuevo">+ Nueva Categoría</a> | <a href="/libros">Libros</a> | <a href="/logout">Salir</a>
<table>
  <thead><tr><th>ID</th><th>Nombre</th><th>Descripción</th><th>Acciones</th></tr></thead>
  <tbody>${filas}</tbody>
</table>`);
}

function formularioView(titulo, action, categoria) {
    const c = categoria || {};
    return page(titulo, `
<h2>${titulo}</h2>
<form method="POST" action="${action}">
  <label>Nombre:</label><input type="text" name="nombre" value="${c.nombre || ''}" required>
  <label>Descripción:</label><textarea name="descripcion">${c.descripcion || ''}</textarea>
  <button type="submit">Guardar</button>
</form>
<a href="/categorias">Volver</a>`);
}

module.exports = { listaView, formularioView };
