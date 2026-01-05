const express = require('express');
const router = express.Router();
const clientController = require('../controllers/clientController');

// Create a new client
router.post('/', clientController.createClient);

// Get all clients
router.get('/', clientController.getAllClients);

// Delete a client 
router.delete('/:id', clientController.deleteClient);

module.exports = router;