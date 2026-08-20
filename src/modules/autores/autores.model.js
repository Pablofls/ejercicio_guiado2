const db = require('../../../db');

async function getAll() {
    const result = await db.query('SELECT * FROM autores ORDER BY nombre');
    return result.rows;
}

async function getById(id) {
    const result = await db.query('SELECT * FROM autores WHERE id = $1', [id]);
    return result.rows[0] || null;
}

async function create({ nombre, biografia, nacionalidad }) {
    await db.query(
        'INSERT INTO autores (nombre, biografia, nacionalidad) VALUES ($1, $2, $3)',
        [nombre, biografia, nacionalidad]
    );
}

async function update(id, { nombre, biografia, nacionalidad }) {
    await db.query(
        'UPDATE autores SET nombre=$1, biografia=$2, nacionalidad=$3 WHERE id=$4',
        [nombre, biografia, nacionalidad, id]
    );
}

async function remove(id) {
    await db.query('DELETE FROM autores WHERE id=$1', [id]);
}

module.exports = { getAll, getById, create, update, remove };
