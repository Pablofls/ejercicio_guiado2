const express = require('express');
const router = express.Router();
const controller = require('./conceptos.controller');
const { requireAdmin } = require('../../shared/middleware');

router.get('/nuevo/:libro_id', requireAdmin, controller.getNuevo);
router.post('/:libro_id', requireAdmin, controller.postCrear);
router.get('/:id/editar', requireAdmin, controller.getEditar);
router.post('/:id/editar', requireAdmin, controller.postActualizar);
router.post('/:id/eliminar', requireAdmin, controller.postEliminar);

module.exports = router;
