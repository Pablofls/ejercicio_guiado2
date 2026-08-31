const ConceptosModel = require('./conceptos.model');
const ConceptosViews = require('./conceptos.views');
const LibrosModel = require('../libros/libros.model');

async function getNuevo(req, res) {
    const libro = await LibrosModel.getById(req.params.libro_id);
    if (!libro) return res.send('Libro no encontrado. <a href="/libros">Volver</a>');
    res.send(ConceptosViews.formularioNuevoView(libro, req.session.usuario));
}

async function postCrear(req, res) {
    await ConceptosModel.create(req.params.libro_id, req.body);
    res.redirect('/libros/' + req.params.libro_id);
}

async function getEditar(req, res) {
    const concepto = await ConceptosModel.getById(req.params.id);
    if (!concepto) return res.send('Concepto no encontrado. <a href="/libros">Volver</a>');
    res.send(ConceptosViews.formularioEditarView(concepto, req.session.usuario));
}

async function postActualizar(req, res) {
    const { libro_id } = await ConceptosModel.update(req.params.id, req.body);
    res.redirect('/libros/' + libro_id);
}

async function postEliminar(req, res) {
    const { libro_id } = await ConceptosModel.remove(req.params.id);
    res.redirect('/libros/' + libro_id);
}

module.exports = { getNuevo, postCrear, getEditar, postActualizar, postEliminar };
