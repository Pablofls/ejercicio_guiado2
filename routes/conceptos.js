const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireLogin } = require('./middleware');

router.get('/nuevo/:libro_id', requireLogin, async (req, res) => {
    const libro = await db.query('SELECT id, titulo FROM libros WHERE id = $1', [req.params.libro_id]);
    if (libro.rows.length === 0) return res.send('Libro no encontrado. <a href="/libros">Volver</a>');
    const l = libro.rows[0];
    res.send(`<!DOCTYPE html>
<html lang="es"><head><meta charset="UTF-8"><title>Nuevo Concepto</title>
<link rel="stylesheet" href="/css/style.css"></head>
<body><div class="container">
<h2>Nuevo Concepto para: ${l.titulo}</h2>
<form method="POST" action="/conceptos/${l.id}">
  <label>Término:</label><input type="text" name="termino" required>
  <label>Definición:</label><textarea name="definicion" required></textarea>
  <button type="submit">Guardar</button>
</form>
<a href="/libros/${l.id}">Volver al libro</a>
</div></body></html>`);
});

router.post('/:libro_id', requireLogin, async (req, res) => {
    const { termino, definicion } = req.body;
    await db.query('INSERT INTO conceptos (libro_id, termino, definicion) VALUES ($1, $2, $3)',
        [req.params.libro_id, termino, definicion]);
    res.redirect('/libros/' + req.params.libro_id);
});

router.get('/:id/editar', requireLogin, async (req, res) => {
    const result = await db.query('SELECT * FROM conceptos WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.send('Concepto no encontrado. <a href="/libros">Volver</a>');
    const c = result.rows[0];
    res.send(`<!DOCTYPE html>
<html lang="es"><head><meta charset="UTF-8"><title>Editar Concepto</title>
<link rel="stylesheet" href="/css/style.css"></head>
<body><div class="container">
<h2>Editar Concepto</h2>
<form method="POST" action="/conceptos/${c.id}/editar">
  <label>Término:</label><input type="text" name="termino" value="${c.termino}" required>
  <label>Definición:</label><textarea name="definicion" required>${c.definicion}</textarea>
  <button type="submit">Actualizar</button>
</form>
<a href="/libros/${c.libro_id}">Volver al libro</a>
</div></body></html>`);
});

router.post('/:id/editar', requireLogin, async (req, res) => {
    const { termino, definicion } = req.body;
    const result = await db.query('UPDATE conceptos SET termino=$1, definicion=$2 WHERE id=$3 RETURNING libro_id',
        [termino, definicion, req.params.id]);
    res.redirect('/libros/' + result.rows[0].libro_id);
});

router.post('/:id/eliminar', requireLogin, async (req, res) => {
    const result = await db.query('DELETE FROM conceptos WHERE id=$1 RETURNING libro_id', [req.params.id]);
    res.redirect('/libros/' + result.rows[0].libro_id);
});

module.exports = router;
