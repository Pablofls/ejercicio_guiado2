const { page, esc, nav } = require('../../shared/layout');

function formularioNuevoView(libro, usuario) {
    return page('Nuevo concepto', `
${nav(usuario)}
<main class="container">
  <div class="panel">
    <h1>Nuevo concepto</h1>
    <p class="libro__autor">Para: ${esc(libro.titulo)}</p>
    <form method="POST" action="/conceptos/${libro.id}">
      <div class="campo"><label for="termino">Término</label>
        <input type="text" id="termino" name="termino" required></div>
      <div class="campo"><label for="definicion">Definición</label>
        <textarea id="definicion" name="definicion" required></textarea></div>
      <button type="submit">Guardar</button>
    </form>
    <p><a href="/libros/${libro.id}">Volver al libro</a></p>
  </div>
</main>`, { contenedor: false });
}

function formularioEditarView(concepto, usuario) {
    return page('Editar concepto', `
${nav(usuario)}
<main class="container">
  <div class="panel">
    <h1>Editar concepto</h1>
    <form method="POST" action="/conceptos/${concepto.id}/editar">
      <div class="campo"><label for="termino">Término</label>
        <input type="text" id="termino" name="termino" value="${esc(concepto.termino)}" required></div>
      <div class="campo"><label for="definicion">Definición</label>
        <textarea id="definicion" name="definicion" required>${esc(concepto.definicion)}</textarea></div>
      <button type="submit">Actualizar</button>
    </form>
    <p><a href="/libros/${concepto.libro_id}">Volver al libro</a></p>
  </div>
</main>`, { contenedor: false });
}

module.exports = { formularioNuevoView, formularioEditarView };
