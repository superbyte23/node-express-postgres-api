const jwt = require('jsonwebtoken');
const config = require('../config');

const TokenUtils = {
  generateAccessToken(payload) {
    return jwt.sign(payload, config.jwt.accessSecret, {
      expiresIn: config.jwt.accessExpiresIn,
      issuer: 'auth-api',
      audience: 'auth-api-client',
    });
  },

  generateRefreshToken(payload) {
    return jwt.sign(payload, config.jwt.refreshSecret, {
      expiresIn: config.jwt.refreshExpiresIn,
      issuer: 'auth-api',
      audience: 'auth-api-client',
    });
  },

  verifyAccessToken(token) {
    return jwt.verify(token, config.jwt.accessSecret, {
      issuer: 'auth-api',
      audience: 'auth-api-client',
    });
  },

  verifyRefreshToken(token) {
    return jwt.verify(token, config.jwt.refreshSecret, {
      issuer: 'auth-api',
      audience: 'auth-api-client',
    });
  },

  createTokenPair(user) {
    const id = user.id || user._id;
    const payload = { sub: id, email: user.email, role: user.role };
    return {
      accessToken: this.generateAccessToken(payload),
      refreshToken: this.generateRefreshToken({ sub: id }),
    };
  },
};

module.exports = TokenUtils;
