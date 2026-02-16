const Appointment = require('../models/Appointment');
const Service = require('../models/Service');
const { Op } = require('sequelize');

// 1. Create a new Appointment
exports.createAppointment = async (req, res) => {
    try {
        const { dateString, time, clientName, service, clientId, price, serviceId } = req.body;

        // Validation: Required fields

        if (!dateString || !time || !clientName || (!service && !serviceId)) {
            return res.status(400).json({
                error: 'Fecha, hora, nombre del cliente y servicio o serviceId son obligatorios'
            });
        }

        let finalService = service;
        let finalPrice = price;
        let finalServiceId = serviceId;

        // If serviceId is provided, find the service and use its name and price
        if (serviceId) {
            const foundService = await Service.findByPk(serviceId);
            if (!foundService) {
                return res.status(400).json({ error: 'Servicio no encontrado' });
            }
            finalService = foundService.name;
            finalPrice = foundService.price;
            finalServiceId = foundService.id;
        }

        // Save to Database
        const newAppointment = await Appointment.create({
            dateString,
            time,
            clientName,
            service: finalService,
            clientId: clientId || null,
            price: finalPrice !== undefined ? finalPrice : 0,
            serviceId: finalServiceId || null
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
        const { dateString, time, clientName, service, clientId, price } = req.body;

        const appointment = await Appointment.findByPk(id);
        if (!appointment) {
            return res.status(404).json({ error: 'Turno no encontrado' });
        }

        appointment.dateString = dateString || appointment.dateString;
        appointment.time = time || appointment.time;
        appointment.clientName = clientName || appointment.clientName;
        appointment.service = service || appointment.service;
        appointment.clientId = clientId !== undefined ? clientId : appointment.clientId;
        if (price !== undefined) appointment.price = price;

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

// 6. Get Dashboard Summary 
exports.getDashboardSummary = async (req, res) => {
    try {
        // Get current time in Argentina timezone (works in any server timezone)
        const now = new Date();
        const argentinaTime = new Date(now.toLocaleString('en-US', {
            timeZone: 'America/Argentina/Buenos_Aires'
        }));

        // Format date as YYYY-MM-DD
        const year = argentinaTime.getFullYear();
        const month = String(argentinaTime.getMonth() + 1).padStart(2, '0');
        const day = String(argentinaTime.getDate()).padStart(2, '0');
        const todayString = `${year}-${month}-${day}`;

        // Format time as HH:MM
        const hours = String(argentinaTime.getHours()).padStart(2, '0');
        const minutes = String(argentinaTime.getMinutes()).padStart(2, '0');
        const timeString = `${hours}:${minutes}`;

        const nextAppointment = await Appointment.findOne({
            where: {
                status: 'pending',
                [Op.or]: [

                    {
                        dateString: { [Op.gt]: todayString }
                    },
                    {
                        dateString: todayString,
                        time: { [Op.gte]: timeString }
                    }
                ]
            },
            order: [
                ['dateString', 'ASC'],
                ['time', 'ASC']
            ]
        });

        const todayAppointments = await Appointment.findAll({
            where: {
                dateString: todayString,
                status: 'completed'
            }
        });
        const todayCount = todayAppointments.length;
        const todayIncome = todayAppointments.reduce((sum, appt) => {
            const price = parseFloat(appt.price) || 0;
            return sum + price;
        }, 0);

        res.status(200).json({
            nextAppointment: nextAppointment || null,
            todayCount: todayCount || 0,
            todayIncome: todayIncome || 0
        });

    } catch (error) {
        console.error("Error en dashboard summary:", error);
        res.status(500).json({ error: 'Error del servidor al obtener resumen' });
    }
};

// Update appointment status
exports.updateAppointmentStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        // Validate status
        const validStatuses = ['pending', 'completed', 'absent', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ error: 'Invalid status value' });
        }

        const appointment = await Appointment.findByPk(id);
        if (!appointment) {
            return res.status(404).json({ error: 'Appointment not found' });
        }

        appointment.status = status;

        // Set completedAt timestamp when marking as completed
        if (status === 'completed') {
            appointment.completedAt = new Date();
        } else if (status === 'pending') {
            // Clear completedAt if reverting to pending
            appointment.completedAt = null;
        }

        await appointment.save();

        res.json({
            id: appointment.id,
            status: appointment.status,
            completedAt: appointment.completedAt,
            message: 'Status updated successfully'
        });
    } catch (error) {
        console.error('Error updating appointment status:', error);
        res.status(500).json({ error: 'Error updating status' });
    }
};