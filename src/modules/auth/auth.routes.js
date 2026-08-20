const express = require('express');
const router = express.Router();
const controller = require('./auth.controller');

router.get('/', controller.getRoot);
router.get('/login', controller.getLogin);
router.post('/login', controller.postLogin);
router.get('/registro', controller.getRegistro);
router.post('/registro', controller.postRegistro);
router.get('/logout', controller.getLogout);

module.exports = router;
