const { validationResult } = require('express-validator');
const stockService = require('../services/stockService');
const apiResponse = require('../utils/apiResponse');

async function stockIn(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return apiResponse.validationError(res, errors.array());
    }

    const { productId, quantity, performedBy, note } = req.body;
    const result = await stockService.recordStockIn({ productId, quantity, performedBy, note });
    return apiResponse.success(res, result);
  } catch (err) {
    return next(err);
  }
}

async function stockOut(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return apiResponse.validationError(res, errors.array());
    }

    const { productId, quantity, performedBy, note } = req.body;
    const result = await stockService.recordStockOut({ productId, quantity, performedBy, note });
    return apiResponse.success(res, result);
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  stockIn,
  stockOut,
};
