const CategoriasModel = require('./categorias.model');
const CategoriasViews = require('./categorias.views');

async function getLista(req, res) {
    const categorias = await CategoriasModel.getAll();
    res.send(CategoriasViews.listaView(categorias, req.session.usuario));
}

function getNuevo(req, res) {
    res.send(CategoriasViews.formularioView('Nueva categoría', '/categorias', null, req.session.usuario));
}

async function postCrear(req, res) {
    await CategoriasModel.create(req.body);
    res.redirect('/categorias');
}

async function getEditar(req, res) {
    const categoria = await CategoriasModel.getById(req.params.id);
    if (!categoria) return res.send('Categoría no encontrada. <a href="/categorias">Volver</a>');
    res.send(CategoriasViews.formularioView('Editar categoría', `/categorias/${categoria.id}/editar`, categoria, req.session.usuario));
}

async function postActualizar(req, res) {
    await CategoriasModel.update(req.params.id, req.body);
    res.redirect('/categorias');
}

async function postEliminar(req, res) {
    await CategoriasModel.remove(req.params.id);
    res.redirect('/categorias');
}

module.exports = { getLista, getNuevo, postCrear, getEditar, postActualizar, postEliminar };
