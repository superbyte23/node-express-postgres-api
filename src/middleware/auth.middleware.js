const TokenUtils = require('../utils/token.utils');
const ResponseUtils = require('../utils/response.utils');
const UserModel = require('../models/user.model');

const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return ResponseUtils.unauthorized(res, 'Access token required');
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = TokenUtils.verifyAccessToken(token);
    const user = await UserModel.findById(decoded.sub);

    if (!user || !user.is_active) {
      return ResponseUtils.unauthorized(res, 'Account not found or deactivated');
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return ResponseUtils.unauthorized(res, 'Access token expired');
    }
    return ResponseUtils.unauthorized(res, 'Invalid access token');
  }
};

const authorize = (...roles) => (req, res, next) => {
  if (!req.user) return ResponseUtils.unauthorized(res, 'Authentication required');
  if (!roles.includes(req.user.role)) {
    return ResponseUtils.forbidden(res, `Access denied. Required role(s): ${roles.join(', ')}`);
  }
  next();
};

module.exports = { authenticate, authorize };
