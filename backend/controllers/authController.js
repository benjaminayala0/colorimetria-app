const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Logger = require('../utils/logger');

// Generate Access Token (Short Lived - 15m)
const generateAccessToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_ACCESS_EXPIRE || '15m',
    });
};

// Generate Refresh Token (Long Lived - 7d)
const generateRefreshToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d',
    });
};

// @desc    Register a user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res, next) => {
    try {
        const { name, email, password, role } = req.body;

        // Check if user already exists
        const userExists = await User.findOne({ where: { email } });
        if (userExists) {
            return res.status(400).json({ success: false, error: 'User already exists' });
        }

        // Create user
        const user = await User.create({
            name,
            email,
            password,
            role: role || 'employee' // Default to employee if not specified
        });

        Logger.info(`New user registered: ${user.email}`);

        // Create tokens
        const accessToken = generateAccessToken(user.id);
        const refreshToken = generateRefreshToken(user.id);

        res.status(201).json({
            success: true,
            accessToken,
            refreshToken,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (err) {
        Logger.error(`Error in register: ${err.message}`);
        next(err);
    }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        // Validate email & password presence
        if (!email || !password) {
            return res.status(400).json({ success: false, error: 'Please provide an email and password' });
        }

        // Check for user
        const user = await User.findOne({ where: { email } });
        if (!user) {
            return res.status(401).json({ success: false, error: 'Invalid credentials' });
        }

        // Check password
        const isMatch = await user.checkPassword(password);
        if (!isMatch) {
            return res.status(401).json({ success: false, error: 'Invalid credentials' });
        }

        // Update last login
        user.lastLogin = new Date();
        await user.save();

        Logger.info(`User logged in: ${user.email}`);

        // Create tokens
        const accessToken = generateAccessToken(user.id);
        const refreshToken = generateRefreshToken(user.id);

        res.status(200).json({
            success: true,
            accessToken,
            refreshToken,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (err) {
        Logger.error(`Error in login: ${err.message}`);
        next(err);
    }
};

// @desc    Refresh Access Token
// @route   POST /api/auth/refresh
// @access  Public (matches Refresh Token)
exports.refreshToken = async (req, res, next) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
        return res.status(401).json({ success: false, error: 'No refresh token provided' });
    }

    try {
        // Verify Refresh Token
        // Note: In production, usage of specific JWT_REFRESH_SECRET is recommended
        const secret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;

        const decoded = jwt.verify(refreshToken, secret);

        // Find user
        const user = await User.findByPk(decoded.id);

        if (!user) {
            return res.status(401).json({ success: false, error: 'User not found' });
        }

        // Generate NEW Access Token
        const accessToken = generateAccessToken(user.id);

        // Optionally prevent reuse of refresh tokens here (Rotation)
        // For now, we return just the new access token

        res.status(200).json({
            success: true,
            accessToken
        });

    } catch (err) {
        Logger.error(`Error in refreshToken: ${err.message}`);
        return res.status(403).json({ success: false, error: 'Invalid refresh token' });
    }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
    try {
        const user = await User.findByPk(req.user.id, {
            attributes: { exclude: ['password'] } // Don't return password
        });

        res.status(200).json({
            success: true,
            user
        });
    } catch (err) {
        Logger.error(`Error in getMe: ${err.message}`);
        next(err);
    }
};

// @desc    Get all users (Admin only)
// @route   GET /api/auth/users
// @access  Private/Admin
exports.getAllUsers = async (req, res, next) => {
    try {
        const users = await User.findAll({
            attributes: { exclude: ['password'] }
        });

        res.status(200).json({
            success: true,
            count: users.length,
            users
        });
    } catch (err) {
        Logger.error(`Error in getAllUsers: ${err.message}`);
        next(err);
    }
};
