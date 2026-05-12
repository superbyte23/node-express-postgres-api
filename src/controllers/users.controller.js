const bcrypt = require('bcryptjs');
const UserModel = require('../models/user.model');
const ResponseUtils = require('../utils/response.utils');
const config = require('../config');

const UsersController = {
  async getAll(req, res, next) {
    try {
      const users = await UserModel.findAll();
      return ResponseUtils.success(res, { users, count: users.length });
    } catch (err) { next(err); }
  },

  async getOne(req, res, next) {
    try {
      const { id } = req.params;
      if (req.user.role !== 'admin' && req.user.id !== id) {
        return ResponseUtils.forbidden(res, 'Access denied');
      }
      const user = await UserModel.findById(id);
      if (!user) return ResponseUtils.notFound(res, 'User not found');
      return ResponseUtils.success(res, { user });
    } catch (err) { next(err); }
  },

  async updateProfile(req, res, next) {
    try {
      const { name } = req.body;
      const user = await UserModel.update(req.user.id, { name });
      if (!user) return ResponseUtils.notFound(res, 'User not found');
      return ResponseUtils.success(res, { user }, 'Profile updated');
    } catch (err) { next(err); }
  },

  async changePassword(req, res, next) {
    try {
      const { currentPassword, newPassword } = req.body;

      const userRecord = await UserModel.findByEmail(req.user.email, true);
      if (!userRecord) return ResponseUtils.notFound(res, 'User not found');

      const match = await bcrypt.compare(currentPassword, userRecord.password_hash);
      if (!match) return ResponseUtils.badRequest(res, 'Current password is incorrect');

      const passwordHash = await bcrypt.hash(newPassword, config.bcrypt.saltRounds);
      await UserModel.update(req.user.id, { passwordHash });

      return ResponseUtils.success(res, null, 'Password changed successfully');
    } catch (err) { next(err); }
  },

  async deactivate(req, res, next) {
    try {
      const { id } = req.params;
      if (id === req.user.id) {
        return ResponseUtils.badRequest(res, 'Cannot deactivate your own account');
      }
      const user = await UserModel.deactivate(id);
      if (!user) return ResponseUtils.notFound(res, 'User not found');
      return ResponseUtils.success(res, { user }, 'User deactivated');
    } catch (err) { next(err); }
  },
};

module.exports = UsersController;
