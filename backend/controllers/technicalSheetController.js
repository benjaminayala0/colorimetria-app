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

        // Handle uploaded images
        let photoBefore = null;
        let photoAfter = null;
        
        // verify if files are uploaded
        if (req.files){
            if (req.files.photoBefore){
                photoBefore = req.files.photoBefore[0].path;
            }
            if (req.files.photoAfter){
                photoAfter = req.files.photoAfter[0].path;
            }
        }
        
        // Create the new technical sheet record
        const newSheet = await TechnicalSheet.create({
            clientId,
            service,
            formula,
            notes,
            date,
            photoBefore: photoBefore,   
            photoAfter: photoAfter
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
            order: [['date', 'DESC']] 
        });

        res.status(200).json(sheets);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error del servidor' });
    }
};

// 3. Delete a Technical Sheet
exports.deleteSheet = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await TechnicalSheet.destroy({
            where: { id: id }
        });

        if (result === 0) {
            return res.status(404).json({ error: 'Ficha no encontrada' });
        }

        res.status(200).json({ message: 'Ficha eliminada correctamente' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error del servidor' });
    }
};