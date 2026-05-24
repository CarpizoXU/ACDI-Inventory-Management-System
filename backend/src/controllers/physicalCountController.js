const { validationResult } = require('express-validator');
const physicalCountService = require('../services/physicalCountService');
const apiResponse = require('../utils/apiResponse');

async function createCount(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return apiResponse.validationError(res, errors.array());
    }

    const { location, items, notes } = req.body;
    const countedBy = req.user?.email || req.user?.sub || 'system';
    const result = await physicalCountService.createPhysicalCount({
      countedBy,
      location,
      items,
      notes,
    });
    return apiResponse.success(res, result, 'Physical count created successfully', 201);
  } catch (err) {
    return next(err);
  }
}

async function getCount(req, res, next) {
  try {
    const { id } = req.params;
    const result = await physicalCountService.getPhysicalCountDetail(id);
    return apiResponse.success(res, result);
  } catch (err) {
    return next(err);
  }
}

async function listCounts(req, res, next) {
  try {
    const { status } = req.query;
    const filters = {};
    if (status) filters.status = status;

    const result = await physicalCountService.listPhysicalCounts(filters);
    return apiResponse.success(res, result);
  } catch (err) {
    return next(err);
  }
}

async function submitCount(req, res, next) {
  try {
    const { id } = req.params;
    const result = await physicalCountService.submitPhysicalCount(id);
    return apiResponse.success(res, result, 'Physical count submitted successfully');
  } catch (err) {
    return next(err);
  }
}

async function reconcileCount(req, res, next) {
  try {
    const { id } = req.params;
    const reconciledBy = req.user?.email || req.user?.sub || 'system';
    const result = await physicalCountService.reconcilePhysicalCount(id, reconciledBy);
    return apiResponse.success(res, result, 'Physical count reconciled successfully');
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  createCount,
  getCount,
  listCounts,
  submitCount,
  reconcileCount,
};
