require('dotenv').config();

// Reuse the same configuration as database/db.js
const dbUrl = process.env.DATABASE_URL;
const isLocal = dbUrl && (dbUrl.includes('localhost') || dbUrl.includes('127.0.0.1'));

module.exports = {
    development: {
        url: process.env.DATABASE_URL,
        dialect: 'postgres',
        logging: false,
        dialectOptions: {
            ssl: isLocal ? false : {
                require: true,
                rejectUnauthorized: false
            },
            family: 4
        }
    },
    production: {
        url: process.env.DATABASE_URL,
        dialect: 'postgres',
        logging: false,
        dialectOptions: {
            ssl: {
                require: true,
                rejectUnauthorized: false
            },
            family: 4
        }
    }
};
