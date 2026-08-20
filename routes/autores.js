const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireLogin, requireAdmin } = require('./middleware');

router.get('/', requireLogin, async (req, res) => {
    const result = await db.query('SELECT * FROM autores ORDER BY nombre');
    let filas = result.rows.map(a => `
        <tr>
            <td>${a.id}</td>
            <td>${a.nombre}</td>
            <td>${a.nacionalidad || ''}</td>
            <td>
                <a href="/autores/${a.id}/editar">Editar</a> |
                <form method="POST" action="/autores/${a.id}/eliminar" style="display:inline">
                    <button type="submit" onclick="return confirm('¿Eliminar?')">Eliminar</button>
                </form>
            </td>
        </tr>`).join('');
    res.send(`<!DOCTYPE html>
<html lang="es"><head><meta charset="UTF-8"><title>Autores</title>
<link rel="stylesheet" href="/css/style.css"></head>
<body><div class="container">
<h1>Autores</h1>
<a href="/autores/nuevo">+ Nuevo Autor</a> | <a href="/libros">Libros</a> | <a href="/logout">Salir</a>
<table><thead><tr><th>ID</th><th>Nombre</th><th>Nacionalidad</th><th>Acciones</th></tr></thead>
<tbody>${filas}</tbody></table>
</div></body></html>`);
});

router.get('/nuevo', requireLogin, (req, res) => {
    res.send(`<!DOCTYPE html>
<html lang="es"><head><meta charset="UTF-8"><title>Nuevo Autor</title>
<link rel="stylesheet" href="/css/style.css"></head>
<body><div class="container">
<h2>Nuevo Autor</h2>
<form method="POST" action="/autores">
  <label>Nombre:</label><input type="text" name="nombre" required>
  <label>Biografía:</label><textarea name="biografia"></textarea>
  <label>Nacionalidad:</label><input type="text" name="nacionalidad">
  <button type="submit">Guardar</button>
</form>
<a href="/autores">Volver</a>
</div></body></html>`);
});

router.post('/', requireLogin, async (req, res) => {
    const { nombre, biografia, nacionalidad } = req.body;
    await db.query('INSERT INTO autores (nombre, biografia, nacionalidad) VALUES ($1, $2, $3)', [nombre, biografia, nacionalidad]);
    res.redirect('/autores');
});

router.get('/:id/editar', requireLogin, async (req, res) => {
    const result = await db.query('SELECT * FROM autores WHERE id = $1', [req.params.id]);
    const a = result.rows[0];
    res.send(`<!DOCTYPE html>
<html lang="es"><head><meta charset="UTF-8"><title>Editar Autor</title>
<link rel="stylesheet" href="/css/style.css"></head>
<body><div class="container">
<h2>Editar Autor</h2>
<form method="POST" action="/autores/${a.id}/editar">
  <label>Nombre:</label><input type="text" name="nombre" value="${a.nombre}" required>
  <label>Biografía:</label><textarea name="biografia">${a.biografia || ''}</textarea>
  <label>Nacionalidad:</label><input type="text" name="nacionalidad" value="${a.nacionalidad || ''}">
  <button type="submit">Actualizar</button>
</form>
<a href="/autores">Volver</a>
</div></body></html>`);
});

router.post('/:id/editar', requireLogin, async (req, res) => {
    const { nombre, biografia, nacionalidad } = req.body;
    await db.query('UPDATE autores SET nombre=$1, biografia=$2, nacionalidad=$3 WHERE id=$4',
        [nombre, biografia, nacionalidad, req.params.id]);
    res.redirect('/autores');
});

router.post('/:id/eliminar', requireLogin, async (req, res) => {
    await db.query('DELETE FROM autores WHERE id=$1', [req.params.id]);
    res.redirect('/autores');
});

module.exports = router;
