const Appointment = require('../models/Appointment');

// 1. Create a new Appointment
exports.createAppointment = async (req, res) => {
    try {
        const { dateString, time, clientName, service, clientId } = req.body;

        // Validation: Required fields
        if (!dateString || !time || !clientName || !service) {
            return res.status(400).json({ 
                error: 'Fecha, hora, nombre del cliente y servicio son obligatorios' 
            });
        }

        // Save to Database
        const newAppointment = await Appointment.create({
            dateString,
            time,
            clientName,
            service,
            clientId: clientId || null
        });

        res.status(201).json({
            message: 'Turno creado exitosamente',
            appointment: newAppointment
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error del servidor, intente más tarde' });
    }
};

// 2. Get All Appointments
exports.getAllAppointments = async (req, res) => {
    try {
        const appointments = await Appointment.findAll({
            order: [['dateString', 'ASC'], ['time', 'ASC']]
        });
        res.status(200).json(appointments);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error del servidor, intente más tarde' });
    }
};

// 3. Get Appointments by Date
exports.getAppointmentsByDate = async (req, res) => {
    try {
        const { date } = req.params;
        
        const appointments = await Appointment.findAll({
            where: { dateString: date },
            order: [['time', 'ASC']]
        });

        res.status(200).json(appointments);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error del servidor, intente más tarde' });
    }
};

// 4. Update an Appointment
exports.updateAppointment = async (req, res) => {
    try {
        const { id } = req.params;
        const { dateString, time, clientName, service, clientId } = req.body;

        const appointment = await Appointment.findByPk(id);
        if (!appointment) {
            return res.status(404).json({ error: 'Turno no encontrado' });
        }

        appointment.dateString = dateString || appointment.dateString;
        appointment.time = time || appointment.time;
        appointment.clientName = clientName || appointment.clientName;
        appointment.service = service || appointment.service;
        appointment.clientId = clientId !== undefined ? clientId : appointment.clientId;

        await appointment.save();

        res.json({ message: 'Turno actualizado exitosamente', appointment });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al actualizar el turno, intente más tarde' });
    }
};

// 5. Delete an Appointment
exports.deleteAppointment = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await Appointment.destroy({
            where: { id: id }
        });

        if (result === 0) {
            return res.status(404).json({ error: 'Turno no encontrado' });
        }

        res.status(200).json({ message: 'Turno eliminado correctamente' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error del servidor, intente más tarde' });
    }
};
