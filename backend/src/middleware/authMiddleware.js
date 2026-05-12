const authService = require('../services/authService');

function authorize(roles = []) {
  if (typeof roles === 'string') {
    roles = [roles];
  }

  return (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      const err = new Error('Authorization header missing');
      err.statusCode = 401;
      return next(err);
    }

    const token = authHeader.split(' ')[1];
    try {
      const payload = authService.verifyToken(token);
      req.user = payload;

      if (roles.length && !roles.includes(payload.role)) {
        const err = new Error('Unauthorized');
        err.statusCode = 403;
        return next(err);
      }

      return next();
    } catch (error) {
      error.statusCode = 401;
      return next(error);
    }
  };
}

module.exports = {
  authorize,
};
