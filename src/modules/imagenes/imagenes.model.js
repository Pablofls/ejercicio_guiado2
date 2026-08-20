const db = require('../../../db');

async function create(libroId, ruta_archivo, descripcion, es_principal) {
    if (es_principal) {
        await db.query(
            'UPDATE imagenes_libros SET es_principal=FALSE WHERE libro_id=$1',
            [libroId]
        );
    }
    await db.query(
        'INSERT INTO imagenes_libros (libro_id, ruta_archivo, descripcion, es_principal) VALUES ($1,$2,$3,$4)',
        [libroId, ruta_archivo, descripcion || null, es_principal]
    );
}

async function remove(id) {
    const result = await db.query(
        'DELETE FROM imagenes_libros WHERE id=$1 RETURNING libro_id',
        [id]
    );
    return result.rows[0];
}

module.exports = { create, remove };
