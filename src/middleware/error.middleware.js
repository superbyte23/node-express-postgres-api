const ResponseUtils = require('../utils/response.utils');

/**
 * 404 handler - for unmatched routes
 */
const notFound = (req, res) => {
  return ResponseUtils.notFound(res, `Route ${req.method} ${req.originalUrl} not found`);
};

/**
 * Global error handler
 */
const errorHandler = (err, req, res, next) => {
  console.error(`[ERROR] ${err.stack || err.message}`);

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return ResponseUtils.unauthorized(res, 'Invalid token');
  }
  if (err.name === 'TokenExpiredError') {
    return ResponseUtils.unauthorized(res, 'Token expired');
  }

  // Default
  const statusCode = err.statusCode || err.status || 500;
  const message =
    process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message;

  return ResponseUtils.error(res, message, statusCode);
};

module.exports = { notFound, errorHandler };
