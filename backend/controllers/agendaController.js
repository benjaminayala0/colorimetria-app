const { Op } = require('sequelize');
const Appointment = require('../models/Appointment');
const Client = require('../models/Client');

// Helper function to format date as YYYY-MM-DD
function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Main controller function
exports.getTodayAgenda = async (req, res) => {
    try {
        const now = new Date();
        const argentinaTime = new Date(now.toLocaleString('en-US', {
            timeZone: 'America/Argentina/Buenos_Aires'
        }));

        const todayString = formatDate(argentinaTime);
        const currentTime = `${String(argentinaTime.getHours()).padStart(2, '0')}:${String(argentinaTime.getMinutes()).padStart(2, '0')}`;

        // Fetch all appointments for today with client info
        const appointments = await Appointment.findAll({
            where: { dateString: todayString },
            include: [{
                model: Client,
                attributes: ['phone'],
                required: false
            }],
            order: [['time', 'ASC']]
        });

        // Enrich with status and current indicator
        let currentFound = false;
        const enrichedAppointments = appointments.map((apt) => {
            const isPast = apt.time < currentTime;
            const isCurrent = !isPast && !currentFound;

            if (isCurrent) {
                currentFound = true;
            }

            return {
                id: apt.id,
                time: apt.time,
                clientName: apt.clientName,
                clientPhone: apt.Client?.phone || null,
                clientId: apt.clientId,
                service: apt.service,
                price: apt.price,
                status: apt.status || 'pending',
                completedAt: apt.completedAt,
                isPast,
                isCurrent
            };
        });

        // Calculate status-based counts
        const pendingCount = enrichedAppointments.filter(a => a.status === 'pending').length;
        const completedCount = enrichedAppointments.filter(a => a.status === 'completed').length;
        const absentCount = enrichedAppointments.filter(a => a.status === 'absent').length;
        const cancelledCount = enrichedAppointments.filter(a => a.status === 'cancelled').length;

        // Calculate total revenue 
        const totalRevenue = enrichedAppointments
            .filter(a => a.status === 'completed')
            .reduce((sum, a) => sum + (parseFloat(a.price) || 0), 0);

        res.status(200).json({
            date: todayString,
            appointments: enrichedAppointments,
            totalAppointments: appointments.length,
            pendingCount,
            completedCount,
            absentCount,
            cancelledCount,
            totalRevenue
        });

    } catch (error) {
        console.error('Error fetching today agenda:', error);
        res.status(500).json({ error: 'Error fetching agenda' });
    }
};
