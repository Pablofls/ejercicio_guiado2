const { page, esc, nav } = require('../../shared/layout');

function listaView(autores, usuario) {
    const filas = autores.map(a => `
        <tr>
            <td>${a.id}</td>
            <td>${esc(a.nombre)}</td>
            <td>${esc(a.nacionalidad || '')}</td>
            <td>
                <a href="/autores/${a.id}/editar">Editar</a> &middot;
                <form method="POST" action="/autores/${a.id}/eliminar">
                    <button type="submit" onclick="return confirm('¿Eliminar este autor?')">Eliminar</button>
                </form>
            </td>
        </tr>`).join('');

    const tabla = autores.length
        ? `<table>
  <thead><tr><th>ID</th><th>Nombre</th><th>Nacionalidad</th><th>Acciones</th></tr></thead>
  <tbody>${filas}</tbody>
</table>`
        : '<div class="vacio"><p>Todavía no hay autores registrados.</p></div>';

    return page('Autores', `
${nav(usuario)}
<main class="container">
  <div class="panel">
    <div class="panel__encabezado">
      <h1>Autores</h1>
      <a class="boton" href="/autores/nuevo">+ Nuevo autor</a>
    </div>
    ${tabla}
  </div>
</main>`, { contenedor: false });
}

function formularioView(titulo, action, autor, usuario) {
    const a = autor || {};
    return page(titulo, `
${nav(usuario)}
<main class="container">
  <div class="panel">
    <h1>${esc(titulo)}</h1>
    <form method="POST" action="${esc(action)}">
      <div class="campo"><label for="nombre">Nombre</label>
        <input type="text" id="nombre" name="nombre" value="${esc(a.nombre || '')}" required></div>
      <div class="campo"><label for="biografia">Biografía</label>
        <textarea id="biografia" name="biografia">${esc(a.biografia || '')}</textarea></div>
      <div class="campo"><label for="nacionalidad">Nacionalidad</label>
        <input type="text" id="nacionalidad" name="nacionalidad" value="${esc(a.nacionalidad || '')}"></div>
      <button type="submit">Guardar</button>
    </form>
    <p><a href="/autores">Volver</a></p>
  </div>
</main>`, { contenedor: false });
}

module.exports = { listaView, formularioView };
