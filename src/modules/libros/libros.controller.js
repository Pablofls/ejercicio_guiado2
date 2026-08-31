const LibrosModel = require('./libros.model');
const LibrosViews = require('./libros.views');
const AutoresModel = require('../autores/autores.model');
const CategoriasModel = require('../categorias/categorias.model');

async function getLista(req, res) {
    const usuario = req.session.usuario;
    const libros = await LibrosModel.getAll();
    // El lector ve el catálogo con portadas; el admin, la tabla de gestión.
    const vista = usuario.rol === 'admin' ? LibrosViews.listaView : LibrosViews.catalogoView;
    res.send(vista(libros, usuario));
}

async function getNuevo(req, res) {
    const [autores, categorias] = await Promise.all([
        AutoresModel.getAll(),
        CategoriasModel.getAll()
    ]);
    res.send(LibrosViews.formularioView('Nuevo libro', '/libros', null, autores, categorias, req.session.usuario));
}

async function postCrear(req, res) {
    await LibrosModel.create(req.body);
    res.redirect('/libros');
}

async function getDetalle(req, res) {
    const libro = await LibrosModel.getById(req.params.id);
    if (!libro) return res.send('Libro no encontrado. <a href="/libros">Volver</a>');
    const [imagenes, conceptos] = await Promise.all([
        LibrosModel.getImagenes(req.params.id),
        LibrosModel.getConceptos(req.params.id)
    ]);
    res.send(LibrosViews.detalleView(libro, imagenes, conceptos, req.session.usuario));
}

async function getEditar(req, res) {
    const [libro, autores, categorias] = await Promise.all([
        LibrosModel.getById(req.params.id),
        AutoresModel.getAll(),
        CategoriasModel.getAll()
    ]);
    if (!libro) return res.send('Libro no encontrado. <a href="/libros">Volver</a>');
    res.send(LibrosViews.formularioView('Editar libro', `/libros/${libro.id}/editar`, libro, autores, categorias, req.session.usuario));
}

async function postActualizar(req, res) {
    await LibrosModel.update(req.params.id, req.body);
    res.redirect('/libros/' + req.params.id);
}

async function postEliminar(req, res) {
    await LibrosModel.remove(req.params.id);
    res.redirect('/libros');
}

module.exports = { getLista, getNuevo, postCrear, getDetalle, getEditar, postActualizar, postEliminar };
