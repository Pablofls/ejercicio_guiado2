const { page, esc, nav } = require('../../shared/layout');

function formularioView(libro, usuario) {
    return page('Nueva imagen', `
${nav(usuario)}
<main class="container">
  <div class="panel">
    <h1>Agregar imagen</h1>
    <p class="libro__autor">Para: ${esc(libro.titulo)}</p>
    <form method="POST" action="/imagenes/${libro.id}" enctype="multipart/form-data">
      <div class="campo"><label for="imagen">Archivo</label>
        <input type="file" id="imagen" name="imagen" accept="image/*" required></div>
      <div class="campo"><label for="descripcion">Descripción</label>
        <input type="text" id="descripcion" name="descripcion"></div>
      <label style="flex-direction:row; align-items:center; gap:8px; display:flex">
        <input type="checkbox" name="es_principal" value="true" style="width:auto">
        Usar como portada
      </label>
      <button type="submit">Subir</button>
    </form>
    <p><a href="/libros/${libro.id}">Volver al libro</a></p>
  </div>
</main>`, { contenedor: false });
}

module.exports = { formularioView };
