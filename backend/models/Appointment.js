const { DataTypes } = require('sequelize');
const sequelize = require('../database/db');

const Appointment = sequelize.define('Appointment', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    dateString: { 
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    time: { 
        type: DataTypes.STRING,
        allowNull: false
    },
    clientName: { 
        type: DataTypes.STRING,
        allowNull: false
    },
    service: { 
        type: DataTypes.STRING,
        allowNull: false
    },
    clientId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'Clients',
            key: 'id'
        }
    },
    price: {
        type: DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 0
    },
    serviceId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'Services',
            key: 'id'
        }
    }
});

module.exports = Appointment;
