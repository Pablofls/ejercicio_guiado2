const express = require('express');
const router = express.Router();
const controller = require('./libros.controller');
const { requireLogin, requireAdmin } = require('../../shared/middleware');

// OJO: '/nuevo' debe declararse antes que '/:id', o '/libros/nuevo' entraría
// en getDetalle con id = 'nuevo'.
router.get('/', requireLogin, controller.getLista);          // catálogo: cualquier usuario
router.get('/nuevo', requireAdmin, controller.getNuevo);     // gestión: solo admin
router.post('/', requireAdmin, controller.postCrear);
router.get('/:id', requireLogin, controller.getDetalle);     // detalle: cualquier usuario
router.get('/:id/editar', requireAdmin, controller.getEditar);
router.post('/:id/editar', requireAdmin, controller.postActualizar);
router.post('/:id/eliminar', requireAdmin, controller.postEliminar);

module.exports = router;
