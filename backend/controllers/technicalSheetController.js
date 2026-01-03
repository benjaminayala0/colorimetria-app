const TechnicalSheet = require('../models/TechnicalSheet');

// 1. Create a new Technical Sheet
exports.createSheet = async (req, res) => {
    try {
        const { clientId, service, formula, notes, date } = req.body;

        if (!clientId || !formula) {
            return res.status(400).json({ 
                error: 'El Cliente ID y la fórmula son obligatorios' 
            });
        }

        const newSheet = await TechnicalSheet.create({
            clientId,
            service,
            formula,
            notes,
            date 
        });

        res.status(201).json({
            message: 'Ficha técnica guardada correctamente',
            sheet: newSheet
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error del servidor' });
    }
};

// 2. Get all sheets for a SPECIFIC Client
exports.getSheetsByClient = async (req, res) => {
    try {
        const { clientId } = req.params; 

        const sheets = await TechnicalSheet.findAll({
            where: { clientId: clientId }, 
            order: [['createdAt', 'DESC']] 
        });

        res.status(200).json(sheets);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error del servidor' });
    }
};