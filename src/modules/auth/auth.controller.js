const AuthModel = require('./auth.model');
const AuthViews = require('./auth.views');

function getRoot(req, res) {
    if (req.session.usuario) return res.redirect('/libros');
    res.redirect('/login');
}

function getLogin(req, res) {
    if (req.session.usuario) return res.redirect('/libros');
    res.send(AuthViews.loginView());
}

async function postLogin(req, res) {
    const { email, password } = req.body;
    try {
        const usuario = await AuthModel.findByEmail(email);
        if (!usuario) return res.send('Usuario no encontrado. <a href="/login">Volver</a>');
        const valido = await AuthModel.verifyPassword(password, usuario.password_hash);
        if (!valido) return res.send('Contraseña incorrecta. <a href="/login">Volver</a>');
        req.session.usuario = { id: usuario.id, nombre: usuario.nombre, rol: usuario.rol };
        res.redirect('/libros');
    } catch (err) {
        console.error(err);
        res.send('Error en el servidor. <a href="/login">Volver</a>');
    }
}

function getRegistro(req, res) {
    res.send(AuthViews.registroView());
}

async function postRegistro(req, res) {
    const { nombre, email, password } = req.body;
    try {
        await AuthModel.createUser(nombre, email, password);
        res.redirect('/login');
    } catch (err) {
        console.error(err);
        res.send('Error al registrar. El email ya puede estar en uso. <a href="/registro">Volver</a>');
    }
}

function getLogout(req, res) {
    req.session.destroy();
    res.redirect('/login');
}

module.exports = { getRoot, getLogin, postLogin, getRegistro, postRegistro, getLogout };
