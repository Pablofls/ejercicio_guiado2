const { page, esc } = require('../../shared/layout');

const OPCIONES = { contenedor: false, bodyClass: 'pantalla-acceso' };

// datos: { toast, email } — `email` se conserva tras un intento fallido.
function loginView({ toast = null, email = '' } = {}) {
    return page('Iniciar sesión', `
<main class="acceso">
  <span class="acceso__marca">Librería Online</span>
  <p class="acceso__lema">Tu catálogo de libros</p>
  <h1 class="acceso__titulo">Iniciar sesión</h1>
  <form method="POST" action="/login">
    <div class="campo">
      <label for="email">Correo electrónico</label>
      <input type="email" id="email" name="email" value="${esc(email)}"
             placeholder="tu@correo.com" autocomplete="email" required autofocus>
    </div>
    <div class="campo">
      <label for="password">Contraseña</label>
      <input type="password" id="password" name="password"
             placeholder="••••••••" autocomplete="current-password" required>
    </div>
    <button type="submit" class="boton--bloque">Entrar</button>
  </form>
  <p class="acceso__pie">¿No tienes cuenta? <a href="/registro">Regístrate</a></p>
</main>`, { ...OPCIONES, toast });
}

// datos: { toast, nombre, email } — se conservan tras un intento fallido.
function registroView({ toast = null, nombre = '', email = '' } = {}) {
    return page('Crear cuenta', `
<main class="acceso">
  <span class="acceso__marca">Librería Online</span>
  <p class="acceso__lema">Tu catálogo de libros</p>
  <h1 class="acceso__titulo">Crear cuenta</h1>
  <form method="POST" action="/registro">
    <div class="campo">
      <label for="nombre">Nombre</label>
      <input type="text" id="nombre" name="nombre" value="${esc(nombre)}"
             placeholder="Tu nombre" autocomplete="name" required autofocus>
    </div>
    <div class="campo">
      <label for="email">Correo electrónico</label>
      <input type="email" id="email" name="email" value="${esc(email)}"
             placeholder="tu@correo.com" autocomplete="email" required>
    </div>
    <div class="campo">
      <label for="password">Contraseña</label>
      <input type="password" id="password" name="password" placeholder="••••••••"
             autocomplete="new-password" minlength="6" required>
    </div>
    <button type="submit" class="boton--bloque">Registrarme</button>
  </form>
  <p class="acceso__pie">¿Ya tienes cuenta? <a href="/login">Inicia sesión</a></p>
</main>`, { ...OPCIONES, toast });
}

module.exports = { loginView, registroView };
