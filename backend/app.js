const express = require('express');
const cors = require('cors');
const sequelize = require('./database/db');

// Import Models
const Client = require('./models/Client');
const TechnicalSheet = require('./models/TechnicalSheet');
const Appointment = require('./models/Appointment');

// Import Routes
const clientRoutes = require('./routes/clientRoutes');
const technicalSheetRoutes = require('./routes/technicalSheetRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');

// Initialize Express App
const app = express();
const PORT = 3000;

// Middlewares
app.use(cors());
app.use(express.json());

// Use Routes
app.use('/api/clients', clientRoutes);
app.use('/api/sheets', technicalSheetRoutes);
app.use('/api/appointments', appointmentRoutes);

// --- DEFINING RELATIONS (Associations) ---
// One Client has many Technical Sheets
Client.hasMany(TechnicalSheet, { foreignKey: 'clientId' }); 
TechnicalSheet.belongsTo(Client, { foreignKey: 'clientId' });

// One Client can have many Appointments
Client.hasMany(Appointment, { foreignKey: 'clientId' });
Appointment.belongsTo(Client, { foreignKey: 'clientId' });

// --- SYNC DB & START SERVER ---
async function startServer() {
    try {
        await sequelize.sync({ force: false, alter: false });
        console.log('✅ Database connected and synchronized');

        app.listen(PORT, () => {
            console.log(`🚀 Server running on http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('❌ Database connection failed:', error);
    }
}

startServer();