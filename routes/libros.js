const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireLogin } = require('./middleware');

router.get('/', requireLogin, async (req, res) => {
    const result = await db.query(`
        SELECT l.*, a.nombre AS autor_nombre, c.nombre AS categoria_nombre
        FROM libros l
        LEFT JOIN autores a ON l.autor_id = a.id
        LEFT JOIN categorias c ON l.categoria_id = c.id
        ORDER BY l.titulo`);
    const usuario = req.session.usuario;
    let filas = result.rows.map(l => `
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
    res.send(`<!DOCTYPE html>
<html lang="es"><head><meta charset="UTF-8"><title>Libros</title>
<link rel="stylesheet" href="/css/style.css"></head>
<body><div class="container">
<h1>Librería Online</h1>
<p>Bienvenido, <strong>${usuario.nombre}</strong> (${usuario.rol}) | <a href="/logout">Salir</a></p>
<nav>
  <a href="/libros/nuevo">+ Nuevo Libro</a> |
  <a href="/autores">Autores</a> |
  <a href="/categorias">Categorías</a> |
  <a href="/usuarios">Usuarios</a>
</nav>
<table><thead><tr><th>ID</th><th>Título</th><th>Autor</th><th>Categoría</th><th>Año</th><th>Stock</th><th>Acciones</th></tr></thead>
<tbody>${filas}</tbody></table>
</div></body></html>`);
});

router.get('/nuevo', requireLogin, async (req, res) => {
    const autores = await db.query('SELECT id, nombre FROM autores ORDER BY nombre');
    const categorias = await db.query('SELECT id, nombre FROM categorias ORDER BY nombre');
    const optsAutores = autores.rows.map(a => `<option value="${a.id}">${a.nombre}</option>`).join('');
    const optsCats = categorias.rows.map(c => `<option value="${c.id}">${c.nombre}</option>`).join('');
    res.send(`<!DOCTYPE html>
<html lang="es"><head><meta charset="UTF-8"><title>Nuevo Libro</title>
<link rel="stylesheet" href="/css/style.css"></head>
<body><div class="container">
<h2>Nuevo Libro</h2>
<form method="POST" action="/libros">
  <label>Título:</label><input type="text" name="titulo" required>
  <label>ISBN:</label><input type="text" name="isbn">
  <label>Año de publicación:</label><input type="number" name="anio_publicacion">
  <label>Sinopsis:</label><textarea name="sinopsis"></textarea>
  <label>Stock:</label><input type="number" name="stock" value="0">
  <label>Autor:</label>
  <select name="autor_id"><option value="">-- Sin autor --</option>${optsAutores}</select>
  <label>Categoría:</label>
  <select name="categoria_id"><option value="">-- Sin categoría --</option>${optsCats}</select>
  <button type="submit">Guardar</button>
</form>
<a href="/libros">Volver</a>
</div></body></html>`);
});

router.post('/', requireLogin, async (req, res) => {
    const { titulo, isbn, anio_publicacion, sinopsis, stock, autor_id, categoria_id } = req.body;
    await db.query(
        'INSERT INTO libros (titulo, isbn, anio_publicacion, sinopsis, stock, autor_id, categoria_id) VALUES ($1,$2,$3,$4,$5,$6,$7)',
        [titulo, isbn || null, anio_publicacion || null, sinopsis, stock || 0, autor_id || null, categoria_id || null]);
    res.redirect('/libros');
});

router.get('/:id', requireLogin, async (req, res) => {
    const libro = await db.query(`
        SELECT l.*, a.nombre AS autor_nombre, c.nombre AS categoria_nombre
        FROM libros l
        LEFT JOIN autores a ON l.autor_id = a.id
        LEFT JOIN categorias c ON l.categoria_id = c.id
        WHERE l.id = $1`, [req.params.id]);
    if (libro.rows.length === 0) return res.send('Libro no encontrado. <a href="/libros">Volver</a>');
    const l = libro.rows[0];
    const imagenes = await db.query('SELECT * FROM imagenes_libros WHERE libro_id = $1', [req.params.id]);
    const conceptos = await db.query('SELECT * FROM conceptos WHERE libro_id = $1 ORDER BY termino', [req.params.id]);
    const imgs = imagenes.rows.map(i => `<div><img src="/uploads/${i.ruta_archivo}" style="max-width:200px"><p>${i.descripcion || ''}</p></div>`).join('');
    const concs = conceptos.rows.map(c => `<tr><td><strong>${c.termino}</strong></td><td>${c.definicion}</td>
        <td><form method="POST" action="/conceptos/${c.id}/eliminar" style="display:inline">
        <button type="submit">Eliminar</button></form></td></tr>`).join('');
    res.send(`<!DOCTYPE html>
<html lang="es"><head><meta charset="UTF-8"><title>${l.titulo}</title>
<link rel="stylesheet" href="/css/style.css"></head>
<body><div class="container">
<h1>${l.titulo}</h1>
<p><strong>Autor:</strong> ${l.autor_nombre || 'N/A'}</p>
<p><strong>Categoría:</strong> ${l.categoria_nombre || 'N/A'}</p>
<p><strong>ISBN:</strong> ${l.isbn || 'N/A'}</p>
<p><strong>Año:</strong> ${l.anio_publicacion || 'N/A'}</p>
<p><strong>Stock:</strong> ${l.stock}</p>
<p><strong>Sinopsis:</strong> ${l.sinopsis || 'N/A'}</p>
<h2>Imágenes</h2>
${imgs || '<p>Sin imágenes</p>'}
<a href="/imagenes/nuevo/${l.id}">+ Agregar imagen</a>
<h2>Conceptos</h2>
<table><thead><tr><th>Término</th><th>Definición</th><th>Acción</th></tr></thead>
<tbody>${concs || '<tr><td colspan="3">Sin conceptos</td></tr>'}</tbody></table>
<a href="/conceptos/nuevo/${l.id}">+ Agregar concepto</a>
<br><br>
<a href="/libros/${l.id}/editar">Editar libro</a> | <a href="/libros">Volver</a>
</div></body></html>`);
});

router.get('/:id/editar', requireLogin, async (req, res) => {
    const libro = await db.query('SELECT * FROM libros WHERE id = $1', [req.params.id]);
    const l = libro.rows[0];
    const autores = await db.query('SELECT id, nombre FROM autores ORDER BY nombre');
    const categorias = await db.query('SELECT id, nombre FROM categorias ORDER BY nombre');
    const optsAutores = autores.rows.map(a =>
        `<option value="${a.id}" ${l.autor_id == a.id ? 'selected' : ''}>${a.nombre}</option>`).join('');
    const optsCats = categorias.rows.map(c =>
        `<option value="${c.id}" ${l.categoria_id == c.id ? 'selected' : ''}>${c.nombre}</option>`).join('');
    res.send(`<!DOCTYPE html>
<html lang="es"><head><meta charset="UTF-8"><title>Editar Libro</title>
<link rel="stylesheet" href="/css/style.css"></head>
<body><div class="container">
<h2>Editar Libro</h2>
<form method="POST" action="/libros/${l.id}/editar">
  <label>Título:</label><input type="text" name="titulo" value="${l.titulo}" required>
  <label>ISBN:</label><input type="text" name="isbn" value="${l.isbn || ''}">
  <label>Año de publicación:</label><input type="number" name="anio_publicacion" value="${l.anio_publicacion || ''}">
  <label>Sinopsis:</label><textarea name="sinopsis">${l.sinopsis || ''}</textarea>
  <label>Stock:</label><input type="number" name="stock" value="${l.stock}">
  <label>Autor:</label>
  <select name="autor_id"><option value="">-- Sin autor --</option>${optsAutores}</select>
  <label>Categoría:</label>
  <select name="categoria_id"><option value="">-- Sin categoría --</option>${optsCats}</select>
  <button type="submit">Actualizar</button>
</form>
<a href="/libros/${l.id}">Volver</a>
</div></body></html>`);
});

router.post('/:id/editar', requireLogin, async (req, res) => {
    const { titulo, isbn, anio_publicacion, sinopsis, stock, autor_id, categoria_id } = req.body;
    await db.query(
        'UPDATE libros SET titulo=$1, isbn=$2, anio_publicacion=$3, sinopsis=$4, stock=$5, autor_id=$6, categoria_id=$7 WHERE id=$8',
        [titulo, isbn || null, anio_publicacion || null, sinopsis, stock || 0, autor_id || null, categoria_id || null, req.params.id]);
    res.redirect('/libros/' + req.params.id);
});

router.post('/:id/eliminar', requireLogin, async (req, res) => {
    await db.query('DELETE FROM libros WHERE id=$1', [req.params.id]);
    res.redirect('/libros');
});

module.exports = router;
