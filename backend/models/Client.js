const { DataTypes } = require('sequelize');
const sequelize = require('../database/db'); 

const Client = sequelize.define('Client', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    fullname: { 
        type: DataTypes.STRING,
        allowNull: false
    },
    phone: { 
        type: DataTypes.STRING,
        allowNull: true
    },
    allergies: { 
        type: DataTypes.TEXT,
        allowNull: true
    }
});

module.exports = Client;