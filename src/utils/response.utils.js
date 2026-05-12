/**
 * Standardized API response helpers
 */
const ResponseUtils = {
  success(res, data = null, message = 'Success', statusCode = 200) {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
      timestamp: new Date().toISOString(),
    });
  },

  created(res, data = null, message = 'Resource created successfully') {
    return this.success(res, data, message, 201);
  },

  error(res, message = 'An error occurred', statusCode = 500, errors = null) {
    const response = {
      success: false,
      message,
      timestamp: new Date().toISOString(),
    };

    if (errors) response.errors = errors;

    return res.status(statusCode).json(response);
  },

  badRequest(res, message = 'Bad request', errors = null) {
    return this.error(res, message, 400, errors);
  },

  unauthorized(res, message = 'Unauthorized') {
    return this.error(res, message, 401);
  },

  forbidden(res, message = 'Forbidden') {
    return this.error(res, message, 403);
  },

  notFound(res, message = 'Resource not found') {
    return this.error(res, message, 404);
  },

  conflict(res, message = 'Resource already exists') {
    return this.error(res, message, 409);
  },
};

module.exports = ResponseUtils;
