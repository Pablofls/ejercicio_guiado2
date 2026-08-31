const AuthModel = require('./auth.model');
const AuthViews = require('./auth.views');

function getRoot(req, res) {
    if (req.session.usuario) return res.redirect('/libros');
    res.redirect('/login');
}

function getLogin(req, res) {
    if (req.session.usuario) return res.redirect('/libros');
    const toast = req.query.registrado !== undefined
        ? { tipo: 'exito', mensaje: 'Cuenta creada. Ya puedes iniciar sesión.' }
        : null;
    res.send(AuthViews.loginView({ toast }));
}

async function postLogin(req, res) {
    const { email, password } = req.body;
    try {
        const usuario = await AuthModel.findByEmail(email);
        const valido = usuario && await AuthModel.verifyPassword(password, usuario.password_hash);

        // Mismo mensaje para email inexistente y contraseña incorrecta: no revela
        // qué correos están registrados.
        if (!valido) {
            return res.status(401).send(AuthViews.loginView({
                email,
                toast: { tipo: 'error', mensaje: 'El correo o la contraseña son incorrectos.' }
            }));
        }

        req.session.usuario = { id: usuario.id, nombre: usuario.nombre, rol: usuario.rol };
        res.redirect('/libros');
    } catch (err) {
        console.error(err);
        res.status(500).send(AuthViews.loginView({
            email,
            toast: { tipo: 'error', mensaje: 'Error en el servidor. Inténtalo de nuevo.' }
        }));
    }
}

function getRegistro(req, res) {
    if (req.session.usuario) return res.redirect('/libros');
    res.send(AuthViews.registroView());
}

async function postRegistro(req, res) {
    const { nombre, email, password } = req.body;
    try {
        await AuthModel.createUser(nombre, email, password);
        res.redirect('/login?registrado');
    } catch (err) {
        console.error(err);
        // 23505 = unique_violation sobre usuarios.email
        const mensaje = err.code === '23505'
            ? 'Ese correo ya está registrado.'
            : 'No se pudo crear la cuenta. Inténtalo de nuevo.';
        res.status(400).send(AuthViews.registroView({
            nombre,
            email,
            toast: { tipo: 'error', mensaje }
        }));
    }
}

function getLogout(req, res) {
    req.session.destroy(() => res.redirect('/login'));
}

module.exports = { getRoot, getLogin, postLogin, getRegistro, postRegistro, getLogout };
