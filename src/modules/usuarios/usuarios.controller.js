const UsuariosModel = require('./usuarios.model');
const UsuariosViews = require('./usuarios.views');

async function getLista(req, res) {
    const usuarios = await UsuariosModel.getAll();
    res.send(UsuariosViews.listaView(usuarios, req.session.usuario));
}

function getNuevo(req, res) {
    res.send(UsuariosViews.formularioView('Nuevo usuario', '/usuarios', null, req.session.usuario));
}

async function postCrear(req, res) {
    await UsuariosModel.create(req.body);
    res.redirect('/usuarios');
}

async function getEditar(req, res) {
    const usuario = await UsuariosModel.getById(req.params.id);
    if (!usuario) return res.send('Usuario no encontrado. <a href="/usuarios">Volver</a>');
    res.send(UsuariosViews.formularioView('Editar usuario', `/usuarios/${usuario.id}/editar`, usuario, req.session.usuario));
}

async function postActualizar(req, res) {
    await UsuariosModel.update(req.params.id, req.body);
    res.redirect('/usuarios');
}

async function postEliminar(req, res) {
    await UsuariosModel.remove(req.params.id);
    res.redirect('/usuarios');
}

module.exports = { getLista, getNuevo, postCrear, getEditar, postActualizar, postEliminar };
