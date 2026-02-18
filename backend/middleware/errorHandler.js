const Logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
    let error = { ...err };
    error.message = err.message;

    // Log to console/file
    Logger.error(`${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);

    // Sequelize bad object ID
    if (err.name === 'CastError') {
        const message = `Resource not found`;
        error = { message, statusCode: 404 };
    }

    // Sequelize unique constraint error
    if (err.name === 'SequelizeUniqueConstraintError') {
        const message = 'Duplicate field value entered';
        error = { message, statusCode: 400 };
    }

    // Sequelize validation error
    if (err.name === 'SequelizeValidationError') {
        const message = Object.values(err.errors).map((val) => val.message);
        error = { message, statusCode: 400 };
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        const message = 'Invalid token. Please log in again.';
        error = { message, statusCode: 401 };
    }

    if (err.name === 'TokenExpiredError') {
        const message = 'Your token has expired. Please log in again.';
        error = { message, statusCode: 401 };
    }

    res.status(error.statusCode || 500).json({
        success: false,
        error: error.message || 'Server Error',
    });
};

module.exports = errorHandler;
