const { page, nav } = require('./layout');

function requireLogin(req, res, next) {
    if (!req.session.usuario) return res.redirect('/login');
    next();
}

function requireAdmin(req, res, next) {
    if (!req.session.usuario) return res.redirect('/login');

    if (req.session.usuario.rol !== 'admin') {
        return res.status(403).send(page('Acceso denegado', `
${nav(req.session.usuario)}
<main class="container">
  <div class="vacio">
    <h1>Acceso denegado</h1>
    <p>Esta sección es solo para administradores.</p>
    <p><a href="/libros">← Volver al catálogo</a></p>
  </div>
</main>`, { contenedor: false }));
    }

    next();
}

module.exports = { requireLogin, requireAdmin };
