const express = require('express');
const { check } = require('express-validator');
const router = express.Router();
const { register, login, getMe, getAllUsers } = require('../controllers/authController');
const { protect, authenticate, authorize } = require('../middleware/auth'); // protect is alias for authenticate if needed, but we used authenticate
const { validate } = require('../middleware/validate');

// Register User
router.post(
    '/register',
    [
        check('name', 'Name is required').not().isEmpty(),
        check('email', 'Please include a valid email').isEmail(),
        check('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 }),
        validate
    ],
    register
);

// Login User
router.post(
    '/login',
    [
        check('email', 'Please include a valid email').isEmail(),
        check('password', 'Password is required').exists(),
        validate
    ],
    login
);

// Get Current User
router.get('/me', authenticate, getMe);

// Get All Users (Admin Only)
router.get('/users', authenticate, authorize('admin'), getAllUsers);

module.exports = router;
