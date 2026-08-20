const express = require('express');
const router = express.Router();
const controller = require('./conceptos.controller');
const { requireLogin } = require('../../shared/middleware');

router.get('/nuevo/:libro_id', requireLogin, controller.getNuevo);
router.post('/:libro_id', requireLogin, controller.postCrear);
router.get('/:id/editar', requireLogin, controller.getEditar);
router.post('/:id/editar', requireLogin, controller.postActualizar);
router.post('/:id/eliminar', requireLogin, controller.postEliminar);

module.exports = router;
