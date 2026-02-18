const winston = require('winston');

// Define log levels
const levels = {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4,
};

// Define log colors based on level
const colors = {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    debug: 'white',
};

// Use winston.addColors to link levels and colors
winston.addColors(colors);

// Define log format
const format = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
    winston.format.colorize({ all: true }),
    winston.format.printf(
        (info) => `${info.timestamp} ${info.level}: ${info.message}`,
    ),
);

// Define transports (console and file)
const transports = [
    new winston.transports.Console(),
    new winston.transports.File({
        filename: 'logs/error.log',
        level: 'error',
        format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json() // Keep JSON format for files
        )
    }),
    new winston.transports.File({
        filename: 'logs/all.log',
        format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json() // Keep JSON format for files
        )
    }),
];

// Create the logger instance
const Logger = winston.createLogger({
    level: process.env.NODE_ENV === 'development' ? 'debug' : 'warn',
    levels,
    format,
    transports,
});

module.exports = Logger;
