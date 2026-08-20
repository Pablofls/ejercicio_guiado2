const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const db = require('../db');

router.get('/', (req, res) => {
    if (req.session.usuario) return res.redirect('/libros');
    res.redirect('/login');
});

router.get('/login', (req, res) => {
    res.send(`<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><title>Login - Librería</title>
<link rel="stylesheet" href="/css/style.css"></head>
<body>
<div class="container">
<h1>Librería Online</h1>
<h2>Iniciar Sesión</h2>
<form method="POST" action="/login">
  <label>Email:</label>
  <input type="email" name="email" required>
  <label>Contraseña:</label>
  <input type="password" name="password" required>
  <button type="submit">Entrar</button>
</form>
<p>¿No tienes cuenta? <a href="/registro">Regístrate</a></p>
</div>
</body></html>`);
});

router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const result = await db.query('SELECT * FROM usuarios WHERE email = $1', [email]);
        if (result.rows.length === 0) return res.send('Usuario no encontrado. <a href="/login">Volver</a>');
        const usuario = result.rows[0];
        const valido = await bcrypt.compare(password, usuario.password_hash);
        if (!valido) return res.send('Contraseña incorrecta. <a href="/login">Volver</a>');
        req.session.usuario = { id: usuario.id, nombre: usuario.nombre, rol: usuario.rol };
        res.redirect('/libros');
    } catch (err) {
        console.error(err);
        res.send('Error en el servidor. <a href="/login">Volver</a>');
    }
});

router.get('/registro', (req, res) => {
    res.send(`<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><title>Registro - Librería</title>
<link rel="stylesheet" href="/css/style.css"></head>
<body>
<div class="container">
<h1>Librería Online</h1>
<h2>Crear Cuenta</h2>
<form method="POST" action="/registro">
  <label>Nombre:</label>
  <input type="text" name="nombre" required>
  <label>Email:</label>
  <input type="email" name="email" required>
  <label>Contraseña:</label>
  <input type="password" name="password" required>
  <button type="submit">Registrarse</button>
</form>
<p>¿Ya tienes cuenta? <a href="/login">Iniciar sesión</a></p>
</div>
</body></html>`);
});

router.post('/registro', async (req, res) => {
    const { nombre, email, password } = req.body;
    try {
        const hash = await bcrypt.hash(password, 10);
        await db.query('INSERT INTO usuarios (nombre, email, password_hash) VALUES ($1, $2, $3)', [nombre, email, hash]);
        res.redirect('/login');
    } catch (err) {
        console.error(err);
        res.send('Error al registrar. El email ya puede estar en uso. <a href="/registro">Volver</a>');
    }
});

router.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login');
});

module.exports = router;
