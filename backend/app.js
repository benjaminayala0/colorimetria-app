const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const sequelize = require('./database/db');
const errorHandler = require('./middleware/errorHandler');
const { authenticate } = require('./middleware/auth'); // Import auth middleware

// Import Models
const Client = require('./models/Client');
const TechnicalSheet = require('./models/TechnicalSheet');
const Appointment = require('./models/Appointment');
const Service = require('./models/Service');
const User = require('./models/User'); // Import User model

// Import Routes
const authRoutes = require('./routes/authRoutes');
const clientRoutes = require('./routes/clientRoutes');
const technicalSheetRoutes = require('./routes/technicalSheetRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');
const serviceRoutes = require('./routes/serviceRoutes');

// Initialize Express App
const app = express();
const PORT = 3000;

// Rate Liimiter
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again after 15 minutes'
});

// Middlewares
app.use(helmet()); // Set security headers
app.use(limiter); // Apply rate limiting to all requests
app.use(cors());
app.use(express.json());

// Use Routes
app.use('/api/auth', authRoutes); // Public routes (login/register) inside
// Protected Routes
app.use('/api/clients', authenticate, clientRoutes);
app.use('/api/sheets', authenticate, technicalSheetRoutes);
app.use('/api/appointments', authenticate, appointmentRoutes);
app.use('/api/services', authenticate, serviceRoutes);

// Error Handler Middleware
app.use(errorHandler);

// --- DEFINING RELATIONS (Associations) ---
// One Client has many Technical Sheets
Client.hasMany(TechnicalSheet, { foreignKey: 'clientId' });
TechnicalSheet.belongsTo(Client, { foreignKey: 'clientId' });

// One Client can have many Appointments
Client.hasMany(Appointment, { foreignKey: 'clientId' });
Appointment.belongsTo(Client, { foreignKey: 'clientId' });

// One Service has many Appointments
Service.hasMany(Appointment, { foreignKey: 'serviceId' });
Appointment.belongsTo(Service, { foreignKey: 'serviceId' });

// --- SYNC DB & START SERVER ---
async function startServer() {
    try {
        // await sequelize.sync({ force: false, alter: true }); // Disabled in favor of migrations
        await sequelize.authenticate();
        console.log('✅ Database connected');

        app.listen(PORT, () => {
            console.log(`🚀 Server running on http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('❌ Database connection failed:', error);
    }
}

startServer();