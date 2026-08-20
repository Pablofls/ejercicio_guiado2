const db = require('../../../db');

async function getById(id) {
    const result = await db.query('SELECT * FROM conceptos WHERE id = $1', [id]);
    return result.rows[0] || null;
}

async function create(libroId, { termino, definicion }) {
    await db.query(
        'INSERT INTO conceptos (libro_id, termino, definicion) VALUES ($1, $2, $3)',
        [libroId, termino, definicion]
    );
}

async function update(id, { termino, definicion }) {
    const result = await db.query(
        'UPDATE conceptos SET termino=$1, definicion=$2 WHERE id=$3 RETURNING libro_id',
        [termino, definicion, id]
    );
    return result.rows[0];
}

async function remove(id) {
    const result = await db.query(
        'DELETE FROM conceptos WHERE id=$1 RETURNING libro_id',
        [id]
    );
    return result.rows[0];
}

module.exports = { getById, create, update, remove };
