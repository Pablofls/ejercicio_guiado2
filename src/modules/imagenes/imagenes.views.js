const { page } = require('../../shared/layout');

function formularioView(libro) {
    return page('Nueva Imagen', `
<h2>Agregar Imagen a: ${libro.titulo}</h2>
<form method="POST" action="/imagenes/${libro.id}" enctype="multipart/form-data">
  <label>Imagen:</label><input type="file" name="imagen" accept="image/*" required>
  <label>Descripción:</label><input type="text" name="descripcion">
  <label><input type="checkbox" name="es_principal" value="true"> Imagen principal</label>
  <button type="submit">Subir</button>
</form>
<a href="/libros/${libro.id}">Volver al libro</a>`);
}

module.exports = { formularioView };
