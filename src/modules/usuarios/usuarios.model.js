const db = require('../../../db');
const bcrypt = require('bcrypt');

async function getAll() {
    const result = await db.query(
        'SELECT id, nombre, email, rol, creado_en FROM usuarios ORDER BY nombre'
    );
    return result.rows;
}

async function getById(id) {
    const result = await db.query(
        'SELECT id, nombre, email, rol FROM usuarios WHERE id = $1',
        [id]
    );
    return result.rows[0] || null;
}

async function create({ nombre, email, password, rol }) {
    const hash = await bcrypt.hash(password, 10);
    await db.query(
        'INSERT INTO usuarios (nombre, email, password_hash, rol) VALUES ($1,$2,$3,$4)',
        [nombre, email, hash, rol || 'lector']
    );
}

async function update(id, { nombre, email, password, rol }) {
    if (password && password.trim() !== '') {
        const hash = await bcrypt.hash(password, 10);
        await db.query(
            'UPDATE usuarios SET nombre=$1, email=$2, password_hash=$3, rol=$4 WHERE id=$5',
            [nombre, email, hash, rol, id]
        );
    } else {
        await db.query(
            'UPDATE usuarios SET nombre=$1, email=$2, rol=$3 WHERE id=$4',
            [nombre, email, rol, id]
        );
    }
}

async function remove(id) {
    await db.query('DELETE FROM usuarios WHERE id=$1', [id]);
}

module.exports = { getAll, getById, create, update, remove };
