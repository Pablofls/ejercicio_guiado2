const AutoresModel = require('./autores.model');
const AutoresViews = require('./autores.views');

async function getLista(req, res) {
    const autores = await AutoresModel.getAll();
    res.send(AutoresViews.listaView(autores));
}

function getNuevo(req, res) {
    res.send(AutoresViews.formularioView('Nuevo Autor', '/autores', null));
}

async function postCrear(req, res) {
    await AutoresModel.create(req.body);
    res.redirect('/autores');
}

async function getEditar(req, res) {
    const autor = await AutoresModel.getById(req.params.id);
    if (!autor) return res.send('Autor no encontrado. <a href="/autores">Volver</a>');
    res.send(AutoresViews.formularioView('Editar Autor', `/autores/${autor.id}/editar`, autor));
}

async function postActualizar(req, res) {
    await AutoresModel.update(req.params.id, req.body);
    res.redirect('/autores');
}

async function postEliminar(req, res) {
    await AutoresModel.remove(req.params.id);
    res.redirect('/autores');
}

module.exports = { getLista, getNuevo, postCrear, getEditar, postActualizar, postEliminar };
