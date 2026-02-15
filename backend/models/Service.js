const { DataTypes } = require('sequelize');
const sequelize = require('../database/db');

const Service = sequelize.define('Service', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  price: {
    type: DataTypes.FLOAT,
    allowNull: false
  }
});

module.exports = Service;
