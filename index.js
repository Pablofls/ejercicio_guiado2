const express = require('express');
const session = require('express-session');
const path = require('path');
const app = express();

app.set('view engine', 'html');
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
    secret: 'libreria_secret_key',
    resave: false,
    saveUninitialized: false
}));

// Rutas
app.use('/', require('./routes/auth'));
app.use('/libros', require('./routes/libros'));
app.use('/autores', require('./routes/autores'));
app.use('/categorias', require('./routes/categorias'));
app.use('/conceptos', require('./routes/conceptos'));
app.use('/imagenes', require('./routes/imagenes'));
app.use('/usuarios', require('./routes/usuarios'));

app.listen(3000, () => {
    console.log('Servidor corriendo en http://localhost:3000');
});
