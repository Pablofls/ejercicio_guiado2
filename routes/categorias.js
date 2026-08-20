const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireLogin } = require('./middleware');

router.get('/', requireLogin, async (req, res) => {
    const result = await db.query('SELECT * FROM categorias ORDER BY nombre');
    let filas = result.rows.map(c => `
        <tr>
            <td>${c.id}</td>
            <td>${c.nombre}</td>
            <td>${c.descripcion || ''}</td>
            <td>
                <a href="/categorias/${c.id}/editar">Editar</a> |
                <form method="POST" action="/categorias/${c.id}/eliminar" style="display:inline">
                    <button type="submit" onclick="return confirm('¿Eliminar?')">Eliminar</button>
                </form>
            </td>
        </tr>`).join('');
    res.send(`<!DOCTYPE html>
<html lang="es"><head><meta charset="UTF-8"><title>Categorías</title>
<link rel="stylesheet" href="/css/style.css"></head>
<body><div class="container">
<h1>Categorías</h1>
<a href="/categorias/nuevo">+ Nueva Categoría</a> | <a href="/libros">Libros</a> | <a href="/logout">Salir</a>
<table><thead><tr><th>ID</th><th>Nombre</th><th>Descripción</th><th>Acciones</th></tr></thead>
<tbody>${filas}</tbody></table>
</div></body></html>`);
});

router.get('/nuevo', requireLogin, (req, res) => {
    res.send(`<!DOCTYPE html>
<html lang="es"><head><meta charset="UTF-8"><title>Nueva Categoría</title>
<link rel="stylesheet" href="/css/style.css"></head>
<body><div class="container">
<h2>Nueva Categoría</h2>
<form method="POST" action="/categorias">
  <label>Nombre:</label><input type="text" name="nombre" required>
  <label>Descripción:</label><textarea name="descripcion"></textarea>
  <button type="submit">Guardar</button>
</form>
<a href="/categorias">Volver</a>
</div></body></html>`);
});

router.post('/', requireLogin, async (req, res) => {
    const { nombre, descripcion } = req.body;
    await db.query('INSERT INTO categorias (nombre, descripcion) VALUES ($1, $2)', [nombre, descripcion]);
    res.redirect('/categorias');
});

router.get('/:id/editar', requireLogin, async (req, res) => {
    const result = await db.query('SELECT * FROM categorias WHERE id = $1', [req.params.id]);
    const c = result.rows[0];
    res.send(`<!DOCTYPE html>
<html lang="es"><head><meta charset="UTF-8"><title>Editar Categoría</title>
<link rel="stylesheet" href="/css/style.css"></head>
<body><div class="container">
<h2>Editar Categoría</h2>
<form method="POST" action="/categorias/${c.id}/editar">
  <label>Nombre:</label><input type="text" name="nombre" value="${c.nombre}" required>
  <label>Descripción:</label><textarea name="descripcion">${c.descripcion || ''}</textarea>
  <button type="submit">Actualizar</button>
</form>
<a href="/categorias">Volver</a>
</div></body></html>`);
});

router.post('/:id/editar', requireLogin, async (req, res) => {
    const { nombre, descripcion } = req.body;
    await db.query('UPDATE categorias SET nombre=$1, descripcion=$2 WHERE id=$3',
        [nombre, descripcion, req.params.id]);
    res.redirect('/categorias');
});

router.post('/:id/eliminar', requireLogin, async (req, res) => {
    await db.query('DELETE FROM categorias WHERE id=$1', [req.params.id]);
    res.redirect('/categorias');
});

module.exports = router;
