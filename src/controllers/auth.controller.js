const bcrypt = require('bcryptjs');
const UserModel = require('../models/user.model');
const TokenModel = require('../models/token.model');
const TokenUtils = require('../utils/token.utils');
const ResponseUtils = require('../utils/response.utils');
const config = require('../config');
const ms = require('ms');

const AuthController = {
  /**
   * POST /api/auth/register
   */
  async register(req, res, next) {
    try {
      const { name, email, password, role } = req.body;

      if (await UserModel.emailExists(email)) {
        return ResponseUtils.conflict(res, 'Email address is already registered');
      }

      const passwordHash = await bcrypt.hash(password, config.bcrypt.saltRounds);
      const user = await UserModel.create({ name, email, passwordHash, role: role || 'user' });

      const tokens = TokenUtils.createTokenPair(user);
      await _saveRefreshToken(tokens.refreshToken, user.id);

      return ResponseUtils.created(res, { user, tokens }, 'Registration successful');
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/auth/login
   */
  async login(req, res, next) {
    try {
      const { email, password } = req.body;

      const userRecord = await UserModel.findByEmail(email, true); // include pw hash
      if (!userRecord) return ResponseUtils.unauthorized(res, 'Invalid email or password');
      if (!userRecord.is_active) return ResponseUtils.unauthorized(res, 'Account is deactivated');

      const match = await bcrypt.compare(password, userRecord.password_hash);
      if (!match) return ResponseUtils.unauthorized(res, 'Invalid email or password');

      // Sanitize before passing to token/response
      const { password_hash, ...user } = userRecord;

      const tokens = TokenUtils.createTokenPair(user);
      await _saveRefreshToken(tokens.refreshToken, user.id);

      return ResponseUtils.success(res, { user, tokens }, 'Login successful');
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/auth/refresh
   */
  async refresh(req, res, next) {
    try {
      const { refreshToken } = req.body;

      const stored = await TokenModel.find(refreshToken);
      if (!stored) return ResponseUtils.unauthorized(res, 'Invalid or expired refresh token');

      let decoded;
      try {
        decoded = TokenUtils.verifyRefreshToken(refreshToken);
      } catch {
        await TokenModel.delete(refreshToken);
        return ResponseUtils.unauthorized(res, 'Invalid or expired refresh token');
      }

      const user = await UserModel.findById(decoded.sub);
      if (!user || !user.is_active) {
        await TokenModel.delete(refreshToken);
        return ResponseUtils.unauthorized(res, 'Account not found or deactivated');
      }

      // Rotate
      await TokenModel.delete(refreshToken);
      const tokens = TokenUtils.createTokenPair(user);
      await _saveRefreshToken(tokens.refreshToken, user.id);

      return ResponseUtils.success(res, { tokens }, 'Token refreshed successfully');
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/auth/logout
   */
  async logout(req, res, next) {
    try {
      const { refreshToken } = req.body;
      if (refreshToken) await TokenModel.delete(refreshToken);
      return ResponseUtils.success(res, null, 'Logged out successfully');
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/auth/me
   */
  async me(req, res) {
    return ResponseUtils.success(res, { user: req.user }, 'User profile retrieved');
  },
};

async function _saveRefreshToken(token, userId) {
  const expiresAt = new Date(Date.now() + ms(config.jwt.refreshExpiresIn));
  await TokenModel.save(token, userId, expiresAt);
}

module.exports = AuthController;
