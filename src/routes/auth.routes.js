const express = require('express');
const rateLimit = require('express-rate-limit');
const AuthController = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { validate, rules } = require('../middleware/validation.middleware');
const config = require('../config');

const router = express.Router();

// Stricter rate limiter for auth endpoints
const authLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.authMax,
  message: { success: false, message: 'Too many attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', authLimiter, rules.register, validate, AuthController.register);

/**
 * @route   POST /api/auth/login
 * @desc    Login and receive token pair
 * @access  Public
 */
router.post('/login', authLimiter, rules.login, validate, AuthController.login);

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh access token using refresh token
 * @access  Public
 */
router.post('/refresh', rules.refreshToken, validate, AuthController.refresh);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout and invalidate refresh token
 * @access  Public (token optional)
 */
router.post('/logout', AuthController.logout);

/**
 * @route   GET /api/auth/me
 * @desc    Get current authenticated user
 * @access  Private
 */
router.get('/me', authenticate, AuthController.me);

module.exports = router;
