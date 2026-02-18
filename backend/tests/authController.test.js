const authController = require('../controllers/authController');
const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Mock User model and jwt
jest.mock('../models/User');
jest.mock('jsonwebtoken');
jest.mock('../utils/logger', () => ({
    info: jest.fn(),
    error: jest.fn(),
}));

describe('AuthController', () => {
    let req, res, next;

    beforeEach(() => {
        req = {
            body: {}
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
        next = jest.fn();
        jest.clearAllMocks();
    });

    describe('register', () => {
        it('should register a new user and return tokens', async () => {
            req.body = {
                name: 'Test User',
                email: 'test@example.com',
                password: 'password123'
            };

            const mockUser = {
                id: 1,
                name: 'Test User',
                email: 'test@example.com',
                role: 'employee'
            };

            User.findOne.mockResolvedValue(null);
            User.create.mockResolvedValue(mockUser);
            jwt.sign.mockReturnValue('mock_token');

            await authController.register(req, res, next);

            expect(User.findOne).toHaveBeenCalledWith({ where: { email: 'test@example.com' } });
            expect(User.create).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                accessToken: 'mock_token',
                refreshToken: 'mock_token'
            }));
        });

        it('should return error if user already exists', async () => {
            req.body = {
                name: 'Test User',
                email: 'existing@example.com',
                password: 'password123'
            };

            User.findOne.mockResolvedValue({ id: 1, email: 'existing@example.com' });

            await authController.register(req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ success: false, error: 'User already exists' });
        });
    });

    describe('login', () => {
        it('should login user and return tokens', async () => {
            req.body = {
                email: 'test@example.com',
                password: 'password123'
            };

            const mockUser = {
                id: 1,
                name: 'Test User',
                email: 'test@example.com',
                role: 'employee',
                checkPassword: jest.fn().mockResolvedValue(true),
                save: jest.fn().mockResolvedValue(true),
                lastLogin: null
            };

            User.findOne.mockResolvedValue(mockUser);
            jwt.sign.mockReturnValue('mock_token');

            await authController.login(req, res, next);

            expect(User.findOne).toHaveBeenCalledWith({ where: { email: 'test@example.com' } });
            expect(mockUser.checkPassword).toHaveBeenCalledWith('password123');
            expect(mockUser.save).toHaveBeenCalled(); // Should update lastLogin
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                accessToken: 'mock_token'
            }));
        });

        it('should return error for invalid credentials', async () => {
            req.body = {
                email: 'test@example.com',
                password: 'wrongpassword'
            };

            const mockUser = {
                checkPassword: jest.fn().mockResolvedValue(false)
            };

            User.findOne.mockResolvedValue(mockUser);

            await authController.login(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ success: false, error: 'Invalid credentials' });
        });
    });
});
