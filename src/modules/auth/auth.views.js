const { page } = require('../../shared/layout');

function loginView() {
    return page('Login', `
<h1>Librería Online</h1>
<h2>Iniciar Sesión</h2>
<form method="POST" action="/login">
  <label>Email:</label>
  <input type="email" name="email" required>
  <label>Contraseña:</label>
  <input type="password" name="password" required>
  <button type="submit">Entrar</button>
</form>
<p>¿No tienes cuenta? <a href="/registro">Regístrate</a></p>`);
}

function registroView() {
    return page('Registro', `
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
<p>¿Ya tienes cuenta? <a href="/login">Iniciar sesión</a></p>`);
}

module.exports = { loginView, registroView };
