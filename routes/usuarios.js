const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcrypt');
const { requireLogin, requireAdmin } = require('./middleware');

router.get('/', requireLogin, async (req, res) => {
    const result = await db.query('SELECT id, nombre, email, rol, creado_en FROM usuarios ORDER BY nombre');
    const usuario = req.session.usuario;
    let filas = result.rows.map(u => `
        <tr>
            <td>${u.id}</td>
            <td>${u.nombre}</td>
            <td>${u.email}</td>
            <td>${u.rol}</td>
            <td>${new Date(u.creado_en).toLocaleDateString('es-MX')}</td>
            <td>
                <a href="/usuarios/${u.id}/editar">Editar</a> |
                <form method="POST" action="/usuarios/${u.id}/eliminar" style="display:inline">
                    <button type="submit" onclick="return confirm('¿Eliminar usuario?')">Eliminar</button>
                </form>
            </td>
        </tr>`).join('');
    res.send(`<!DOCTYPE html>
<html lang="es"><head><meta charset="UTF-8"><title>Usuarios</title>
<link rel="stylesheet" href="/css/style.css"></head>
<body><div class="container">
<h1>Usuarios Registrados</h1>
<a href="/usuarios/nuevo">+ Nuevo Usuario</a> | <a href="/libros">Libros</a> | <a href="/logout">Salir</a>
<table><thead><tr><th>ID</th><th>Nombre</th><th>Email</th><th>Rol</th><th>Registro</th><th>Acciones</th></tr></thead>
<tbody>${filas}</tbody></table>
</div></body></html>`);
});

router.get('/nuevo', requireLogin, (req, res) => {
    res.send(`<!DOCTYPE html>
<html lang="es"><head><meta charset="UTF-8"><title>Nuevo Usuario</title>
<link rel="stylesheet" href="/css/style.css"></head>
<body><div class="container">
<h2>Nuevo Usuario</h2>
<form method="POST" action="/usuarios">
  <label>Nombre:</label><input type="text" name="nombre" required>
  <label>Email:</label><input type="email" name="email" required>
  <label>Contraseña:</label><input type="password" name="password" required>
  <label>Rol:</label>
  <select name="rol">
    <option value="lector">Lector</option>
    <option value="admin">Admin</option>
  </select>
  <button type="submit">Guardar</button>
</form>
<a href="/usuarios">Volver</a>
</div></body></html>`);
});

router.post('/', requireLogin, async (req, res) => {
    const { nombre, email, password, rol } = req.body;
    const hash = await bcrypt.hash(password, 10);
    await db.query('INSERT INTO usuarios (nombre, email, password_hash, rol) VALUES ($1,$2,$3,$4)',
        [nombre, email, hash, rol || 'lector']);
    res.redirect('/usuarios');
});

router.get('/:id/editar', requireLogin, async (req, res) => {
    const result = await db.query('SELECT id, nombre, email, rol FROM usuarios WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.send('Usuario no encontrado. <a href="/usuarios">Volver</a>');
    const u = result.rows[0];
    res.send(`<!DOCTYPE html>
<html lang="es"><head><meta charset="UTF-8"><title>Editar Usuario</title>
<link rel="stylesheet" href="/css/style.css"></head>
<body><div class="container">
<h2>Editar Usuario</h2>
<form method="POST" action="/usuarios/${u.id}/editar">
  <label>Nombre:</label><input type="text" name="nombre" value="${u.nombre}" required>
  <label>Email:</label><input type="email" name="email" value="${u.email}" required>
  <label>Nueva contraseña (dejar vacío para no cambiar):</label>
  <input type="password" name="password">
  <label>Rol:</label>
  <select name="rol">
    <option value="lector" ${u.rol === 'lector' ? 'selected' : ''}>Lector</option>
    <option value="admin" ${u.rol === 'admin' ? 'selected' : ''}>Admin</option>
  </select>
  <button type="submit">Actualizar</button>
</form>
<a href="/usuarios">Volver</a>
</div></body></html>`);
});

router.post('/:id/editar', requireLogin, async (req, res) => {
    const { nombre, email, password, rol } = req.body;
    if (password && password.trim() !== '') {
        const hash = await bcrypt.hash(password, 10);
        await db.query('UPDATE usuarios SET nombre=$1, email=$2, password_hash=$3, rol=$4 WHERE id=$5',
            [nombre, email, hash, rol, req.params.id]);
    } else {
        await db.query('UPDATE usuarios SET nombre=$1, email=$2, rol=$3 WHERE id=$4',
            [nombre, email, rol, req.params.id]);
    }
    res.redirect('/usuarios');
});

router.post('/:id/eliminar', requireLogin, async (req, res) => {
    await db.query('DELETE FROM usuarios WHERE id=$1', [req.params.id]);
    res.redirect('/usuarios');
});

module.exports = router;
