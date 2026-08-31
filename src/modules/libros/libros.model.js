const db = require('../../../db');

async function getAll() {
    // La subconsulta lateral trae la portada de cada libro: la imagen marcada como
    // principal y, si no hay ninguna, la más antigua.
    const result = await db.query(`
        SELECT l.*, a.nombre AS autor_nombre, c.nombre AS categoria_nombre,
               img.ruta_archivo AS portada
        FROM libros l
        LEFT JOIN autores a ON l.autor_id = a.id
        LEFT JOIN categorias c ON l.categoria_id = c.id
        LEFT JOIN LATERAL (
            SELECT ruta_archivo
            FROM imagenes_libros
            WHERE libro_id = l.id
            ORDER BY es_principal DESC, id
            LIMIT 1
        ) img ON TRUE
        ORDER BY l.titulo`);
    return result.rows;
}

async function getById(id) {
    const result = await db.query(`
        SELECT l.*, a.nombre AS autor_nombre, c.nombre AS categoria_nombre
        FROM libros l
        LEFT JOIN autores a ON l.autor_id = a.id
        LEFT JOIN categorias c ON l.categoria_id = c.id
        WHERE l.id = $1`, [id]);
    return result.rows[0] || null;
}

async function getImagenes(libroId) {
    const result = await db.query(
        'SELECT * FROM imagenes_libros WHERE libro_id = $1 ORDER BY es_principal DESC, id',
        [libroId]
    );
    return result.rows;
}

async function getConceptos(libroId) {
    const result = await db.query(
        'SELECT * FROM conceptos WHERE libro_id = $1 ORDER BY termino',
        [libroId]
    );
    return result.rows;
}

async function create({ titulo, isbn, anio_publicacion, sinopsis, stock, autor_id, categoria_id }) {
    await db.query(
        'INSERT INTO libros (titulo, isbn, anio_publicacion, sinopsis, stock, autor_id, categoria_id) VALUES ($1,$2,$3,$4,$5,$6,$7)',
        [titulo, isbn || null, anio_publicacion || null, sinopsis, stock || 0, autor_id || null, categoria_id || null]
    );
}

async function update(id, { titulo, isbn, anio_publicacion, sinopsis, stock, autor_id, categoria_id }) {
    await db.query(
        'UPDATE libros SET titulo=$1, isbn=$2, anio_publicacion=$3, sinopsis=$4, stock=$5, autor_id=$6, categoria_id=$7 WHERE id=$8',
        [titulo, isbn || null, anio_publicacion || null, sinopsis, stock || 0, autor_id || null, categoria_id || null, id]
    );
}

async function remove(id) {
    await db.query('DELETE FROM libros WHERE id=$1', [id]);
}

module.exports = { getAll, getById, getImagenes, getConceptos, create, update, remove };
