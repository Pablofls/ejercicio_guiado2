const express = require('express');
const router = express.Router();
const controller = require('./categorias.controller');
const { requireAdmin } = require('../../shared/middleware');

router.get('/', requireAdmin, controller.getLista);
router.get('/nuevo', requireAdmin, controller.getNuevo);
router.post('/', requireAdmin, controller.postCrear);
router.get('/:id/editar', requireAdmin, controller.getEditar);
router.post('/:id/editar', requireAdmin, controller.postActualizar);
router.post('/:id/eliminar', requireAdmin, controller.postEliminar);

module.exports = router;
