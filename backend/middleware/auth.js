const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Logger = require('../utils/logger');

// Middleware to protect routes
exports.authenticate = async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        // Set token from Bearer token in header
        token = req.headers.authorization.split(' ')[1];
    }

    // Make sure token exists
    if (!token) {
        return res.status(401).json({ success: false, error: 'Not authorized to access this route' });
    }

    try {
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        Logger.debug(`User authenticated: ${decoded.id}`);

        req.user = await User.findByPk(decoded.id);

        if (!req.user) {
            return res.status(401).json({ success: false, error: 'User not found' });
        }

        next();
    } catch (err) {
        Logger.error(`Auth error: ${err.message}`);
        return res.status(401).json({ success: false, error: 'Not authorized to access this route' });
    }
};

// Grant access to specific roles
exports.authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            Logger.warn(`User ${req.user.id} attempted to access restricted route with role ${req.user.role}`);
            return res.status(403).json({
                success: false,
                error: `User role ${req.user.role} is not authorized to access this route`
            });
        }
        next();
    };
};
