const { validationResult } = require('express-validator');
const transactionService = require('../services/transactionService');
const apiResponse = require('../utils/apiResponse');

async function listTransactions(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return apiResponse.validationError(res, errors.array());
    }

    const filters = {
      productId: req.query.productId,
      type: req.query.type,
      limit: parseInt(req.query.limit, 10) || 20,
    };

    const result = await transactionService.listTransactions(filters);
    return apiResponse.success(res, result);
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  listTransactions,
};
