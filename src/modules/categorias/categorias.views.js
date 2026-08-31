const { page, esc, nav } = require('../../shared/layout');

function listaView(categorias, usuario) {
    const filas = categorias.map(c => `
        <tr>
            <td>${c.id}</td>
            <td>${esc(c.nombre)}</td>
            <td>${esc(c.descripcion || '')}</td>
            <td>
                <a href="/categorias/${c.id}/editar">Editar</a> &middot;
                <form method="POST" action="/categorias/${c.id}/eliminar">
                    <button type="submit" onclick="return confirm('¿Eliminar esta categoría?')">Eliminar</button>
                </form>
            </td>
        </tr>`).join('');

    const tabla = categorias.length
        ? `<table>
  <thead><tr><th>ID</th><th>Nombre</th><th>Descripción</th><th>Acciones</th></tr></thead>
  <tbody>${filas}</tbody>
</table>`
        : '<div class="vacio"><p>Todavía no hay categorías registradas.</p></div>';

    return page('Categorías', `
${nav(usuario)}
<main class="container">
  <div class="panel">
    <div class="panel__encabezado">
      <h1>Categorías</h1>
      <a class="boton" href="/categorias/nuevo">+ Nueva categoría</a>
    </div>
    ${tabla}
  </div>
</main>`, { contenedor: false });
}

function formularioView(titulo, action, categoria, usuario) {
    const c = categoria || {};
    return page(titulo, `
${nav(usuario)}
<main class="container">
  <div class="panel">
    <h1>${esc(titulo)}</h1>
    <form method="POST" action="${esc(action)}">
      <div class="campo"><label for="nombre">Nombre</label>
        <input type="text" id="nombre" name="nombre" value="${esc(c.nombre || '')}" required></div>
      <div class="campo"><label for="descripcion">Descripción</label>
        <textarea id="descripcion" name="descripcion">${esc(c.descripcion || '')}</textarea></div>
      <button type="submit">Guardar</button>
    </form>
    <p><a href="/categorias">Volver</a></p>
  </div>
</main>`, { contenedor: false });
}

module.exports = { listaView, formularioView };
