const { body, validationResult } = require('express-validator');
const ResponseUtils = require('../utils/response.utils');

/**
 * Runs validationResult and returns 400 if any errors exist
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return ResponseUtils.badRequest(
      res,
      'Validation failed',
      errors.array().map((e) => ({ field: e.path, message: e.msg }))
    );
  }
  next();
};

/**
 * Validation rule sets
 */
const rules = {
  register: [
    body('name')
      .trim()
      .notEmpty().withMessage('Name is required')
      .isLength({ min: 2, max: 50 }).withMessage('Name must be 2–50 characters'),

    body('email')
      .trim()
      .notEmpty().withMessage('Email is required')
      .isEmail().withMessage('Must be a valid email address')
      .normalizeEmail(),

    body('password')
      .notEmpty().withMessage('Password is required')
      .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
      .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
      .matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter')
      .matches(/\d/).withMessage('Password must contain at least one number')
      .matches(/[@$!%*?&]/).withMessage('Password must contain at least one special character (@$!%*?&)'),

    body('role')
      .optional()
      .isIn(['user', 'admin']).withMessage('Role must be user or admin'),
  ],

  login: [
    body('email')
      .trim()
      .notEmpty().withMessage('Email is required')
      .isEmail().withMessage('Must be a valid email address')
      .normalizeEmail(),

    body('password')
      .notEmpty().withMessage('Password is required'),
  ],

  refreshToken: [
    body('refreshToken')
      .notEmpty().withMessage('Refresh token is required'),
  ],

  updateProfile: [
    body('name')
      .optional()
      .trim()
      .isLength({ min: 2, max: 50 }).withMessage('Name must be 2–50 characters'),
  ],

  changePassword: [
    body('currentPassword')
      .notEmpty().withMessage('Current password is required'),

    body('newPassword')
      .notEmpty().withMessage('New password is required')
      .isLength({ min: 8 }).withMessage('New password must be at least 8 characters')
      .matches(/[A-Z]/).withMessage('Must contain at least one uppercase letter')
      .matches(/[a-z]/).withMessage('Must contain at least one lowercase letter')
      .matches(/\d/).withMessage('Must contain at least one number')
      .matches(/[@$!%*?&]/).withMessage('Must contain at least one special character (@$!%*?&)'),
  ],
};

module.exports = { validate, rules };
