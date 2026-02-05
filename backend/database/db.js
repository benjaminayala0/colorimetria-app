require ('dotenv').config();
const { Sequelize } = require('sequelize');

const dbUrl = process.env.DATABASE_URL ;

if (!dbUrl) {
    console.error('DATABASE_URL is not defined in the environment variables.');
}

const isLocal = dbUrl && (dbUrl.includes('localhost') || dbUrl.includes('127.0.0.1'));

// Initialize Sequelize with SQLite
 const sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres', 
    logging: false ,
    dialectOptions: {
        ssl: isLocal ? false : {
            require: true,
            rejectUnauthorized: false
        }, 
        
        family: 4

    } 
});

module.exports = sequelize;