function page(title, content) {
    return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><title>${title} - Librería</title>
<link rel="stylesheet" href="/css/style.css"></head>
<body><div class="container">${content}</div></body>
</html>`;
}

module.exports = { page };
