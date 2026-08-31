const path = require('path');
const multer = require('multer');
const ImagenesModel = require('./imagenes.model');
const ImagenesViews = require('./imagenes.views');
const LibrosModel = require('../libros/libros.model');

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, path.join(__dirname, '../../../public/uploads')),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, Date.now() + ext);
    }
});

const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        const allowed = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
        cb(null, allowed.includes(path.extname(file.originalname).toLowerCase()));
    }
});

const uploadMiddleware = upload.single('imagen');

async function getNuevo(req, res) {
    const libro = await LibrosModel.getById(req.params.libro_id);
    if (!libro) return res.send('Libro no encontrado. <a href="/libros">Volver</a>');
    res.send(ImagenesViews.formularioView(libro, req.session.usuario));
}

async function postSubir(req, res) {
    if (!req.file) return res.send('Archivo no válido. <a href="/libros">Volver</a>');
    const esPrincipal = req.body.es_principal === 'true';
    await ImagenesModel.create(req.params.libro_id, req.file.filename, req.body.descripcion, esPrincipal);
    res.redirect('/libros/' + req.params.libro_id);
}

async function postEliminar(req, res) {
    const { libro_id } = await ImagenesModel.remove(req.params.id);
    res.redirect('/libros/' + libro_id);
}

module.exports = { uploadMiddleware, getNuevo, postSubir, postEliminar };
