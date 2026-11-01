const AppError = require('../utils/app.error');

/**
 * Express request validation middleware factory.
 * Validates req.params, req.query, and req.body against schema validators.
 * Returns HTTP 400 with consistent safe error envelopes on failure.
 * Ensures validated, sanitized data is passed forward to route controllers.
 *
 * @param {Object} options
 * @param {Object} [options.params] - schema validator for req.params
 * @param {Object} [options.query] - schema validator for req.query
 * @param {Object} [options.body] - schema validator for req.body
 * @returns {Function} Express middleware (req, res, next)
 */
function validate({ params, query, body } = {}) {
  return function requestValidationMiddleware(req, res, next) {
    if (params) {
      const result = params.validate(req.params || {}, 'params');
      if (!result.valid) {
        return next(new AppError(result.error, 400));
      }
      req.params = Object.assign(req.params || {}, result.value);
    }

    if (query) {
      const result = query.validate(req.query || {}, 'query');
      if (!result.valid) {
        return next(new AppError(result.error, 400));
      }
      req.query = Object.assign(req.query || {}, result.value);
    }

    if (body) {
      const inputBody = (req.body === undefined || req.body === null) ? {} : req.body;
      const result = body.validate(inputBody, 'body');
      if (!result.valid) {
        return next(new AppError(result.error, 400));
      }
      req.body = result.value;
    }

    next();
  };
}

module.exports = validate;
