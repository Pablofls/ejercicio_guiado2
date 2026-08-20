const { page } = require('../../shared/layout');

function listaView(autores) {
    const filas = autores.map(a => `
        <tr>
            <td>${a.id}</td>
            <td>${a.nombre}</td>
            <td>${a.nacionalidad || ''}</td>
            <td>
                <a href="/autores/${a.id}/editar">Editar</a> |
                <form method="POST" action="/autores/${a.id}/eliminar" style="display:inline">
                    <button type="submit" onclick="return confirm('¿Eliminar?')">Eliminar</button>
                </form>
            </td>
        </tr>`).join('');

    return page('Autores', `
<h1>Autores</h1>
<a href="/autores/nuevo">+ Nuevo Autor</a> | <a href="/libros">Libros</a> | <a href="/logout">Salir</a>
<table>
  <thead><tr><th>ID</th><th>Nombre</th><th>Nacionalidad</th><th>Acciones</th></tr></thead>
  <tbody>${filas}</tbody>
</table>`);
}

function formularioView(titulo, action, autor) {
    const a = autor || {};
    return page(titulo, `
<h2>${titulo}</h2>
<form method="POST" action="${action}">
  <label>Nombre:</label><input type="text" name="nombre" value="${a.nombre || ''}" required>
  <label>Biografía:</label><textarea name="biografia">${a.biografia || ''}</textarea>
  <label>Nacionalidad:</label><input type="text" name="nacionalidad" value="${a.nacionalidad || ''}">
  <button type="submit">Guardar</button>
</form>
<a href="/autores">Volver</a>`);
}

module.exports = { listaView, formularioView };
