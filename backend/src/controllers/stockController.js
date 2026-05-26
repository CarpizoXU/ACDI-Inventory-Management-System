const { validationResult } = require('express-validator');
const stockService = require('../services/stockService');
const apiResponse = require('../utils/apiResponse');

function getPerformedBy(req) {
  return req.user?.name || req.user?.email || req.user?.sub || 'system';
}

async function stockIn(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return apiResponse.validationError(res, errors.array());
    }

    const {
      productId,
      quantity,
      note,
      notes,
      vendor,
      receivedBy,
      dateReceived,
      voucherType,
      voucherNumber,
    } = req.body;

    const performedBy = getPerformedBy(req);
    const result = await stockService.recordStockIn({
      productId,
      quantity,
      performedBy,
      note: note || notes || '',
      vendor,
      receivedBy,
      dateReceived,
      voucherType,
      voucherNumber,
    });

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

    const {
      productId,
      quantity,
      note,
      issuedTo,
      department,
      dateIssued,
      purpose,
    } = req.body;

    const performedBy = getPerformedBy(req);
    const result = await stockService.recordStockOut({
      productId,
      quantity,
      performedBy,
      note,
      issuedTo,
      department,
      dateIssued,
      purpose,
    });

    return apiResponse.success(res, result);
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  stockIn,
  stockOut,
};
