const express = require('express');
const router = express.Router();
const controller = require('./imagenes.controller');
const { requireAdmin } = require('../../shared/middleware');

router.get('/nuevo/:libro_id', requireAdmin, controller.getNuevo);
router.post('/:libro_id', requireAdmin, controller.uploadMiddleware, controller.postSubir);
router.post('/:id/eliminar', requireAdmin, controller.postEliminar);

module.exports = router;
