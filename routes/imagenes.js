const express = require('express');
const router = express.Router();
const db = require('../db');
const multer = require('multer');
const path = require('path');
const { requireLogin } = require('./middleware');

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, path.join(__dirname, '../public/uploads')),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, Date.now() + ext);
    }
});
const upload = multer({ storage, fileFilter: (req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, allowed.includes(ext));
}});

router.get('/nuevo/:libro_id', requireLogin, async (req, res) => {
    const libro = await db.query('SELECT id, titulo FROM libros WHERE id = $1', [req.params.libro_id]);
    if (libro.rows.length === 0) return res.send('Libro no encontrado. <a href="/libros">Volver</a>');
    const l = libro.rows[0];
    res.send(`<!DOCTYPE html>
<html lang="es"><head><meta charset="UTF-8"><title>Nueva Imagen</title>
<link rel="stylesheet" href="/css/style.css"></head>
<body><div class="container">
<h2>Agregar Imagen a: ${l.titulo}</h2>
<form method="POST" action="/imagenes/${l.id}" enctype="multipart/form-data">
  <label>Imagen:</label><input type="file" name="imagen" accept="image/*" required>
  <label>Descripción:</label><input type="text" name="descripcion">
  <label><input type="checkbox" name="es_principal" value="true"> Imagen principal</label>
  <button type="submit">Subir</button>
</form>
<a href="/libros/${l.id}">Volver al libro</a>
</div></body></html>`);
});

router.post('/:libro_id', requireLogin, upload.single('imagen'), async (req, res) => {
    if (!req.file) return res.send('Archivo no válido. <a href="/libros">Volver</a>');
    const { descripcion, es_principal } = req.body;
    const esPrincipal = es_principal === 'true';
    if (esPrincipal) {
        await db.query('UPDATE imagenes_libros SET es_principal=FALSE WHERE libro_id=$1', [req.params.libro_id]);
    }
    await db.query('INSERT INTO imagenes_libros (libro_id, ruta_archivo, descripcion, es_principal) VALUES ($1,$2,$3,$4)',
        [req.params.libro_id, req.file.filename, descripcion || null, esPrincipal]);
    res.redirect('/libros/' + req.params.libro_id);
});

router.post('/:id/eliminar', requireLogin, async (req, res) => {
    const result = await db.query('DELETE FROM imagenes_libros WHERE id=$1 RETURNING libro_id', [req.params.id]);
    res.redirect('/libros/' + result.rows[0].libro_id);
});

module.exports = router;
