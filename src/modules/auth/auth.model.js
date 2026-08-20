const db = require('../../../db');
const bcrypt = require('bcrypt');

async function findByEmail(email) {
    const result = await db.query('SELECT * FROM usuarios WHERE email = $1', [email]);
    return result.rows[0] || null;
}

async function createUser(nombre, email, password) {
    const hash = await bcrypt.hash(password, 10);
    await db.query(
        'INSERT INTO usuarios (nombre, email, password_hash) VALUES ($1, $2, $3)',
        [nombre, email, hash]
    );
}

async function verifyPassword(password, hash) {
    return bcrypt.compare(password, hash);
}

module.exports = { findByEmail, createUser, verifyPassword };
