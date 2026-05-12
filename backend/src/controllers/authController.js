const authService = require('../services/authService');
const { validationResult } = require('express-validator');
const apiResponse = require('../utils/apiResponse');

async function login(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return apiResponse.validationError(res, errors.array());
    }

    const { email, password } = req.body;
    const { user, token } = await authService.authenticateUser({ email, password });
    return apiResponse.success(res, { user: { id: user._id, name: user.name, email: user.email, role: user.role }, token });
  } catch (err) {
    return next(err);
  }
}

async function register(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return apiResponse.validationError(res, errors.array());
    }

    const { name, email, password, role } = req.body;
    const user = await authService.registerUser({ name, email, password, role });
    return apiResponse.created(res, { id: user._id, name: user.name, email: user.email, role: user.role });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  login,
  register,
};
