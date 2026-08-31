// Lectura y validación de la configuración. Un solo lugar que toca process.env.
//
// La aplicación falla al arrancar si falta un secreto obligatorio, en vez de
// arrancar con un valor por defecto inseguro. Un SESSION_SECRET con valor por
// omisión en el repositorio permitiría a cualquiera firmar cookies de sesión
// válidas, así que preferimos no arrancar.
require('dotenv').config({ quiet: true });

const OBLIGATORIAS = ['DB_USER', 'DB_HOST', 'DB_NAME', 'DB_PASSWORD', 'DB_PORT', 'SESSION_SECRET'];

const faltantes = OBLIGATORIAS.filter(v => !process.env[v]);
if (faltantes.length) {
    console.error(
        `Falta configuración obligatoria en .env: ${faltantes.join(', ')}.\n` +
        `Copia .env.example a .env y complétalo. Ver README, "Variables de entorno".`
    );
    process.exit(1);
}

if (process.env.SESSION_SECRET.length < 32) {
    console.error('SESSION_SECRET debe tener al menos 32 caracteres.');
    process.exit(1);
}

// basePath: prefijo bajo el que publica el reverse proxy ('/library' en la VM).
// Vacío en local. Se normaliza para que nunca termine en '/'.
const basePath = (process.env.BASE_PATH || '').replace(/\/+$/, '');

module.exports = {
    entorno: process.env.NODE_ENV || 'development',
    // 127.0.0.1 por defecto: Node no se expone a internet, solo el proxy lo alcanza.
    host: process.env.APP_HOST || '127.0.0.1',
    puerto: parseInt(process.env.APP_PORT || '3000', 10),
    basePath,
    sessionSecret: process.env.SESSION_SECRET,
    // true solo detrás de HTTPS; con http la cookie secure nunca se enviaría.
    cookieSegura: process.env.COOKIE_SECURE === 'true',
    db: {
        user: process.env.DB_USER,
        host: process.env.DB_HOST,
        database: process.env.DB_NAME,
        password: process.env.DB_PASSWORD,
        port: parseInt(process.env.DB_PORT, 10)
    },
    subidas: {
        directorio: process.env.UPLOAD_DIR || 'uploads',
        // 2 MB. El mismo límite está replicado en ck_imagenes_tamano (BD).
        tamanoMaximo: parseInt(process.env.UPLOAD_MAX_BYTES || '2097152', 10)
    }
};
