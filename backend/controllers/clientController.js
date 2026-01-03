const Client = require('../models/Client');

// 1. Create a new Client
exports.createClient = async (req, res) => {
    try {
        // Get data from the App (Request Body)
        const { fullname, phone, allergies } = req.body;

        // Validation: Name is mandatory
        if (!fullname) {
            return res.status(400).json({ error: 'El nombre completo es requerido' });
        }

        // Save to Database
        const newClient = await Client.create({
            fullname,
            phone,
            allergies
        });

        // Respond to the App
        res.status(201).json({
            message: 'Cliente creado exitosamente',
            client: newClient
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error del servidor, intente más tarde' });
    }
};

// 2. Get All Clients
exports.getAllClients = async (req, res) => {
    try {
        const clients = await Client.findAll();
        res.status(200).json(clients);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error del servidor, intente más tarde' });
    }
};