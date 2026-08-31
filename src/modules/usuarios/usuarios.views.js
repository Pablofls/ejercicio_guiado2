const { page, esc, nav } = require('../../shared/layout');

function listaView(usuarios, usuario) {
    const filas = usuarios.map(u => `
        <tr>
            <td>${u.id}</td>
            <td>${esc(u.nombre)}</td>
            <td>${esc(u.email)}</td>
            <td><span class="etiqueta etiqueta--${u.rol === 'admin' ? 'admin' : 'lector'}">${esc(u.rol)}</span></td>
            <td>${esc(new Date(u.creado_en).toLocaleDateString('es-MX'))}</td>
            <td>
                <a href="/usuarios/${u.id}/editar">Editar</a> &middot;
                <form method="POST" action="/usuarios/${u.id}/eliminar">
                    <button type="submit" onclick="return confirm('¿Eliminar este usuario?')">Eliminar</button>
                </form>
            </td>
        </tr>`).join('');

    return page('Usuarios', `
${nav(usuario)}
<main class="container">
  <div class="panel">
    <div class="panel__encabezado">
      <h1>Usuarios</h1>
      <a class="boton" href="/usuarios/nuevo">+ Nuevo usuario</a>
    </div>
    <table>
      <thead><tr><th>ID</th><th>Nombre</th><th>Email</th><th>Rol</th><th>Registro</th><th>Acciones</th></tr></thead>
      <tbody>${filas}</tbody>
    </table>
  </div>
</main>`, { contenedor: false });
}

function formularioView(titulo, action, editado, usuario) {
    const u = editado || {};
    const campoPassword = editado
        ? `<div class="campo">
             <label for="password">Nueva contraseña <span style="font-weight:400">(vacío = no cambiar)</span></label>
             <input type="password" id="password" name="password" autocomplete="new-password">
           </div>`
        : `<div class="campo">
             <label for="password">Contraseña</label>
             <input type="password" id="password" name="password" autocomplete="new-password" minlength="6" required>
           </div>`;

    return page(titulo, `
${nav(usuario)}
<main class="container">
  <div class="panel">
    <h1>${esc(titulo)}</h1>
    <form method="POST" action="${esc(action)}">
      <div class="campo"><label for="nombre">Nombre</label>
        <input type="text" id="nombre" name="nombre" value="${esc(u.nombre || '')}" required></div>
      <div class="campo"><label for="email">Email</label>
        <input type="email" id="email" name="email" value="${esc(u.email || '')}" required></div>
      ${campoPassword}
      <div class="campo"><label for="rol">Rol</label>
        <select id="rol" name="rol">
          <option value="lector" ${u.rol === 'lector' ? 'selected' : ''}>Lector</option>
          <option value="admin" ${u.rol === 'admin' ? 'selected' : ''}>Admin</option>
        </select></div>
      <button type="submit">Guardar</button>
    </form>
    <p><a href="/usuarios">Volver</a></p>
  </div>
</main>`, { contenedor: false });
}

module.exports = { listaView, formularioView };
