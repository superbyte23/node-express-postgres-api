const express = require('express');
const UsersController = require('../controllers/users.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { validate, rules } = require('../middleware/validation.middleware');

const router = express.Router();

// All user routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/users
 * @desc    List all users
 * @access  Admin
 */
router.get('/', authorize('admin'), UsersController.getAll);

/**
 * @route   GET /api/users/:id
 * @desc    Get a specific user (admin or self)
 * @access  Private
 */
router.get('/:id', UsersController.getOne);

/**
 * @route   PATCH /api/users/profile
 * @desc    Update own profile
 * @access  Private
 */
router.patch('/profile', rules.updateProfile, validate, UsersController.updateProfile);

/**
 * @route   PATCH /api/users/change-password
 * @desc    Change own password
 * @access  Private
 */
router.patch(
  '/change-password',
  rules.changePassword,
  validate,
  UsersController.changePassword
);

/**
 * @route   PATCH /api/users/:id/deactivate
 * @desc    Deactivate a user account
 * @access  Admin
 */
router.patch('/:id/deactivate', authorize('admin'), UsersController.deactivate);

module.exports = router;
