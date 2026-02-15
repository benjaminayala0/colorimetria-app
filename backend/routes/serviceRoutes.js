const express = require('express');
const router = express.Router();
const serviceController = require('../controllers/serviceController');

// Crear un nuevo servicio
router.post('/', serviceController.createService);
// Listar todos los servicios
router.get('/', serviceController.getAllServices);
// Actualizar un servicio
router.put('/:id', serviceController.updateService);
// Eliminar un servicio
router.delete('/:id', serviceController.deleteService);

module.exports = router;
