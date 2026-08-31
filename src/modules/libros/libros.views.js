const { page, esc, nav } = require('../../shared/layout');

function portada(libro) {
    if (libro.portada) {
        return `<img class="libro__portada" src="/uploads/${esc(libro.portada)}"
                     alt="Portada de ${esc(libro.titulo)}" loading="lazy">`;
    }
    return `<div class="libro__portada-vacia" aria-hidden="true">${esc(libro.titulo)}</div>`;
}

function existencias(stock) {
    return stock > 0
        ? '<span class="existencias existencias--si">Disponible</span>'
        : '<span class="existencias existencias--no">Sin existencias</span>';
}

// Vista del lector: rejilla de portadas, sin acciones de gestión.
function catalogoView(libros, usuario) {
    const tarjetas = libros.map(l => `
      <article class="libro">
        <a class="libro__enlace" href="/libros/${l.id}">
          ${portada(l)}
          <h3 class="libro__titulo">${esc(l.titulo)}</h3>
        </a>
        <p class="libro__autor">${esc(l.autor_nombre || 'Autor desconocido')}</p>
        <p class="libro__categoria">${esc(l.categoria_nombre || 'Sin categoría')}</p>
        <p class="libro__pie">
          ${l.anio_publicacion ? `<span class="libro__anio">${esc(l.anio_publicacion)}</span>` : ''}
          ${existencias(l.stock)}
        </p>
      </article>`).join('');

    const cuerpo = libros.length
        ? `<div class="rejilla">${tarjetas}</div>`
        : '<div class="vacio"><p>Todavía no hay libros en el catálogo.</p></div>';

    return page('Catálogo', `
${nav(usuario)}
<main class="container">
  <div class="catalogo__encabezado">
    <h1>Catálogo</h1>
    <span class="catalogo__conteo">${libros.length} ${libros.length === 1 ? 'libro' : 'libros'}</span>
  </div>
  ${cuerpo}
</main>`, { contenedor: false });
}

// Vista del administrador: tabla con las acciones de gestión.
function listaView(libros, usuario) {
    const filas = libros.map(l => `
        <tr>
            <td>${l.id}</td>
            <td><a href="/libros/${l.id}">${esc(l.titulo)}</a></td>
            <td>${esc(l.autor_nombre || '')}</td>
            <td>${esc(l.categoria_nombre || '')}</td>
            <td>${esc(l.anio_publicacion || '')}</td>
            <td>${esc(l.stock)}</td>
            <td>
                <a href="/libros/${l.id}/editar">Editar</a> &middot;
                <form method="POST" action="/libros/${l.id}/eliminar">
                    <button type="submit" onclick="return confirm('¿Eliminar este libro?')">Eliminar</button>
                </form>
            </td>
        </tr>`).join('');

    const tabla = libros.length
        ? `<table>
  <thead><tr><th>ID</th><th>Título</th><th>Autor</th><th>Categoría</th><th>Año</th><th>Stock</th><th>Acciones</th></tr></thead>
  <tbody>${filas}</tbody>
</table>`
        : '<div class="vacio"><p>Todavía no hay libros registrados.</p></div>';

    return page('Libros', `
${nav(usuario)}
<main class="container">
  <div class="panel">
    <div class="panel__encabezado">
      <h1>Libros</h1>
      <a class="boton" href="/libros/nuevo">+ Nuevo libro</a>
    </div>
    ${tabla}
  </div>
</main>`, { contenedor: false });
}

function formularioView(titulo, action, libro, autores, categorias, usuario) {
    const l = libro || {};
    const backLink = libro ? `/libros/${libro.id}` : '/libros';
    const optsAutores = autores.map(a =>
        `<option value="${a.id}" ${l.autor_id == a.id ? 'selected' : ''}>${esc(a.nombre)}</option>`
    ).join('');
    const optsCats = categorias.map(c =>
        `<option value="${c.id}" ${l.categoria_id == c.id ? 'selected' : ''}>${esc(c.nombre)}</option>`
    ).join('');

    return page(titulo, `
${nav(usuario)}
<main class="container">
  <div class="panel">
    <h1>${esc(titulo)}</h1>
    <form method="POST" action="${esc(action)}">
      <div class="campo"><label for="titulo">Título</label>
        <input type="text" id="titulo" name="titulo" value="${esc(l.titulo || '')}" required></div>
      <div class="campo"><label for="isbn">ISBN</label>
        <input type="text" id="isbn" name="isbn" value="${esc(l.isbn || '')}"></div>
      <div class="campo"><label for="anio">Año de publicación</label>
        <input type="number" id="anio" name="anio_publicacion" value="${esc(l.anio_publicacion || '')}"></div>
      <div class="campo"><label for="sinopsis">Sinopsis</label>
        <textarea id="sinopsis" name="sinopsis">${esc(l.sinopsis || '')}</textarea></div>
      <div class="campo"><label for="stock">Stock</label>
        <input type="number" id="stock" name="stock" min="0" value="${esc(l.stock !== undefined ? l.stock : 0)}"></div>
      <div class="campo"><label for="autor">Autor</label>
        <select id="autor" name="autor_id"><option value="">— Sin autor —</option>${optsAutores}</select></div>
      <div class="campo"><label for="categoria">Categoría</label>
        <select id="categoria" name="categoria_id"><option value="">— Sin categoría —</option>${optsCats}</select></div>
      <button type="submit">Guardar</button>
    </form>
    <p><a href="${esc(backLink)}">Volver</a></p>
  </div>
</main>`, { contenedor: false });
}

function detalleView(libro, imagenes, conceptos, usuario) {
    const esAdmin = usuario.rol === 'admin';
    const principal = imagenes.find(i => i.es_principal) || imagenes[0];

    const galeria = imagenes.length
        ? `<div class="galeria">${imagenes.map(i => `
        <figure>
          <img src="/uploads/${esc(i.ruta_archivo)}" alt="${esc(i.descripcion || libro.titulo)}">
          ${i.descripcion ? `<figcaption>${esc(i.descripcion)}</figcaption>` : ''}
          ${esAdmin ? `<form method="POST" action="/imagenes/${i.id}/eliminar">
            <button type="submit" onclick="return confirm('¿Eliminar esta imagen?')">Eliminar</button>
          </form>` : ''}
        </figure>`).join('')}</div>`
        : '<p class="libro__categoria">Sin imágenes.</p>';

    const filasConceptos = conceptos.map(c => `
        <tr>
            <td><strong>${esc(c.termino)}</strong></td>
            <td>${esc(c.definicion)}</td>
            ${esAdmin ? `<td>
                <a href="/conceptos/${c.id}/editar">Editar</a> &middot;
                <form method="POST" action="/conceptos/${c.id}/eliminar">
                    <button type="submit" onclick="return confirm('¿Eliminar este concepto?')">Eliminar</button>
                </form>
            </td>` : ''}
        </tr>`).join('');

    const tablaConceptos = conceptos.length
        ? `<table>
  <thead><tr><th>Término</th><th>Definición</th>${esAdmin ? '<th>Acciones</th>' : ''}</tr></thead>
  <tbody>${filasConceptos}</tbody>
</table>`
        : '<p class="libro__categoria">Sin conceptos.</p>';

    const acciones = esAdmin ? `
  <div class="acciones">
    <a class="boton" href="/libros/${libro.id}/editar">Editar libro</a>
    <a class="boton boton--sutil" href="/imagenes/nuevo/${libro.id}">+ Agregar imagen</a>
    <a class="boton boton--sutil" href="/conceptos/nuevo/${libro.id}">+ Agregar concepto</a>
  </div>` : '';

    return page(libro.titulo, `
${nav(usuario)}
<main class="container">
  <div class="panel">
    <div class="detalle">
      <div>${portada({ portada: principal && principal.ruta_archivo, titulo: libro.titulo })}</div>
      <div class="detalle__datos">
        <h1>${esc(libro.titulo)}</h1>
        <p><strong>Autor:</strong> ${esc(libro.autor_nombre || 'Sin autor')}</p>
        <p><strong>Categoría:</strong> ${esc(libro.categoria_nombre || 'Sin categoría')}</p>
        <p><strong>ISBN:</strong> ${esc(libro.isbn || 'N/D')}</p>
        <p><strong>Año:</strong> ${esc(libro.anio_publicacion || 'N/D')}</p>
        <p><strong>Disponibilidad:</strong> ${existencias(libro.stock)} (${esc(libro.stock)})</p>
        <p><strong>Sinopsis:</strong> ${esc(libro.sinopsis || 'Sin sinopsis.')}</p>
      </div>
    </div>

    <div class="seccion">
      <h2>Imágenes</h2>
      ${galeria}
    </div>

    <div class="seccion">
      <h2>Conceptos</h2>
      ${tablaConceptos}
    </div>
    ${acciones}
    <p><a href="/libros">← Volver al catálogo</a></p>
  </div>
</main>`, { contenedor: false });
}

module.exports = { catalogoView, listaView, formularioView, detalleView };
