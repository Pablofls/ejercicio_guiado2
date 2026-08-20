const { page } = require('../../shared/layout');

function listaView(libros, usuario) {
    const filas = libros.map(l => `
        <tr>
            <td>${l.id}</td>
            <td><a href="/libros/${l.id}">${l.titulo}</a></td>
            <td>${l.autor_nombre || ''}</td>
            <td>${l.categoria_nombre || ''}</td>
            <td>${l.anio_publicacion || ''}</td>
            <td>${l.stock}</td>
            <td>
                <a href="/libros/${l.id}/editar">Editar</a> |
                <form method="POST" action="/libros/${l.id}/eliminar" style="display:inline">
                    <button type="submit" onclick="return confirm('¿Eliminar?')">Eliminar</button>
                </form>
            </td>
        </tr>`).join('');

    return page('Libros', `
<h1>Librería Online</h1>
<p>Bienvenido, <strong>${usuario.nombre}</strong> (${usuario.rol}) | <a href="/logout">Salir</a></p>
<nav>
  <a href="/libros/nuevo">+ Nuevo Libro</a> |
  <a href="/autores">Autores</a> |
  <a href="/categorias">Categorías</a> |
  <a href="/usuarios">Usuarios</a>
</nav>
<table>
  <thead><tr><th>ID</th><th>Título</th><th>Autor</th><th>Categoría</th><th>Año</th><th>Stock</th><th>Acciones</th></tr></thead>
  <tbody>${filas}</tbody>
</table>`);
}

function formularioView(titulo, action, libro, autores, categorias) {
    const l = libro || {};
    const backLink = libro ? `/libros/${libro.id}` : '/libros';
    const optsAutores = autores.map(a =>
        `<option value="${a.id}" ${l.autor_id == a.id ? 'selected' : ''}>${a.nombre}</option>`
    ).join('');
    const optsCats = categorias.map(c =>
        `<option value="${c.id}" ${l.categoria_id == c.id ? 'selected' : ''}>${c.nombre}</option>`
    ).join('');

    return page(titulo, `
<h2>${titulo}</h2>
<form method="POST" action="${action}">
  <label>Título:</label><input type="text" name="titulo" value="${l.titulo || ''}" required>
  <label>ISBN:</label><input type="text" name="isbn" value="${l.isbn || ''}">
  <label>Año de publicación:</label><input type="number" name="anio_publicacion" value="${l.anio_publicacion || ''}">
  <label>Sinopsis:</label><textarea name="sinopsis">${l.sinopsis || ''}</textarea>
  <label>Stock:</label><input type="number" name="stock" value="${l.stock !== undefined ? l.stock : 0}">
  <label>Autor:</label>
  <select name="autor_id"><option value="">-- Sin autor --</option>${optsAutores}</select>
  <label>Categoría:</label>
  <select name="categoria_id"><option value="">-- Sin categoría --</option>${optsCats}</select>
  <button type="submit">Guardar</button>
</form>
<a href="${backLink}">Volver</a>`);
}

function detalleView(libro, imagenes, conceptos) {
    const imgs = imagenes.map(i =>
        `<div><img src="/uploads/${i.ruta_archivo}" style="max-width:200px"><p>${i.descripcion || ''}</p></div>`
    ).join('');

    const concs = conceptos.map(c => `
        <tr>
            <td><strong>${c.termino}</strong></td>
            <td>${c.definicion}</td>
            <td>
                <a href="/conceptos/${c.id}/editar">Editar</a> |
                <form method="POST" action="/conceptos/${c.id}/eliminar" style="display:inline">
                    <button type="submit">Eliminar</button>
                </form>
            </td>
        </tr>`).join('');

    return page(libro.titulo, `
<h1>${libro.titulo}</h1>
<p><strong>Autor:</strong> ${libro.autor_nombre || 'N/A'}</p>
<p><strong>Categoría:</strong> ${libro.categoria_nombre || 'N/A'}</p>
<p><strong>ISBN:</strong> ${libro.isbn || 'N/A'}</p>
<p><strong>Año:</strong> ${libro.anio_publicacion || 'N/A'}</p>
<p><strong>Stock:</strong> ${libro.stock}</p>
<p><strong>Sinopsis:</strong> ${libro.sinopsis || 'N/A'}</p>
<h2>Imágenes</h2>
${imgs || '<p>Sin imágenes</p>'}
<a href="/imagenes/nuevo/${libro.id}">+ Agregar imagen</a>
<h2>Conceptos</h2>
<table>
  <thead><tr><th>Término</th><th>Definición</th><th>Acción</th></tr></thead>
  <tbody>${concs || '<tr><td colspan="3">Sin conceptos</td></tr>'}</tbody>
</table>
<a href="/conceptos/nuevo/${libro.id}">+ Agregar concepto</a>
<br><br>
<a href="/libros/${libro.id}/editar">Editar libro</a> | <a href="/libros">Volver</a>`);
}

module.exports = { listaView, formularioView, detalleView };
