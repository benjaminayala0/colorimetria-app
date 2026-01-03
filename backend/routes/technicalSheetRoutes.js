const express = require('express');
const router = express.Router();
const technicalSheetController = require('../controllers/technicalSheetController');

// Create a new technical sheet
router.post('/', technicalSheetController.createSheet);

// Get all technical sheets for a specific client
router.get('/client/:clientId', technicalSheetController.getSheetsByClient);

module.exports = router;