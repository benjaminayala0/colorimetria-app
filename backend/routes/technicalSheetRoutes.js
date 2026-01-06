const express = require('express');
const router = express.Router();
const technicalSheetController = require('../controllers/technicalSheetController');
const TechnicalSheet = require('../models/TechnicalSheet'); // Importamos el modelo Sequelize

// Create a new technical sheet
router.post('/', technicalSheetController.createSheet);

// Get all technical sheets for a specific client
router.get('/client/:clientId', technicalSheetController.getSheetsByClient);

//  Update an existing technical sheet
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { service, formula, notes, date } = req.body;

  try {
    if (!service || !formula || !date) {
      return res.status(400).json({ error: 'Faltan datos obligatorios (service, formula, date)' });
    }

    
    const sheet = await TechnicalSheet.findByPk(id);

    if (!sheet) {
      return res.status(404).json({ error: 'No se encontró esa ficha' });
    }

    
    sheet.service = service;
    sheet.formula = formula;
    sheet.notes = notes;
    sheet.date = date;

    
    await sheet.save();

    res.json({ message: '¡Ficha actualizada correctamente!', sheet });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar la ficha' });
  }
});

// Delete a technical sheet
router.delete('/:id', technicalSheetController.deleteSheet);

module.exports = router;