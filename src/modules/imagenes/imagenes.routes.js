const express = require('express');
const router = express.Router();
const controller = require('./imagenes.controller');
const { requireLogin } = require('../../shared/middleware');

router.get('/nuevo/:libro_id', requireLogin, controller.getNuevo);
router.post('/:libro_id', requireLogin, controller.uploadMiddleware, controller.postSubir);
router.post('/:id/eliminar', requireLogin, controller.postEliminar);

module.exports = router;
