const express = require('express');
const router = express.Router();
const controller = require('./autores.controller');
const { requireLogin } = require('../../shared/middleware');

router.get('/', requireLogin, controller.getLista);
router.get('/nuevo', requireLogin, controller.getNuevo);
router.post('/', requireLogin, controller.postCrear);
router.get('/:id/editar', requireLogin, controller.getEditar);
router.post('/:id/editar', requireLogin, controller.postActualizar);
router.post('/:id/eliminar', requireLogin, controller.postEliminar);

module.exports = router;
