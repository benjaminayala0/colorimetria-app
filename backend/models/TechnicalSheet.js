const { DataTypes } = require('sequelize');
const sequelize = require('../database/db');

const TechnicalSheet = sequelize.define('TechnicalSheet', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    date: {
        type: DataTypes.DATEONLY,
        defaultValue: DataTypes.NOW
    },
    service: {
        type: DataTypes.STRING,
        allowNull: false
    },
    price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true
    },
    formula: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    notes: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    photoBefore: {
        type: DataTypes.STRING,
        allowNull: true
    },
    photoAfter: {
        type: DataTypes.STRING,
        allowNull: true
    }
});

module.exports = TechnicalSheet;