function requireLogin(req, res, next) {
    if (!req.session.usuario) return res.redirect('/login');
    next();
}

function requireAdmin(req, res, next) {
    if (!req.session.usuario) return res.redirect('/login');
    if (req.session.usuario.rol !== 'admin') return res.send('Acceso denegado. <a href="/libros">Volver</a>');
    next();
}

module.exports = { requireLogin, requireAdmin };
