const { Op } = require('sequelize');
const Appointment = require('../models/Appointment');

// Helper function to format date as YYYY-MM-DD
function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Helper function to calculate date range based on period
function calculateDateRange(period, baseDate) {
    const now = baseDate ? new Date(baseDate) : new Date();
    const argentinaTime = new Date(now.toLocaleString('en-US', {
        timeZone: 'America/Argentina/Buenos_Aires'
    }));

    let startDate, endDate;

    switch (period) {
        case 'day':
            startDate = endDate = formatDate(argentinaTime);
            break;

        case 'week':
            // Get Monday of current week (week starts on Monday)
            const dayOfWeek = argentinaTime.getDay();
            const monday = new Date(argentinaTime);
            // If Sunday (0), go back 6 days, otherwise go back (dayOfWeek - 1) days
            const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
            monday.setDate(argentinaTime.getDate() - daysToMonday);
            startDate = formatDate(monday);

            // Get Sunday (end of week)
            const sunday = new Date(monday);
            sunday.setDate(monday.getDate() + 6);
            endDate = formatDate(sunday);
            break;

        case 'month':
            const year = argentinaTime.getFullYear();
            const month = argentinaTime.getMonth();
            startDate = `${year}-${String(month + 1).padStart(2, '0')}-01`;

            // Get last day of month
            const lastDay = new Date(year, month + 1, 0);
            endDate = formatDate(lastDay);
            break;

        case 'year':
            const currentYear = argentinaTime.getFullYear();
            startDate = `${currentYear}-01-01`;
            endDate = `${currentYear}-12-31`;
            break;

        default:
            startDate = endDate = formatDate(argentinaTime);
    }

    return { startDate, endDate };
}

// Helper function to calculate insights from appointments
function calculateInsights(appointments) {
    if (appointments.length === 0) {
        return {
            averagePerAppointment: 0,
            topService: null,
            topServiceCount: 0
        };
    }

    // Calculate average
    const totalIncome = appointments.reduce((sum, apt) => sum + (apt.price || 0), 0);
    const averagePerAppointment = Math.round(totalIncome / appointments.length);

    // Find most popular service
    const serviceCounts = {};
    appointments.forEach(apt => {
        const service = apt.service || 'Sin servicio';
        serviceCounts[service] = (serviceCounts[service] || 0) + 1;
    });

    let topService = null;
    let topServiceCount = 0;
    Object.entries(serviceCounts).forEach(([service, count]) => {
        if (count > topServiceCount) {
            topService = service;
            topServiceCount = count;
        }
    });

    return {
        averagePerAppointment,
        topService,
        topServiceCount
    };
}

// Main controller function
exports.getRevenueStats = async (req, res) => {
    try {
        const { period = 'day', date } = req.query;

        // Validate period
        const validPeriods = ['day', 'week', 'month', 'year'];
        if (!validPeriods.includes(period)) {
            return res.status(400).json({
                error: 'Invalid period. Must be one of: day, week, month, year'
            });
        }

        // Calculate date range
        const { startDate, endDate } = calculateDateRange(period, date);

        // Fetch appointments in range
        const appointments = await Appointment.findAll({
            where: {
                dateString: {
                    [Op.between]: [startDate, endDate]
                }
            },
            order: [['dateString', 'DESC'], ['time', 'DESC']]
        });

        // Calculate statistics
        const totalIncome = appointments.reduce((sum, apt) => sum + (apt.price || 0), 0);
        const appointmentCount = appointments.length;

        // Calculate insights
        const insights = calculateInsights(appointments);

        res.status(200).json({
            period,
            startDate,
            endDate,
            totalIncome,
            appointmentCount,
            appointments,
            insights
        });

    } catch (error) {
        console.error('Error fetching revenue stats:', error);
        res.status(500).json({ error: 'Error fetching revenue statistics' });
    }
};
