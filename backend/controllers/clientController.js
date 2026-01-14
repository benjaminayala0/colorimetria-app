const Client = require('../models/Client');
const TechnicalSheet = require('../models/TechnicalSheet');

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
        const clients = await Client.findAll(
            { order: [['fullname', 'ASC']] }
        );
        res.status(200).json(clients);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error del servidor, intente más tarde' });
    }
};

// 3. Delete a Client (and their history)
exports.deleteClient = async (req, res) => {
    try {
        const { id } = req.params;

        // First: Delete all technical sheets associated with this client
        await TechnicalSheet.destroy({
            where: { clientId: id }
        });

        // Second: Delete the client
        const result = await Client.destroy({
            where: { id: id }
        });

        if (result === 0) {
            return res.status(404).json({ error: 'Cliente no encontrado' });
        }

        res.status(200).json({ message: 'Cliente y su historial eliminados correctamente' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error del servidor, intente más tarde' });
    }
};

    // Update a Client
    exports.updateClient = async (req, res) => {
        try {
            const { id } = req.params;
            const { fullname, phone } = req.body;

            // Find the client by ID
            const client = await Client.findByPk(id);
            if (!client) {
                return res.status(404).json({ error: 'Cliente no encontrado' });
            }

            // Update the client
            client.fullname = fullname || client.fullname;
            client.phone = phone || client.phone;

            await client.save();

            res.json({message: 'Cliente actualizado exitosamente', client});

            } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Error al actualizar el cliente, intente más tarde' });
        }
}; 