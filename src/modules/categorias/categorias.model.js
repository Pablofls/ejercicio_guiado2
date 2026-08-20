const db = require('../../../db');

async function getAll() {
    const result = await db.query('SELECT * FROM categorias ORDER BY nombre');
    return result.rows;
}

async function getById(id) {
    const result = await db.query('SELECT * FROM categorias WHERE id = $1', [id]);
    return result.rows[0] || null;
}

async function create({ nombre, descripcion }) {
    await db.query(
        'INSERT INTO categorias (nombre, descripcion) VALUES ($1, $2)',
        [nombre, descripcion]
    );
}

async function update(id, { nombre, descripcion }) {
    await db.query(
        'UPDATE categorias SET nombre=$1, descripcion=$2 WHERE id=$3',
        [nombre, descripcion, id]
    );
}

async function remove(id) {
    await db.query('DELETE FROM categorias WHERE id=$1', [id]);
}

module.exports = { getAll, getById, create, update, remove };
