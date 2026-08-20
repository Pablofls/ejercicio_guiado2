const { Pool } = require('pg');

const pool = new Pool({
    user: 'libreria_user',
    host: 'localhost',
    database: 'libreria_db',
    password: '666',
    port: 5432
});

module.exports = pool;
