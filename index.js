const express = require('express');
const session = require('express-session');
const path = require('path');
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
    secret: 'libreria_secret_key',
    resave: false,
    saveUninitialized: false
}));

// Módulos
app.use('/', require('./src/modules/auth/auth.routes'));
app.use('/libros', require('./src/modules/libros/libros.routes'));
app.use('/autores', require('./src/modules/autores/autores.routes'));
app.use('/categorias', require('./src/modules/categorias/categorias.routes'));
app.use('/conceptos', require('./src/modules/conceptos/conceptos.routes'));
app.use('/imagenes', require('./src/modules/imagenes/imagenes.routes'));
app.use('/usuarios', require('./src/modules/usuarios/usuarios.routes'));

app.listen(3000, () => {
    console.log('Servidor corriendo en http://localhost:3000');
});
