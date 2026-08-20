const { page } = require('../../shared/layout');

function listaView(usuarios) {
    const filas = usuarios.map(u => `
        <tr>
            <td>${u.id}</td>
            <td>${u.nombre}</td>
            <td>${u.email}</td>
            <td>${u.rol}</td>
            <td>${new Date(u.creado_en).toLocaleDateString('es-MX')}</td>
            <td>
                <a href="/usuarios/${u.id}/editar">Editar</a> |
                <form method="POST" action="/usuarios/${u.id}/eliminar" style="display:inline">
                    <button type="submit" onclick="return confirm('¿Eliminar usuario?')">Eliminar</button>
                </form>
            </td>
        </tr>`).join('');

    return page('Usuarios', `
<h1>Usuarios Registrados</h1>
<a href="/usuarios/nuevo">+ Nuevo Usuario</a> | <a href="/libros">Libros</a> | <a href="/logout">Salir</a>
<table>
  <thead><tr><th>ID</th><th>Nombre</th><th>Email</th><th>Rol</th><th>Registro</th><th>Acciones</th></tr></thead>
  <tbody>${filas}</tbody>
</table>`);
}

function formularioView(titulo, action, usuario) {
    const u = usuario || {};
    const optsRol = `
    <option value="lector" ${u.rol === 'lector' ? 'selected' : ''}>Lector</option>
    <option value="admin" ${u.rol === 'admin' ? 'selected' : ''}>Admin</option>`;

    const campoPassword = usuario
        ? `<label>Nueva contraseña (dejar vacío para no cambiar):</label>
           <input type="password" name="password">`
        : `<label>Contraseña:</label>
           <input type="password" name="password" required>`;

    return page(titulo, `
<h2>${titulo}</h2>
<form method="POST" action="${action}">
  <label>Nombre:</label><input type="text" name="nombre" value="${u.nombre || ''}" required>
  <label>Email:</label><input type="email" name="email" value="${u.email || ''}" required>
  ${campoPassword}
  <label>Rol:</label>
  <select name="rol">${optsRol}</select>
  <button type="submit">Guardar</button>
</form>
<a href="/usuarios">Volver</a>`);
}

module.exports = { listaView, formularioView };
