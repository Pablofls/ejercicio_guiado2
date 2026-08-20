const { page } = require('../../shared/layout');

function formularioNuevoView(libro) {
    return page('Nuevo Concepto', `
<h2>Nuevo Concepto para: ${libro.titulo}</h2>
<form method="POST" action="/conceptos/${libro.id}">
  <label>Término:</label><input type="text" name="termino" required>
  <label>Definición:</label><textarea name="definicion" required></textarea>
  <button type="submit">Guardar</button>
</form>
<a href="/libros/${libro.id}">Volver al libro</a>`);
}

function formularioEditarView(concepto) {
    return page('Editar Concepto', `
<h2>Editar Concepto</h2>
<form method="POST" action="/conceptos/${concepto.id}/editar">
  <label>Término:</label><input type="text" name="termino" value="${concepto.termino}" required>
  <label>Definición:</label><textarea name="definicion" required>${concepto.definicion}</textarea>
  <button type="submit">Actualizar</button>
</form>
<a href="/libros/${concepto.libro_id}">Volver al libro</a>`);
}

module.exports = { formularioNuevoView, formularioEditarView };
